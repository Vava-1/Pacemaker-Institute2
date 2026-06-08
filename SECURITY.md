# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Pacemaker Institute seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to **security@pacemaker.institute**.

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### Response Timeline

| Severity | Initial Response | Assessment Complete |
|----------|-----------------|-------------------|
| Critical | 48 hours | 72 hours |
| High     | 48 hours | 1 week    |
| Medium   | 48 hours | 2 weeks   |
| Low      | 48 hours | Next release |

### Security Measures

- Automated dependency audits (npm audit)
- Snyk vulnerability scanning in CI/CD
- Mandatory code review for all pull requests
- ESLint security plugins
- Zod input validation for all API endpoints
- Drizzle ORM with parameterized queries (SQL injection prevention)
- bcrypt password hashing (cost factor 12)
- JWT authentication with HttpOnly cookies
- Rate limiting on all API endpoints
- Content Security Policy (CSP) headers
- HTTPS enforced in production
- Stripe webhook signature verification

### Security Headers

| Header | Value |
|--------|-------|
| X-Frame-Options | DENY |
| X-XSS-Protection | 1; mode=block |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Cross-Origin-Opener-Policy | same-origin |
| Content-Security-Policy | See boot.ts configuration |

### Responsible Disclosure

- Provide details of the vulnerability, including steps to reproduce
- Allow us reasonable time to resolve the issue before public disclosure
- Do not access or modify other users' data without permission
- Act in good faith to avoid privacy violations and data destruction

### Bug Bounty

We do not currently operate a formal bug bounty program, but we greatly appreciate and acknowledge responsible security researchers who help us keep our platform secure.

## Security Contacts

- **Security Issues**: security@pacemaker.institute
- **Data Protection**: dpo@pacemaker.institute
- **Emergency Phone**: +1 (555) 123-4567
