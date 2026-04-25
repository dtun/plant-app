import { defineConfig } from "@lingui/cli";

export default defineConfig({
  sourceLocale: "en",
  locales: ["en", "es"],
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["app", "components", "contexts", "src", "utils"],
    },
  ],
});
