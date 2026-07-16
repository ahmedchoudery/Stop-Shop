import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';
import dbConnect from '../db';
import { getAdminFromToken, hasRole } from '../adminAuth';
import jwt from 'jsonwebtoken';
import { CUSTOMER_JWT_SECRET } from '../adminAuth';
import type { ApiErrorCode, AuthenticatedUser } from './types';
// @ts-ignore
import logger from '../../utils/logger.js';

// @ts-ignore
const pinoLogger = logger;



export const withSentry = Sentry.wrapRouteHandlerWithSentry;

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

export class OutOfStockError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, OutOfStockError.prototype);
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
  } catch {
    return null;
  }
}

export function withRoute<TBody = any, TQuery = any, TParams = any>(
  config: RouteConfig<TBody, TQuery, TParams>
) {
  const handler = async (req: NextRequest, context: { params: any } = { params: {} }) => {
    // Defensive polyfill for request objects in test/mock environments
    let localReq: any = req;
    if (!localReq) {
      localReq = {
        url: 'http://localhost',
        method: 'GET',
        headers: { get: () => null },
        cookies: { get: () => null }
      };
    }
    if (!localReq.url) {
      localReq.url = 'http://localhost';
    }
    if (!localReq.method) {
      localReq.method = 'GET';
    }
    if (!localReq.headers || typeof localReq.headers.get !== 'function') {
      const rawHeaders = localReq.headers || {};
      localReq.headers = {
        get: (name: string) => {
          if (name === '__proto__' || name === 'constructor' || name === 'prototype') return null;
          const val = Object.prototype.hasOwnProperty.call(rawHeaders, name) ? Reflect.get(rawHeaders, name) : undefined;
          const lowerName = name.toLowerCase();
          if (lowerName === '__proto__' || lowerName === 'constructor' || lowerName === 'prototype') return val || null;
          const lowerVal = Object.prototype.hasOwnProperty.call(rawHeaders, lowerName) ? Reflect.get(rawHeaders, lowerName) : undefined;
          return val || lowerVal || null;
        }
      };
    }
    if (!localReq.cookies || typeof localReq.cookies.get !== 'function') {
      const rawCookies = localReq.cookies || {};
      localReq.cookies = {
        get: (name: string) => {
          if (name === '__proto__' || name === 'constructor' || name === 'prototype') return null;
          const val = Object.prototype.hasOwnProperty.call(rawCookies, name) ? Reflect.get(rawCookies, name) : undefined;
          return val ? { value: val } : null;
        }
      };
    }


    const requestId = localReq.headers.get('x-request-id') || crypto.randomUUID();
    const startTime = Date.now();
    let authUser: AuthenticatedUser | null = null;
    let status = 200;

    // Propagate x-request-id to Sentry Scope tags
    Sentry.getCurrentScope().setTag('requestId', requestId);

    try {
      // 1. Database connection check/establish
      await dbConnect();

      // 2. Authentication & Authorization
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

      if (authUser) {
        Sentry.setUser({ id: authUser.id, email: authUser.email });
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
        } catch {
          throw new ApiError('VALIDATION', 'Malformed request body', 400);
        }



        const result = config.schema.body.safeParse(rawBody);
        if (!result.success) {
          const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[] | undefined>;
          const firstErrField = Object.keys(fieldErrors)[0];
          const firstErrMsg = (firstErrField &&
            firstErrField !== '__proto__' &&
            firstErrField !== 'constructor' &&
            firstErrField !== 'prototype' &&
            Object.prototype.hasOwnProperty.call(fieldErrors, firstErrField) &&
            (Reflect.get(fieldErrors, firstErrField) as string[] | undefined)?.[0]) || 'Invalid request body';
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

      let response: Response;
      if (result instanceof Response) {
        response = result;
      } else {
        response = NextResponse.json(result);
      }

      status = response.status;
      response.headers.set('x-request-id', requestId);
      return response;

    } catch (error: any) {
      let response: Response;
      if (error instanceof ApiError) {
        status = error.status;
        response = NextResponse.json(
          {
            error: {
              code: error.code,
              message: error.message,
              requestId,
              ...(error.details ? { details: error.details } : {}),
            },
          },
          { status: error.status }
        );
      } else if (error instanceof OutOfStockError) {
        status = 409;
        response = NextResponse.json(
          {
            error: {
              code: 'OUT_OF_STOCK',
              message: error.message,
              requestId,
            },
          },
          { status: 409 }
        );
      } else {
        status = 500;
        // Capture unexpected internal exceptions to Sentry
        Sentry.withScope((scope) => {
          scope.setTag('requestId', requestId);
          Sentry.captureException(error);
        });

        console.error(`[API Error] Request ${requestId} failed:`, error);

        response = NextResponse.json(
          {
            error: {
              code: 'INTERNAL',
              message: 'An unexpected error occurred. Please try again later.',
              requestId,
            },
          },
          { status: 500 }
        );
      }

      response.headers.set('x-request-id', requestId);
      return response;
    } finally {
      const durationMs = Date.now() - startTime;
      const routePath = localReq.nextUrl?.pathname || new URL(localReq.url).pathname;
      
      // Structured JSON logging (pino) — exactly one log line per request
      pinoLogger.info({
        requestId,
        userId: authUser?.id || null,
        route: routePath,
        status,
        durationMs,
      }, `Request: ${localReq.method} ${routePath} - Status ${status} - ${durationMs}ms`);
    }
  };

  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return handler;
  }

  return Sentry.wrapRouteHandlerWithSentry(handler, {
    method: 'GET',
    parameterizedRoute: 'unknown'
  });
}

