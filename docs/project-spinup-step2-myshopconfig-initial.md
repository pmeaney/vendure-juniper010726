# Project spin up from scratch - Configuring Vendure's scaffolding Manual Config

Although this project will be entirely dockerized-- We're not quite there yet.
I haven't messed with programming & docker for a few months.
So, in the initial config I am going to try to keep things as simple as possible and fix things step-by-step-- crossing each bridge as we come to it.


## Differences between my Docker Compose assumptions vs. the my-shop template's Docker Compose setup

  
Here's some notes for guiding the process of the initial scaffolding of a Vendure project (the official my-shop template) via the "manual config" (vs "Quickstart").
This will cover what I discover while starting to setup my own productionized version of the Vendure my-shop template.

To start the scaffolding process, run `npx @vendure/create my-shop-juniper` and select `Manual Config`

Things I want to address in moving through this process:

1. database host address
   
I haven't been through the manual config scaffolding yet, so I am assuming it might not initially set things up Dockerized (though its Quickstart provides that option).

Below, ClaudeAI provides tips on setup when we DO want each main application module (DB, Backend, Frontend) to reside in the same docker-compose file.  Which, we ultimately will want (for local development).

This is from ClaudeAI:
```
### QUESTION
In general, a DB URI would be something like: `

# Database connection string
DATABASE_URI=postgres://postgres:<password>@127.0.0.1:5432/your-database-name1
for this project.

In the Vendure instantiation (manual config) it asks: 

◆  What's the database host address?
│  localhost█

In our case, it's dockerized.  Should it still be localhost? or the docker container name?

### ANSWER
Use localhost (or 127.0.0.1).

Since you're mapping the PostgreSQL port to your host machine with:

yaml
ports:
  - "5432:5432"
The Vendure CLI (running on your host machine, not in Docker) connects to localhost:5432, which Docker forwards to the container.

Use container name only when:

Both services are in the same Docker network/compose file
Service-to-service communication within Docker
Your situation:

Vendure CLI: running on your Mac (host)
PostgreSQL: running in Docker container
Connection: host → localhost:5432 → Docker container
So use:

Host: localhost (or 127.0.0.1)
Port: 5432
Database: vendure_db
User: vendure_db_user
Password: vendure_db_pass
```

## NOTE:

Once Vendure does scaffold up (again-- we're talking via manual config), it provides a docker-compose file in /apps/server which states how it maps ports into the postgres docker container, which looks like this:

```yml
services:
    postgres_db:
        image: postgres:16-alpine
        volumes:
            - postgres_db_data:/var/lib/postgresql/data
        ports:
            - "6543:5432"
        environment:
            POSTGRES_DB: vendure_db
            POSTGRES_USER: vendure_db_user
            POSTGRES_PASSWORD: vendure_db_pass
        labels:
            - "io.vendure.create.name=my-shop-juniper"

```

2. Postgres version & local port.

I usually go with Postgres 17 in my own project templates (e.g. my dockerized, templated version of the PayloadCMS official web template).  Vendure uses 16.

3. Postgres ports

Vendure's server docker-compose file shows it connects to the its postgres container via nonstandard port 6543.

Locally, we may change "6543:5432" to "localhost:5432" or just leave it as 6543:5432.  It probably won't matter-- as long as it runs.

On the remote, live, internet-traffic-receiving server, Vendure will connect to the postgres DB via its container name (which. may be set as "host address" within vendure).  Within the docker config (i.e. CICD docker run statement), we'll likely feed it a DB_HOST=<pg container name> (i.e. DB_HOST=vendure-db-juniper010725) env var (via -e flag, or similar env var flag during the docker run statement)

4. database address

Initially, localhost should work.
Once we network the docker containers together, we'll need to set the DB_HOST as vendure-db-juniper010725
