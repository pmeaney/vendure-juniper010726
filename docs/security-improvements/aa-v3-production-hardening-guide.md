# Vendure Platform – v3.0 Production Hardening & Payment Activation Guide

**Architecture Context**

- Vendure server + worker (Dockerized)
- Next.js storefront (Dockerized)
- Deployed via GitHub Actions CI/CD
- Hosted on DigitalOcean Debian droplet
- Infrastructure bootstrapped with Terraform + cloud-init
- Reverse proxy via Nginx Proxy Manager (containerized)
- Cloudflare in front (DNS + edge protection)

This document details how to implement all security and payment activation steps between v2.0 and v3.0 for a production Vendure deployment.

---

# 1. Application-Level (Vendure)

## 1.1 HardenPlugin (GraphQL Protection)

### Purpose

Prevents expensive GraphQL queries, depth attacks, and resource exhaustion.

### Steps

1. Install if not already present:

```bash
npm install @vendure/harden-plugin
```

2. Configure in `vendure-config.ts`:

```ts
import { HardenPlugin } from "@vendure/harden-plugin";

plugins: [
  HardenPlugin.init({
    maxQueryDepth: 8,
    maxComplexity: 1000,
    maxAliases: 20,
  }),
];
```

3. Deploy and verify:

- Attempt deeply nested query in dev
- Confirm request is rejected

---

## 1.2 Rate Limiting

### Purpose

Prevent brute force login and API abuse.

### Option A – Express middleware (recommended)

Install:

```bash
npm install express-rate-limit
```

In Vendure bootstrap (before server start):

```ts
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
});

app.use("/shop-api", limiter);
app.use("/admin-api", limiter);
```

### Option B – Cloudflare Rate Limiting

Create rule for:

- `/admin-api`
- `/auth/login`

---

## 1.3 Restrictive CORS

In `vendure-config.ts`:

```ts
apiOptions: {
  cors: {
    origin: [
      'https://your-frontend-domain.com',
      'https://your-api-domain.com'
    ],
    credentials: true,
  }
}
```

Confirm dev config is separate.

---

# 2. Infrastructure-Level

## 2.1 Cloudflare Integration

### Steps

1. Point domain DNS to Cloudflare
2. Set SSL mode: **Full (Strict)**
3. Enable:
   - Bot Fight Mode
   - Auto HTTPS Rewrites
   - Always Use HTTPS

---

## 2.2 Basic Cloudflare WAF Rules

Enable Managed Rules:

- OWASP Core Ruleset

Create custom rule:

- If URI contains `/admin-api`
- Apply stricter rate limit

---

## 2.3 Trust Proxy (Required Behind Cloudflare + Nginx)

In server bootstrap:

```ts
app.set("trust proxy", 1);
```

Required for:

- Correct IP detection
- Secure cookies
- Rate limiting accuracy

---

## 2.4 Force HTTPS

### In Cloudflare

Enable:

- Always Use HTTPS

### In Nginx Proxy Manager

Ensure HTTP → HTTPS redirect enabled.

---

## 2.5 Secure Cookies

Ensure:

```ts
cookieOptions: {
  secure: true,
  httpOnly: true,
  sameSite: 'lax',
}
```

Verify in browser dev tools → Cookies.

---

## 2.6 Database Timezone (UTC)

On DigitalOcean droplet:

```bash
timedatectl
```

In Postgres:

```sql
SHOW timezone;
```

Ensure:

```sql
SET timezone TO 'UTC';
```

Persist in `postgresql.conf` if needed.

---

## 2.7 Weekly Automated Database Backups

### Option: Cron + pg_dump

Create script:

```bash
pg_dump -U postgres -h localhost vendure_db > /backups/$(date +%F).sql
```

Add cron job:

```bash
0 3 * * 0 /path/to/backup-script.sh
```

Upload to:

- DigitalOcean Spaces
- S3-compatible storage

Test restore quarterly.

---

## 2.8 Error Logging

### Option A – Sentry

Install:

```bash
npm install @sentry/node
```

Initialize in server entry:

```ts
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

Verify by throwing test error.

---

## 2.9 5xx Alerting

Options:

- Sentry alerts
- Cloudflare alert rules
- DigitalOcean monitoring

Trigger test 500 error and confirm alert.

---

## 2.10 Uptime Monitoring

Use UptimeRobot:

- Monitor: `https://your-api-domain.com/shop-api`
- Interval: 5 minutes
- Alert via email

---

## 2.11 Container Resource Limits

In production docker-compose:

```yaml
services:
  vendure-server:
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 1G
```

If not using swarm, use:

```yaml
mem_limit: 1g
cpus: 1.0
```

Restart container and confirm limits applied.

---

# 3. Payment Activation

## 3.1 Stripe Live Mode

1. Replace test API keys with live keys
2. Update webhook endpoint in Stripe dashboard
3. Store webhook secret in GitHub Secrets

Deploy.

---

## 3.2 PayPal Live Mode

1. Switch to live credentials
2. Update webhook URLs
3. Store credentials in GitHub Secrets

Deploy.

---

## 3.3 Test Live Transactions

Perform:

- $1 purchase
- Refund
- Failed payment test

Verify:

- Order state transitions
- Payment captured
- Email confirmation

---

## 3.4 Webhook Handling Verification

Test:

- Payment success
- Payment failure
- Refund
- Webhook retry

Confirm:

- Idempotency
- No duplicate order updates

---

## 3.5 Webhook Signature Validation

### Stripe

Ensure:

```ts
webhookSecret: process.env.STRIPE_WEBHOOK_SECRET;
```

Test invalid signature → request rejected.

### PayPal

Ensure certificate validation enabled.

Attempt manual POST → confirm rejection.

---

# Final Validation Checklist Before Public Launch

- All endpoints HTTPS
- No test keys present
- Backups verified
- Monitoring alerts confirmed
- Admin API protected
- Webhooks validated
- Live $1 purchase successful

---

When complete, v3.0 represents:

- Revenue-ready
- Abuse-resistant
- Monitored
- Backed up
- Production-hardened

This is now a responsibly operated commerce system, not just a deployed app.

---

# v3.0 Production Release – Publication Checklist

This section can be reused when publishing the `v3.0-production` tag.

## Release Highlights

- ✅ Production security hardening complete
- ✅ GraphQL abuse protection enabled (query depth + complexity limits)
- ✅ API rate limiting configured
- ✅ Strict CORS policy enforced
- ✅ Cloudflare edge protection + WAF active
- ✅ HTTPS enforced end-to-end
- ✅ Secure cookie configuration verified
- ✅ Database configured for UTC consistency
- ✅ Automated weekly database backups implemented
- ✅ Structured error logging + alerting enabled
- ✅ Uptime monitoring active
- ✅ Container resource limits enforced
- ✅ Payment providers switched to live mode
- ✅ Live transactions tested successfully
- ✅ Webhook handling + signature validation verified

## Operational Readiness Confirmed

- 🔐 Secrets managed via GitHub Actions + runtime injection
- 🐳 Containerized deployment with production parity
- 🔁 CI/CD pipeline building and deploying successfully
- 📦 Deterministic Linux-based dependency locking
- 🛡️ Public-facing endpoints hardened and monitored

## Git Tag Command

```bash
git tag -a v3.0-production -m "Production-ready deployment complete"
git push origin v3.0-production
```

This tag represents the transition from prototype deployment to hardened, monitored, payment-enabled production infrastructure.
