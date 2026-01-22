# Guide to Configuring: Vendure.io Containerized CICD Deployment via Github Actions

This project's CICD deployment uses the following secrets.
They must be setup in the repo's secrets.


Set up the following **repository secrets** in the repo.  Be sure that the ones labeled _ENV_FILE use the production, super secret env vars-- not the ones from the default or example env var files.
(example env var files: for local dev on developer's MacOS laptop; default env var files: during CICD these are parsed and set into the project's app container images when they're built and published. Then in a later CICD step, when the containers are built from the images and run-- when they're run, the containers are injected with the secret production env var files)
   - `LINUX_BOTCICDGHA_USERNAME`: Username for SSH access
   - `LINUX_SERVER_IPADDRESS`: IP address of deployment server
   - `POSTGRES__SECRET_ENV_FILE`: environment variables for Database
   - `STOREFRONT__SECRET_ENV_FILE`: environment variables for storefront
   - `SRV_WRK__SECRET_ENV_FILE`: environment variables for vendure server & worker (one file, used for both)
   - `GHPATCICD_RPOWKFLO_WRDPCKGS`: GitHub Personal Access Token with repository, workflow, and package read/write permissions
   - `LINUX_SSH_PRIVATE_KEY_CICD`: SSH key for deployment server access.  See below for steps to set this up.

## Setup of LINUX_SSH_PRIVATE_KEY_CICD

The ssh key for the CICD Bot was already setup in the steps we followed to generate the server with terraform (see the `server011526-debian-ecom` project).  So, the CICD Bot's ssh public key is already on the server.  The private key is on the developer's laptop (and be sure the private key is in 1password too! The public key can be generated from the private key, so the private key is important to keep in 1password and to keep secret)

So, we really just need to upload the private key to the github repo. From there, Github Actions will create a temporary server which interacts with ours to deploy the app containers-- it interacts with out server by ssh-ing into it for the container deployments.