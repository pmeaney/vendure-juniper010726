# Dev vs Prod Improvements

## 🚫 Admin Dashboard API Ports: Dev vs Prod Behavior (Critical)

When building the Vendure Admin Dashboard with Vite, **any explicitly specified API port is permanently baked into the compiled frontend**. This distinction is easy to miss, but it has serious production implications.

In **development**, explicitly specifying `host + port` is correct and required: the browser must talk directly to a locally running Vendure server (e.g. `localhost:3000`).

In **production**, however, the Admin UI runs **behind a reverse proxy** (e.g. Nginx Proxy Manager). In this environment:

- The browser must use **same-origin routing**
- The proxy is responsible for forwarding traffic to the internal server port
- **Exposing an explicit port in frontend code forces cross-origin requests**

If a port is specified during the Admin Dashboard build, the compiled UI will always call `host:port` directly. In production this:
- Bypasses the reverse proxy
- Triggers CORS preflight requests
- Causes multi-second request timeouts
- Results in a blank or delayed Admin UI load

To prevent this, the dashboard build **must omit the port in production** and rely on implicit same-origin API paths instead.

The configuration below enforces this rule consistently using `APP_ENV`, ensuring:
- `host + port` is used only in development
- Same-origin routing is used in production
- No internal ports or Docker assumptions leak into compiled frontend code

If a port is specified, it will be baked into the compiled Admin UI. In production, this forces host:port requests, bypasses the reverse proxy, and causes CORS delays and slow dashboard loads.

```js
// vite.config.mts
At top:
import 'dotenv/config';
const IS_DEV = process.env.APP_ENV === 'dev';

// export default defineConfig({
//   ...
  api: IS_DEV
    ? {
        host: 'http://localhost',
        port: 3000,
      }
    : {
        host: process.env.VENDURE_API_HOST,
        // 🚫 NO port in prod.  If you provide port, it will be used.
        // In production, specifying an API port in the Vite dashboard config forces the
        // compiled Admin UI to call host:port directly, bypassing the reverse proxy and
        // causing CORS delays. This change aligns dashboard API config with APP_ENV:
        // use host + port in dev, and same-origin API paths in prod.
      },
// ... })
```

````md


## 🧱 Build-Time vs Runtime Environment Alignment (Admin Dashboard Fix)

### Problem Summary

The Vendure Admin Dashboard was intermittently failing in production.

- The dashboard page loaded, but login requests failed
- Network calls were sent to `http://localhost:3000/admin-api`
- CORS errors appeared despite correct runtime configuration
- Environment variables appeared correct inside running containers

The root cause was **not runtime configuration**. It was a **build-time environment mismatch**.

---

### Root Cause

The Vendure Admin Dashboard is a **compiled frontend artifact**.  
Its API configuration is **baked into JavaScript at build time**, not read dynamically at runtime.

During the Docker build process:

- `VENDURE_API_HOST` was correctly passed as a build argument
- `APP_ENV` was **not** passed at build time
- Dashboard build logic relied on:

```ts
const IS_DEV = process.env.APP_ENV === 'dev';
````

Because `APP_ENV` was undefined during `npm run build:dashboard`, the dashboard
was compiled using **development defaults**:

```js
{
  host: "http://localhost",
  port: 3000
}
```

These values were embedded into the compiled dashboard bundle and later served
verbatim in production, causing the browser to attempt API calls to
`localhost:3000`.

Runtime environment variables could not correct this behavior because the
dashboard had already been compiled.

---

### The Fix

All environment variables that influence frontend behavior **must be present at
build time**, not just at runtime.

#### CI Build Step

```bash
docker build \
  --build-arg APP_ENV=prod \
  --build-arg VENDURE_API_HOST=https://admin.example.com \
  --no-cache \
  ...
```

#### Dockerfile (Builder Stage)

```dockerfile
ARG APP_ENV=prod
ENV APP_ENV=$APP_ENV

ARG VENDURE_API_HOST
ENV VENDURE_API_HOST=$VENDURE_API_HOST

RUN npm run build
RUN npm run build:dashboard
```

With `APP_ENV=prod` available during the dashboard build:

* Development-only API defaults are disabled
* No ports are baked into frontend code
* The Admin UI uses same-origin routing (`/admin-api`)
* Reverse proxy behavior works as intended

---

### Verification

After applying the fix:

* No `localhost` or `:3000` strings appear in `dashboard/assets/*.js`
* The Admin UI loads immediately
* Login succeeds without CORS errors
* Network requests target:

```text
https://admin.<domain>/admin-api
```

---

### Key Takeaway

If an environment variable affects frontend behavior, it **must be present at
build time**.

In multi-stage Docker builds:

* The **builder stage** defines reality for compiled assets
* The **runtime stage** cannot change baked artifacts

Aligning build-time and runtime environments prevents development-only
assumptions from leaking into production.

```
```
