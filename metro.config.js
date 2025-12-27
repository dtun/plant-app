const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const { isDev } = require("./src/utils/env");

const config = getDefaultConfig(__dirname);

// Only add LiveStore devtools in development
if (isDev()) {
  try {
    const { addLiveStoreDevtoolsMiddleware } = require("@livestore/devtools-expo");
    addLiveStoreDevtoolsMiddleware(config, {
      schemaPath: "./src/livestore/schema.ts",
    });
  } catch (error) {
    // Silently fail if devtools can't load (ESM compatibility issues)
    console.warn("LiveStore devtools failed to load:", error.message);
  }
}

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./uniwind-types.d.ts",
});
