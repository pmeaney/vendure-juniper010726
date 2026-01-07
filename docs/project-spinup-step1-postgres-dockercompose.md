# Project spin up from scratch - Setting up Postgres (dockerized) prior to scaffolding via npx @vendure/create

- Setup postgresl docker-compose file & env file.
- Spin it up w/: `docker compose -f docker-compose.local.yml up -d`
- Check it out via postgres CLI login: `docker exec -it vendure-db-juniper010725 psql -U vendure_db_user -d vendure_db`
- Explore a bit:
  ```postgres
  \l # list databases
  \du # display users
  \c vendure_db # connect to vendure_db
  \c postgres # connect back to overall postgres db
  \q # exit postgres
  ```
