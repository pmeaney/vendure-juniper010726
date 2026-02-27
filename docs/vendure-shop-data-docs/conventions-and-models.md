# Preparing to seed DB

Chatted with ClaudeAI & ChatGPT a bit to try to get a sense of how to find the right files and determine the right setup for the db schema & initial seed data.

What was super helpful was finding this. The initial csv file-- I used it to create a first mock product item.
Offical my-shop mock data & seed files:

- products.csv: https://github.com/vendurehq/vendure/blob/master/packages/core/mock-data/data-sources/products.csv
- initial-data.ts: https://github.com/vendurehq/vendure/blob/master/packages/core/mock-data/data-sources/initial-data.ts

## 🏗 Proper Mental Model

Think of it like this:

| File               | Purpose                 |
| ------------------ | ----------------------- |
| `initial-data.ts`  | System setup            |
| `products.csv`     | Catalog content         |
| `src/seed/assets/` | Product image sources   |
| `static/assets/`   | Vendure-managed storage |

To ensure that the populate function in the seed file finds the right directory for the seed media assets,
I had to add this to vendure-config.ts:

```javascript
  importExportOptions: {
    importAssetsDir: path.join(__dirname, "seed", "assets"),
  },
```

Then we can run:
docker exec -it vendure-juniper010726-vendure-server-1 npm run seed

Without any errors in our logs:
docker exec -it vendure-juniper010726-vendure-server-1 cat /usr/src/app/vendure-import-error.log
