# v4.0 – Blue/Green Deployment Architecture (Roadmap Forecast)

This document outlines the conceptual plan for **v4.0**, which introduces blue/green deployment capabilities after v3 (Production Ready).

v4 focuses on operational maturity, zero-downtime releases, and rapid rollback capability.

---

## **v4.0 - Blue/Green Deployment Architecture** 📋 (Date: TBD - SHA: TBD - v4.0-blue-green)

- 📋 Implement tree-based release identifiers (e.g., `juniper`, `elm`)
- 📋 Introduce parallel container stacks per release
- 📋 Traffic switching controlled at reverse proxy layer
- 📋 Enable zero-downtime deployment
- 📋 Enable near-instant rollback via proxy switch
- 📋 Use image tags as source of truth for release identity
- 📋 Preserve invariant service topology across all environments

---

## Core Architectural Principle

Service topology remains invariant across environments:

- `vendure-db`
- `vendure-server`
- `vendure-worker`
- `vendure-storefront`
- `vendure-network`

Release identity is expressed through image tags and parallel container instances.

Example image tags:

```
ghcr.io/<user>/vendure-server:juniper
ghcr.io/<user>/vendure-server:elm
```

Topology does not change.
Release identity does.

---

## Conceptual Blue/Green Flow

### 1️⃣ Current Live Release

- Running release: `juniper`
- Traffic routed to containers based on `juniper` image

### 2️⃣ Build New Release

CI builds new tagged images:

```
vendure-server:elm
vendure-worker:elm
vendure-storefront:elm
```

### 3️⃣ Deploy Parallel Stack

New containers are started in parallel on the same network:

```
vendure-server--elm
vendure-worker--elm
vendure-storefront--elm
```

Traffic is not yet switched.

### 4️⃣ Health Checks & Validation

- Verify API health
- Confirm DB migrations completed
- Validate GraphQL endpoint
- Run optional smoke tests

### 5️⃣ Traffic Switch

Reverse proxy updates upstream target from `juniper` containers to `elm` containers.

No container restart required.
No downtime required.

### 6️⃣ Decommission Previous Release

Old containers (`juniper`) are stopped after validation window.

---

## Rollback Strategy

If a problem is detected:

- Switch proxy routing back to previous release
- No rebuild required
- Rollback time measured in seconds

---

## Preconditions (Must Be True After v3)

Before implementing blue/green, the system must ensure:

- Database migrations are backward-compatible
- No destructive schema changes during rollout
- Worker jobs are idempotent
- Payment webhooks are idempotent
- Application startup is deterministic

v3 establishes production stability.
v4 enhances production resilience.

---

## Why v4 Matters

Blue/green deployment introduces:

- Zero-downtime releases
- Safer experimentation in production
- Instant rollback capability
- Operational maturity beyond prototype stage
- Clear separation between service topology and release identity

v4 builds upon the invariant topology established in v2.1 and the security hardening completed in v3.

---

## Strategic Positioning

v2.1 → Environmental invariants & parity
v3 → Security hardening & payment activation
v4 → Operational resilience (blue/green)
v5+ → Scaling, performance tuning, business growth

---

Blue/green is not about new features.

It is about controlled risk.

It transforms deployments from "replace and hope" into "stage, verify, switch."

That is the operational leap v4 represents.
