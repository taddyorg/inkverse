# Inkverse Infrastructure (AWS CDK)

CDK app that replaces AWS Copilot (which AWS is
[sunsetting](https://aws.amazon.com/blogs/containers/announcing-the-end-of-support-for-the-aws-copilot-cli/)).

**Middle path:** the Copilot-generated **env stack** (VPC, subnets, ALB + HTTP listener,
ECS cluster, the shared `EnvironmentSecurityGroup`) is **imported, never managed** here.
This app owns the **compute layer** (web services, worker, scheduled jobs, one-off tasks)
and, after a one-time `cdk import`, the **RDS data layer**.

## Layout

```
cdk/
  bin/inkverse.ts                 # all stacks wired here
  lib/
    config.ts                     # InkverseConfig interface + loader (env > config.local.ts)
    env-imports.ts                # imports VPC/cluster/SG/listener + secret() helper
    secrets.ts                    # per-service SSM secret name lists
    data-stack.ts                 # InkverseDataStack: L1 mirror of rds.yml (for cdk import)
    stacks.ts                     # one Stack per compute unit
    constructs/
      common.ts                   # container + IAM (SQS/SES) helpers
      web-service.ts              # ALB-attached Fargate service (api, website)
      worker-service.ts           # no-LB Fargate service (worker-high-priority)
      scheduled-job.ts            # EventBridge -> RunTask cron job
      ad-hoc-task.ts              # migrate / ad-hoc task defs
  scripts/
    run.ts                        # shared: reads infra ids from config.local.ts, starts a Fargate task
    run-migrate.ts                # run the DB migration task (replaces `copilot task run`)
    run-task.ts                   # run an ad-hoc worker npm script (replaces `copilot task run`)
  config.example.ts               # template -> copy to config.local.ts (gitignored)
```

## Setup

```bash
cd cdk
npm install
cp config.example.ts config.local.ts   # then fill in real IDs (see below)
```

`config.local.ts` is gitignored — it holds infra identifiers, which must not be committed
(this is an open-source repo). Produce the values with:

## One-time migration runbook

Do this once, in order. The env stack, ALB, DNS, and RDS data are never moved.

1. **Bootstrap CDK** (creates the `CDKToolkit` stack: assets bucket, assets ECR repo, roles):
   ```bash
   npx cdk bootstrap aws://<account>/us-west-2
   ```

2. **Detach RDS from Copilot** so deleting the api service can't cascade into the database.
   `copilot/api/addons/rds.yml` already has `DeletionPolicy: Retain` +
   `UpdateReplacePolicy: Retain` on the DB resources — deploy that once via the still-working
   CLI (`copilot svc deploy --name api`), or apply the addon stack update directly. After this,
   deleting the api stack retains the instance, its security group, and the `DATABASE_ENDPOINT`
   SSM param.

3. **Adopt the existing RDS into `InkverseDataStack`** (no recreation, no downtime). Once the
   DB resources are orphaned/alive:
   ```bash
   npx cdk import InkverseDataStack     # supply the physical ids when prompted
   npx cdk diff   InkverseDataStack     # MUST show zero changes
   ```
   If the diff wants to Modify/Replace anything, the L1 props in `data-stack.ts` don't match the
   live resource yet — fix before deploying.

4. **Stand up compute alongside Copilot, then cut over per service.** For each web service:
   ```bash
   npx cdk deploy InkverseApi           # new service + target group + listener rule (priority 10/100)
   ```
   Verify health in the new target group, then flip traffic (the new rule's priority vs Copilot's),
   then `copilot svc delete` the old service. Deploy `InkverseWebsite` the same way.
   For the worker: stop the old Copilot worker first, then `npx cdk deploy InkverseWorkerHighPriority`.
   For jobs: `npx cdk deploy` each, confirm a manual run, then delete the Copilot job.

5. **Decommission.** After all services are on CDK and verified, delete the remaining Copilot
   service stacks, then the Copilot app-level StackSet. Keep the env stack. Remove `copilot/`.

## Day-to-day commands

`CLUSTER` = the imported ECS cluster name. The one-off task scripts (`run-migrate.ts`,
`run-task.ts`) read the cluster, private subnets, and EnvironmentSecurityGroup straight from
`config.local.ts` — nothing to export.

```bash
# Deploy / preview                                  (was: copilot svc deploy)
npx cdk diff  InkverseApi
npx cdk deploy InkverseApi
npx cdk deploy --all
npx cdk deploy InkverseDataStack          # DB config change — confirm "Modify" not "Replace"

# Logs                                              (was: copilot svc logs)
aws logs tail /inkverse/api --follow

# Exec into a container                             (was: copilot svc exec)
TASK=$(aws ecs list-tasks --cluster "$CLUSTER" --service-name worker-high-priority \
  --query 'taskArns[0]' --output text)
aws ecs execute-command --cluster "$CLUSTER" --task "$TASK" --container app \
  --interactive --command "/bin/sh"

# Turn a service off / on (no delete)
aws ecs update-service --cluster "$CLUSTER" --service <svc> --desired-count 0
aws ecs update-service --cluster "$CLUSTER" --service <svc> --desired-count 1
# persistent: set desiredCount in code + cdk deploy (a deploy reasserts the code value)

# Migrations & ad-hoc tasks                         (was: copilot task run)
npm run migrate                                      # DB migration task
npm run task -- generate-creator-links               # any worker npm script (ad-hoc)
npx cdk deploy InkverseAdHocTask                     # only when the ad-hoc Dockerfile / secrets change

# Scheduled jobs
npm run task -- <script>                             # or trigger the job's task def directly
aws events disable-rule --name <rule>                # pause   (enable-rule to resume)
```

### ECR image cleanup (`cdk gc`)

`cdk deploy` builds each image with `ContainerImage.fromAsset` and pushes it to the **single,
content-addressed** bootstrap repo (`cdk-hnb659fds-container-assets-<acct>-us-west-2`) — there is
**no per-service repo and no lifecycle policy**, so old image hashes accumulate over time.
`cdk gc` removes hashes that **no deployed stack references** — it is reference-aware and never
deletes an image your current stacks point at.

Safe for scheduled jobs: a running Fargate task already pulled its image (Fargate does not re-pull
mid-run), and the next cron run launches with the image the **live stack** references — which gc
never touches. So gc can only remove old hashes you've already deployed away from.

```bash
npm run gc                                            # dry run — lists what WOULD be removed, deletes nothing
# when ready, hard-delete with buffers (quarantine 30d, skip images <7d old):
npx cdk gc --unstable=gc --type=ecr --action=full \
  --rollback-buffer-days=30 --created-buffer-days=7
```

Run occasionally (e.g. monthly) and review the `npm run gc` dry run before deleting.

### Adding a secret to ad-hoc runs

1. Create the SSM SecureString param:
   ```bash
   aws ssm put-parameter --type SecureString --overwrite \
     --name /copilot/inkverse/prod/secrets/<NAME> --value '<value>'
   ```
2. Append `<NAME>` to `ADHOC_SECRETS` in `lib/secrets.ts`.
3. `npx cdk deploy InkverseAdHocTask` — the secret is then injected into `npm run task` runs.

## Adding things (all are code + deploy)

- **New service/job:** add a `WebService` / `WorkerService` / `ScheduledJob` block in
  `bin/inkverse.ts` (+ its Dockerfile), then `npx cdk deploy <NewStack>`.
- **New addon (e.g. Redis/ElastiCache):** add the construct to `InkverseDataStack` (subnet group
  + SG with ingress from the EnvironmentSecurityGroup), then deploy.

## Notes vs Copilot

- Scheduled jobs are plain EventBridge → RunTask (no Step Functions retry wrapper). A failed run
  waits for the next cron — fine for these idempotent maintenance jobs.
- **Fargate Spot:** services take a `capacity` option (`'on-demand'` default | `'spot'` | a raw
  `CapacityProviderStrategy[]`). The worker runs on **pure `spot`** (SQS-driven; a reclaim just reprocesses
  the message — and at `desiredCount 1` only pure spot actually saves money). Web services stay
  on-demand — pass a raw strategy with an on-demand base + Spot overflow
  (`[{FARGATE, base:1, weight:0}, {FARGATE_SPOT, weight:1}]`) only once they run ≥2 tasks. Scheduled jobs stay
  on-demand (Spot not worth it). Prereq: the cluster must have the `FARGATE_SPOT` capacity provider —
  verify with `aws ecs describe-clusters --clusters <name> --query 'clusters[0].capacityProviders'`.
- **ECR has no per-service repos and no lifecycle policy by design:** `fromAsset` pushes every
  image to the one content-addressed bootstrap repo. Clean up accumulated hashes with `cdk gc`
  (reference-aware — see "ECR image cleanup" under Day-to-day commands), not per-service repos.
- Secrets remain SSM SecureString params at `/copilot/inkverse/prod/secrets/*`; manage with
  `aws ssm put-parameter --type SecureString --overwrite`, then reference the name in `secrets.ts`.
- RDS + its SG + endpoint param are retained/imported resources. Any change to them is deliberate;
  no IaC will recreate them. Always `cdk diff InkverseDataStack` before deploying the data stack.

## Post-migration follow-ups

Deferred until the CDK deployment has been proven in production:

- **`npm run gc`** occasionally (e.g. monthly) to prune unreferenced image hashes from the
  bootstrap ECR repo.