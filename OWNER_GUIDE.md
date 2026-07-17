# Pacemaker Institute - Owner & Administrator Guide

**Version:** 1.0.1
**Audience:** Platform owners, administrators, and instructors

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Managing Courses](#3-managing-courses)
4. [Managing Users](#4-managing-users)
5. [Payments & Subscriptions](#5-payments--subscriptions)
6. [AI Tutor](#6-ai-tutor)
7. [Email & Notifications](#7-email--notifications)
8. [Content Moderation](#8-content-moderation)
9. [Security & Compliance](#9-security--compliance)
10. [Troubleshooting](#10-troubleshooting)
11. [FAQ](#11-faq)

## 1. Getting Started

### First Login

After deployment, the seed script creates an admin account using credentials
from the following environment variables (or randomized defaults that are
printed ONCE to the server logs at seed time):

```
SEED_ADMIN_EMAIL      (default: admin@pacemaker.institute)
SEED_ADMIN_PASSWORD   (default: random — check server logs)
```

To set your own credentials, configure those env vars in Railway/Render
**before** the first deploy, then run the seed. The password is printed in
plain text in the seed output exactly once, then stored only as a bcrypt
hash. Rotate it immediately from **Profile → Change Password** after first
login.

> **⚠️ IMPORTANT:** Never commit a real password to the repository. The
> seed config in `backend/db/seed.ts` deliberately reads from env vars so
> production credentials never touch source control.

### Initial Setup Checklist

- [ ] Change default admin password
- [ ] Configure SMTP settings for email delivery
- [ ] Set up Stripe API keys (test mode first)
- [ ] Configure Google OAuth credentials
- [ ] Set up Anthropic API key for AI tutor
- [ ] Configure Cloudinary for file uploads
- [ ] Review and customize platform settings
- [ ] Create instructor accounts
- [ ] Configure course categories
- [ ] Set up monitoring (Sentry, error webhooks)

### Navigation

The admin dashboard provides access to:

- **Dashboard** - Platform metrics and activity feed
- **Courses** - Manage all courses
- **Users** - Manage users, roles, and permissions
- **Payments** - Transaction history and refunds
- **Analytics** - Platform usage statistics
- **Settings** - Platform configuration
- **AI Tutor** - Monitor AI interactions

## 2. Dashboard Overview

### Key Metrics

| Metric | Description |
|--------|-------------|
| Total Users | Registered user count |
| Active Courses | Published courses |
| Monthly Revenue | Current month revenue |
| Enrollments | Total course enrollments |
| Completion Rate | Average course completion % |
| AI Tutor Queries | Total AI interactions |
| Active Subscriptions | Current subscriber count |

### Real-time Activity Feed

- New user registrations
- Course enrollments
- Payment transactions
- AI tutor interactions
- System alerts and warnings

## 3. Managing Courses

### Creating a Course

1. Navigate to **Courses > Create Course**
2. Fill in course details:
   - Title, description, and thumbnail
   - Category and difficulty level
   - Price (free or paid)
   - Learning outcomes and prerequisites
   - Tags for discoverability
3. Add course modules and lessons
4. Configure lesson types (video, text, PDF, quiz)
5. Set publishing date and feature status

### Lesson Types

| Type | Requirements | Max Size |
|------|-------------|----------|
| Video | MP4, WebM, MOV | 50MB |
| Text | Markdown content | 50KB |
| PDF | PDF document | 50MB |
| Quiz | Questions with options | N/A |

### Publishing Checklist

- [ ] Course has at least 1 module
- [ ] Each module has at least 1 lesson
- [ ] Thumbnail image is uploaded
- [ ] Price is set (use 0 for free)
- [ ] Learning outcomes are defined
- [ ] Tags are added for search

### Course Analytics

- Enrollment numbers over time
- Lesson completion rates
- Average time spent per lesson
- Student feedback and ratings
- Drop-off points in the curriculum

## 4. Managing Users

### User Roles

| Role | Permissions |
|------|------------|
| Admin | Full platform access, user management, settings |
| Instructor | Create/manage courses, view analytics |
| Student | Enroll in courses, access learning content |

### Suspending a User

1. Go to **Users > Find user**
2. Click **Suspend Account**
3. Select suspension reason
4. Set duration (temporary or permanent)
5. Confirm suspension

### Role Changes

1. Go to **Users > Find user**
2. Click **Edit Role**
3. Select new role
4. Confirm change (warning: this may affect course ownership)

### Bulk Actions

- Export user list to CSV
- Send bulk email notifications
- Apply role changes to multiple users

## 5. Payments & Subscriptions

### Payment Dashboard

- Transaction history with filtering
- Revenue charts and trends
- Refund management
- Subscription status overview
- Payout tracking for instructors

### Refund Processing

1. Go to **Payments > Refund Request**
2. Review refund eligibility:
   - Within 14 days of purchase
   - Less than 20% course progress
   - Not previously refunded
3. Approve or deny refund
4. Stripe automatically processes the refund
5. Student receives confirmation email

### Subscription Plans

| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | 2 courses, 3 daily exercises, basic AI (5 queries/day) |
| Pro | $19.99/mo | Unlimited courses, full AI, certificates |
| Expert | $39.99/mo | Everything in Pro + 1-on-1 mentoring |

### Revenue Reports

- Monthly/quarterly/annual revenue
- Revenue by course/category
- Subscription revenue vs one-time purchases
- Refund rate and trends

## 6. AI Tutor

### AI Tutor Dashboard

- Total conversations and messages
- Popular topics and subjects
- Usage patterns (peak hours)
- Response quality metrics
- Blocked content attempts

### Content Safety

The AI tutor automatically blocks:

1. Hacking and exploitation requests
2. Personal information sharing
3. Illegal or harmful content
4. System prompt extraction attempts
5. Impersonation requests

### Customizing AI Behavior

1. Go to **Settings > AI Tutor**
2. Modify system prompt (advanced)
3. Adjust temperature and response length
4. Configure blocked patterns
5. Set usage limits per user

> **⚠️ WARNING:** Modifying the system prompt can affect response quality and safety. Test changes thoroughly.

## 7. Email & Notifications

### Email Templates

| Event | Template | Editable |
|-------|----------|----------|
| Welcome | Welcome email | Yes |
| Email Verification | Verify address | Yes |
| Password Reset | Reset link | Yes |
| Enrollment Confirmation | Course enrolled | Yes |
| Certificate Awarded | Certificate link | Yes |
| Payment Receipt | Transaction details | Yes |
| Subscription Expiry | Renewal notice | Yes |
| Account Suspended | Suspension notice | Yes |

### SMTP Configuration

Supported providers:
- SendGrid
- Mailgun
- Amazon SES
- SMTP2GO
- Any standard SMTP provider

### In-App Notifications

- Course enrollment confirmed
- New course published
- Certificate earned
- Exercise reminder
- System announcements

## 8. Content Moderation

### Automated Moderation

- Profanity filtering in user-generated content
- Spam detection in forum posts
- Copyright infringement checks
- Plagiarism detection for course content

### Manual Review Queue

- Flagged user comments
- Reported course content
- Suspicious account activity
- Support ticket escalations

### Content Policies

- No hate speech or discrimination
- No copyrighted material without permission
- No malicious code or links
- No explicit or adult content
- No promotional spam

## 9. Security & Compliance

### Monthly Security Checklist

- [ ] Review access logs for unusual activity
- [ ] Check for outdated dependencies (npm audit)
- [ ] Verify SSL/TLS certificates are valid
- [ ] Review user suspension reports
- [ ] Test backup restoration process
- [ ] Review API rate limit effectiveness
- [ ] Audit admin account activity

### GDPR Compliance

- User data export available
- Account deletion with data removal
- Cookie consent management
- Privacy policy compliance

### Audit Logs

- Login attempts (successful and failed)
- Password changes
- Role modifications
- Payment transactions
- Content changes

## 10. Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Emails not sending | Check SMTP configuration and credentials |
| Stripe payments failing | Verify Stripe keys and webhook endpoint |
| AI tutor not responding | Check Anthropic API key and quota |
| Slow page loads | Check database connection and query performance |
| File upload failing | Verify Cloudinary configuration and file size limits |
| Users cannot log in | Check if account is suspended or email unverified |

### Health Checks

- `GET /api/health` - Full system health
- `GET /api/ready` - Database readiness
- `GET /api/live` - Server liveness

### Getting Help

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
- Open an issue on [GitHub](https://github.com/Vava-1/Pacemaker-Institute2/issues)
- Contact support@pacemaker.institute for urgent issues

## 11. FAQ

**Q: How do I reset the admin password?**
A: Use the forgot password flow on the login page, or run a direct database update.

**Q: Can I customize the platform branding?**
A: Yes, update the theme settings in the admin panel and modify TailwindCSS variables.

**Q: How are instructor payouts handled?**
A: Currently manual. Use the revenue reports to calculate and process payouts.

**Q: Can I integrate with my existing LMS?**
A: The platform provides REST API endpoints for integration. Contact support for custom solutions.

**Q: How do I back up the database?**
A: Use `npm run backup:db` or the scripts in the `scripts/` directory.

**Q: Is there a mobile app?**
A: Not yet. The platform is mobile-responsive for all devices.

**Q: How do I add new lesson types?**
A: Extend the lesson schema in `db/schema.ts` and add a new component in `src/pages/LessonPlayer.tsx`.

**Q: Can I migrate from another platform?**
A: Yes, contact support for migration assistance and data import services.
