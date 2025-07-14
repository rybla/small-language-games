// import eslint from "@eslint/js";
// import tseslint from "typescript-eslint";
// import next from "@next/eslint-plugin-next";

// export default tseslint.config(
//   eslint.configs.recommended,
//   tseslint.configs.recommendedTypeChecked,
//   next.configs.recommendedTypeChecked,
//   {
//     languageOptions: {
//       parserOptions: {
//         projectService: true,
//         tsconfigRootDir: import.meta.dirname,
//       },
//     },
//     plugins: {
//       "@next/next": next,
//     },
//     ignores: ["eslint.config.mjs"],
//   },
// );

import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ["next"],
    settings: {
      next: {
        rootDir: "packages/my-app/",
      },
    },
  }),
];

export default eslintConfig;
