# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Full GDPR-compliant Privacy Policy with 14 sections and blue info banner
- Complete Terms of Service with 16 sections and yellow warning banner
- Detailed Cookie Policy with HTML tables and green info banner
- SECURITY.md with vulnerability reporting process and supported versions table
- Comprehensive test suite with 50+ assertions across 15 test suites
- Docker multi-stage build with non-root user and health check
- Graceful shutdown handlers (SIGTERM/SIGINT) for production
- Kubernetes-compatible health probes (/api/ready, /api/live)
- Auth-specific rate limiting (10 req/min) for brute force protection
- Content safety filter for AI tutor with blocked patterns detection
- Sentry integration for error monitoring in production
- Request correlation IDs (X-Request-ID) for distributed tracing
- S3 and GCS upload support in backup scripts
- PostgreSQL database service in render.yaml

### Changed
- Enhanced boot.ts with full CSP headers, request logging middleware, OPTIONS handler, and improved error handler
- Strengthened JWT secret validation to minimum 32 characters (BREAKING)
- Improved env.ts with strict key format validation (Stripe, Anthropic prefixes)
- Enhanced logger.ts with Sentry integration for warn/error levels
- Rewrote auth-router.ts with proper error codes and password complexity validation
- Expanded vitest config with coverage thresholds (60% statements, 50% branches)
- Updated CI/CD pipeline with 5 jobs (quality, security, test, build, deploy)
- Improved render.yaml with auto-scaling, health checks, and disk configuration

### Security
- Added Content Security Policy (CSP) headers
- Implemented tiered rate limiting (auth: 10/min, general: 100/min)
- Added password complexity validation (uppercase, lowercase, number, special char)
- Added SQL injection pattern detection in tests
- Added email header injection prevention checks
- Added file upload MIME type whitelist validation
- Added Stripe webhook signature verification

### Fixed
- Removed placeholder TODO text from legal pages
- Fixed database connection to use connection pool with proper limits
- Fixed context.ts to properly extract tokens from Authorization header
- Fixed error messages to prevent user enumeration in auth flows

## [1.0.0] - 2026-06-07

### Added
- Initial release of Pacemaker Institute e-learning platform
- React 19 frontend with 26 page components
- Hono backend with tRPC API (14 routers)
- MySQL database with Drizzle ORM
- JWT-based authentication with refresh tokens
- Stripe payment processing
- AI tutor powered by Anthropic Claude
- Course management with module and lesson system
- Daily exercises and quiz system
- Leaderboards and gamification
- Community chat rooms
- Certificate generation
- Google OAuth integration
- Dark mode support
- Responsive mobile-first design
