# Pacemaker Institute Platform

A modern, full-stack e-learning platform.

## Tech Stack
- **Frontend:** React 19, TypeScript, TailwindCSS, shadcn/ui, react-router
- **Backend:** Node.js, Hono, tRPC
- **Database:** MySQL, Drizzle ORM
- **Auth:** Custom JWT with HttpOnly cookies, Google OAuth 2.0
- **Payments:** Stripe Checkout
- **AI:** Anthropic Claude (AI Tutor)

## Getting Started Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup the database (requires MySQL running locally):
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` to point to your local MySQL database.
   
3. Run database migrations:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Production Build

```bash
npm run build
npm start
```

## Documentation
Please see `OWNER_GUIDE.md` for information on how to manage the platform and deploy it to production environments like Render or cPanel.
