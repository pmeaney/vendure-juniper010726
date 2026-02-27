import { bootstrap } from "@vendure/core";
import { populate } from "@vendure/core/cli";
import path from "path";
import { config } from "../vendure-config";
import { initialData } from "./initial-data";

const productsCsvPath = path.join(__dirname, "./seed/products.csv");

populate(() => bootstrap(config), initialData, productsCsvPath)
  .then(() => {
    console.log("Seeding complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
