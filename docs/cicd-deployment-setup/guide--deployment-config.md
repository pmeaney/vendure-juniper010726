# Guide to Configuring: Vendure.io Containerized CICD Deployment via Github Actions

This guide currently covers the **initial prototype** production deployment.

After I get this initial deployment done and explore how to configure vendure for my use case, I'll then review in further detail documentation including:
- https://docs.vendure.io/guides/deployment/production-configuration/
- https://docs.vendure.io/guides/developer-guide/security


## Don't forget-- once Deployment is working... place the Nginx Proxy Manager into the project's container network.


My containerized instance of nginx proxy manager creates its own network `nginx-proxy-mgr-011526` for nginx proxy manager to connect to its own postgres db.  However, I placed my vendure project's containers into a network called `vendure-network`. So, the two groups are isolated.  However, we need nginx to send traffic to our vendure project.  So, we'll connect nginx to our vendure container network with:

`docker network connect vendure-network nginx-proxy-mgr-011526`

Then, log into nginx proxy manager and it send traffic to our frontend app at `vendure-storefront:3001`.

## CICD Setup for Github Actions

This project's CICD deployment uses the following secrets.
They must be setup in the repo's secrets.

Set up the following **repository secrets** in the repo.  Be sure that the ones labeled _ENV_FILE use the production, super secret env vars-- not the ones from the default or example env var files.
(example env var files: for local dev on developer's MacOS laptop; default env var files: during CICD these are parsed and set into the project's app container images when they're built and published. Then in a later CICD step, when the containers are built from the images and run-- when they're run, the containers are injected with the secret production env var files)

#### Regarding the Env Var files

- **Initially**, when testing out all the secrets work-- Just copy in the example env vars for each of these _ENV_FILE repo secrets
- Later, **after verifying with a test CICD workflow that all the secrets show up**... Overwrite these _ENV_FILE items' values with the real for the production secrets.  And be sure they use scrambled passwords-- and be sure to copy the production ones into 1pass

### Secrets to upload

   - `POSTGRES__SECRET_ENV_FILE`: environment variables for Database  
     - Be sure to setup a unique password in the prod env var file
   - `STOREFRONT__SECRET_ENV_FILE`: environment variables for storefront.  
     - Be sure to check out the `.env.local.storefront.example-guided` file-- because you'll want to generate a unique REVALIDATION_SECRET via the command `openssl rand -base64 32` for the prod secret.
   - `SRV_WRK__SECRET_ENV_FILE`: environment variables for vendure server & worker (one file, used for both)
     - Be sure to set new, unique values for SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD, and that the DB_ items match the ones from the `POSTGRES__SECRET_ENV_FILE`.  And set APP_ENV to 'prod' instead of 'dev'.  For more info: https://docs.vendure.io/guides/deployment/production-configuration/ (note the use of 'prod' as the env name, in the info regarding the hardening plugin-- which is why I assume it should be 'prod' and not 'production'.)
   - `LINUX_BOTCICDGHA_USERNAME`: Username for SSH access
   - `LINUX_SERVER_IPADDRESS`: IP address of deployment server
   - `GHPATCICD_VendureRepo_010726`: GitHub Personal Access Token with repository, workflow, and package read/write permissions.  (Workflow-- because we'll have a Main workflow and subworkflows.  Main workflow will output values from the subworkflows into a CICD summary screen.  The Main workflow basically orchestrates its sub workflows)
   - `LINUX_SSH_PRIVATE_KEY_CICD`: SSH key for deployment server access.  See below for steps to set this up.

## Setup of LINUX_SSH_PRIVATE_KEY_CICD

The ssh key for the CICD Bot was already setup in the steps we followed to generate the server with terraform (see the `server011526-debian-ecom` project).  So, the CICD Bot's ssh public key is already on the server.  The private key is on the developer's laptop (and be sure the private key is in 1password too! The public key can be generated from the private key, so the private key is important to keep in 1password and to keep secret)

So, we really just need to upload the private key to the github repo. From there, Github Actions will create a temporary server which interacts with ours to deploy the app containers-- it interacts with out server by ssh-ing into it for the container deployments.