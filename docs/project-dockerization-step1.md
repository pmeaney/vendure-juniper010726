# Dockerizing the project via Docker-compose (local dev work) and Dockerfiles

The original template (`npx @vendure/create my-shop  ...then select:  manual config)`  arrived with a Dockerfile and a Docker-compose for the Server.  I'll keep it for reference-- for example, it adds this label to the postgres container.  Perhaps it would be needed for something (such as elasticsearch reference, or even reference within the server or worker apps, I dunno).

```
labels:
            - "io.vendure.create.name=my-shop-juniper"
```

...Anyway, I am keeping that old one for reference.

In terms of the setup I'll actually use:

I setup a Dockerfile.server & Dockerfile.worker for the Server.  Both of those containers are mentioned here: https://docs.vendure.io/guides/deployment/using-docker -- the Server for general process handling, the worker for background tasks.  I created an overall project docker-compose file in the monorepo (db, server, storefront) root to be used for local dev work.  It references the Dockerfiles.  Also, the CICD will reference the dockerfiles when it builds them as images, then publishes them to my registry (from there, CICD pulls the images, creates containers from them, injects secrets into them)

We could probably run the project just fine without separate worker & server Dockerfiles, but I like the idea of keeping both of them so it's very very clear how we're building two separate containers for separate purposes. 