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
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Prebundle every client dep eagerly. Lazy discovery on first visit to a
    // route re-optimizes mid-session and can leave the browser with two React
    // copies (mixed ?v= hashes) → "Cannot read properties of null (useContext)".
    include: [
      'react',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom',
      'react-dom/client',
      'react-router',
      'react-router/dom',
      'react-router-dom',
      '@apollo/client',
      '@apollo/client/errors',
      '@apollo/client/link/context',
      '@apollo/client/link/error',
      '@apollo/client/react',
      'graphql-tag',
      '@react-oauth/google',
      'react-apple-signin-auth',
      'axios',
      'date-fns',
      'dompurify',
      'jwt-decode',
      'lodash-es',
      'mitt',
      'posthog-js',
      'react-icons/bs',
      'react-icons/fa',
      'react-icons/hi2',
      'react-icons/io5',
      'react-icons/md',
      'react-icons/pi',
      'react-notion-x',
      'react-notion-x/build/third-party/code',
    ],
  },
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