# Deployment Architecture Notes (Post v2 Reflection)

## Context

After completing **v2.0 – Prototype Production**, we reviewed the CI/CD architecture and evaluated whether to simplify the deployment model or retain its current stateful behavior.

Conclusion: **Keep the stateful deployment system.** Refine invariants, do not redesign.

---

# Why Stateful Deployment Is Appropriate

Current system behavior:

- Detects changes per service directory
- Skips deployment if no meaningful code changes exist
- Tracks last deployed commit via artifact marker
- Provides clear deployment summary
- Verifies container and DB state before deployment

This is not over-engineered. It provides:

- Deployment observability
- Controlled release behavior
- Reduced unnecessary container restarts
- Auditability of what changed
- Reduced production churn

For a live ecommerce system, this is appropriate.

---

# Why Not Switch to Stateless Deployment (Now)

Stateless model:

- Always rebuild
- Always redeploy
- No history tracking

Pros:

- Simpler
- Fewer moving parts

Cons:

- Unnecessary container restarts
- Minor but real traffic interruption
- No change summary
- Less deployment awareness

Given production goals and payment activation upcoming (v3), removing change detection would be a regression in control.

---

# Current System Assessment

Your CI is:

- Deterministic
- Explicit
- Gracefully degrading (if marker missing → deploy)
- Not dependent on fragile runtime state
- Using commit-based tracking for clarity

This is a reasonable deployment model for a small production platform.

---

# Things to Watch Out for Moving Forward

## 1. Artifact-Based Commit Tracking (Long-Term Consideration)

Current model uses:

- GitHub artifact storing last deployed commit per service

This works well.

However, long term (v4+), consider shifting to:

> Image tag or image digest as source of truth

Why?

- Container registry already stores version history
- Images are immutable artifacts
- Artifacts in CI are additional state to maintain
- Registry-based version tracking reduces CI coupling

Example future direction:

- Tag images as `vendure-server:commit-sha`
- Deploy by explicit image tag
- Compare running container image digest vs registry digest
- Skip deploy if digest unchanged

This reduces reliance on GitHub artifact history.

Not needed for v3 — just a forward-looking improvement.

---

## 2. Naming Invariants

Ensure unified taxonomy across:

- Local dev
- CI build
- Production runtime

Avoid having multiple names for the same conceptual service.

Prefer:

- `vendure-db`
- `vendure-server`
- `vendure-worker`
- `vendure-storefront`
- `vendure-network`

Consistency reduces cognitive load and parity bugs.

---

## 3. Database Version Consistency

Ensure Postgres version is identical across environments.

Do not allow local and production DB major versions to drift.

---

## 4. Deployment Strategy vs Downtime

Current deployment method:

```
docker rm -f <container>
docker run -d ...
```

This causes a brief hard restart.

Acceptable for prototype stage.

Future (v4+) enhancement could include:

- Blue/green deployment
- Health-check-based swap
- Reverse proxy controlled cutover

Not required for v3.

---

## 5. Release Control Philosophy

Currently:

- Push to main → deploy (if changes detected)

Future improvement:

- Push to main → build only
- Git tag → deploy

This separates "code merge" from "release decision."

Not required before v3, but advisable once real traffic volume increases.

---

# Final Position (Before v3)

Do NOT simplify the CI system.

Instead:

- Fix local parity
- Unify naming
- Standardize DB version
- Add production simulation compose file
- Maintain stateful deployment logic

Your architecture is disciplined and appropriate.

Refine it.
Do not shrink it.

---

# Summary

Stateful deployment is not the problem.

Uncontrolled environmental drift is.

Keep the intelligent CI logic.
Tighten invariants.
Harden security for v3.
Improve release gating in v4.

This is a healthy evolutionary path.

---

# v2.1 – Environment Parity & Production Simulation

Following the completion of **v2.0 – Prototype Production**, we identified an important architectural gap: local development had drifted from production topology and behavior.

Rather than simplifying the CI/CD system, we chose to strengthen environmental invariants and improve deployment confidence.

## What v2.1 Accomplished

### 1️⃣ Database Version Alignment

- Standardized PostgreSQL to version **17** across local and production environments.
- Eliminated a major-version drift vector that could cause subtle migration or planner inconsistencies.

### 2️⃣ Naming Unification (Single Invariant Topology)

Standardized service taxonomy across all environments:

- `vendure-db`
- `vendure-server`
- `vendure-worker`
- `vendure-storefront`
- `vendure-network`

This removed environment-specific naming differences and reduced cognitive load when reasoning about deployments.

### 3️⃣ Restored Local Development Parity

- Updated local Docker Compose configuration to use canonical service names.
- Aligned `DB_HOST` and internal service URLs with production naming.
- Preserved developer ergonomics (hot reload, bind mounts, dev targets).

### 4️⃣ Introduced Production Simulation Mode

Added a separate **prod-sim Docker Compose configuration** to locally reproduce production behavior:

- Uses `target: prod`
- No bind mounts
- No dev commands
- Same network and service naming as production
- Validates the real built image before deployment

This created two intentional modes:

| Mode     | Purpose                                    |
| -------- | ------------------------------------------ |
| Dev      | Developer velocity & hot reload            |
| Prod-Sim | Deployment correctness & parity validation |

## Why This Matters

v2.1 does not change business functionality.

Instead, it strengthens:

- Deployment confidence
- Environmental consistency
- Operational clarity
- Release discipline

This ensures that future work (v3 – Production Ready hardening) is built on a stable, invariant foundation.

v2.1 represents a shift from "working prototype" to "operationally disciplined system."

## What v2.1 Brings

- 📋 Unified naming taxonomy across local, prod-sim, and production environments (`vendure-db`, `vendure-server`, `vendure-worker`, `vendure-storefront`, `vendure-network`).
- 📋 Standardized PostgreSQL version across environments (Postgres 17) to eliminate major-version drift.
- 📋 Restored local development stability while preserving hot-reload ergonomics.
- 📋 Introduced a dedicated **production simulation mode** to validate the real built image before deployment.

## Environment Modes

| Mode       | Purpose           |
| ---------- | ----------------- |
| local      | dev ergonomics    |
| prod-sim   | production parity |
| production | real deployment   |

## Why We Want Both Local Dev & Prod-Sim

Local development is optimized for **speed and ergonomics**:

- Hot reload
- Bind mounts
- Rapid iteration
- Minimal friction while building features

Production simulation is optimized for **correctness and parity**:

- Uses the real production Docker build (`target: prod`)
- No bind mounts
- Same network and service topology as production
- Validates that the artifact we deploy actually works

Dev answers: _"Does my code change work?"_

Prod-sim answers: _"Will this behave correctly in production?"_

v2.1 formalizes this separation of concerns. It does not change business functionality, but it strengthens deployment confidence and reduces the risk of production drift before v3 security hardening.

````bash
git tag -a v2.1-fix-dev-add-prodparity -m "Fix local env & add production simulation parity"
git push origin v2.1-fix-dev-add-prodparity
```"
````
