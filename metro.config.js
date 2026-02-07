let { getDefaultConfig } = require("expo/metro-config");
let { withUniwindConfig } = require("uniwind/metro");

let config = getDefaultConfig(__dirname);

// Exclude test files from the bundle so test-only dependencies
// (e.g. @testing-library/react-native) don't get resolved at runtime
config.resolver.blockList = [/\.test\.[jt]sx?$/];

// Only add LiveStore devtools in development (not in production or EAS builds)
if (process.env.NODE_ENV !== "production" && !process.env.EAS_BUILD) {
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
