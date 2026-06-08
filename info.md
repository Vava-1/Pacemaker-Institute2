# Pacemaker Institute - Technical Information

**Environment:** Node.js 20+ | npm 10+ | MySQL 8+

## Tech Stack Details

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2 | Frontend UI library |
| TypeScript | 5.9 | Type-safe development |
| Vite | 7.2 | Build tool and dev server |
| TailwindCSS | 3.4 | Utility-first CSS framework |
| Hono | 4.8 | Web framework (backend) |
| tRPC | 11.8 | Type-safe API layer |
| Drizzle ORM | 0.45 | Database ORM |
| MySQL | 8.0 | Relational database |
| Stripe | 22.2 | Payment processing |
| Anthropic SDK | 0.100 | AI tutor integration |
| TanStack Query | 5.90 | Server state management |
| React Router | 7.6 | Client-side routing |
| Zod | 4.3 | Schema validation |
| jose | 6.1 | JWT authentication |
| bcrypt | 6.0 | Password hashing |
| Nodemailer | 8.0 | Email delivery |
| Cloudinary | 2.10 | Media hosting |
| Vitest | 4.0 | Testing framework |
| Docker | Latest | Containerization |

## Project Structure

```
pacemaker-institute/
├── api/                        # Backend application
│   ├── boot.ts                 # Server entry point
│   ├── router.ts               # tRPC router definitions
│   ├── context.ts              # Request context
│   ├── auth-router.ts          # Authentication procedures
│   ├── middleware.ts           # tRPC middleware
│   ├── lib/
│   │   ├── auth.ts             # JWT and password utilities
│   │   ├── env.ts              # Environment validation
│   │   ├── logger.ts           # Structured logging
│   │   ├── mailer.ts           # Email templates and sending
│   │   ├── google-auth.ts      # Google OAuth flow
│   │   ├── webhook-router.ts   # Stripe webhooks
│   │   ├── upload-router.ts    # File upload handling
│   │   └── vite.ts             # Static file serving
│   ├── queries/
│   │   └── connection.ts       # Database pool and Drizzle
│   └── routers/                # 14 tRPC routers
│       ├── admin-router.ts
│       ├── ai-router.ts
│       ├── category-router.ts
│       ├── certificate-router.ts
│       ├── course-router.ts
│       ├── dashboard-router.ts
│       ├── exercise-router.ts
│       ├── leaderboard-router.ts
│       ├── lesson-router.ts
│       ├── message-router.ts
│       ├── notification-router.ts
│       ├── payment-router.ts
│       ├── subscription-router.ts
│       └── testimonial-router.ts
├── src/                        # Frontend application
│   ├── components/             # UI components (shadcn/ui)
│   └── pages/                  # 26 page components
├── db/                         # Database
│   ├── schema.ts               # Drizzle schema definitions
│   ├── relations.ts            # Table relations
│   ├── seed.ts                 # Database seeder
│   └── migrations/             # Migration files
├── contracts/                  # Shared TypeScript types
├── tests/                      # Test suites
│   ├── contracts.test.ts       # Contract and unit tests
│   └── setup.ts                # Test environment setup
├── scripts/                    # Utility scripts
│   ├── backup.sh               # Database backup (Linux)
│   └── backup.ps1              # Database backup (Windows)
├── .github/workflows/          # CI/CD pipeline
│   └── deploy.yml              # GitHub Actions workflow
├── Dockerfile                  # Multi-stage Docker build
├── render.yaml                 # Render blueprint config
└── config files                # Various configs
```

## Development Workflow

### Setup
```bash
npm install          # Install dependencies
cp .env.example .env  # Configure environment
npm run db:migrate    # Run database migrations
npm run db:seed       # Seed sample data
npm run dev           # Start dev server
```

### Making Changes
```bash
npm run lint          # Check code quality
npm run format        # Format code
npm run check         # TypeScript check
```

### Committing
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation
- `security:` security fixes

### Testing
```bash
npm test              # Run all tests
npm run test:coverage # Run with coverage
```

## Database Migrations

```bash
npm run db:generate   # Generate migration from schema changes
npm run db:migrate    # Apply pending migrations
npm run db:push       # Push schema directly (dev only)
npm run db:seed       # Seed database with sample data
npm run db:reset      # Drop, recreate, and seed
```

## Environment Variables

### Critical Variables
- `DATABASE_URL` - MySQL connection string
- `JWT_ACCESS_SECRET` - JWT signing key (min 32 chars)
- `JWT_REFRESH_SECRET` - Refresh token key (min 32 chars)
- `FRONTEND_URL` - Public URL of the application

### Optional But Important
- `STRIPE_SECRET_KEY` - Payment processing
- `ANTHROPIC_API_KEY` - AI tutor functionality
- `GOOGLE_CLIENT_ID/SECRET` - OAuth login
- `SMTP_*` - Email delivery
- `CLOUDINARY_URL` - File uploads

## Security Checklist

- [ ] JWT secrets are 32+ characters
- [ ] Stripe webhooks verify signatures
- [ ] Rate limiting is active (100/min general, 10/min auth)
- [ ] CSP headers are present
- [ ] Input validation with Zod on all endpoints
- [ ] Password hashing with bcrypt (cost 12)
- [ ] HTTP-only cookies for auth tokens
- [ ] TLS in production
- [ ] File upload MIME type whitelist
- [ ] SQL injection prevention via Drizzle ORM

## Performance Guidelines

- Use TanStack Query for efficient data fetching
- Implement pagination for large datasets
- Use database indexes on frequently queried columns
- Optimize images before upload (Cloudinary handles this)
- Enable CDN caching for static assets
- Monitor query performance with slow query logging

## Troubleshooting

| Issue | Check |
|-------|-------|
| Build fails | Node.js version (20+), npm cache, disk space |
| Database errors | Connection string, MySQL running, migrations applied |
| Auth fails | JWT secrets length (32+), token expiry |
| Payments fail | Stripe keys, webhook endpoint, test mode |
| Email fails | SMTP config, port accessibility, credentials |
| AI tutor fails | API key, usage quota, network access |
