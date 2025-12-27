let { getDefaultConfig } = require("expo/metro-config");
let { withUniwindConfig } = require("uniwind/metro");
let { isDev } = require("./src/utils/env");

let config = getDefaultConfig(__dirname);

if (isDev()) {
  try {
    let { addLiveStoreDevtoolsMiddleware } = require("@livestore/devtools-expo");
    addLiveStoreDevtoolsMiddleware(config, {
      schemaPath: "./src/livestore/schema.ts",
    });
  } catch (error) {
    console.warn("LiveStore devtools failed to load:", error.message);
  }
}

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./uniwind-types.d.ts",
});
