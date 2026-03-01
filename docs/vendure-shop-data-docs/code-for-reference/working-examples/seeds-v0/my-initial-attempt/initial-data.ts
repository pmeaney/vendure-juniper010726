import { LanguageCode } from "@vendure/common/lib/generated-types";
import { InitialData } from "@vendure/core";

export const initialData: InitialData = {
  defaultLanguage: LanguageCode.en,
  defaultZone: "North America",
  countries: [
    { code: "US", name: "United States", zone: "North America" },
    { code: "MX", name: "Mexico", zone: "North America" },
  ],
  taxRates: [
    { name: "Texas", percentage: 8.25 },
    { name: "Standard", percentage: 0 },
  ],
  shippingMethods: [{ name: "Standard Shipping", price: 12500 }],
  paymentMethods: [],
  collections: [
    {
      name: "Guitars",
      slug: "guitars",
      description: "Handmade classical and flamenco guitars",
    },
    {
      name: "Classical",
      slug: "classical-guitars",
      parentName: "Guitars",
      filters: [
        {
          code: "facet-value-filter",
          args: { facetValueNames: ["Classical"], containsAny: false },
        },
      ],
    },
    {
      name: "Flamenco",
      slug: "flamenco-guitars",
      parentName: "Guitars",
      filters: [
        {
          code: "facet-value-filter",
          args: { facetValueNames: ["Flamenco"], containsAny: false },
        },
      ],
    },
  ],
};
