# Online Shop — Development Roadmap

---

## Phase 1 — Local Dev Foundation

1. Write `initial-data.ts`
2. Write `products.csv` (5 fixture guitars)
3. Collect and organize 25 placeholder media files locally
4. Write `seed.ts` entry point
5. Run seed locally — verify catalog appears correctly in dashboard and storefront
6. Commit seed files to git

---

## Phase 2 — Payment Integration (Local)

7. Install and configure Stripe plugin
8. Install and configure PayPal plugin
9. Test both payment flows locally with test API keys and $1 products
10. Verify webhook handling locally

---

## Phase 3 — Production Deploy (v2)

> Domain, SSL, and server infrastructure already live. Catalog is empty.

11. Configure prod environment variables
12. Run migrations and seed on first prod boot
13. Upload 25 media files to prod manually (pre-S3)
14. Smoke test catalog and storefront on prod

---

## Phase 4 — Security Hardening (v2 → v3)

### Application-Level (Vendure)

- 📋 🔒 HardenPlugin configured (prevents GraphQL query attacks)
- 📋 🔒 Rate limiting on API endpoints (prevent brute force)

### Infrastructure-Level

- 📋 🔒 Cloudflare integration (DDoS protection, CDN, SSL)
- 📋 🔒 Basic Cloudflare WAF rules (5 free rules)
- 📋 🔒 Database timezone verification (UTC)
- 📋 🔒 Trust proxy configuration for Express
- 📋 🔒 Weekly automated database backups
- 📋 🔒 Uptime monitoring (UptimeRobot free tier)
- 📋 🔒 Container resource limits (prevent runaway processes)

### Email

- 📋 📧 Wire up transactional email provider (Postmark, SendGrid, or similar)
- 📋 📧 Verify customer registration and email verification flow on prod

---

## Phase 5 — Payment Activation (v3)

- 📋 💳 Switch Stripe to live mode (production API keys)
- 📋 💳 Switch PayPal to live mode
- 📋 💳 Test live transactions ($1 test purchases on prod)
- 📋 💳 Verify webhook handling in production

**v3.0 — Production Ready**
All security hardening complete. Payment providers live and tested. Ready to accept real customer orders.
*Estimated time investment: 1–2 weeks (10–15 hours)*

---

## Phase 6 — Near-Future Infrastructure

15. Set up DigitalOcean Spaces (S3-compatible) for asset storage
16. Migrate existing assets from local/prod storage to bucket
17. Update `assetUrlPrefix` in Vendure config
18. Verify assets serving correctly from bucket on prod
