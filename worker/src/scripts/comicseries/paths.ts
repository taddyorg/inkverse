import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// worker/src/scripts/comicseries -> repo root
export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const WORKER_ROOT = path.join(REPO_ROOT, 'worker');

// worker/input and worker/output are gitignored (see worker/.gitignore)
export const DEFAULT_EXPORT_PATH = path.join(WORKER_ROOT, 'output', 'comicseries-taglines.csv');
export const DEFAULT_IMPORT_PATH = path.join(WORKER_ROOT, 'input', 'comicseries-taglines.csv');

// `yarn workspace worker ...` runs with worker/ as cwd no matter where yarn was invoked,
// so a relative output path is taken from the repo root (e.g. worker/output/foo.csv)
export function resolveOutputPath(arg: string | undefined): string {
  if (!arg) { return DEFAULT_EXPORT_PATH; }
  return path.isAbsolute(arg) ? arg : path.resolve(REPO_ROOT, arg);
}

// For an input file, accept a path relative to cwd (worker/) or to the repo root
export function resolveInputPath(arg: string | undefined): string {
  if (!arg) { return DEFAULT_IMPORT_PATH; }
  const candidates = path.isAbsolute(arg) ? [arg] : [path.resolve(process.cwd(), arg), path.resolve(REPO_ROOT, arg)];
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0]!;
}
