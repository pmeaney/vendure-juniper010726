# Vendure Project - Monorepo 

This project will be an initial draft of an Vendure ecommerce project. It's containerized (docker) for easy CICD deployment.  It has a docker-compose file for easy local development spin-up.

Run it locally:

- Clone project
- Generate Linux-compatible lockfiles: `./generate-lockfiles.sh`
  - **Why:** Creates `package-lock.json` files with Linux-compatible binaries (required for Docker containers). This ensures dependencies like `lightningcss`* work correctly in the containerized environment.
  - **When to run:** 
    - First time setting up the project (lockfiles don't exist in repo yet)
    - After updating dependencies in `package.json`
    - If you've deleted `package-lock.json` files
- Start all services: `docker compose -f docker-compose.local.yml up --build`

Access the application:
- Storefront: http://localhost:3001
- Admin/API: http://localhost:3000
- Database: localhost:5432

---

**\*About platform-specific dependencies:** Some npm packages (like `lightningcss`) include native binaries compiled for specific operating systems. If you run `npm install` on macOS, it generates a lockfile pointing to macOS binaries. When Docker tries to use that lockfile in a Linux container, it fails with "module not found" errors.

Without the `generate-lockfiles.sh` script (which is really just a helper to simplify the commands), the Dockerfiles would create a `package-lock.json` within the container during the **build phase**. However, this lockfile would only exist as an ephemeral layer in the Docker image - it wouldn't sync back to your host filesystem because Docker volumes are only mounted during the **run phase**, not the build phase. This means:
- The lockfile exists temporarily in the built image
- It never makes it to your Mac's filesystem
- You can't commit it to version control
- Every build regenerates it (slow)
- Team members and CI/CD can't use a consistent lockfile

The script solves this by running `npm install` in a temporary Linux container **at runtime** (not build time), with your project directory mounted as a volume. This way, the Linux-generated lockfile is written directly to your Mac, can be committed to git, and ensures everyone (local dev, teammates, CI/CD, production) uses identical dependencies.

To clean up:
- break out with control-c
- `docker compose -f docker-compose.local.yml down -v`
  

# TO DO

- Research: docker not generating package-lock.json
- Ensure package-lock.json is generated locally on docker compose up command, but from the Docker container itself so that the dependencies are based on the docker container's OS.


#### 1/21/26 having issues from cafe-- docker image downloads seem to be limited by router or ISP

**Note to self-- still figuring this part out.  Need to re-try a fresh install.**
Due to how this project is built... When re-building it, you may need to delete node_modules and package-lock.json if doing a docker image re-build.  This is because the project's dockerfiles are setup to run its `npm install` from within the container, rather than within the local OS (macOS developer laptop).  The reason is to keep the dependencies consistent with what will exist on the web server.  If the project is installed from the local OS (macOS) at least one of its dependencies (lightningcss) will be built based on its ARM dependency, rather than Linux x64 dependency and subsequently that will be in noted in the package-lock.json file.

# Explanation of Project Components - Local Development

This project is designed to be entirely containerized, both for local dev & remote prod deployment.
In Local Development (i.e. on your Desktop computer during dev work), you'll run it via Docker Compose.

The docker-compose.local.yml file lists 4 services:
DB, Server, Worker, and Storefront.

Here are some notes about those.  Note: For more information on this project in general, see the ./docs directory.

- Database - 
  - My preference is PostgreSQL. However, in you can find other options' configurations in the `my-shop-juniper/apps/server/docker-compose.ForReferenceOnly.yml` file.  That file shows the original settings for the alternate databases which work with Vendure
  - You may wonder "Why keep a directory just for the database, when you could simply put its environment variables into the docker-compose.local.yml file as well?"  There are two reasons the DB's directory exists in this project:
    - 1. For consistency, this project contains an .env files in each of its main components (DB, Storefront, and a combined one for Server & Worker), rather than placing them into docker-compose files. For CICD, the env vars will also appear in two other locations: locally, in a ./.github/defaults/env-defaults.yml file-- for default env vars with which the images will be built.  And remotely, in the project's Github Repo's secrets-- from where they'll be injected, during CICD, into the containers during their run step-- one of the final steps of the CICD process. In that step, the default env vars (set into the image from the ./.github/defaults/env-defaults.yml file) will be overwritten with the secret production env vars.
    - 2. The database directory also contains the local database files (in `v-db-juniper010725/pg-data-vendure-juniper`), which is a directory (a "bind-mount") created when docker spins up the database container.

- Storefront
  - An instance of Nextjs
- Server
  - The API for Vendure, operated via GraphQL.  
- Worker
  - The background task runner for Vendure. For its tasks, it feeds directly from the database, where its Job Queue resides.  So, no need for it to have port exposure unless there's a desire to use a health check functionality with it.
  
---

To Do:
  - Deploy it via CICD
  - Start customizing the storefront a bit
  - Create a custom schema for database
  - Create a two-language schema (english, spanish)


