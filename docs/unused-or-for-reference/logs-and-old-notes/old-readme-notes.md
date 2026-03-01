# Old readme notes

These notes are archived as they might be relevant later.  Such as when I look back and wonder "why did I set things up that way?"

### Why project is setup to generate package-lock.json from inside a container, rather than on MacOS dev laptop?

The reason is to ensure the project's dependencies are based on its Linux OS requirements rather than MacOS requirements-- since it's to be run inside docker containers on the server (and locally on MacOS laptop).

Due to how this project is built... When re-building it, you may need to delete node_modules and package-lock.json if doing a docker image re-build.  This is because the project's dockerfiles are setup to run its `npm install` from within the container, rather than within the local OS (macOS developer laptop).  The reason is to keep the dependencies consistent with what will exist on the web server.  If the project is installed from the local OS (macOS) at least one of its dependencies (lightningcss) will be built based on its ARM dependency, rather than Linux x64 dependency and subsequently that will be in noted in the package-lock.json file.
