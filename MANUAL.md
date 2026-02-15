# ClaudeCare — Manual Setup Guide

Everything that needs to be done manually to get ClaudeCare live in production.

---

## 1. Railway Deployment

### 1a. Install Railway CLI & Create Project

```bash
# Install Railway CLI
bun install -g @railway/cli

# Login
railway login

# Initialize project (from project root)
railway init

# Or link to existing project
railway link

# Deploy
railway up

# Generate a Railway subdomain (for initial testing)
railway domain
```

### 1b. Environment Variables (Railway Dashboard)

Go to your Railway service → **Variables** tab. These should already be set in shared variables:

| Variable | Value | Notes |
|---|---|---|
| `BASE_URL` | `https://claudecare.com` | Your production URL |
| `DATABASE_URL` | `postgresql://...?sslmode=require` | Neon connection string |
| `BETTER_AUTH_SECRET` | *(random 32+ char string)* | `openssl rand -hex 32` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | From Anthropic console |
| `TWILIO_ACCOUNT_SID` | `AC...` | From Twilio console |
| `TWILIO_AUTH_TOKEN` | *(from Twilio)* | From Twilio console |
| `TWILIO_PHONE_NUMBER` | `+1...` | Your Twilio phone number |

### 1c. Push Database Schema

After deploying, run locally (or via Railway CLI):

```bash
bun run db:push
```

This creates all 8 tables (user, session, account, verification, persons, calls, assessments, escalations).

---

## 2. Domain Setup (Option A: Cloudflare — Recommended)

Using Cloudflare as DNS intermediary gives you root domain support (`claudecare.com`), free SSL, DDoS protection, and caching.

### 2a. Create Free Cloudflare Account

1. Go to [cloudflare.com](https://cloudflare.com) and sign up
2. Click **Add a Site** → enter `claudecare.com`
3. Select the **Free** plan
4. Cloudflare will scan existing DNS records — review and keep any you need

### 2b. Change GoDaddy Nameservers to Cloudflare

1. Cloudflare will give you two nameservers (e.g. `lara.ns.cloudflare.com`, `nick.ns.cloudflare.com`)
2. In GoDaddy → **My Products** → `claudecare.com` → **DNS Management** → **Nameservers**
3. Click **Change** → **Enter my own nameservers**
4. Paste the two Cloudflare nameservers
5. Save. Propagation takes 1-48 hours (usually minutes).

### 2c. Add Custom Domain in Railway

1. Railway service → **Settings** → **Public Networking**
2. Click **+ Custom Domain**
3. Add `claudecare.com` → copy the CNAME value Railway shows
4. Add `www.claudecare.com` → copy that CNAME value too

### 2d. Configure DNS Records in Cloudflare

Add two CNAME records:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `@` | *(Railway's CNAME value)* | Proxied (orange cloud) |
| CNAME | `www` | *(Railway's CNAME value)* | Proxied (orange cloud) |

### 2e. Configure Cloudflare SSL

1. **SSL/TLS** → **Overview** → set to **Full (strict)**
2. **Edge Certificates** → enable **Always Use HTTPS**

### 2f. Verify

Back in Railway, wait for green checkmarks next to both domains. SSL certificates auto-provision via Let's Encrypt.

---

## 3. Twilio Configuration

**Already set up.** For reference, the Twilio webhooks that need to be configured:

| Webhook | URL | Method |
|---------|-----|--------|
| Voice URL | `https://claudecare.com/api/twilio/voice` | POST |
| Status Callback | `https://claudecare.com/api/twilio/status` | POST |

The recording callback is handled automatically by Twilio when `record=true`.

Make sure the Twilio phone number is configured to use the Voice URL above in the Twilio Console → Phone Numbers → Active Numbers → your number.

---

## 4. Email Service (TODO)

Password reset and escalation notification emails need an email service. Options:

- **Resend** (recommended, simple API, good free tier)
- **SendGrid** (established, generous free tier)

### Setup Steps:

1. Create account at your chosen provider
2. Verify your domain (`claudecare.com`) following their DNS instructions
3. Get API key
4. Add API key as env var in Railway (e.g. `RESEND_API_KEY`)
5. Update `src/server/lib/auth.ts` → `sendResetPassword` callback to actually send the email

---

## 5. Social Media & Marketing Accounts

Create accounts on the following platforms:

| Platform | Username | Status |
|----------|----------|--------|
| Domain (GoDaddy) | claudecare.com | Done |
| Twitter/X | @claudecare | TODO |
| LinkedIn | ClaudeCare | TODO |
| GitHub (public repo/org) | claudecare | TODO |
| Product Hunt | ClaudeCare | TODO |

---

## 6. Post-Launch Checklist

- [ ] Railway deployment is live and healthy (`/api/health` returns `{"ok":true}`)
- [ ] Custom domain resolves (`claudecare.com`)
- [ ] SSL is working (green padlock)
- [ ] Auth flow works (signup → login → dashboard)
- [ ] DB schema is pushed (`bun run db:push`)
- [ ] Twilio webhooks are pointed to production URL
- [ ] Test a manual call trigger from the person detail page
- [ ] Email service is configured for password resets
- [ ] Environment variables are all set in Railway

---

## 7. Useful Commands

```bash
# Deploy to Railway
railway up

# View Railway logs
railway logs

# Open Railway dashboard
railway open

# Push DB schema changes
bun run db:push

# Open Drizzle Studio (DB GUI)
bun run db:studio

# Generate a strong secret
openssl rand -hex 32
```

---

## 8. Troubleshooting

| Issue | Fix |
|-------|-----|
| Railway shows "DNS not detected" | Verify CNAME value matches exactly, no trailing dot. Wait up to 15 min. |
| 526 error | Change Cloudflare SSL from "Flexible" to "Full (strict)" |
| Auth "Invalid origin" error | Ensure `BASE_URL` env var matches your production domain exactly |
| pg-boss fails to start | Ensure `DATABASE_URL` is correct and accessible from Railway |
| Build fails on Railway | Check that `bun run build` works locally first |
