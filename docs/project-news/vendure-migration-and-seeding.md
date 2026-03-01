---
title: "Vendure eCommerce migration & seeding"
description: "Learnings from setting up migration & seeding processes in Vendure eCommerce Framework"
date: "03/01/2026"
---

import Callout from "@/components/Callout.astro";

---

## Seeding and Migrating a Vendure Store in Production (And the Gotchas That Will Get You)

I'm building a handmade guitar marketplace on [Vendure](https://www.vendure.io/) — a TypeScript-first, headless commerce framework. Getting the local dev environment seeded was straightforward enough. Getting it working in production was a different story.

This post covers how Vendure's seeding system actually works, the decisions I made modeling the initial data, and the three production failures that cost me a few hours. If you're building on Vendure and planning to containerize it, the second half of this post will save you real time.

---

## How Vendure Seeding Works

Vendure ships a `populate()` function in `@vendure/core/cli` that handles database seeding in two sequential phases:

```typescript
populate(
  bootstrapFn: () => Promise<T>,
  initialDataPathOrObject: string | object,  // phase 1: structural config
  productsCsvPath?: string,                   // phase 2: product catalog
  channelOrToken?: string | Channel
)
```

**Phase 1 — Initial Data:** Establishes the store's structural foundation: zones, countries, tax rates, shipping methods, payment methods, and the collection tree. This is defined in a typed `InitialData` object.

**Phase 2 — Products CSV:** Imports actual product records. Vendure's importer parses a pipe-delimited CSV, one row per variant, with product-level fields repeated across variant rows for multi-variant products.

The two concerns are intentionally separate — structural config vs. catalog content. Think of it like this:

| File                | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `initial-data.ts`   | System setup — zones, tax, shipping, collections     |
| `products.csv`      | Catalog content — products, variants, prices, images |
| `src/seeds/assets/` | Source images for the seed importer                  |
| `static/assets/`    | Vendure-managed storage (processed output)           |

One thing that tripped me up early: **`static/assets/` is managed by Vendure, not you.** When Vendure imports a product image, it processes it into optimized versions (thumbnails, previews, source) and stores them there. Your seed images belong in a separate `seeds/assets/` directory. You tell Vendure where to find them via `vendure-config.ts`:

```typescript
importExportOptions: {
  importAssetsDir: path.join(__dirname, "seeds", "assets"),
}
```

---

## Modeling the Initial Data

The store sells handmade guitars — classical and flamenco — sourced from luthiers in Mexico. Sales are US-focused for now. That shaped a few decisions.

### Collections

Collections in Vendure are filter-driven. The collection tree for this store:

```
Guitars (parent — no filter, container only)
  ├── Classical  (filter: facet Type:Classical)
  └── Flamenco   (filter: facet Type:Flamenco)
```

The parent collection has no filter. Child collections use Vendure's built-in `facet-value-filter` to automatically place products based on their facet tags. Adding a new guitar type later (Requinto, Steel String) is as simple as adding a new collection with the right facet filter — no code changes required.

### Tax Strategy

Musical instruments are taxable in Texas. The combined state + San Antonio local rate caps at 8.25%. I modeled this as two tax rates: `Texas` at 8.25% and `Standard` at 0%.

Worth noting: `InitialData` only registers the rate _definitions_. The actual zone-to-rate assignments have to be configured manually in the admin dashboard after seeding. It's a minor annoyance but reasonable given how flexible zone configuration can get.

### Pricing

All prices in Vendure are stored in cents. A flat 40% markup is applied across all products:

```
listed price = vendor price × 1.40
$750 vendor → $1,050 listed → stored as 105000
```

Shipping is a flat $125 (12500 cents) applied at checkout, not baked into product prices.

### Product Modeling: One Product, One Variant

Each guitar is a unique handmade instrument — no size or color variants. So the data model is simple: one `Product`, one `ProductVariant`, `stockOnHand: 1`, `trackInventory: TRUE`. When it sells, it's gone.

### SKU Convention

```
{vendor-initials}-{type-initial}-{unit-number}

aq-c-1  →  Alonso Quixano, Classical, unit 1
sp-f-1  →  Sancho Panza, Flamenco, unit 1
dt-c-1  →  Dulcinea Toboso, Classical, unit 1
```

This maps directly to a planned vendor URL pattern: `shop.example.com/aq/aq-c-1`. Human-readable, memorable, and the vendor can identify their own products at a glance.

### Placeholder Data

The three placeholder luthiers are named after characters from _Don Quixote_ — anonymized stand-ins for real people. Five guitars total, five photos each (25 images), following a consistent shot list:

| Filename           | Shot                   |
| ------------------ | ---------------------- |
| `01-front.jpg`     | Full front (hero shot) |
| `02-back.jpg`      | Full back              |
| `03-side.jpg`      | One side               |
| `04-rosette.jpg`   | Soundhole close-up     |
| `05-headstock.jpg` | Headstock close-up     |

Numeric prefixes ensure filesystem sort order matches display order. Vendure uses the first asset as the primary thumbnail, so `01-front.jpg` is always the hero.

---

## The Seed Script

```typescript
import { bootstrap, DefaultLogger, LogLevel } from "@vendure/core";
import { populate } from "@vendure/core/cli";
import path from "path";
import { config } from "../vendure-config";
import { initialData } from "./initial-data";

const populateConfig = {
  ...config,
  apiOptions: {
    ...config.apiOptions,
    port: 3099, // run on a different port so it doesn't conflict with the live server
  },
  logger: new DefaultLogger({ level: LogLevel.Verbose }),
};

populate(
  () => bootstrap(populateConfig),
  initialData,
  path.join(__dirname, "products.csv"),
)
  .then((app) => app.close())
  .then(
    () => process.exit(0),
    (err) => {
      console.log(err);
      process.exit(1);
    },
  );
```

Locally, this runs cleanly via:

```bash
docker exec -it vendure-server npm run seed
```

Production was a different story.

---

## Production Failures (The Actually Useful Part)

The project is containerized — a multi-stage Docker build that produces a lean production image. The dev environment uses a volume mount and runs TypeScript source directly. Production compiles to `dist/` and runs the compiled JS. This is where things got interesting.

### Failure 1: `Cannot find module '../vendure-config'`

Running the seed command on the production server:

```
TSError: ⨯ Unable to compile TypeScript:
src/seeds/seed.ts:8:24 - error TS2307: Cannot find module '../vendure-config'
```

The production Dockerfile only copies specific directories into the final image:

```dockerfile
COPY --from=builder --chown=vendure:nodejs /usr/src/app/src/migrations ./src/migrations
COPY --from=builder --chown=vendure:nodejs /usr/src/app/src/seeds ./src/seeds
```

`vendure-config.ts` was never copied. The seed script couldn't find it because it simply wasn't there.

**Fix:** Add it explicitly to the prod stage:

```dockerfile
COPY --from=builder --chown=vendure:nodejs /usr/src/app/src/vendure-config.ts ./src/vendure-config.ts
COPY --from=builder --chown=vendure:nodejs /usr/src/app/tsconfig.json ./tsconfig.json
```

### Failure 2: `Unknown file extension ".ts"`

With `vendure-config.ts` now present, the next error:

```
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts"
    for /usr/src/app/src/seeds/seed.ts
```

The project's `tsconfig.json` uses `"module": "nodenext"` and `"moduleResolution": "nodenext"`. With `ts-node`, this causes ESM handling issues — it tries to resolve `.ts` files as ES modules and fails.

The `ts-node` config block in `tsconfig.json` (`esm: true`, `experimentalSpecifierResolution: node`) didn't reliably fix it either. After several attempts, the cleanest solution was to swap `ts-node` for [`tsx`](https://github.com/privatenumber/tsx), which handles modern TypeScript module resolution without the ESM configuration headaches.

In the Dockerfile, before the `USER vendure` line:

```dockerfile
RUN npm install -g tsx
```

In `package.json`:

```json
"seed": "tsx ./src/seeds/seed.ts"
```

Done. No tsconfig gymnastics required.

### Failure 3: Product Images 404ing in Production

The seed ran successfully. The products showed up. The images were all broken — 404s across the board. The network tab showed requests going to `shop.vivaluthiers.com/assets/...`, and `shop.vivaluthiers.com` is the Next.js storefront — which has no idea what `/assets` is.

The root cause: `assetUrlPrefix` in `vendure-config.ts` was set using a `SHOP_URL_PUBLIC` environment variable that pointed to the storefront domain. When Vendure imports product images, it writes the full asset URL into the database. Those URLs got baked in at seed time pointing at the wrong domain.

The reasoning chain that led to the diagnosis:

1. The env var was correctly set in the container ✓
2. The config code was correct ✓
3. But the wrong URL was still being used

If the config is right but the URL is wrong, the URL isn't being generated at request time — it was stored when the data was first created. The only time Vendure writes asset URLs is during seeding. Therefore: old URLs in the database, written during the first (broken) seed run.

**Fix:** Add a dedicated `VENDURE_API_URL_PUBLIC` env var pointing to the domain that actually serves the Vendure backend, update `vendure-config.ts` to use it, wipe the database, and re-seed:

```typescript
assetUrlPrefix: IS_DEV ? undefined : `${process.env.VENDURE_API_URL_PUBLIC}/assets/`,
```

```bash
# .env (production)
VENDURE_API_URL_PUBLIC=https://api.vivaluthiers.com
```

And add `api.vivaluthiers.com` as a proxy host in nginx pointing to the Vendure server container. This creates clean domain separation: `shop` for the storefront, `admin` for the dashboard, `api` for the Vendure backend (assets + GraphQL).

---

## Key Takeaways

**The seed process has two distinct phases** — structural config (`initial-data.ts`) and catalog content (`products.csv`). Keep them separate and understand what each one does.

**Asset URLs are written to the database at seed time.** If `assetUrlPrefix` points to the wrong domain, re-seeding is the only fix. Get this right before your first production seed run.

**Don't use `static/assets/` for seed images.** It's Vendure-managed storage. Put your source images in `seeds/assets/` and configure `importAssetsDir` to point there.

**In a multi-stage Docker build, the prod image only contains what you explicitly copy.** If the seed script needs a file, that file needs to be in the image. Audit your COPY statements.

**`tsx` is a better choice than `ts-node` for scripts** in projects using `"module": "nodenext"`. Less configuration, more reliable behavior.

The store is live at [vivaluthiers.com](https://vivaluthiers.com).
