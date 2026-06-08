# Pacemaker Institute

[![CI / CD / Security](https://github.com/Vava-1/Pacemaker-Institute2/actions/workflows/deploy.yml/badge.svg)](https://github.com/Vava-1/Pacemaker-Institute2/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-20.x-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Code Coverage](https://img.shields.io/codecov/c/github/Vava-1/Pacemaker-Institute2)](https://codecov.io/gh/Vava-1/Pacemaker-Institute2)

A modern, full-stack e-learning platform built with React 19, Hono, and MySQL. Features AI-powered tutoring, Stripe payments, real-time leaderboards, and comprehensive certification.

## Features

- 🎓 **Course Management** - Create, publish, and manage courses with multi-lesson modules
- 🤖 **AI Tutor** - Anthropic Claude-powered tutoring with contextual learning support
- 💳 **Stripe Payments** - Secure payment processing with subscription management
- 📜 **Certificates** - Auto-generated certificates upon course completion
- 🏆 **Leaderboards** - Gamified learning with daily exercises and rankings
- 💬 **Community Chat** - Real-time chat rooms for student collaboration
- 📊 **Dashboard** - Comprehensive analytics for students, instructors, and admins
- 🔔 **Notifications** - In-app and email notifications for course updates
- 🔐 **OAuth** - Google OAuth integration for seamless login
- 🌙 **Dark Mode** - Full dark/light theme support
- 📱 **Responsive** - Mobile-first design with adaptive layouts
- 🔒 **Enterprise Security** - CSP, rate limiting, JWT, SQL injection prevention

## Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | React 19, TypeScript 5.9, TailwindCSS 3.4, TanStack Query 5, React Router 7 |
| Backend | Hono 4, tRPC 11, Node.js 20, Zod 4 |
| Database | MySQL 8, Drizzle ORM 0.45 |
| Auth | JWT (jose), bcrypt, Google OAuth |
| Payments | Stripe 22 |
| AI | Anthropic Claude 3 (Sonnet/Haiku) |
| Email | Nodemailer, SMTP |
| Media | Cloudinary |
| DevOps | Docker, GitHub Actions, Render |
| Monitoring | Sentry, Structured Logging |

## Quick Start

### Prerequisites

- Node.js 20+ and npm 10+
- MySQL 8+ database
- Stripe account (optional, for payments)
- Anthropic API key (optional, for AI tutor)
- Google OAuth credentials (optional)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Vava-1/Pacemaker-Institute2.git
   cd Pacemaker-Institute2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your MySQL credentials and API keys
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Seed the database**
   ```bash
   npm run db:seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:5173` to access the frontend.

## Architecture

```
pacemaker-institute/
├── api/                   # Backend (Hono + tRPC)
│   ├── lib/               # Utilities (auth, mailer, env, logger)
│   ├── queries/           # Database connection
│   └── routers/           # tRPC routers (14 modules)
├── src/                   # Frontend (React 19)
│   ├── components/        # Reusable UI components
│   └── pages/             # 26 page components
├── db/                    # Database schema, migrations, seed
├── contracts/             # Shared TypeScript types
├── tests/                 # Test suites
├── scripts/               # Backup utilities
└── .github/workflows/     # CI/CD pipeline
```

## API Documentation

### Health Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Full health check (DB, Stripe, Anthropic, SMTP) |
| `GET /api/ready` | Database readiness check |
| `GET /api/live` | Server liveness check |

### Auth Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `auth.register` | Mutation | Create account |
| `auth.login` | Mutation | Sign in |
| `auth.refresh` | Mutation | Refresh tokens |
| `auth.forgotPassword` | Mutation | Request password reset |
| `auth.resetPassword` | Mutation | Reset password |
| `auth.changePassword` | Mutation | Change password (authenticated) |
| `auth.verifyEmail` | Mutation | Verify email address |
| `auth.me` | Query | Get current user profile |

### tRPC Routers

- `auth` - Authentication (register, login, password management)
- `payment` - Stripe checkout, payment history, refunds
- `ai` - AI tutor conversations
- `course` - Course CRUD and enrollment
- `lesson` - Lesson content and progress
- `category` - Course categories
- `certificate` - Certificate generation
- `exercise` - Daily exercises and quizzes
- `leaderboard` - Rankings and streaks
- `dashboard` - User analytics
- `notification` - In-app notifications
- `message` - Chat messaging
- `subscription` - Subscription plans
- `admin` - Admin management
- `testimonial` - User testimonials

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Coverage Areas

- API response contracts
- Authentication flows
- Payment processing validation
- Course content schemas
- User management
- Security (SQL injection, CSP, XSS)
- Environment validation
- Rate limiting configuration
- Integration workflows

## Deployment

### Render (Recommended)

1. Fork this repository
2. Create a MySQL database on Render
3. Configure environment variables in Render Dashboard
4. Connect your repository to Render
5. Deploy automatically via the `render.yaml` blueprint

Detailed deployment guides are available in [DEPLOYMENT.md](./DEPLOYMENT.md).

## Security

### Implemented Measures

- Content Security Policy (CSP) headers
- Rate limiting (100 req/min general, 10 req/min auth)
- SQL injection prevention via Drizzle ORM parameterized queries
- XSS protection via HttpOnly cookies and CSP
- CSRF protection with SameSite cookie attribute
- Password hashing with bcrypt (cost factor 12)
- JWT authentication with short-lived access tokens (15 min)
- Stripe webhook signature verification
- File upload validation (MIME type whitelist, size limits)
- Input validation with Zod schemas
- Graceful shutdown handlers (SIGTERM/SIGINT)

### Checklist

- [ ] JWT secrets are 32+ characters
- [ ] Stripe webhooks verify signatures
- [ ] Rate limiting is active
- [ ] CSP headers are present
- [ ] Database connections use TLS in production
- [ ] File uploads are restricted by MIME type
- [ ] All user inputs are validated with Zod
- [ ] Error messages don't leak sensitive information

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes following conventional commits
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Documentation

- [Owner Guide](./OWNER_GUIDE.md) - Admin and instructor operations
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- [Changelog](./CHANGELOG.md) - Version history
- [Improvements](./IMPROVEMENTS.md) - Development roadmap

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Support

- Documentation: [GitHub Wiki](https://github.com/Vava-1/Pacemaker-Institute2/wiki)
- Issues: [GitHub Issues](https://github.com/Vava-1/Pacemaker-Institute2/issues)
- Email: support@pacemaker.institute
