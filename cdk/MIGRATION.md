# Copilot → CDK Cutover Runbook

AWS Copilot is deprecated; Inkverse is migrating its deployment from `copilot/` to the CDK app in `cdk/`. The CDK app is code-complete and audited for parity with Copilot, but the migration has not been executed — every stack imports live Copilot resource IDs (VPC, ALB, cluster, env security group) and the RDS instance is still owned by the Copilot `api` addon stack.

Phases are ordered lowest-risk-first. Each is independently deployable; Copilot keeps running until each workload is individually cut over.

## Phase 0 — Preflight

0. **Free disk space first.** Synth stages a copy of the Docker build context into `cdk/cdk.out` for each image asset (~10 of them, ~1.4 GB total). A 2026-07-17 synth attempt failed on a nearly-full disk. `.dockerignore` is verified correct (excludes `node_modules`, `.git`, `cdk`, `copilot`, build outputs) — just budget a few GB free, and `rm -rf cdk/cdk.out` between runs if space gets tight.
1. `cd cdk && npm run build && npx cdk synth` — ✅ verified 2026-07-17: all 11 stacks synth clean. (Benign warnings about `subnet-08ec715c2f45124c0` missing a `routeTableId` — artifact of importing the Copilot VPC by ID; nothing reads `routeTable`.)
2. Verify `config.local.ts` values against live stacks (the `aws cloudformation describe-stacks` commands are in `config.example.ts`).
3. `npx cdk bootstrap aws://253384754083/us-west-2` (if not already done).
4. **Check ALB listener rule priorities**: `aws elbv2 describe-rules --listener-arn <albListenerArn>` — confirm Copilot's existing rules don't occupy priorities 10 or 100 (CDK's chosen priorities). If they collide, adjust the CDK priorities in `bin/inkverse.ts` before deploying.

## Phase 1 — Adopt RDS (the only stateful/risky step)

1. Confirm the live Copilot addon stack has Retain on all RDS resources (it does in the template; verify deployed version matches).
2. Detach from Copilot: remove `copilot/api/addons/rds.yml` **only** (keep `sespermissions.yml` / `sqspermissions.yml`) and `copilot svc deploy api`. Retain policies orphan the DB, SG, subnet group, param group, and the `DATABASE_ENDPOINT` SSM param rather than deleting them.
3. `npx cdk import InkverseDataStack` — adopt all 6 resources.
4. `npx cdk diff InkverseDataStack` — **must show zero changes** before proceeding. DB has `DeletionProtection: true` as a backstop.

## Phase 2 — Ad-hoc tasks (zero risk, validates the whole pipeline)

1. `npx cdk deploy InkverseMigrateTask InkverseAdHocTask`.
2. Smoke-test: `npm run task -- <some-read-only-script>` — proves image builds, secrets injection, networking, and DB connectivity end-to-end without touching production traffic.

## Phase 3 — Scheduled jobs (5 stacks)

For each job: `npx cdk deploy <stack>` then immediately `copilot job delete <name>` to avoid double-runs. Do them one at a time, timed away from that job's cron window (all UTC — digest 14:05 daily, sitemap 01:00 daily, delete-old 16:25 daily, refresh-tokens Mon 06:00, audit-images Sun 06:00). Verify each job's next scheduled run succeeds via its `/inkverse/<name>` log group.

## Phase 4 — Worker

1. `npx cdk deploy InkverseWorkerHighPriority`. Brief overlap with the Copilot worker is safe (SQS handles concurrent consumers).
2. Verify the new task is consuming (log group `/inkverse/worker-high-priority`, queue depth stable). Note: first arm64 run in production — watch logs for a full processing cycle.
3. `copilot svc delete worker-high-priority`.

## Phase 5 — Web services (traffic cutover)

1. `npx cdk deploy InkverseApi InkverseWebsite`. New target groups register on the shared ALB listener at priorities 10/100, behind or alongside Copilot's rules per the Phase 0 priority check.
2. Verify both CDK target groups report healthy targets.
3. Cut over: ensure CDK rules win priority (adjust rule priority if needed), verify `inkverse.co` and `/api` behavior through Cloudflare, watch Sentry.
4. `copilot svc delete api` and `copilot svc delete website` (this also removes Copilot's listener rules and the api's SES/SQS addon policies — CDK task roles carry their own).

## Phase 6 — Decommission

1. Delete any leftover Copilot service/job stacks. **Do NOT run `copilot app delete` or `copilot env delete`** — CDK permanently imports the env stack's VPC, ALB, cluster, and environment security group, and all secrets stay at the `/copilot/inkverse/prod/secrets/` SSM path.
2. Remove the `copilot/` directory from the repo; keep `Dockerfile-*` files (CDK builds from them).

## Verification

- Per phase, as embedded above (cdk diff zero on import; ad-hoc task run; job log groups; queue consumption; target group health + live-site checks).
- End state: `npx cdk diff` across all stacks shows no drift; `copilot svc ls` / `job ls` empty; site, API, worker, and one full day of cron jobs verified via CloudWatch logs and Sentry.

## Follow-ups (out of scope for the migration)

- Enable FARGATE_SPOT for the worker (`capacity: 'spot'` in `bin/inkverse.ts`).
- Consider autoscaling / CloudWatch alarms (neither existed under Copilot).
- Periodic `npm run gc` to prune old images from the bootstrap ECR repo.
