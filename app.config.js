// Load .env into process.env at build time
import 'dotenv/config';

// Reuse existing app.json config to avoid duplication
import appJson from './app.json';

export default {
  ...appJson,
  expo: {
    ...(appJson.expo || {}),
    android: {
      package: "com.hibarineesh.stocker"
    },
    ios: {
      bundleIdentifier: "com.hibarineesh.stocker"
    },
    extra: {
      eas: {
        projectId: "00b3ee89-7a73-4ee5-9dde-43b99ec4b2e0"
      }
    }
  }
};
