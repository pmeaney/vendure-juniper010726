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
