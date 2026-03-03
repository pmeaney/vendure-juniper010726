# Vendure: Seeding a Featured Products Collection

One of the first UI goals for the storefront was getting a "Featured Products" carousel on the homepage. The component queries Vendure's search API by collection slug:

See file `my-shop-juniper/apps/storefront/src/components/commerce/featured-products.tsx`

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

The question was: how do you seed specific products into that collection?

## How Vendure Collections Work

Vendure collections are filter-based — they don't hold a static list of products. Instead, you define a filter (e.g. "all products with facet value X") and Vendure automatically populates the collection with matching products.

The `facet-value-filter` is the most common filter type. It checks whether a product has a specific facet value assigned to it.

## The Two-Part Solution

### 1. Add the "Featured Guitars" collection to `initial-data.ts`

Note: if you don't add `parentName: "Guitars",` then things won't work properly-- "guitars" will no longer appear in the nav bar, and the homepage won't be populated by the featured guitars. Though they will appear as a category in the store's product list view.

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

The `assetPaths` sets the collection's thumbnail image in the Admin UI. The filter tells Vendure: "include any product tagged with the `Featured Guitars` facet value."

### 2. Tag products in the CSV seed file

In the `facets` column of the product CSV, add `category:Featured Guitars` to whichever products you want featured:

```
name, slug, ..., facets, ...
Dulcinea Toboso Studio Classical Cedar Guitar, dt-c-1, ..., category:Guitars|category:Classical Guitars|brand:Toboso|category:Featured Guitars, ...
```

The `category:Featured Guitars` entry creates the facet value automatically during import if it doesn't already exist, and tags the product with it.

## Why This Works

Vendure's seeding runs in two phases: `initial-data` first (which creates the collections and their filter definitions), then the CSV import (which creates products and assigns facet values). By the time the collection filter runs, the products are already tagged — so Vendure wires everything up automatically.

The result: any product with `category:Featured Guitars` in its CSV facets column appears in the `featured-guitars` collection, which the storefront component then queries and renders in the homepage carousel.

## Key Insight

The facet value (`Featured Guitars`) doesn't need to be pre-defined anywhere — the CSV import creates it on the fly. The collection just needs to reference the same name in its filter. The naming convention in the CSV is `facetName:facetValue`, where `facetName` matches the facet's code (e.g. `category`) and `facetValue` is the value name (e.g. `Featured Guitars`).
