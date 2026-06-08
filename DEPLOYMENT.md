# Pacemaker Institute - Deployment Guide

**Version:** 1.0.1
**Target Environments:** Render (recommended), cPanel/BlueHost, VPS (Ubuntu)

## Prerequisites

### Required Accounts

- [GitHub](https://github.com) account (source control)
- [Render](https://render.com) account (hosting, or use alternatives)
- [Stripe](https://stripe.com) account (payments)
- [Anthropic](https://console.anthropic.com) account (AI tutor)
- [Cloudinary](https://cloudinary.com) account (media storage)
- [Google Cloud Console](https://console.cloud.google.com) (OAuth)
- [Sentry](https://sentry.io) account (error monitoring, optional)

### Required Tools

- Git
- Node.js 20+
- MySQL 8+ client (for database management)
- npm 10+

## Render.com Deployment

### Step 1: Create MySQL Database

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click **New > PostgreSQL** (Note: Render doesn't offer MySQL, use an external MySQL provider or Render's PostgreSQL with a compatibility layer)
3. Alternative: Use [Aiven](https://aiven.io/mysql), [PlanetScale](https://planetscale.com), or [JawsDB](https://jawsdb.com) for MySQL

### Step 2: Fork the Repository

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/Pacemaker-Institute2.git
cd Pacemaker-Institute2
```

### Step 3: Configure Environment Variables

In the Render Dashboard, add these environment variables:

| Variable | Source |
|----------|--------|
| `DATABASE_URL` | MySQL connection string |
| `JWT_ACCESS_SECRET` | Generate with `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Generate with `openssl rand -hex 32` |
| `FRONTEND_URL` | Auto-populated by Render |
| `STRIPE_SECRET_KEY` | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard |
| `ANTHROPIC_API_KEY` | Anthropic Console |
| `CLOUDINARY_URL` | Cloudinary Dashboard |
| `SMTP_*` | Your email provider |

### Step 4: Create Web Service

1. In Render Dashboard, click **New > Web Service**
2. Connect your GitHub repository
3. Use the `render.yaml` blueprint or configure manually:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`

### Step 5: Configure Stripe Webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-app.onrender.com/api/webhooks/stripe`
3. Listen for events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `charge.refunded`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Step 6: Configure Google OAuth

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://your-app.onrender.com/api/oauth/google/callback`

### Step 7: Deploy

Push to the `main` branch to trigger automatic deployment:

```bash
git push origin main
```

### Auto-Deploy Configuration

Render auto-deploys on every push to the `main` branch. To disable:

1. Go to your Web Service > Settings
2. Scroll to **Deploy** section
3. Change **Auto-Deploy** to **No**

### Scaling

Configure auto-scaling in `render.yaml` or Render Dashboard:

```yaml
scaling:
  minInstances: 1
  maxInstances: 3
  targetCPUPercent: 70
  targetMemoryPercent: 80
```

## cPanel/BlueHost Deployment

### Step 1: Prepare Files

```bash
npm install
npm run build
```

### Step 2: Upload to Server

Upload the following via FTP/SFTP:

- `dist/` (compiled frontend and backend)
- `node_modules/`
- `package.json`
- `api/` (backend source if running in dev mode)

### Step 3: Configure MySQL Database

1. Create a MySQL database in cPanel
2. Create a database user and assign privileges
3. Note the connection string

### Step 4: Configure Environment Variables

Create `.env` in the root directory:

```
NODE_ENV=production
DATABASE_URL=mysql://user:password@localhost:3306/pacemaker
JWT_ACCESS_SECRET=<random_32_chars>
JWT_REFRESH_SECRET=<random_32_chars>
FRONTEND_URL=https://yourdomain.com
```

### Step 5: Install Dependencies and Run Migrations

```bash
npm install --production
npm run db:migrate
npm run db:seed
```

### Step 6: Configure Node.js App (cPanel)

1. Go to **Setup Node.js App** in cPanel
2. Create a new application:
   - **Application root:** `/path/to/app`
   - **Application URL:** `yourdomain.com`
   - **Application startup file:** `dist/boot.js`
   - **Pass environment variables:** Paste from `.env`

### Step 7: Configure Web Server

Create `.htaccess` for Apache:

```apache
RewriteEngine On

# Serve static files
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^(.*)$ index.html [QSA,L]

# Proxy API requests to Node.js
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

### Step 8: SSL Certificate

Enable SSL via cPanel's SSL/TLS manager or Let's Encrypt.

## VPS Deployment (Ubuntu 22.04)

### Server Requirements

- Ubuntu 22.04 LTS
- 2+ CPU cores
- 4GB+ RAM
- 20GB+ storage
- Root or sudo access

### Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL 8
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx

# Clone and setup application
git clone https://github.com/YOUR_USERNAME/Pacemaker-Institute2.git /var/www/pacemaker
cd /var/www/pacemaker
npm install
cp .env.example .env
# Edit .env with production values
npm run db:migrate
npm run db:seed

# Start with PM2
pm2 start dist/boot.js --name pacemaker-institute
pm2 save
pm2 startup
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # Static files
    location / {
        root /var/www/pacemaker/dist;
        try_files $uri $uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### SSL with Certbot

```bash
sudo certbot --nginx -d yourdomain.com
```

## Post-Deployment Checklist

### Immediate (First 24 Hours)

- [ ] Verify health check: `GET /api/health`
- [ ] Test user registration and login
- [ ] Verify email delivery (check spam folder)
- [ ] Test Stripe payment flow in test mode
- [ ] Verify AI tutor responses
- [ ] Test file upload functionality
- [ ] Verify SSL certificate is valid

### Short-term (First Week)

- [ ] Monitor error logs for issues
- [ ] Set up uptime monitoring (Pingdom, UptimeRobot)
- [ ] Configure database backup schedule
- [ ] Test backup restoration
- [ ] Verify CDN delivery for static assets
- [ ] Test payment flow in production mode
- [ ] Review rate limiting effectiveness

### Ongoing

- [ ] Weekly dependency updates (npm audit)
- [ ] Monthly security review
- [ ] Quarterly performance audit
- [ ] Regular database maintenance (optimize, analyze)

## Troubleshooting

### Build Failures

1. Clear npm cache: `npm cache clean --force`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Check Node.js version: `node --version` (must be 20+)

### Database Issues

1. Verify connection string format
2. Check database accessibility from server
3. Ensure migrations have been run

### Stripe Webhooks

1. Verify webhook signing secret
2. Check webhook endpoint is publicly accessible
3. Review Stripe webhook logs for failures

### Memory Issues

```
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### Performance Issues

1. Enable database query caching
2. Configure CDN for static assets
3. Optimize database queries with indexes
4. Scale horizontally with multiple instances
