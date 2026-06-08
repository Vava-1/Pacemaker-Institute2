# Contributing to Pacemaker Institute

We love your input! We want to make contributing to this project as easy and transparent as possible.

## Code of Conduct

This project is governed by the [Contributor Covenant](https://www.contributor-covenant.org). By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Use the bug report template** when creating an issue
3. **Include detailed information**:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment (browser, OS, Node.js version)
4. **Label appropriately** (bug, critical, low-priority)

### Suggesting Features

1. **Describe the feature** and its use case
2. **Explain why** it would benefit the platform
3. **Provide examples** of similar features in other platforms
4. **Tag as enhancement** and discuss with maintainers

### Pull Requests

1. Fork the repository and create your branch from `main`
2. Follow the [commit message convention](#commit-message-convention)
3. Add or update tests as needed
4. Ensure all tests pass
5. Update documentation if changing public APIs
6. Request review from maintainers

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style (formatting, missing semicolons) |
| `refactor` | Code restructuring |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, tooling |
| `security` | Security fixes or improvements |

Examples:
```
feat: add course progress tracking API
fix: correct JWT token expiration calculation
docs: update API documentation for payment endpoints
security: increase bcrypt salt rounds to 12
```

## Development Setup

### Prerequisites

- Node.js 20+ and npm 10+
- MySQL 8+ database
- Git

### Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/Pacemaker-Institute2.git
cd Pacemaker-Institute2

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Start development server
npm run dev
```

## Coding Standards

### TypeScript

- Use strict TypeScript with proper types (avoid `any`)
- Follow existing patterns for interfaces and types
- Use `type` for unions/intersections, `interface` for objects
- Document complex types with JSDoc when needed

### React

- Use functional components with hooks
- Prefer `@tanstack/react-query` for data fetching
- Use `zod` for form validation with `react-hook-form`
- Follow existing component patterns (shadcn/ui style)

### Styling

- Use TailwindCSS utility classes
- Follow the existing dark mode pattern
- Use `cn()` utility for conditional classes
- Maintain mobile-first responsive design

### Backend

- Use Hono framework patterns
- Validate all inputs with Zod schemas
- Use Drizzle ORM for database queries
- Follow tRPC router patterns

### Testing

- Write tests for all new features
- Maintain or exceed coverage thresholds
- Use Vitest for unit and integration tests
- Test edge cases and error states

## Review Process

### Before Submitting

1. Run `npm run check` (TypeScript check)
2. Run `npm run lint` (ESLint)
3. Run `npm run format:check` (Prettier)
4. Run `npm test` (all tests pass)
5. Run `npm run build` (build succeeds)

### Reviewer Checks

- [ ] Code follows project style and conventions
- [ ] Tests cover the change adequately
- [ ] No security vulnerabilities introduced
- [ ] Documentation is updated if needed
- [ ] Commit messages follow convention

## Release Process

1. Create a release branch from `main`
2. Update version in `package.json`
3. Update `CHANGELOG.md`
4. Create a GitHub release with release notes
5. Merge to `main` and tag the release
6. Deploy to production

## Questions?

- Open a [GitHub Discussion](https://github.com/Vava-1/Pacemaker-Institute2/discussions)
- Email: support@pacemaker.institute
