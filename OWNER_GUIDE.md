# Pacemaker Institute - Owner's Guide

Welcome to your new e-learning platform! This guide explains how to manage your platform without touching any code.

## 1. The Admin Dashboard
To access the Admin Dashboard:
1. Log in to the platform with your admin account.
2. Click on your profile avatar in the top right corner.
3. Select "Admin Dashboard".

Here, you can manage **Users**, **Courses**, **Settings**, and view **Revenue**.

## 2. Managing Users & Instructors
In the **Users** tab of the Admin Dashboard:
- **Change Roles:** You can promote a standard user to an "Instructor" or "Admin" using the dropdown next to their name. Instructors can create and manage their own courses.
- **Suspend Users:** If a user violates terms, you can suspend them with one click. They will immediately lose access to their account.

## 3. Platform Settings (No-Code Configuration)
You do not need to edit environment variables or code files to change your integrations!
Go to the **Settings** tab in the Admin Dashboard to configure:

- **Stripe Secret Key:** To accept payments. Get this from your Stripe Dashboard (Developers -> API Keys).
- **Stripe Webhook Secret:** To automatically enroll students when they pay. Get this from Stripe (Developers -> Webhooks).
- **Anthropic API Key:** To power the AI Tutor. Get this from console.anthropic.com.
- **SMTP Settings:** To send verification emails and password resets. Enter your SendGrid/Mailgun details here.

## 4. Course Management
Instructors and Admins can create courses:
1. Go to your Dashboard and click "Create New Course".
2. You can upload a thumbnail, set the price (in USD), and add lessons.
3. Lessons can include Video URLs, text content, or PDFs.
4. If a course price is set to `0.00`, students can enroll for free with one click. If it has a price, they will be redirected to Stripe Checkout.

## 5. Deployment Guide (Render & BlueHost/cPanel)

### Option A: Render.com (Recommended for easy updates)
1. Push this code to a private GitHub repository.
2. Create an account on [Render.com](https://render.com).
3. Click "New" -> "Web Service".
4. Connect your GitHub repository.
5. Render will automatically detect the `render.yaml` file and configure everything.
6. Make sure you set your `DATABASE_URL` (MySQL) in the Environment variables in Render.

### Option B: BlueHost / cPanel (Standard Hosting)
1. Zip this entire folder.
2. Upload it to your cPanel File Manager (e.g., in `public_html`).
3. Extract the files.
4. Go to **MySQL Databases** in cPanel and create a new database, user, and password.
5. Open `.env.example`, rename it to `.env`, and update the `DATABASE_URL` with your new database credentials:
   `DATABASE_URL="mysql://your_db_user:your_db_pass@127.0.0.1:3306/your_db_name"`
6. Use cPanel's **Setup Node.js App** tool.
   - Choose Node 20+
   - Point the Application URL to your domain.
   - Point the Application startup file to `dist/boot.js`
   - Run `npm install` and `npm run build` from the cPanel terminal.
   - Start the App.
7. We have included an `.htaccess` file that automatically routes traffic correctly.

## 6. Certificate Generation
Certificates are generated automatically when a student reaches 100% progress on a course. They can view, download, and print their certificate directly from their profile page. The UI automatically styles itself perfectly for printing to PDF.

---
*Built by ArchitectAI*
