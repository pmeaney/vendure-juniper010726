# Advantages of Fully Containerized Development


[Question]: What would you say would be any advantages of running your server code from inside docker locally?

[Response]:

From:

- Patrick Meaney / Discord: BioByte01
- patrick.wm.meaney@gmail.com
- https://github.com/pmeaney/

Great question!

TLDR of the advantages of containerizing the app for use with all environments (Local Dev & Testing, Remote Prod, Remote Testing):
- It's easy to startup for a new-to-the-team developer
- Environment-agnostic
- Isolated
- Reproducible
- Portable (more conducive to business exit-- that is, for the business using the framework to sell it onward to the new buyer, as a portable package)

# Advantages in detail:

## 1. Production <-> Dev environment parity.

### A. Both will run in the same OS (the container's Linux OS), use the same NodeJS version, the same DB version-- same everything.

### B. This helps catch production issues early as well
For example, I hit a lightningcss binary issue: initially, I installed on my MacOS. npm, sensing an ARM Mac OS, installed `lightningcss-darwin-arm64`, but the container's Linux OS was looking for `lightningcss-linux-arm64-gnu`-- causing an error.

**Solution:** Install the project from inside container on first startup, via conditional if statement in the Dockerfile (see [line 19](https://github.com/pmeaney/vendure-juniper010725/blob/main/my-shop-juniper/apps/storefront/Dockerfile.storefront#L19))

### C. My Engineering team at CDK Global ran into a big problem with our 15-year old ruby-based software
For context: at my most recent company, CDK Global, which makes Auto Dealership Software (for Sales, Operations HR, and Managing Communications with Manufacturers), I joined as a Full Stack Dev & Later transitioned to DevOps

It was difficult to onboard new developers into setting up the company's software product ready to start programming on.
This is because the devs had to install several different dependencies, and in certain ways. 
And the installation step's documentation lagged behind newest versions of the various dependencies.
A big part of this main point is due to it being a 15 year old Ruby on Rails app, with some expired and abandon-ware dependencies.

There was no simple turn-key command to allow a new developer joining the team to easily start-up the app and begin working on it. By keeping things containerized, the application is packaged up and runs on just one OS.

All nuts & bolts are included, and it can be started with just one command. That one command installs all dependencies-- of the various applications: serverside, clientside, database, and operating system. The app is decoupled from and irrespective of the host OS, making it more portable, and more easy to setup for a new developer joining the team in developing the business application:

```bash
docker compose up 
# or, if using a filename other than docker-compose.yml, such as I do, for specificity:
docker compose -f docker-compose.local.yml up
```

Not like we faced at CDK Global: "Go to the confluence page. Follow the 10+ steps. If the steps need updating, update the doc. Let us know if you can get it all installed. If you can get it installed, start it up.  Next try to log in and see if it works."  At every step, a typical new developer faced errors.  It typically took a new developer a few days to get it working, interspersed with other onboarding work.  They usually had to ping other developers for help, simply to get it installed.

But there were inevitably errors during install, startup, and initial attempts to get the development environment up and running. The whole process of getting the application installed & running was a significant distraction and an unnecessary series of steps, creating an obstacle for new developers. Which is why the leadership had my colleague work for about 3 months to dockerize the company's corporate application-- which over 15 years had grown into a $25 million dollar product.

## 2. The same goes for Testing Environments
Exact parity with Dev & Prod. As a result, it's also easy to quickly deploy the app to Testing server, in order to supply it with Test data, Run the app, and run tests against the mock (test) data.

## 3. Clean isolation
No need for global npm packages, no conflict with other projects' npm or node versions, no need to juggle multiple npm or node versions on the developer's laptop.

## 4. Reproducibility
The Dockerfile is itself documentation of what the application needs to run. The Docker-compose.yml also documents the whole app's overall ecosystem setup regarding what is needed locally. Both items are committed to version control, making it easy to see what is needed for Prod and what is needed for Dev.

Need a new server? Need a new laptop? No worries-- it's easy to boot it back up no matter the environment and bam-- you can quickly get to work.

## 5. Transferring the company to a new owner

Some of my projects are for commercial purposes-- such as my use case for using Vendure: To create a company which sells products in its e-commerce store.

Transferring the application is more simple and more sellable, if it's packaged.

If I ever sell the company, I don't want to say:

"Here are the dependencies you'll need to install." or "Here are the instuctructions to get the app up and running".

I'd rather say:

"Running the app is easy-- just run this one command. Deploying it is also easy-- the deployment app is fully packaged up and is the same as what gets built locally."


## Conclusion:

Ultimately, I'm pretty fastidious.

I like knowing that the project is the exact same, regardless of if the environment is local dev, remote prod, or remote testing. 
And that it's easy to startup for a new-to-the-team developer, environment-agnostic, isolated, reproducible, portable.

Plus, I saw a how much of a horror show local installation and local hosting can be, for a developer to begin development work at a new company, when a project grows in size and isn't fully containerized for all environments. 

As a result, I typically containerize all my applications from the beginning.