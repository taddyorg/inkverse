import type { CodegenConfig } from '@graphql-codegen/cli';

const serverUrl = process.env.NODE_ENV === 'production' 
  ? "https://api-v2.inkverse.co" 
  : "http://inkverse.test:3010/api/graphql"

const config: CodegenConfig = {
  overwrite: true,
  schema: serverUrl,
  generates: {
    "packages/public/src/graphql/types.ts": {
      config: {
        useIndexSignature: true,
        useTypeImports: true,
        namingConvention: {
          enumValues: 'upper-case#upperCase'
        }
      },
      plugins: ["typescript", "typescript-resolvers"]
    },
  }
};

export default config;