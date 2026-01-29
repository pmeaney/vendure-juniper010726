# Vendure Project - Monorepo 

This project is a Vendure ecommerce application. It's containerized (Docker) for easy CI/CD deployment and includes docker-compose for local development.

## Version Benchmarks

**v1.0 - Local Development** ✅ (01/22/26)
- Fully functional local development environment
- Docker Compose setup working
- Basic configuration complete
- Payment integration: Stripe & PayPal test mode configured
```bash
git tag -a v1.0-local-dev -m "Local development environment complete"
git push origin v1.0-local-dev
```

**Between v1.0 and v2.0:**
- ✅ Initial Linux server hardening (UFW firewall, Fail2ban)
- ✅ Nginx Proxy Manager setup
- ✅ SSH key-only authentication
- ✅ Kernel hardening via sysctl
- 📋 Apply for Stripe live account (1-3 business days)
- 📋 Apply for PayPal Business account (immediate-5 days)
- 📋 Prepare compliance docs (Privacy Policy, Terms of Service, Refund Policy)

**v2.0 - Prototype Production** (CICD Deployment done: 1/29/26)
- CI/CD pipeline functional
- Production environment variables configured
- Mid-level Server Security (Debian Linux server deployed via Terraform with basic security features: UFW, Fail2ban, SSH key auth only, kernel hardening)
- Mid-level App Deployment Security (changed credentials, proper secrets management)
- Payment providers: Awaiting live account approval / approved but using test mode
- NOT hardened for public production use
```bash
git tag -a v2.0-prototype-prod -m "Prototype production deployment complete"
git push origin v2.0-prototype-prod
```


**Between v2.0 and v3.0 - Essential Security & Payment Activation:**

*Application-Level (Vendure):*
- 🔒 HardenPlugin configured (prevents GraphQL query attacks)
- 🔒 Rate limiting on API endpoints (prevent brute force)

*Infrastructure-Level:*
- 🔒 Cloudflare integration (DDoS protection, CDN, SSL)
- 🔒 Basic Cloudflare WAF rules (5 free rules)
- 🔒 Database timezone verification (UTC)
- 🔒 Trust proxy configuration for Express
- 🔒 Weekly automated database backups
- 🔒 Uptime monitoring (UptimeRobot free tier)
- 🔒 Container resource limits (prevent runaway processes)

*Payment Activation:*
- 💳 Switch Stripe to live mode (production API keys)
- 💳 Switch PayPal to live mode
- 💳 Test live transactions ($1 test purchases)
- 💳 Verify webhook handling in production

**v3.0 - Production Ready** 📋 
- All v2.0 features plus essential security hardening
- Payment providers: Live mode active and tested
- Public-facing production ready
- Ready to accept real customer orders
- **Time investment: 1-2 weeks (10-15 hours)**
```bash
git tag -a v3.0-production -m "Production-ready deployment complete"
git push origin v3.0-production
```

**Post v3.0 - Business Operations:**
- 🏷️ Catalog customization (products, categories, suppliers)
- 🎨 Storefront UI customization
- 📦 Shipping rules configuration
- 🌎 Logistics setup & testing, regulatory analysis
- 📸 Product photography workflow
- 📱 Marketing and launch

## Run it locally:

- Clone project
- Generate Linux-compatible lockfiles: 
  - `chmod +x ./project-shellscripts/generate-lockfiles.sh`
  - `./project-shellscripts/generate-lockfiles.sh`
  - **Why:** Creates `package-lock.json` files with Linux-compatible binaries (required for Docker containers). This ensures dependencies like `lightningcss`* work correctly in the containerized environment. (* = see note "About platform-specific dependencies" in More Info section at bottom of readme)
  - **When to run:** 
    - First time setting up the project (lockfiles don't exist in repo yet)
    - After updating dependencies in `package.json`
    - If you've deleted `package-lock.json` files
- Start all services: `docker compose -f docker-compose.local.yml up --build`

Access the application:
- Storefront: http://localhost:3001
- Admin/API: http://localhost:3000
- Database: localhost:5432

To clean up:
- break out with control-c
- `docker compose -f docker-compose.local.yml down -v`


# Explanation of Project Components - Local Development

This project is designed to be entirely containerized, both for local dev & remote prod deployment.
In Local Development (i.e. on your Desktop computer during dev work), you'll run it via Docker Compose.

The docker-compose.local.yml file lists 4 services:
DB, Server, Worker, and Storefront.

Here are some notes about those.  Note: For more information on this project in general, see the ./docs directory.

- Database - 
  - My preference is PostgreSQL. However, in you can find other options' configurations in the `my-shop-juniper/apps/server/docker-compose.ForReferenceOnly.yml` file.  That file shows the original settings for the alternate databases which work with Vendure
  - You may wonder "Why keep a directory just for the database, when you could simply put its environment variables into the docker-compose.local.yml file as well?"  There are two reasons the DB's directory exists in this project:
    - 1. For consistency, this project contains an .env files in each of its main components (DB, Storefront, and a combined one for Server & Worker), rather than placing them into docker-compose files. For CICD, the env vars will also appear in two other locations: locally, in a ./.github/defaults/env-defaults.yml file-- for default env vars with which the images will be built.  And remotely, in the project's Github Repo's secrets-- from where they'll be injected, during CICD, into the containers during their run step-- one of the final steps of the CICD process. In that step, the default env vars (set into the image from the ./.github/defaults/env-defaults.yml file) will be overwritten with the secret production env vars.
    - 2. The database directory also contains the local database files (in `v-db-juniper010726/pg-data-vendure-juniper`), which is a directory (a "bind-mount") created when docker spins up the database container.

- Storefront
  - An instance of Nextjs
- Server
  - The API for Vendure, operated via GraphQL.  
- Worker
  - The background task runner for Vendure. For its tasks, it feeds directly from the database, where its Job Queue resides.  So, no need for it to have port exposure unless there's a desire to use a health check functionality with it.
  
---

To Do:
  - Deploy it via CICD
  - Start customizing the storefront a bit
  - Create a custom schema for database
  - Create a two-language schema (english, spanish)



# More Info

**\*About platform-specific dependencies:** Some npm packages (like `lightningcss`) include native binaries compiled for specific operating systems. If you run `npm install` on macOS, it generates a lockfile pointing to macOS binaries. When Docker tries to use that lockfile in a Linux container, it fails with "module not found" errors.

Without the `generate-lockfiles.sh` script (which is really just a helper to simplify the commands), the Dockerfiles would create a `package-lock.json` within the container during the **build phase**. However, this lockfile would only exist as an ephemeral layer in the Docker image - it wouldn't sync back to your host filesystem because Docker volumes are only mounted during the **run phase**, not the build phase. This means:
- The lockfile exists temporarily in the built image
- It never makes it to your Mac's filesystem
- You can't commit it to version control
- Every build regenerates it (slow)
- Team members and CI/CD can't use a consistent lockfile

The script solves this by running `npm install` in a temporary Linux container **at runtime** (not build time), with your project directory mounted as a volume. This way, the Linux-generated lockfile is written directly to your Mac, can be committed to git, and ensures everyone (local dev, teammates, CI/CD, production) uses identical dependencies.