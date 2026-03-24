import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: { globals: globals.node },
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      {
        ignores: ["node_modules", "dist", "build"],
      },
      prettier, // turn off ESLint rules conflicting with Prettier
    ],
  },
]);
