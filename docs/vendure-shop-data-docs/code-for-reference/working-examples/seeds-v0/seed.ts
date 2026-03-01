// import { bootstrap } from "@vendure/core";
import { bootstrap, DefaultLogger, LogLevel } from "@vendure/core";
import { populate } from "@vendure/core/cli";
import path from "path";
import { config } from "../vendure-config";
import { initialData } from "./initial-data";

const populateConfig = {
  ...config,
  apiOptions: {
    ...config.apiOptions,
    port: 3099,
  },
  logger: new DefaultLogger({ level: LogLevel.Verbose }),
};

const productsCsvFile = path.join(__dirname, "products.csv");

populate(
  () => bootstrap(populateConfig),
  initialData,
  productsCsvFile,
  // "my-channel-token", // optional - used to assign imported
) // entities to the specified Channel
  .then((app) => {
    return app.close();
  })
  .then(
    () => process.exit(0),
    (err) => {
      console.log(err);
      process.exit(1);
    },
  );
