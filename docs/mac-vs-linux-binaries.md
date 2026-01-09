# Mac M2 (ARM) binaries vs Containers' Linux binaries.



If you're on a Mac, and you installed this project locally (as I did, prior to containerizing it)...

Then your Mac's node_modules has Mac-compiled native binaries:

lightningcss.darwin-arm64.node (Mac)

But the Storefront container needs Linux binaries:

lightningcss.linux-arm64-gnu.node (Linux)

Otherwise you'll get this error:

```
Error: Cannot find module '../lightningcss.linux-arm64-gnu.node'
```

So... if that's the case, then your node_modules were mounted from your host (mac computer) into the container-- after they were installed on the mac.

So, the solution is: simply delete the node_modules directories (there should be one in /server and one in /storefront).   As a result, you may see red squiggly lines in your editor in certain files such as vite.config.mts -- this is because it's trying to reference node_module files that no longer exist.  But don't worry-- they get installed into the container, and that's all that matters, because for this project, we're running it entirely via docker.  In both Dev environment (on laptop) and in prod (deployed via CICD).

Keep the package-lock files though, to lock exact versions of dependencies.  Otherwise you might run into discrepencies in dependencies versions' later.
