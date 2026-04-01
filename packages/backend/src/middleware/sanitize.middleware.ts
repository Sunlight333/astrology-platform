import { Request, Response, NextFunction } from 'express';

/**
 * Strip HTML tags from a string to prevent XSS.
 */
function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

/**
 * Recursively sanitize all string values in an object:
 * - Strip HTML tags
 * - Trim whitespace
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return stripHtmlTags(value).trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }

  return value;
}

/**
 * Express middleware that sanitizes all string inputs in req.body,
 * req.query, and req.params by stripping HTML tags and trimming whitespace.
 */
export function sanitizeInputs(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query) as typeof req.query;
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params) as typeof req.params;
  }

  next();
}
