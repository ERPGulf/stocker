// Load .env into process.env at build time
import "dotenv/config";

export default {
  expo: {
    name: "stocker",
    slug: "stocker",
    owner: "erpgulf",
    version: "1.0.0",
    newArchEnabled: true,
    android: {
      package: "com.bazim.stocker",
    },
    ios: {
      bundleIdentifier: "com.bazim.stocker",
    },
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
        projectId: "df51e535-ffab-4f5f-a6b8-b65d1ec0091f",
      },
    },
  },
};
