import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

let __filename = fileURLToPath(import.meta.url);
let __dirname = dirname(__filename);

let compat = new FlatCompat({
  baseDirectory: __dirname,
});

let eslintConfig = [...compat.extends("next/core-web-vitals")];

export default eslintConfig;
