# Vendure Migration Idiosyncrasies

- [Vendure Migration docs](https://docs.vendure.io/guides/developer-guide/migrations/)
- [Vendure CLI docs](https://docs.vendure.io/guides/developer-guide/cli/)

## Initial Setup Issue

When first running `npx vendure migrate`, it failed with a dependency error.

**Root cause:** This project uses `generate-lockfiles.sh` to create Linux-compatible `package-lock.json` files inside Docker containers. While this script **does** create `node_modules` on the host machine (via bind mount), the dependencies are generated for Linux, not macOS.

**Fix:** Ran `npm install` on the host to regenerate dependencies for macOS:
```bash
cd my-shop-juniper/apps/server
npm install
npx vendure migrate
```

## Potential Side Effects

Running `npm install` on macOS **overwrites** the Linux-generated `node_modules` with macOS-compatible versions. This affects:
- **Pure JavaScript packages:** Identical across platforms (no issue)
- **Native modules** (packages with C++ bindings): Different binaries for Linux vs macOS

**Theory:** This should be fine because:
1. `package-lock.json` remains the source of truth for versions
2. Production CICD builds in clean Linux containers using `npm ci`
3. Local `node_modules` is never used in production builds
4. Most Vendure dependencies are pure JavaScript

**Status:** Untested. Will verify when next production deployment runs. If issues arise, can regenerate Linux `node_modules` by re-running `generate-lockfiles.sh`.

**Worst case recovery:** Delete local `node_modules` and re-run `generate-lockfiles.sh`.

## Notes on migration

Initial migration steps:

- Start DB container from root directory: `docker compose -f docker-compose.local.yml up -d v-db-juniper010726`
- Create the migration directory (it didnt exist when project was initially scaffolded) and make sure it matches what you select during the next step of migration setup.
- run `npx vendure migrate`

Here's what I entered:

```bash
❯ npx vendure migrate


┌  🛠️️ Vendure migrations
│
◇  What would you like to do?
│  Generate a new migration
│
◇  Project analyzed
│
●  Using VendureConfig from vendure-config.ts
│
◇  Enter a meaningful name for the migration
│  InitialMigration
│
◇  Migration file location
│  /Users/fuegofox/localhost/projects/active/business-apps/vendure-proje
cts/vendure-juniper010726/my-shop-juniper/apps/server/src/migrations
```

I initially was using this value in the local env var file (`.env.local.example.srv-wrk`):
`DB_HOST=vendure-database`

However, that's the Docker network alias. It only works inside Docker containers, such as in the remote prod container. And it would work for local migrations IF I ran all the containers (since the vendure container can reach the db via container network alias).  However for simplicity I am trying to run the migration process without all the containers running (only the DB container running, locally, for migration).

So, I changed `DB_HOST=vendure-database` to `DB_HOST=localhost`

Basically... I initially setup a docker-compose file to simulate the CICD Deployed container network.  I've since renamed that file to `docker-compose.production-like.yml`.  For local dev work, use the `docker-compose.local.yml` file.

Also, here's what happened when I initially tried to run the db migration, locally.

Basically-- when I initially ran docker compose up, all 4 apps (db, server, worker, storefront) booted normally. As a result, a first DB migration was automatically run by Vendure.  This created the DB files in `./v-db-juniper010726/pg-data-vendure-juniper`.  So, as a result... when I tried to create an initial migration locally... I first created a `migrations` directory.  However, the initial migration wasn't happening-- because the database schema had already been setup-- on that initial booting up of the project locally.  And because of that, no migration file was being output to the `migrations` directory.

So, the solution for getting the initial migration setup was this-- and this is all done locally of course.
- make sure the whole local project is down
- (For migrations, we actually only need the DB app to be up.  For that, we would have run `docker compose -f docker-compose.local.yml up -d v-db-juniper010726`)
- Make sure there's no container volume for the db (`docker compose -f docker-compose.local.yml down -v`)
- Delete the local DB dir: `rm -rf v-db-juniper010726/pg-data-vendure-juniper`
- Make sure the migrations directory exists (I place mine here `vendure-juniper010726/my-shop-juniper/apps/server/src/migrations` as seems to be the convention)

Now we're ready to setup the initial migration, locally.  By doing this, it creates the initial migration file in the /migrations directory.  This way, when we go to activate the CICD process, Vendure will automatically notice the migration file and run them.  From there, it should setup the DB schema, superadmin user, etc., to allow for the app to be accessed on the live, remote server for the first time.

Here's how the initial setup looked for me.
Note how I enter these values when prompted:
- migration name: InitialMigration
- migration location: the first one it suggests-- `server/src/migrations`

```bash
❯ npx vendure migrate


┌  🛠️️ Vendure migrations
│
◇  What would you like to do?
│  Generate a new migration
│
◇  Project analyzed
│
●  Using VendureConfig from vendure-config.ts
│
◇  Enter a meaningful name for the migration
│  InitialMigration
[dotenv@17.2.3] injecting env (11) from .env.local.example.srv-wrk -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
│
◇  Migration file location
│  /Users/fuegofox/localhost/projects/active/business-apps/vendure-projects/vendure-juniper010726/my-shop-juniper/apps/server/src/migrations
│
◇  New migration generated: /Users/fuegofox/localhost/projects/active/business-apps/vendure-projects/vendure-juniper010726/my-shop-juniper/apps/server/src/migrations/1769621898632-InitialMigration.ts
│
└  ✅ Done!
```