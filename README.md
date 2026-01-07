# Vendure Project - Monorepo 

This project will be an initial draft of an Vendure ecommerce project. It's dockerized for easy CICD deployment.  It has Docker-compose files for easy local development spin-up.

DB Info:
POSTGRES_DB: vendure_db
POSTGRES_USER: vendure_db_user
POSTGRES_PASSWORD: vendure_db_pass

---

Current to do:

- Jan 07, 2026 - 03:48 pm
  - Finish setting up docker-compose.local.yml:
    - & its dependencies (e.g. 3 dockerfiles- Server, worker, storefront)
    - create example env file if not already existing & make sure .gitignore does not ignore them
  - Test it locally
  - Deploy it via CICD
  - Start customizing the storefront a bit
  - Create a custom schema for database
  - Create a two-language schema (english, spanish)



