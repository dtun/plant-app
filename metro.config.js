const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const { addLiveStoreDevtoolsMiddleware } = require("@livestore/devtools-expo");

const config = getDefaultConfig(__dirname);

// Add LiveStore devtools middleware before uniwind
addLiveStoreDevtoolsMiddleware(config, {
  schemaPath: "./src/livestore/schema.ts",
});

module.exports = withUniwindConfig(config, {
  cssEntryFile: "./global.css",
  dtsFile: "./uniwind-types.d.ts",
});
