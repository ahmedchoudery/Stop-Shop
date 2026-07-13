export type ApiErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'OUT_OF_STOCK'
  | 'INTERNAL';

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
  requestId: string;
  details?: Record<string, string[]>;
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
}

export interface ApiResponseEnvelope<T> {
  data: T;
  requestId: string;
}

export type ApiResponse<T> = ApiResponseEnvelope<T> | ApiErrorResponse;

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'customer';
}
