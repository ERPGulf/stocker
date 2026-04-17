// Load .env into process.env at build time
import "dotenv/config";

export default {
  expo: {
    name: "stocker",
    slug: "stocker",
    version: "1.0.0",
    newArchEnabled: true,
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: "00b3ee89-7a73-4ee5-9dde-43b99ec4b2e0",
      },
    },
  },
};
