# Vendure: Seeding a Featured Products Collection

## Resources

- Offical my-shop mock data & seed files:
  products.csv: https://github.com/vendurehq/vendure/blob/master/packages/core/mock-data/data-sources/products.csv
- initial-data.ts: https://github.com/vendurehq/vendure/blob/master/packages/core/mock-data/data-sources/initial-data.ts

- The default featured-products component:
  https://github.com/vendurehq/nextjs-starter-vendure/blob/main/src/components/commerce/featured-products.tsx#L10-L20

## The Problem

One of the first UI goals for the storefront was getting a "Featured Products" carousel on the homepage. The component was already there, querying Vendure's search API by collection slug — but the carousel was empty.

The question was deceptively simple: _how do you get specific products to show up there?_

Vendure has a lot of overlapping concepts — collections, facets, facet values, filters, and their hierarchies — and the relationship between them isn't immediately obvious. I knew products needed to end up in a collection called `featured-guitars`, but I wasn't sure:

- Whether "featured" was a special built-in concept or something I had to create
- Whether to handle it via seed data or manually in the Admin UI
- Whether it needed a separate `collections` column in the CSV, a special facet, or something else entirely

I went down a few false starts before landing on the right approach. The Admin UI turned out to be useful as a conceptual guide — once the seeding was set up correctly, looking at the resulting collections and facets in the dashboard provided the breadcrumbs to understand how the pieces fit together. But getting there required understanding Vendure's data model first.

---

## How Vendure Collections Work

Vendure collections are filter-based — they don't hold a static list of products. Instead, you define a filter (e.g. "all products with facet value X") and Vendure automatically populates the collection with matching products.

The `facet-value-filter` is the most common filter type. It checks whether a product has a specific facet value assigned to it.

Facets are essentially tags. A facet has a name (e.g. `category`) and values (e.g. `Guitars`, `Classical Guitars`, `Featured Guitars`). Products get tagged with facet values in the CSV seed file, and collections use filters to automatically pull in products with matching tags.

---

## The Two-Part Solution

### 1. Add the "Featured Guitars" collection to `initial-data.ts`

```typescript
{
  name: "Featured Guitars",
  filters: [
    {
      code: "facet-value-filter",
      args: { facetValueNames: ["Featured Guitars"], containsAny: false },
    },
  ],
  assetPaths: ["guitar-general-classical.jpg"],
  parentName: "Guitars",
}
```

A few things to note:

- `assetPaths` sets the collection's thumbnail image in the Admin UI — not required but nice to have.
- The filter tells Vendure: "include any product tagged with the `Featured Guitars` facet value."
- `parentName: "Guitars"` is important. Without it, `Featured Guitars` becomes a top-level collection and shows up in the storefront navbar alongside `Guitars` — which isn't what you want. Making it a child of `Guitars` keeps the navbar clean while still allowing the homepage component to query it directly by slug.

### 2. Tag products in the CSV seed file

In the `facets` column of the product CSV, add `category:Featured Guitars` to whichever products you want featured:

```
name, slug, ..., facets, ...
Dulcinea Toboso Studio Classical Cedar Guitar, dt-c-1, ..., category:Guitars|category:Classical Guitars|brand:Toboso|category:Featured Guitars, ...
```

The `category:Featured Guitars` entry creates the facet value automatically during import if it doesn't already exist, and tags the product with it.

### 3. Query by collection slug in the storefront

See `my-shop-juniper/apps/storefront/src/components/commerce/featured-products.tsx`:

```typescript
const result = await query(GetCollectionProductsQuery, {
  slug: "featured-guitars",
  input: {
    collectionSlug: "featured-guitars",
    take: 12,
    skip: 0,
    groupByProduct: true,
  },
});
```

The `collectionSlug` is what actually drives the query — it doesn't matter whether the collection is top-level or nested.

---

## Why This Works

Vendure's seeding runs in two phases: `initial-data` first (which creates the collections and their filter definitions), then the CSV import (which creates products and assigns facet values). By the time the collection filter evaluates, the products are already tagged — so Vendure wires everything up automatically.

The result: any product with `category:Featured Guitars` in its CSV facets column appears in the `featured-guitars` collection, which the storefront component then queries and renders in the homepage carousel.

---

## Key Insight

The facet value (`Featured Guitars`) doesn't need to be pre-defined anywhere — the CSV import creates it on the fly. The collection just needs to reference the same name in its filter. The naming convention in the CSV is `facetName:facetValue`, where `facetName` matches the facet's code (e.g. `category`) and `facetValue` is the value name (e.g. `Featured Guitars`).

This also means the Admin UI reflects exactly what the seed data created — which makes it a useful reference for understanding the data model even if you set everything up in code.
