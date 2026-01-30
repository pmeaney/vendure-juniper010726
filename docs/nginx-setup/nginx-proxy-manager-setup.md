# Nginx Proxy Manager - Vendure Proxy Host Setup

This document describes how to configure Nginx Proxy Manager to route traffic to the Vendure storefront and admin panel.

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