import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Ilova o'zbek tilida — matnda apostrof (' ) hamma joyda uchraydi
      // (O'zbek, bo'lim, so'rov ...). Bu qoida shu loyihada faqat shovqin.
      "react/no-unescaped-entities": "off",
      // Sahifalarda Google Fonts <link> ataylab ishlatiladi — ogohlantirish darajasi.
      "@next/next/no-page-custom-font": "warn",
      // React 19 compiler qoidasi: mount paytida fetch+setState keng tarqalgan
      // namuna; xato emas, ogohlantirish sifatida qoldiramiz.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
