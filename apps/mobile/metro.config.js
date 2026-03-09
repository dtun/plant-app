let { getDefaultConfig } = require("expo/metro-config");
let { withUniwindConfig } = require("uniwind/metro");
let path = require("path");

let projectRoot = __dirname;
let monorepoRoot = path.resolve(projectRoot, "../..");

let config = getDefaultConfig(projectRoot);

// Monorepo: watch root for shared packages
config.watchFolders = [monorepoRoot];

// Monorepo: resolve node_modules from both app and root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

config.resolver.sourceExts = [...(config.resolver?.sourceExts ?? []), "po", "pot"];
config.transformer.babelTransformerPath = require.resolve("@lingui/metro-transformer/expo");

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
