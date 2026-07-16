import { reactRouter } from "@react-router/dev/vite";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  plugins: [reactRouter(), tsconfigPaths()],
  publicDir: 'assets',
  build: {
    // Never inline font subsets as data URIs — each script's subset must stay
    // a separate file so browsers fetch it on demand via unicode-range.
    assetsInlineLimit: (filePath) => (filePath.endsWith('.woff2') ? false : undefined),
  },
  server: {
    host: 'inkverse.test',
    port: 8082,
  },
});