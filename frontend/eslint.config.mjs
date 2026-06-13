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
  // shadcn/ui ships generated, vendored components that intentionally use
  // patterns our authored-code rules reject (loose Recharts typing in the chart
  // component, a Math.random() skeleton width in the sidebar). Relax only those
  // rules for the generated files so they aren't hand-maintained against rules
  // they were never written for — authored code stays fully linted.
  {
    files: ["components/ui/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/purity": "off",
    },
  },
  {
    // shadcn dashboard block: forces the mobile time range via an effect.
    files: ["components/chart-area-interactive.tsx"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
