# Nginx Proxy Manager — Rate Limiting Setup

## Overview

Rate limiting is implemented in two parts:

1. **Zone definitions** — declared in a custom `http_top.conf` file that NPM loads into the `http {}` block
2. **Rate limit directives** — applied per proxy host via the Advanced tab in the NPM UI

These two parts are connected by name. The zone definitions declare that certain named buckets exist with certain rates. The per-host directives reference those bucket names to apply them. Nginx knows which proxy host gets which limit because the `limit_req` directive lives inside that host's `server {}` block — NPM injects it there via the Advanced tab.

---

## Part 1 — Zone Definitions

**File path (on host):**

```
/home/patDevOpsUser/nginxProxyMgr/data/nginx/custom/http_top.conf
```

This file is loaded by NPM near the top of the `http {}` block in `/etc/nginx/nginx.conf`, via:

```nginx
include /data/nginx/custom/http_top[.]conf;
```

Note that `/data/` inside the container maps to `/home/patDevOpsUser/nginxProxyMgr/data/` on the host. This is a Docker volume mount — the file you edit on the host is the same file Nginx reads inside the container.

**Contents:**

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=120r/m;
limit_req_zone $binary_remote_addr zone=shop_limit:10m rate=120r/m;
limit_req_zone $binary_remote_addr zone=admin_limit:10m rate=30r/m;
```

### Breaking Down the Syntax

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=120r/m;
```

- **`$binary_remote_addr`** — the key used to track requests. Limits are applied per IP address. Each unique IP gets its own counter.
- **`zone=api_limit:10m`** — declares a shared memory zone named `api_limit` with 10MB of storage for tracking IP counters. 10MB holds roughly 160,000 IP addresses.
- **`rate=120r/m`** — the steady-state rate limit: 120 requests per minute per IP.
- The zone name (`api_limit`, `shop_limit`, `admin_limit`) is just a label — it's the glue between the global definition here and the per-host application in Part 2. The name has no special meaning to Nginx beyond that reference.

### Zone Reference

| Zone          | Rate               | Memory | Used By                           |
| ------------- | ------------------ | ------ | --------------------------------- |
| `api_limit`   | 120 req/min per IP | 10MB   | `api.vivaluthiers.com`            |
| `shop_limit`  | 120 req/min per IP | 10MB   | `shop`, `vivaluthiers.com`, `www` |
| `admin_limit` | 30 req/min per IP  | 10MB   | `admin.vivaluthiers.com`          |

Note that `shop_limit` is shared across three proxy hosts. They all reference the same zone, meaning the same rate limit applies to all three storefronts. This is intentional — they all serve the same app.

---

## Part 2 — Per-Host Advanced Config

These are added via **NPM UI → Edit Proxy Host → Advanced tab**.

The Advanced tab injects config directly into that proxy host's `server {}` block. This is how Nginx knows which limit applies to which host — the directive is scoped to that server block, not applied globally. Each host explicitly names the zone it wants to use.

### `api.vivaluthiers.com`

```nginx
limit_req zone=api_limit burst=50 nodelay;
limit_req_status 429;
```

### `admin.vivaluthiers.com`

```nginx
limit_req zone=admin_limit burst=10 nodelay;
limit_req_status 429;
```

### `shop.vivaluthiers.com`

```nginx
limit_req zone=shop_limit burst=50 nodelay;
limit_req_status 429;
```

### `vivaluthiers.com`

```nginx
limit_req zone=shop_limit burst=50 nodelay;
limit_req_status 429;
```

### `www.vivaluthiers.com`

```nginx
limit_req zone=shop_limit burst=50 nodelay;
limit_req_status 429;
```

### Breaking Down the Syntax

```nginx
limit_req zone=api_limit burst=50 nodelay;
limit_req_status 429;
```

- **`zone=api_limit`** — references the zone defined in `http_top.conf` by name. This is the connection between Part 1 and Part 2. If the zone name doesn't match exactly, nginx will fail on reload.
- **`burst=50`** — allows up to 50 requests above the steady-state rate before rejecting. This absorbs legitimate spikes, like a page load that fires many asset requests simultaneously.
- **`nodelay`** — burst requests are processed immediately rather than queued/delayed. Without this, Nginx would slow-drip burst requests, which breaks page loads.
- **`limit_req_status 429`** — sets the HTTP status code returned when a request is rejected. 429 is the standard "Too Many Requests" code.

---

## How `burst` Works

Think of rate limiting like a highway on-ramp:

- **`rate`** is highway speed — the sustained throughput allowed
- **`burst`** is the length of the on-ramp — how many cars can accelerate before being turned away
- **`nodelay`** means cars don't have to wait on the ramp — they merge immediately up to the burst limit

Concrete example with `rate=120r/m burst=50`:

- A user loads a page that fires 30 requests at once → all 30 go through (within burst)
- If they immediately fire 30 more → first 20 go through (exhausting burst), remaining 10 get 429
- As time passes, the burst refills at the steady-state rate

The initial rates of `30r/m burst=10` were too tight — a single page load serving multiple product images from `api.vivaluthiers.com` was enough to trip the limit. The final values above account for real-world page load behavior.

---

## What Went Wrong

### 1. Wrong custom file path

The zone definitions were initially created at:

```
/opt/npm/data/nginx/custom/http.conf
```

NPM does not load files from `/opt/npm`. The correct path was found by inspecting the Docker volume mount (`docker inspect`) and reading `/etc/nginx/nginx.conf` inside the container to find the actual include paths. The correct location is:

```
/home/patDevOpsUser/nginxProxyMgr/data/nginx/custom/http_top.conf
```

The filename also matters — NPM specifically includes `http_top[.]conf`, not `http.conf`. Using the wrong filename means the file is silently ignored.

### 2. Custom Locations vs Advanced tab

Rate limit directives were initially added via the **Custom Locations** tab, which generates a new `location {}` block. This conflicted with NPM's own generated `location /` block for the same host, causing nginx to fail on reload or serve the NPM default fallback page. The correct approach is the **Advanced tab**, which injects config into the `server {}` block directly, above the location blocks, where `limit_req` belongs.

### 3. Zones not loaded = instant nginx failure

Because `http_top.conf` was in the wrong path, the zone definitions were never loaded. Any `limit_req` directive referencing an undefined zone causes nginx to reject the config entirely on reload. This broke proxy hosts silently whenever the Advanced tab config was saved — nginx failed to reload, leaving the previous (or broken) config in place.

### 4. SSL certs getting unset

When nginx fails to reload after saving a proxy host, NPM can lose the SSL certificate assignment for that host. This resulted in `ERR_SSL_UNRECOGNIZED_NAME` errors — nginx no longer recognized the domain as having a valid SSL context. Fix: re-select the Let's Encrypt cert on the SSL tab and re-enable Force SSL after any config change that caused a reload failure.

### 5. Rate limits too aggressive for asset serving

The `api.vivaluthiers.com` host serves both GraphQL requests and static assets (`/assets/...`). A single page load fires multiple simultaneous image requests, all from the same IP, all hitting the same rate limit zone. The initial `30r/m burst=10` was too tight and caused product images to return 429 on page load. Rates were raised to `120r/m burst=50` to accommodate real page load behavior.

---

## Verification

After setup, confirm zones are loaded:

```bash
docker exec nginx-proxy-mgr-011526 nginx -T | grep limit_req_zone
```

Expected output:

```
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=120r/m;
limit_req_zone $binary_remote_addr zone=shop_limit:10m rate=120r/m;
limit_req_zone $binary_remote_addr zone=admin_limit:10m rate=30r/m;
```

If nothing is returned, the file is in the wrong path or has the wrong filename.

Test rate limiting (run from local machine):

```bash
for i in $(seq 1 15); do curl -s -o /dev/null -w "%{http_code}\n" https://api.vivaluthiers.com/shop-api; done
```

Expected: a run of `200`s followed by `429`s once burst is exhausted.
