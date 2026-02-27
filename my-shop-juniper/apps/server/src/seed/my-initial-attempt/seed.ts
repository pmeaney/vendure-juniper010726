// import { bootstrap } from "@vendure/core";
import { bootstrap, DefaultLogger, LogLevel } from "@vendure/core";
import { populate } from "@vendure/core/cli";
import path from "path";
import { config } from "../vendure-config";
import { initialData } from "./initial-data";

const seedConfig = {
  ...config,
  apiOptions: {
    ...config.apiOptions,
    port: 3099,
  },
  logger: new DefaultLogger({ level: LogLevel.Verbose }),
};

const productsCsvPath = path.join(__dirname, "products.csv");
console.log("CSV path:", productsCsvPath);

const importAssetsDir = path.join(__dirname, "assets");

populate(
  () => bootstrap(seedConfig),
  initialData,
  productsCsvPath,
  importAssetsDir,
)
  .then(() => {
    console.log("Seeding complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });

// populate(() => bootstrap(seedConfig), initialData, productsCsvPath)
//   .then(() => {
//     console.log("Seeding complete.");
//     process.exit(0);
//   })
//   .catch((err) => {
//     console.error("Seeding failed:", err);
//     process.exit(1);
//   });
