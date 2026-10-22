/**
 * Production server for the website.
 *
 * Mirrors `react-router-serve` (compression, immutable /assets, static
 * build/client, morgan, React Router request handler) and adds one thing the
 * stock server cannot do: serve `/.well-known/*` from `build/client/.well-known`.
 * Express's static handler ignores dotfile path segments by default, so the
 * directory is mounted explicitly. The extensionless
 * `apple-app-site-association` file gets its `application/json` content type
 * here because nothing can infer it from the file name.
 *
 * Run with `yarn start` after `yarn build`. `yarn dev` uses Vite and does not
 * serve `/.well-known/*`.
 */

import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createRequestHandler } from "@react-router/express";
import compression from "compression";
import express from "express";
import morgan from "morgan";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.join(rootDir, "build", "client");
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const build = await import("./build/server/index.js");

const app = express();
app.disable("x-powered-by");
app.use(compression());

// Hashed, immutable build output.
app.use(
  "/assets",
  express.static(path.join(clientDir, "assets"), { immutable: true, maxAge: "1y" })
);

// Apple Universal Links / Android App Links / security.txt.
app.use(
  "/.well-known",
  express.static(path.join(clientDir, ".well-known"), {
    maxAge: "1h",
    setHeaders(res, filePath) {
      if (path.basename(filePath) === "apple-app-site-association") {
        res.setHeader("Content-Type", "application/json");
      }
    },
  })
);

// Everything else copied from `assets/` (robots.txt, sitemap.xml, favicons…).
app.use(express.static(clientDir));

app.use(morgan("tiny"));

app.all("*", createRequestHandler({ build, mode: process.env.NODE_ENV }));

function onListen() {
  const address =
    process.env.HOST ||
    Object.values(os.networkInterfaces())
      .flat()
      .find((ip) => String(ip?.family).includes("4") && !ip?.internal)?.address;

  if (!address) {
    console.log(`[website] http://localhost:${port}`);
  } else {
    console.log(`[website] http://localhost:${port} (http://${address}:${port})`);
  }
}

const server = process.env.HOST
  ? app.listen(port, process.env.HOST, onListen)
  : app.listen(port, onListen);

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.once(signal, () => server.close(console.error));
}
