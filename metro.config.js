let { getDefaultConfig } = require("expo/metro-config");
let { withUniwindConfig } = require("uniwind/metro");
let { isDev } = require("./src/utils/env");

let config = getDefaultConfig(__dirname);

// Only add LiveStore devtools in development
if (isDev()) {
  try {
    let { addLiveStoreDevtoolsMiddleware } = require("@livestore/devtools-expo");
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
