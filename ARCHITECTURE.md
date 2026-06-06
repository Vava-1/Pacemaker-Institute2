# Architecture Overview

## Frontend
- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS v3.4 and shadcn/ui component library
- **Routing**: react-router v7
- **State Management**: react-query v5 for data fetching and caching
- **Authentication Flow**: JWT stored in HttpOnly, SameSite=Lax cookies; Google OAuth 2.0 integration

## Backend (API)
- **Runtime**: Node.js 20, built with Hono (lightweight web framework)
- **API Layer**: tRPC for type‑safe RPC endpoints
- **Security**:
  - Secure headers via `hono/secure-headers`
  - CSRF protection with `hono/csrf`
  - Rate limiting (`hono-rate-limiter`)
  - Cookie flags set to `httpOnly`, `secure` (in prod), `sameSite: lax`
- **Email**: Nodemailer with environment‑driven SMTP config; simple per‑recipient rate limiting (5/minute)
- **Database**: MySQL accessed through Drizzle ORM; migrations managed via `drizzle-kit`

## Deployment
- **Build**: Vite builds the frontend; esbuild bundles the backend entry (`api/boot.ts`).
- **Server**: `@hono/node-server` serves the combined app in production.
- **CI/CD**: GitHub Actions workflow runs lint, type‑check, tests, and builds on each push.

## Key Security Enhancements Added
- Content‑Security‑Policy, HSTS, X‑Frame‑Options, X‑Content‑Type‑Options via `secureHeaders`.
- CSRF middleware applied to all routes.
- Email sending now rate‑limited per recipient.
- CI pipeline ensures linting, type safety, and successful build before deployment.

---

Feel free to extend this diagram with more details (e.g., dataflow, external services) as the project evolves.
