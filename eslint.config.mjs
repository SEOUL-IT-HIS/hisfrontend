import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      /**
       * 밑줄(_)로 시작하는 인자/변수는 "일부러 안 쓴다"는 표시로 보고 검사에서 제외한다.
       *
       * Redux slice 의 Request 리듀서가 대표적인 경우다.
       * payload 타입을 선언하려면 인자가 있어야 하지만(dispatch 할 때 타입 검사용),
       * 리듀서는 loading 만 켜고 payload 는 saga 가 쓰기 때문에 여기서는 쓸 일이 없다.
       *   fetchEmpDetailRequest(state, _action: PayloadAction<string>) { state.loading = true; }
       */
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
