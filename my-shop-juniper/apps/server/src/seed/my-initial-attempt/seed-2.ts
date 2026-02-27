// import { bootstrap } from "@vendure/core";
import { bootstrap, DefaultLogger, LogLevel } from "@vendure/core";
import { populate } from "@vendure/core/cli";
import path from "path";
import { config } from "../vendure-config";
import { initialData } from "./initial-data";

// const productsCsvPath = path.join(__dirname, "products.csv");
// console.log("CSV path:", productsCsvPath);

// populate(() => bootstrap(seedConfig), initialData, productsCsvPath)
//   .then(() => {
//     console.log("Seeding complete.");
//     process.exit(0);
//   })
//   .catch((err) => {
//     console.error("Seeding failed:", err);
//     process.exit(1);
//   });

// const populateConfig = {
//   ...config,
//   plugins: (config.plugins || []).filter(
//     // Remove your JobQueuePlugin during populating to avoid
//     // generating lots of unnecessary jobs as the Collections get created.
//     (plugin) => plugin !== DefaultJobQueuePlugin,
//   ),
// };

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
