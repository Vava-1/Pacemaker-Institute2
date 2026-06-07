# Pacemaker Institute - Owner's Guide

Welcome to your e-learning platform! This guide is for the **non-technical owner** who manages the platform day-to-day.

> **For first-time setup and deployment**, see [`DEPLOYMENT.md`](./DEPLOYMENT.md).
> **For developer documentation**, see [`README.md`](./README.md).

---

## 1. First Time Setup

When you first log in after deploying, do these things in order:

1. **Log in** with the seeded admin account:
   - Email: `admin@pacemaker.institute`
   - Password: `Admin@2024!`
2. **Change the admin password** (Profile -> Change Password). Use a strong password.
3. **Configure your integrations** (see [Section 3 - Platform Settings](#3-platform-settings-no-code-configuration) below).
4. **Add your first real course** (see [Section 4 - Course Management](#4-course-management)).
5. **Customize the legal pages** (`/terms`, `/privacy`, `/cookies`) - look for `<!-- TODO: Replace with actual company info -->` markers.
6. **Set up a custom domain** (see [DEPLOYMENT.md Section 5](./DEPLOYMENT.md#5-custom-domain-configuration)).

---

## 2. The Admin Dashboard

To access the Admin Dashboard:
1. Log in to the platform with your admin account.
2. Click on your profile avatar in the top right corner.
3. Select "Admin Dashboard".

Here, you can manage **Users**, **Courses**, **Settings**, and view **Revenue**.

---

## 3. Managing Users & Instructors

In the **Users** tab of the Admin Dashboard:
- **Change Roles:** You can promote a standard user to an "Instructor" or "Admin" using the dropdown next to their name. Instructors can create and manage their own courses.
- **Suspend Users:** If a user violates terms, you can suspend them with one click. They will immediately lose access to their account.

### How to Add a New Instructor

There are two ways:

**Option A - Promote an existing user (recommended):**
1. Have the user register a normal account at `/register`.
2. In Admin Dashboard -> Users, find the user and change their role from `user` to `instructor`.
3. The user can now log in and access the Instructor Dashboard.

**Option B - Create an instructor account directly:**
1. In Admin Dashboard -> Users -> Add User.
2. Fill in name, email, set role to `instructor`.
3. A temporary password is generated - share it with the new instructor and ask them to change it.

---

## 4. Platform Settings (No-Code Configuration)

You do not need to edit environment variables or code files to change your integrations!
Go to the **Settings** tab in the Admin Dashboard to configure:

- **Stripe Secret Key:** To accept payments. Get this from your Stripe Dashboard (Developers -> API Keys).
- **Stripe Webhook Secret:** To automatically enroll students when they pay. Get this from Stripe (Developers -> Webhooks).
- **Anthropic API Key:** To power the AI Tutor. Get this from console.anthropic.com.
- **SMTP Settings:** To send verification emails and password resets. Enter your SendGrid/Mailgun details here.

---

## 5. Course Management

Instructors and Admins can create courses:
1. Go to your Dashboard and click "Create New Course".
2. You can upload a thumbnail, set the price (in USD), and add lessons.
3. Lessons can include Video URLs, text content, or PDFs.
4. If a course price is set to `0.00`, students can enroll for free with one click. If it has a price, they will be redirected to Stripe Checkout.

### Adding lessons

1. Open a course -> "Add Module" (groups of lessons).
2. Inside the module, "Add Lesson" and choose a type:
   - **Video:** Paste a YouTube/Vimeo URL or any direct video link.
   - **Text:** Write the lesson content in Markdown.
   - **PDF:** Upload a PDF file.
   - **Quiz:** Built-in quiz with multiple-choice or true/false questions.
3. Mark a lesson as "Free" to let non-enrolled students preview it.

---

## 6. Switching from Test to Live Payments

> [!CAUTION]
> Always test with Stripe test mode first.

1. In Stripe Dashboard, the toggle at the top switches between **Test** and **Live** mode.
2. Complete Stripe's business verification (Settings -> Account settings).
3. Switch to **Live mode**.
4. Copy the **Live** secret key (starts with `sk_live_`).
5. Create a webhook in **Live mode**:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Listen for: `checkout.session.completed`
6. Copy the new webhook signing secret.
7. Update `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in your hosting dashboard with the **live** values.
8. Trigger a redeploy.

> [!TIP]
> Keep your test keys in a note somewhere. You can switch back to test mode anytime.

---

## 7. Certificate Generation

Certificates are generated automatically when a student reaches 100% progress on a course. They can view, download, and print their certificate directly from their profile page. The UI automatically styles itself perfectly for printing to PDF.

---

## 8. Database Backups

Backups are not automatic by default. Set them up once and forget.

- **Render-managed backups:** Render Dashboard -> your database -> **Backups** -> enable automatic daily backups.
- **Self-managed backups:** Use the included `scripts/backup-db.sh` (Linux/Mac) or `scripts/backup-db.ps1` (Windows). See [DEPLOYMENT.md Section 9](./DEPLOYMENT.md#9-database-backups) for setup.

To **restore** a backup, see the troubleshooting section below.

---

## 9. Troubleshooting Common Issues

### "I forgot the admin password"

If you have database access (Render Dashboard -> Database -> Connect):

```sql
-- 1. Generate a bcrypt hash for your new password locally:
--    node -e "console.log(require('bcrypt').hashSync('MyNewPassword', 12))"

-- 2. Run this in the database console:
UPDATE users SET password_hash = '<paste-hash-here>' WHERE email = 'admin@pacemaker.institute';
```

### "Student paid but didn't get enrolled"

1. Stripe Dashboard -> Webhooks -> your endpoint -> Logs. Check the most recent event succeeded (green).
2. If it shows a red error, the issue is usually:
   - Wrong webhook signing secret in your env vars.
   - Your service was down when the webhook arrived (Stripe retries automatically).
3. Manually trigger enrollment from Admin Dashboard -> Payments.

### "I'm not receiving emails"

1. Check your **SMTP settings** in the Admin Settings page.
2. Send a test email (Settings -> "Send Test Email" button).
3. If using SendGrid, verify the sender email in SendGrid Settings -> Sender Authentication.
4. Check your email provider's logs for bounce/spam complaints.

### "Stripe webhook signature is invalid"

This means `STRIPE_WEBHOOK_SECRET` does not match the secret Stripe is using.
1. Go to Stripe Dashboard -> Developers -> Webhooks.
2. Click your endpoint -> "Reveal" the signing secret.
3. Copy it exactly into your env vars (no extra spaces or newlines).
4. Redeploy.

### "The app is slow / unresponsive"

1. Check Render logs for errors.
2. Check your database for slow queries (Render -> Database -> Query Insights).
3. Consider upgrading to a paid Render plan (more CPU/RAM).

### "I see 'Application error' on the site"

1. Render Dashboard -> your service -> Logs.
2. Look at the most recent lines. Common causes:
   - `Error: connect ECONNREFUSED` -> `DATABASE_URL` is wrong or the DB is down.
   - `Missing required environment variable` -> fill in the missing env var.
   - `JWT secret too short` -> your JWT secrets must be at least 16 characters.

### "A user is spamming/abusing the platform"

1. Admin Dashboard -> Users -> find the user -> click "Suspend".
2. They will be logged out immediately and unable to log back in.
3. Their data is preserved in case you want to reinstate them.

---

## 10. Legal & Compliance

- **Terms of Service** - `/terms` - Edit `src/pages/Terms.tsx`. Search for `<!-- TODO:` to find placeholders.
- **Privacy Policy** - `/privacy` - Edit `src/pages/Privacy.tsx`.
- **Cookie Policy** - `/cookies` - Edit `src/pages/Cookies.tsx`.
- **Cookie consent banner** - Appears automatically on first visit. Users can accept, reject, or customize.

> [!WARNING]
> Have a lawyer review your legal pages before going live with real users. The provided templates are placeholders.

---

## 11. Getting Help

- **Deployment issues:** see [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- **Developer docs:** see [`README.md`](./README.md)
- **API status:** visit `https://your-domain.com/api/health`
- **Bug reports:** open an issue on GitHub

---

*Built by ArchitectAI*
