# Nginx Proxy Manager - Vendure Proxy Host Setup

This document describes how to configure Nginx Proxy Manager to route traffic to the Vendure storefront and admin panel.

After setup, tail the nginx access logs with:

```bash
# List all access logs and tail them
docker exec nginx-proxy-mgr-011526 sh -c 'tail -f /data/logs/proxy-host-*_access.log'
```
## Prerequisites

- Nginx Proxy Manager is running and accessible
- Vendure containers (database, server, worker, storefront) are running
- Nginx container is connected to the `vendure-network`
- DNS records point to your server's IP address

### Connect Nginx to Vendure Network

Before setting up proxy hosts, ensure Nginx Proxy Manager can reach the Vendure containers:

```bash
docker network connect vendure-network nginx-proxy-mgr-011526
```

Verify the connection:
```bash
docker network inspect vendure-network | grep nginx
```

---

## Connect by ssh tunnel to Nginx Proxy Manager via Browser

Since direct http access to the server is disabled, you won't be able to reach it on the browser at http://serverIp:81 as you might normally be able to, in the default case.

Instead, to log into nginx proxy manager from browser, open ssh tunnel.  (below, `deb` is the name of my ssh config user-- it stands for Debian. You can use username:ip instead if needed). 

```bash
# Run this in CLI:
ssh -L 8181:localhost:81 deb
# then access on browser at:
http://localhost:8181/
```

## 1. Storefront Proxy Host (Public Shop)

### Domain Configuration
- **Domain Names:** `shop.theWebsiteUrl.com` (or your desired storefront domain)
- **Access List:** Publicly Accessible

### Forward Configuration
- **Scheme:** `http`
- **Forward Hostname/IP:** `vendure-storefront`
- **Forward Port:** `3001`

### Options
- ✅ **Block Common Exploits** - Enabled (security)
- ❌ **Cache Assets** - Disabled (Next.js handles caching)
- ❌ **Websockets Support** - Disabled (not needed unless you add real-time features)

### SSL Configuration
- **SSL Certificate:** Request a new SSL Certificate (Let's Encrypt)
- **Domain Names:** `shop.theWebsiteUrl.com`
- ✅ **Force SSL** - Enabled (redirect HTTP to HTTPS)
- ✅ **HTTP/2 Support** - Enabled (better performance)
- ✅ **HSTS Enabled** - Enabled (security)
- ⚠️ **HSTS Sub-domains** - Enable only if ALL subdomains have SSL
- ❌ **Use DNS Challenge** - Disabled (not needed for standard certificates)

### Result
Storefront accessible at: **`https://shop.theWebsiteUrl.com`**

---

## 2. Admin Panel Proxy Host

### Domain Configuration
- **Domain Names:** `admin.theWebsiteUrl.com` (or your desired admin domain)
- **Access List:** Publicly Accessible (or restrict by IP for extra security)

### Forward Configuration
- **Scheme:** `http`
- **Forward Hostname/IP:** `vendure-server`
- **Forward Port:** `3000`

### Options
- ✅ **Block Common Exploits** - Enabled (security)
- ❌ **Cache Assets** - Disabled
- ❌ **Websockets Support** - Disabled

### SSL Configuration
- **SSL Certificate:** Request a new SSL Certificate (Let's Encrypt)
- **Domain Names:** `admin.theWebsiteUrl.com`
- ✅ **Force SSL** - Enabled
- ✅ **HTTP/2 Support** - Enabled
- ✅ **HSTS Enabled** - Enabled
- ⚠️ **HSTS Sub-domains** - Enable only if ALL subdomains have SSL
- ❌ **Use DNS Challenge** - Disabled

### Custom Locations (Optional but Recommended)
To ensure the admin UI works properly, you can add a custom location:

**Custom Location 1:**
- **Location:** `/admin`
- **Scheme:** `http`
- **Forward Hostname/IP:** `vendure-server`
- **Forward Port:** `3000`

### Result
Admin panel accessible at: **`https://admin.theWebsiteUrl.com/admin`**

### Admin Login Credentials
- **Email:** `superadmin@example.com` (or valid email format)
- **Password:** `superadmin`

> **Note:** These are default credentials from your env-defaults.yml. Change them immediately in production!

patDevOpsUser@server011526-debian-ecom:~$ docker logs 27

> server@0.1.0 start:server
> node ./dist/index.js

## Dev vs Prod 

### Ports-- on Dev, the port for the dashboard is `5173`-- the vite live dev server runs on that port.  but in prod, it's `3000`, as you can see in this production deploy logs output:

```bash
Successfully ran migration: InitialMigration1769621898632
info 1/30/26, 10:35 PM - [Vendure Server] Bootstrapping Vendure Server (pid: 20)...
info 1/30/26, 10:35 PM - [AssetServerPlugin] Creating asset server middleware
info 1/30/26, 10:35 PM - [EmailPlugin] Creating dev mailbox middleware
info 1/30/26, 10:35 PM - [RoutesResolver] HealthController {/health}:
info 1/30/26, 10:35 PM - [RouterExplorer] Mapped {/health, GET} route
info 1/30/26, 10:35 PM - [GraphQLModule] Mapped {/shop-api, POST} route
info 1/30/26, 10:35 PM - [GraphQLModule] Mapped {/admin-api, POST} route
info 1/30/26, 10:35 PM - [NestApplication] Nest application successfully started
info 1/30/26, 10:35 PM - [Vendure Server] ====================================================
info 1/30/26, 10:35 PM - [Vendure Server]   Vendure server (v3.5.2) now running on port 3000
info 1/30/26, 10:35 PM - [Vendure Server] ----------------------------------------------------
info 1/30/26, 10:35 PM - [Vendure Server] Shop API:       http://localhost:3000/shop-api
info 1/30/26, 10:35 PM - [Vendure Server] Admin API:      http://localhost:3000/admin-api
info 1/30/26, 10:35 PM - [Vendure Server] Dashboard UI:   http://localhost:3000/dashboard
info 1/30/26, 10:35 PM - [Vendure Server] GraphiQL Admin: http://localhost:3000/graphiql/admin
info 1/30/26, 10:35 PM - [Vendure Server] GraphiQL Shop:  http://localhost:3000/graphiql/shop
info 1/30/26, 10:35 PM - [Vendure Server] Asset server:   http://localhost:3000/assets
info 1/30/26, 10:35 PM - [Vendure Server] Dev mailbox:    http://localhost:3000/mailbox
info 1/30/26, 10:35 PM - [Vendure Server] ====================================================
```

---

## Network Architecture

```
Internet
   |
   v
Nginx Proxy Manager (nginx-proxy-mgr-011526)
   |
   |-- Connected to: main-network--npm011526 (for postgres DB)
   |-- Connected to: vendure-network (for Vendure services)
   |
   +-- shop.theWebsiteUrl.com --> vendure-storefront:3001
   |
   +-- admin.theWebsiteUrl.com --> vendure-server:3000
```

### Docker Network Aliases
- `vendure-storefront` → Storefront container (port 3001)
- `vendure-server` → Server container (port 3000)
- `vendure-worker` → Worker container (no external port)
- `vendure-database` → Postgres container (port 5432, internal only)

---

## Troubleshooting

### 502 Bad Gateway
- **Cause:** Nginx can't reach the target container
- **Fix:** Ensure Nginx is connected to vendure-network
  ```bash
  docker network connect vendure-network nginx-proxy-mgr-011526
  ```

### SSL Certificate Issues
- **Cause:** Let's Encrypt rate limits or DNS not propagated
- **Fix:** 
  - Verify DNS records point to your server
  - Wait for DNS propagation (up to 24-48 hours)
  - Check Let's Encrypt rate limits (5 certificates per domain per week)

### Container Not Running
Check container status:
```bash
docker ps -a | grep vendure
```

Restart if needed:
```bash
docker restart vendure-storefront-juniper010726
docker restart vendure-server-juniper010726
```

### Cannot Access Admin Panel
- Verify proxy host is configured correctly
- Check admin URL: `https://admin.theWebsiteUrl.com/admin`
- Try different email format for login (must be valid email format)

---

## Security Recommendations

1. **Change default credentials immediately** after first login
2. **Consider IP whitelisting** for admin panel (restrict access to known IPs)
3. **Enable HSTS** on all domains for security
4. **Regular updates** - Keep Nginx Proxy Manager and Vendure updated
5. **Monitor logs** - Check Nginx logs regularly for suspicious activity

---

## Additional Proxy Hosts (Future)

If you need to expose other services:

### Shop API (GraphQL Endpoint)
- **Domain:** `api.theWebsiteUrl.com`
- **Forward to:** `vendure-server:3000`
- **Path:** `/shop-api`

### Admin API (GraphQL Endpoint)  
- **Domain:** `admin-api.theWebsiteUrl.com`
- **Forward to:** `vendure-server:3000`
- **Path:** `/admin-api`

> **Note:** Only expose these if needed by external applications. The storefront already communicates internally via Docker network.