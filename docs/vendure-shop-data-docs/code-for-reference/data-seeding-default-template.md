# Data seeding default template

Add the seed media asset directory into the vendure-config (`apps/server/src/vendure-config.ts`) object:

```js
importExportOptions: {
    importAssetsDir: path.join(__dirname, "seed", "assets"),
  },
```

Update package.json to add a `npm run seed` command

```js
"seed": "ts-node ./src/seed/seed.ts"
```

Start the containers

Run the above command in the vendure server container
`docker exec -it vendure-juniper010726-vendure-server-1 npm run seed`

This runs a populate function from the seed.ts file which uploads an initial data schema, then parses the products.csv file (csv file but uses `|` for separating the image file names) to load the product data into its database.
