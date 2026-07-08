import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import dbConnect from '../db';
import { getAdminFromToken, hasRole } from '../adminAuth';
import jwt from 'jsonwebtoken';
import { CUSTOMER_JWT_SECRET } from '../adminAuth';
import type { ApiErrorCode, AuthenticatedUser } from './types';

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status: number = 400,
    public details?: Record<string, string[]>
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

interface RouteConfig<TBody = any, TQuery = any, TParams = any> {
  schema?: {
    body?: z.ZodSchema<TBody>;
    query?: z.ZodSchema<TQuery>;
    params?: z.ZodSchema<TParams>;
  };
  requiredRole?: 'admin' | 'staff' | 'customer' | 'public';
  handler: (args: {
    req: NextRequest;
    body: TBody;
    query: TQuery;
    params: TParams;
    user: AuthenticatedUser | null;
    requestId: string;
  }) => Promise<Response | NextResponse | any>;
}

function getCustomerFromToken(req: any): { id: string; email: string; name: string } | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, CUSTOMER_JWT_SECRET || '') as any;
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name || decoded.email.split('@')[0],
    };
  } catch (error) {
    return null;
  }
}

export function withRoute<TBody = any, TQuery = any, TParams = any>(
  config: RouteConfig<TBody, TQuery, TParams>
) {
  return async (req: NextRequest, context: { params: any } = { params: {} }) => {
    // Defensive polyfill for request objects in test/mock environments
    let localReq: any = req;
    if (!localReq) {
      localReq = { url: 'http://localhost', method: 'GET' };
    }
    if (!localReq.url) {
      localReq = { ...localReq, url: 'http://localhost' };
    }
    if (!localReq.method) {
      localReq = { ...localReq, method: 'GET' };
    }
    if (!localReq.headers || typeof localReq.headers.get !== 'function') {
      const rawHeaders = localReq.headers || {};
      localReq = {
        ...localReq,
        headers: {
          get: (name: string) => {
            return rawHeaders[name] || rawHeaders[name.toLowerCase()] || null;
          }
        }
      };
    }
    if (!localReq.cookies || typeof localReq.cookies.get !== 'function') {
      const rawCookies = localReq.cookies || {};
      localReq = {
        ...localReq,
        cookies: {
          get: (name: string) => {
            const val = rawCookies[name];
            return val ? { value: val } : null;
          }
        }
      };
    }

    const requestId = localReq.headers.get('x-request-id') || crypto.randomUUID();
    
    try {
      // 1. Database connection check/establish
      await dbConnect();

      // 2. Authentication & Authorization
      let authUser: AuthenticatedUser | null = null;

      if (config.requiredRole && config.requiredRole !== 'public') {
        if (config.requiredRole === 'customer') {
          const customer = getCustomerFromToken(localReq);
          if (!customer) {
            throw new ApiError('UNAUTHENTICATED', 'Authentication required', 401);
          }
          authUser = {
            id: customer.id,
            email: customer.email,
            name: customer.name,
            role: 'customer',
          };
        } else {
          // Admin or staff check
          const adminPayload = getAdminFromToken(localReq) as any;
          if (!adminPayload || !adminPayload.id) {
            throw new ApiError('UNAUTHENTICATED', 'Authentication required', 401);
          }

          const isAdmin = await hasRole(adminPayload.id, 'admin');
          const isStaff = await hasRole(adminPayload.id, 'staff');

          if (!isAdmin && !isStaff) {
            throw new ApiError('FORBIDDEN', 'Access denied', 403);
          }

          if (config.requiredRole === 'admin' && !isAdmin) {
            throw new ApiError('FORBIDDEN', 'Access denied', 403);
          }

          authUser = {
            id: adminPayload.id,
            email: adminPayload.email,
            name: adminPayload.name || adminPayload.email.split('@')[0],
            role: isAdmin ? 'admin' : 'staff',
          };
        }
      } else {
        // Public route, but try to extract user if token exists (optional auth)
        const adminPayload = getAdminFromToken(localReq) as any;
        if (adminPayload && adminPayload.id) {
          const isAdmin = await hasRole(adminPayload.id, 'admin');
          authUser = {
            id: adminPayload.id,
            email: adminPayload.email,
            name: adminPayload.name || adminPayload.email.split('@')[0],
            role: isAdmin ? 'admin' : 'staff',
          };
        } else {
          const customer = getCustomerFromToken(localReq);
          if (customer) {
            authUser = {
              id: customer.id,
              email: customer.email,
              name: customer.name,
              role: 'customer',
            };
          }
        }
      }

      // 3. Validation
      let validatedBody: any = undefined;
      let validatedQuery: any = undefined;
      let validatedParams: any = undefined;

      // Validate Route Params
      if (config.schema?.params) {
        const result = config.schema.params.safeParse(context.params || {});
        if (!result.success) {
          throw new ApiError('VALIDATION', 'Invalid route parameters', 400, result.error.flatten().fieldErrors as any);
        }
        validatedParams = result.data;
      } else {
        validatedParams = context.params || {};
      }

      // Validate Query Parameters
      if (config.schema?.query) {
        const url = new URL(localReq.url);
        const queryObj = Object.fromEntries(url.searchParams.entries());
        const result = config.schema.query.safeParse(queryObj);
        if (!result.success) {
          throw new ApiError('VALIDATION', 'Invalid query parameters', 400, result.error.flatten().fieldErrors as any);
        }
        validatedQuery = result.data;
      } else {
        const url = new URL(localReq.url);
        validatedQuery = Object.fromEntries(url.searchParams.entries());
      }

      // Validate Request Body
      if (config.schema?.body) {
        let rawBody: any = null;
        try {
          rawBody = await localReq.json();
        } catch (e) {
          throw new ApiError('VALIDATION', 'Malformed request body', 400);
        }

        const result = config.schema.body.safeParse(rawBody);
        if (!result.success) {
          // If Zod validation failed, extract the first error message for user-friendly default message
          const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
          const firstErrField = Object.keys(fieldErrors)[0];
          const firstErrMsg = (firstErrField && fieldErrors[firstErrField]?.[0]) || 'Invalid request body';
          throw new ApiError('VALIDATION', firstErrMsg, 400, fieldErrors as any);
        }
        validatedBody = result.data;
      }

      // 4. Run handler
      const result = await config.handler({
        req: localReq,
        body: validatedBody,
        query: validatedQuery,
        params: validatedParams,
        user: authUser,
        requestId,
      });

      // If handler returned a Response/NextResponse, return it directly
      if (result instanceof Response) {
        return result;
      }

      // Otherwise wrap it in NextResponse.json
      return NextResponse.json(result);

    } catch (error: any) {
      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            error: {
              code: error.code,
              message: error.message,
              requestId,
              ...(error.details ? { details: error.details } : {}),
            },
          },
          { status: error.status, headers: { 'x-request-id': requestId } }
        );
      }

      // Capture unexpected internal exceptions to Sentry
      Sentry.withScope((scope) => {
        scope.setTag('requestId', requestId);
        Sentry.captureException(error);
      });

      console.error(`[API Error] Request ${requestId} failed:`, error);

      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'An unexpected error occurred. Please try again later.',
            requestId,
          },
        },
        { status: 500, headers: { 'x-request-id': requestId } }
      );
    }
  };
}
