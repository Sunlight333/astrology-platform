import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * Custom error class with HTTP status code support.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Structured error response sent to the client.
 */
interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

/**
 * Determine the HTTP status code from the error.
 */
function getStatusCode(err: unknown): number {
  if (err instanceof AppError) return err.statusCode;

  // Zod validation errors
  if (err instanceof Error && err.name === 'ZodError') return 400;

  // JWT errors
  if (err instanceof Error) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return 401;
    }
    if (err.name === 'NotFoundError') return 404;
  }

  return 500;
}

/**
 * Get a client-safe error label from the status code.
 */
function getErrorLabel(statusCode: number): string {
  switch (statusCode) {
    case 400: return 'Validation error';
    case 401: return 'Authentication error';
    case 403: return 'Forbidden';
    case 404: return 'Not found';
    case 409: return 'Conflict';
    case 429: return 'Too many requests';
    default:  return 'Internal server error';
  }
}

/**
 * Global error handler middleware.
 *
 * - Logs full error details server-side (stack trace, request info).
 * - Returns sanitized error to client (no stack traces, no file paths, no DB details).
 * - In production: generic messages for 5xx errors.
 * - In development: includes error message (but never stack traces).
 */
export function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = getStatusCode(err);
  const errorLabel = getErrorLabel(statusCode);

  // ---- Server-side logging (full details) ----
  const errorMessage = err instanceof Error ? err.message : String(err);
  const errorStack = err instanceof Error ? err.stack : undefined;

  console.error('[error-handler]', {
    statusCode,
    message: errorMessage,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.userId,
    timestamp: new Date().toISOString(),
    ...(errorStack && { stack: errorStack }),
  });

  // ---- Client-facing response (sanitized) ----
  const response: ErrorResponse = {
    error: errorLabel,
    message: '',
  };

  if (statusCode >= 500) {
    // Never leak internal details for server errors
    response.message = env.NODE_ENV === 'development'
      ? errorMessage
      : 'An unexpected error occurred. Please try again later.';
  } else {
    // For 4xx errors the message is usually safe to show
    response.message = errorMessage;
  }

  // Include Zod validation details for 400 errors
  if (statusCode === 400 && err instanceof Error && 'issues' in err) {
    response.details = (err as { issues: unknown }).issues;
  }

  res.status(statusCode).json(response);
}
