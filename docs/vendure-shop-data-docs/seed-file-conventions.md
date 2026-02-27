# Seed Files: Conventions & Initial Decisions

This document records the conventions and decisions made when creating the initial seed files for the online shop. It covers file structure, naming conventions, pricing, and data modeling decisions.

---

## File Structure

```
apps/server/
  src/
    seed.ts                        ← entry point, calls populate()
    seed/
      initial-data.ts              ← zones, countries, tax, shipping, collections
      products.csv                 ← dev fixture products (one row per variant)
  static/
    assets/
      seed-fixtures/               ← placeholder media for dev fixtures
        aq-c-1/
          01-front.jpg
          02-back.jpg
          03-side.jpg
          04-rosette.jpg
          05-headstock.jpg
        aq-f-1/
        sp-c-1/
        sp-f-1/
        dt-c-1/
```

`seed.ts` lives at the `src/` level and orchestrates both files. `initial-data.ts` and `products.csv` live together inside `src/seed/`. Media lives in `static/assets/seed-fixtures/` — outside of `src/` because it is binary content, not code.

---

## How Seeding Works

Vendure's `populate()` function from `@vendure/core/cli` runs in two sequential steps:

1. **`initial-data.ts`** runs first via `populateInitialData()` — establishes zones, countries, tax rates, shipping methods, payment methods, and collections
2. **`products.csv`** runs second via `importProductsFromCsv()` — imports product and variant records into the catalog

To run the seed:

```bash
ts-node ./src/seed.ts
```

---

## SKU Convention

```
{vendor-initials}-{type-initial}-{unit-number}
```

| Part              | Description                                                                           |
| ----------------- | ------------------------------------------------------------------------------------- |
| `vendor-initials` | Lowercase initials of the luthier                                                     |
| `type-initial`    | `c` = classical, `f` = flamenco, `r` = requinto (future), `s` = steel string (future) |
| `unit-number`     | Sequential integer per vendor per type, starting at 1                                 |

**Examples:**

| SKU      | Luthier         | Type      |
| -------- | --------------- | --------- |
| `aq-c-1` | Alonso Quixano  | Classical |
| `aq-f-1` | Alonso Quixano  | Flamenco  |
| `sp-c-1` | Sancho Panza    | Classical |
| `sp-f-1` | Sancho Panza    | Flamenco  |
| `dt-c-1` | Dulcinea Toboso | Classical |

The SKU convention is designed to be human-readable and memorable. Vendors can identify their own products at a glance. It also maps directly to the planned vendor URL pattern:

```
shop.example.com/{vendor-initials}/{sku}
e.g. shop.example.com/aq/aq-f-1
```

---

## Media File Convention

Each guitar has exactly 5 photos, stored in a folder named after its SKU inside `static/assets/seed-fixtures/`.

| Filename           | Shot                               |
| ------------------ | ---------------------------------- |
| `01-front.jpg`     | Full front                         |
| `02-back.jpg`      | Full back                          |
| `03-side.jpg`      | One side                           |
| `04-rosette.jpg`   | Front close-up, focus on rosette   |
| `05-headstock.jpg` | Front close-up, focus on headstock |

The numeric prefix ensures filesystem sort order matches display order. Vendure uses the first asset as the primary/thumbnail image, so `01-front.jpg` is always the hero shot.

**Why 5 photos minimum:** Decided against 3 to avoid needing to update later. 5 photos tells a complete story for a handmade instrument and is sufficient for a premium product listing.

---

## Pricing Decisions

### Markup

A flat **40% markup** is applied across all products for consistency and simplicity.

```
listed price = vendor price × 1.40
```

| SKU    | Vendor Price | Listed Price |
| ------ | ------------ | ------------ |
| aq-c-1 | $750         | $1,050       |
| aq-f-1 | $1,200       | $1,680       |
| sp-c-1 | $650         | $910         |
| sp-f-1 | $600         | $840         |
| dt-c-1 | $250         | $350         |

The markup covers business operating costs and a small profit margin. A flat percentage was chosen over flat-dollar or tiered markups to keep the pricing policy simple and consistent.

### Shipping

A flat **$125 shipping rate** is charged at checkout, applied to all orders regardless of destination. This reflects the estimated cost of shipping a guitar from Mexico via FedEx ($100–$150).

Shipping is **not** baked into the listed product price — it is a separate line item at checkout. This keeps product prices clean and honest.

In `initial-data.ts`, shipping price is stored in cents: `12500` = $125.00.

### Prices in Vendure

All prices in Vendure are stored in **cents** (smallest currency unit). Always multiply dollar amounts by 100:

```
$1,050.00 → 105000
$125.00   → 12500
```

---

## Tax Strategy

| Zone                                  | Rate  |
| ------------------------------------- | ----- |
| Texas (state + San Antonio local max) | 8.25% |
| Everywhere else                       | 0%    |

Two tax rates are registered in `initial-data.ts`: `Texas` at 8.25% and `Standard` at 0%.

**Note:** `InitialData` only registers the rate definitions. The actual zone-to-rate assignments (Texas zone → 8.25%, default zone → 0%) must be configured manually in the Vendure admin dashboard after seeding.

Musical instruments are taxable in Texas. The 8.25% rate represents the maximum combined state + local rate (6.25% state + 2% San Antonio local) and is applied uniformly to all Texas orders.

---

## Product Data Model Decisions

### One Product = One Variant

Each guitar is a unique handmade instrument. There are no variants in the traditional sense (no size, color, or finish options). Each guitar is modeled as:

- One `Product`
- One `ProductVariant`
- `stockOnHand: 1`
- `trackInventory: TRUE`

This reflects the reality that each guitar is a one-of-a-kind item. When it sells, it is gone.

### Facets

Products are tagged with a `Type` facet to drive collection membership:

| Facet | Value     |
| ----- | --------- |
| Type  | Classical |
| Type  | Flamenco  |

Collections are filtered by facet value, so adding a product with `Type:Classical` automatically places it in the Classical collection.

### Collections Structure

```
Guitars (parent)
  ├── Classical
  └── Flamenco
```

The parent `Guitars` collection has no filter — it is a container. Child collections filter by facet value. This structure allows easy expansion: adding `Requinto` or `Steel String` later is a matter of adding a new collection with the appropriate facet filter.

---

## Dev Fixtures

The three fixture luthiers represent anonymized versions of real people and are named after characters from _Don Quixote_:

| Fixture Name    | Level        | Guitars        |
| --------------- | ------------ | -------------- |
| Alonso Quixano  | Professional | aq-c-1, aq-f-1 |
| Sancho Panza    | Professional | sp-c-1, sp-f-1 |
| Dulcinea Toboso | Student      | dt-c-1         |

**Total: 3 luthiers, 5 guitars, 25 placeholder media files**

These fixtures exist for local development only. They should never be seeded into production. Production catalog is populated manually through the Vendure admin dashboard.
