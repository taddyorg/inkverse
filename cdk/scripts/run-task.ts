/**
 * Run a one-off ad-hoc Fargate task (replaces `copilot task run`).
 *
 * Usage:
 *   npm run task -- generate-creator-links
 *   npm run task -- some-script arg1 --flag value   # extra params are forwarded
 *
 * Pass any worker npm script name; it's injected as a command override on the
 * inkverse-adhoc task. Any args after the script name are forwarded to it via
 * npm's `--` separator (so the worker runs `npm run <script> -- <args>`).
 * Infra identifiers are read from cdk/config.local.ts (see scripts/run.ts). To
 * give ad-hoc runs a new secret, add it to ADHOC_SECRETS in lib/secrets.ts and
 * `npx cdk deploy InkverseAdHocTask`.
 */
import { runFargateTask } from './run';

const [npmScript, ...scriptArgs] = process.argv.slice(2);
if (!npmScript) {
  console.error('usage: npm run task -- <npm-script> [args...]');
  process.exit(1);
}

const command = scriptArgs.length
  ? ['npm', 'run', npmScript, '--', ...scriptArgs]
  : ['npm', 'run', npmScript];

runFargateTask('inkverse-adhoc', command).catch((err) => {
  console.error(err);
  process.exit(1);
});
