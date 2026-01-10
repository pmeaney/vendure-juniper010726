# Vendure Project - Monorepo 

This project will be an initial draft of an Vendure ecommerce project. It's containerized (docker) for easy CICD deployment.  It has a docker-compose file for easy local development spin-up.

Run it locally:

- Clone project.
- run `docker compose -f docker-compose.local.yml up`

To clean up:
- break out with control-c
- `docker compose -f docker-compose.local.yml down -v`
  

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


