import { bootstrap, runMigrations } from "@vendure/core";
import { config } from "./vendure-config";

runMigrations(config)
  .then(() => bootstrap(config))
  .then((app) => {
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  })
  .catch((err) => {
    console.log(err);
  });
