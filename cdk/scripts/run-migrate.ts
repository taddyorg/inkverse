/**
 * Run the one-off DB migration Fargate task (replaces `copilot task run`).
 *
 * Usage:
 *   npm run migrate
 *
 * Takes no arguments — uses the inkverse-migrate image's default CMD (npm run migrate).
 * Infra identifiers are read from cdk/config.local.ts (see scripts/run.ts).
 */
import { runFargateTask } from './run';

runFargateTask('inkverse-migrate').catch((err) => {
  console.error(err);
  process.exit(1);
});
