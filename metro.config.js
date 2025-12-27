let { getDefaultConfig } = require("expo/metro-config");
let { withUniwindConfig } = require("uniwind/metro");

let config = getDefaultConfig(__dirname);

// Only add LiveStore devtools in development
if (process.env.NODE_ENV !== "production") {
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
