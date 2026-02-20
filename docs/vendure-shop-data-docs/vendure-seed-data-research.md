# Vendure Seed Data: Research, Findings & Decisions

## Overview

This document records how we determined the correct way to model seed data for the Online Shop Vendure project — what we looked for, what we found, how we interpreted it, and what we decided to build.

---

## Part 0: Scaffolding a new throwaway test example

First, we scaffold a new test example simply to explore how it scaffolds its product catalog via exploring its db seed files:

```
npx @vendure/create test-seed-reference --use-npm
cd test-seed-reference
npm run dev
```

## Part 1: How We Found the Right Files

### Starting Point: `test-seed-reference/node_modules/@vendure/core/package.json`

We started by checking the `package.json` of `@vendure/core` to find the authoritative entry points:

```json
"main": "dist/index.js",
"types": "dist/index.d.ts"
```

This told us that `dist/index.d.ts` is the primary TypeScript declarations file — the source of truth for everything `@vendure/core` publicly exports.

### The CLI Subpath: `@vendure/core/cli`

We found that `@vendure/core` ships a separate `cli/` directory alongside `dist/`. Inside it:

```
@vendure/core/cli/
  index.d.ts
  index.js
  populate.d.ts
  populate.js
```

The `cli/index.d.ts` simply re-exports everything from `populate.d.ts`, which exports four functions:

- `populate()` — the main entry point; bootstraps the app and runs initial data + optional product CSV import
- `populateInitialData()` — runs only the structural/config data
- `populateCollections()` — runs only collection creation
- `importProductsFromCsv()` — runs only the product CSV import

### Key Insight from `populate.d.ts`

The function signature revealed that seeding has **two distinct inputs**:

```typescript
populate(
    bootstrapFn: () => Promise<T>,
    initialDataPathOrObject: string | object,  // structural config
    productsCsvPath?: string,                   // product catalog (optional)
    channelOrToken?: string | Channel
)
```

This told us there are two separate concerns:

1. **Initial data** — an object/file describing zones, countries, tax rates, shipping, collections
2. **Product data** — a CSV file describing individual products and their variants

### Finding the `InitialData` Type: `data-import/types.d.ts`

By browsing the `@vendure/core/dist/` directory tree, we found:

```
dist/data-import/
  types.d.ts          ← InitialData interface lives here
  providers/
    populator/        ← Populator service (used internally by populate())
    importer/         ← Importer service (processes the CSV)
    import-parser/    ← ImportParser (parses CSV columns into typed objects)
```

`data-import/types.d.ts` gave us the exact `InitialData` interface:

```typescript
export interface InitialData {
  defaultLanguage: LanguageCode;
  defaultZone: string;
  roles?: RoleDefinition[];
  countries: CountryDefinition[];
  taxRates: Array<{ name: string; percentage: number }>;
  shippingMethods: Array<{ name: string; price: number; taxRate?: number }>;
  paymentMethods: Array<{ name: string; handler: ConfigurableOperationInput }>;
  collections: CollectionDefinition[];
}
```

Notable details extracted from the type:

- `roles` is optional
- `paymentMethods` is required but can be an empty array
- `shippingMethods` prices are in **cents** (e.g. `1500` = $15.00)
- Collections support `parentName` for nesting
- The only supported collection filter out of the box is `facet-value-filter`

### Finding the CSV Format: `data-import/providers/import-parser/import-parser.d.ts`

`import-parser.d.ts` exposed the parsed data structures, which map directly to CSV columns:

**Product-level fields** (repeated on every row for a given product):

- `name`, `slug`, `description`
- `assetPaths` (image file paths)
- `optionGroups` (e.g. "Size", "Color")
- `facets` (e.g. "Type: Classical")

**Variant-level fields** (one row per variant):

- `sku`
- `price` (in cents)
- `taxCategory`
- `stockOnHand`
- `trackInventory`
- `optionValues`
- `customFields` (prefixed in CSV headers)

Each product has at least one variant. For one-of-a-kind instruments, each instrument = one product with one variant.

---

## Part 2: Two Types of Seed Files

From the above research, we determined that seeding a Vendure project requires **two separate files**:

### File 1: `initial-data.ts` (Structural / Schema Config)

Defines the store's foundational configuration. This runs once and establishes the environment the catalog lives in. In Vendure's own terminology this is called **initial data**.

Contains:

- Default language and zone
- Countries and zone assignments
- Tax rate definitions
- Shipping method definitions
- Payment method definitions
- Collection structure (the category tree)

### File 2: `products.csv` (Product Catalog / Dev Fixtures)

Defines the actual products — in our case, example guitars for local development. This is commonly called **seed data**, **dev fixtures**, or **dev seed** in other frameworks. Since Vendure's importer uses CSV specifically, the format is fixed.

Contains:

- One row per product variant
- Product-level fields repeated across variant rows for the same product
- SKUs, prices, facet assignments, asset paths

---

## Part 3: What We Determined — Online Shop Initial Data

### Business Context

- **Store:** Online Shop — a marketplace for handmade guitars
- **Sales territory:** USA only (customers may browse from other countries)
- **Guitar types (current):** Classical, Flamenco (Requinto and Steel String planned)
- **Vendor model:** Admin manually uploads product info and media received from vendors
- **Multivendor:** Planned — each vendor will eventually have their own channel/seller with a slug-based URL pattern (e.g. `shop.example.com/aq/aq-f-1`)

### Tax Strategy

- Texas (state): 6.25%
- San Antonio (local): up to 2%
- Everywhere else: 0%

Modeled as two tax rates: `Texas` at 8.25% (max combined, applied uniformly to all Texas orders) and `Standard` at 0%.

### `initial-data.ts` Result

```typescript
export const initialData: InitialData = {
  defaultLanguage: LanguageCode.en,
  defaultZone: "North America",
  countries: [
    { code: "US", name: "United States", zone: "North America" },
    { code: "MX", name: "Mexico", zone: "North America" },
  ],
  taxRates: [
    { name: "Texas", percentage: 8.25 },
    { name: "Standard", percentage: 0 },
  ],
  shippingMethods: [{ name: "Standard Shipping", price: 1500 }],
  paymentMethods: [],
  collections: [
    {
      name: "Guitars",
      slug: "guitars",
      description: "Handmade classical and flamenco guitars",
    },
    {
      name: "Classical",
      slug: "classical-guitars",
      parentName: "Guitars",
      filters: [
        {
          code: "facet-value-filter",
          args: { facetValueNames: ["Classical"], containsAny: false },
        },
      ],
    },
    {
      name: "Flamenco",
      slug: "flamenco-guitars",
      parentName: "Guitars",
      filters: [
        {
          code: "facet-value-filter",
          args: { facetValueNames: ["Flamenco"], containsAny: false },
        },
      ],
    },
  ],
};
```

**Note:** Tax zones (Texas vs everywhere else) and zone-to-rate assignments must be configured in the Vendure admin dashboard after seeding, as `InitialData` only registers the rate definitions themselves.

---

## Part 4: Dev Fixtures Plan — Example Luthiers & Products

### SKU Convention

```
{vendor-initials}-{type-initial}-{unit-number}

Examples:
  aq-f-1   →  Alonso Quixano, Flamenco, unit 1
  sp-c-1   →  Sancho Panza, Classical, unit 1
  dt-c-1   →  Dulcinea Toboso, Classical, unit 1
```

Type initials: `c` = classical, `f` = flamenco, `r` = requinto (future), `s` = steel string (future)

### Planned Dev Fixtures

| Luthier         | Level        | Guitar Type | SKU    | Price (vendor) | Price (listed) |
| --------------- | ------------ | ----------- | ------ | -------------- | -------------- |
| Alonso Quixano  | Professional | Flamenco    | aq-f-1 | $750           | $1,050         |
| Sancho Panza    | Professional | Classical   | sp-c-1 | TBD            | TBD            |
| Dulcinea Toboso | Student      | Classical   | dt-c-1 | TBD            | TBD            |

3 luthiers × their guitars = **5 total example products**
(2 pro luthiers × 1 guitar each + 1 student luthier × 1 guitar = 3, but planned total is 5 to give broader coverage)

### Media Plan

- **5 photos per guitar minimum** (decided against 3 to avoid needing to update later)
- **25 total placeholder images** for the dev fixture set (5 guitars × 5 photos)

Suggested shot list per guitar:

1. Full front
2. Full back
3. Headstock
4. Soundhole / rosette
5. Detail shot (binding, heel, or maker's label)

### One Product = One Variant

Each guitar is a unique handmade instrument. There are no "variants" in the traditional sense (no size/color options). Each guitar is modeled as **one product with one variant**, with `stockOnHand: 1` and `trackInventory: TRUE`.

---

## File Structure (Planned)

```
apps/server/src/
  seed.ts                    ← entry point: calls populate()
  seed-data/
    initial-data.ts          ← InitialData object (zones, tax, shipping, collections)
    products.csv             ← example luthier guitars for local dev
    assets/                  ← placeholder product images (25 total)
```
