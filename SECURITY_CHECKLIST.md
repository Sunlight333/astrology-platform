# Security Checklist

## Input Validation
- [x] All API endpoints validated with Zod schemas
- [x] Birth dates restricted to 1800-present
- [x] Birth times validated as 24h format
- [x] Coordinates validated (-90/90 lat, -180/180 lon)
- [x] Text inputs sanitized against XSS

## Rate Limiting
- [x] Auth endpoints: 5/min per IP
- [x] Chart calculation: 10/hour per user
- [x] Geocoding: 100/hour per user
- [x] General: 100/min per IP
- [ ] Webhook IP whitelist (Mercado Pago ranges)

## Authentication & Authorization
- [x] JWT with httpOnly refresh cookies
- [x] Secure, SameSite=Strict cookie flags
- [x] bcrypt password hashing (10 rounds)
- [x] Content access checks server-side
- [ ] Admin routes protected with admin role (TODO)

## CORS & Headers
- [x] CORS restricted to frontend URL
- [x] Helmet.js security headers
- [x] No wildcard origins

## Database
- [x] Parameterized queries (Prisma)
- [x] JSONB fields through Prisma (no raw SQL)
- [ ] Connection pooling configured for production

## Payment Security
- [x] Prices read from database, not client
- [x] Server-side order validation
- [ ] Webhook signature verification (partial)

## Secrets
- [x] .env in .gitignore
- [x] No secrets in code
- [ ] Pre-commit hook for secret scanning

## Error Handling
- [x] Global error handler
- [x] Sanitized error responses (no stack traces)
- [x] Full server-side logging
