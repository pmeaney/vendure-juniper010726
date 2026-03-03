---
title: "Seeding a Featured Products Collection in Vendure"
description: "How I figured out the relationship between facets, filters, and collections to populate a homepage carousel from seed data."
date: 2026-03-03
tags: ["vendure", "e-commerce", "seeding", "dev", "devlog"]
---

I'm building Viva Luthiers — a marketplace for handmade guitars from Mexican luthiers. The storefront is built on Vendure, a headless e-commerce framework, with a Next.js frontend.

Early on, the homepage had a "Featured Products" carousel component sitting there with nothing in it. Getting products to show up turned out to be more interesting than I expected — not because it's hard, but because Vendure's data model has several overlapping concepts that aren't immediately obvious when you're new to it.

This is the story of how I figured it out.

## The Empty Carousel

The component was already wired up, querying Vendure's search API by collection slug. If you look at the [default featured-products component](https://github.com/vendurehq/nextjs-starter-vendure/blob/main/src/components/commerce/featured-products.tsx#L10-L20) from Vendure's Next.js starter, the original targets the `"electronics"` collection from the mock data:
(see References section at bottom for direct link to this file in the official template)

```typescript
const result = await query(GetCollectionProductsQuery, {
  slug: "electronics",
  input: {
    collectionSlug: "electronics",
    take: 12,
    skip: 0,
    groupByProduct: true,
  },
});
```

You'll notice there are _two_ slug-like parameters here — `slug` at the top level and `collectionSlug` inside `input`. This is mildly confusing. The one that actually drives the product query is `collectionSlug` inside `input` — that's what filters the search results by collection. The top-level `slug` appears to be a separate parameter for the query itself and should be kept consistent with it, but `collectionSlug` is the one doing the real work.

For Viva Luthiers I updated both to `"featured-guitars"`:

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

So the storefront knew _where_ to look. The problem was that no collection called `featured-guitars` existed yet, and even if it did, no products were assigned to it.

My first instinct was to look for a `collections` column in Vendure's CSV product import format. Maybe you just list the collection slugs a product belongs to? No such column exists. Then I wondered if "featured" was some built-in concept in Vendure. It isn't. Then I considered just doing it manually in the Admin UI — which would have worked, but would have broken every time I re-seeded.

What I actually needed was to understand how Vendure's collections work at a fundamental level.

## How Collections Actually Work

Vendure collections are filter-based. They don't hold a static list of products — instead, you define a filter and Vendure continuously evaluates which products match it.

The most common filter type is the `facet-value-filter`. Facets are essentially tags. A facet has a name (e.g. `category`) and a set of values (e.g. `Guitars`, `Classical Guitars`, `Flamenco Guitars`). Products get tagged with facet values, and collections use filters to automatically pull in matching products.

Once I understood this, the solution became clear: create a `Featured Guitars` facet value, tag the products I wanted featured with it, and create a collection that filters by that value.

## The Two-Part Seed Setup

Vendure's seeding runs in two phases. First, `initial-data` runs — this sets up collections, shipping methods, tax rates, and other structural config. Second, the CSV product import runs — this creates products and assigns facet values to them. The order matters.

**Phase 1: Add the collection to `initial-data.ts`**

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

A couple of things worth calling out here. The `assetPaths` field sets the collection's thumbnail in the Admin UI — not required, but nice. More importantly, `parentName: "Guitars"` makes this a child of the Guitars collection rather than a top-level collection.

I learned this the hard way. Without `parentName`, two things broke: the navbar stopped showing any product collections at all — not even `Guitars` — and the homepage carousel still wasn't populated, even though `Featured Guitars` now appeared as a category in the product list page. It was a confusing failure mode because things were _partially_ working in the wrong places.

The fix was setting `parentName: "Guitars"` to make it a child collection. That restored the navbar and wired up the homepage correctly. Vendure looks up collections by slug regardless of their position in the hierarchy, so the storefront component's `collectionSlug: "featured-guitars"` query works fine whether the collection is top-level or nested.

**Phase 2: Tag products in the CSV**

In the `facets` column of the product CSV, pipe-delimit the facet values and add `category:Featured Guitars` to whichever products you want to feature:

```
Dulcinea Toboso Studio Classical Cedar Guitar, dt-c-1, ...,
category:Guitars|category:Classical Guitars|brand:Toboso|category:Featured Guitars, ...
```

The `category:Featured Guitars` entry creates the facet value automatically on import if it doesn't already exist. No need to pre-define it anywhere.

## Why It Works

By the time the collection filter runs, the products are already tagged from the CSV import. Vendure evaluates the filter and pulls in any product with the `Featured Guitars` facet value. The homepage component queries the `featured-guitars` collection by slug, gets those products back, and renders them in the carousel.

The Admin UI ended up being a useful sanity check — after seeding, I could open the Collections view and see `Featured Guitars` nested under `Guitars` with the correct filter applied, and the Facets view showed `featured-guitars` as a value under the `category` facet. Seeing the data model reflected visually helped cement the mental model.

## The Key Insight

The facet value doesn't need to be pre-defined — the CSV creates it on the fly. The collection filter just needs to reference the same name. The CSV naming convention is `facetName:facetValue`, where `facetName` is the facet's code (e.g. `category`) and `facetValue` is the value name (e.g. `Featured Guitars`).

Once you understand that collections are just saved filters against a tagging system, the whole thing clicks. It's more powerful than a static list — add `category:Featured Guitars` to any product's CSV row and it automatically appears in the featured collection. Remove it and it disappears. No manual Admin UI work required after the initial setup.

## References

- Vendure official mock seed files (useful for understanding the expected CSV and initial-data format):
  - [products.csv](https://github.com/vendurehq/vendure/blob/master/packages/core/mock-data/data-sources/products.csv)
  - [initial-data.ts](https://github.com/vendurehq/vendure/blob/master/packages/core/mock-data/data-sources/initial-data.ts)
- [Default featured-products component](https://github.com/vendurehq/nextjs-starter-vendure/blob/main/src/components/commerce/featured-products.tsx#L10-L20) from Vendure's Next.js starter
