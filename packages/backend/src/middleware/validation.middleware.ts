import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Format Zod errors into a structured response.
 */
function formatZodError(error: ZodError): { field: string; message: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Validate `req.body` against a Zod schema.
 * Returns 400 with structured validation errors on failure.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Request body validation failed',
        details: formatZodError(result.error),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validate `req.query` against a Zod schema.
 * Returns 400 with structured validation errors on failure.
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Query parameter validation failed',
        details: formatZodError(result.error),
      });
      return;
    }
    // Assign validated data back to req.query
    req.query = result.data as typeof req.query;
    next();
  };
}

/**
 * Validate `req.params` against a Zod schema.
 * Returns 400 with structured validation errors on failure.
 */
export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation error',
        message: 'Path parameter validation failed',
        details: formatZodError(result.error),
      });
      return;
    }
    req.params = result.data as typeof req.params;
    next();
  };
}
