// Load .env into process.env at build time
import 'dotenv/config';

// Reuse existing app.json config to avoid duplication
import appJson from './app.json';

export default {
  // Spread your existing Expo config
  ...appJson,
  // Ensure we export an object with an `expo` key as expected by Expo
  expo: {
    ...(appJson.expo || {}),
    "android": {
      "package": "com.hibarineesh.stocker"
    },
  },
  
};
