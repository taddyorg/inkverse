#!/usr/bin/env node
/**
 * Inkverse infrastructure — one stack per compute unit + the data stack.
 *
 * The Copilot env stack (VPC/ALB/cluster/SG), RDS, and SSM secrets are imported,
 * never managed here. See cdk/README.md for the migration runbook.
 */
import * as cdk from 'aws-cdk-lib';
import { config } from '../lib/config';
import { InkverseDataStack } from '../lib/data-stack';
import {
  WebServiceStack,
  WorkerServiceStack,
  ScheduledJobStack,
  AdHocTaskStack,
} from '../lib/stacks';
import { ADHOC_SECRETS, API_SECRETS, BASE_JOB_SECRETS, WORKER_SECRETS } from '../lib/secrets';

const app = new cdk.App();
const env = { account: config.account, region: config.region };
const common = { env };

// --- Stateful layer (RDS adopted via `cdk import`) ---
new InkverseDataStack(app, 'InkverseDataStack', common);

// --- Internet-facing web services (shared ALB) ---
new WebServiceStack(
  app,
  'InkverseApi',
  {
    serviceName: 'api',
    dockerfile: 'Dockerfile-graphql-server',
    arch: 'arm64',
    port: 3010,
    pathPatterns: ['/api', '/api/*'],
    priority: 10,
    healthCheckPath: '/api',
    secretNames: API_SECRETS,
    grantSqs: true,
    grantSes: true,
  },
  common,
);

new WebServiceStack(
  app,
  'InkverseWebsite',
  {
    serviceName: 'website',
    dockerfile: 'Dockerfile-website',
    arch: 'arm64',
    port: 3000,
    pathPatterns: ['/*'],
    priority: 100, // lower priority than /api so it acts as the catch-all
    healthCheckPath: '/',
  },
  common,
);

// --- Backend worker (no load balancer) ---
new WorkerServiceStack(
  app,
  'InkverseWorkerHighPriority',
  {
    serviceName: 'worker-high-priority',
    dockerfile: 'Dockerfile-worker-high-priority',
    arch: 'arm64',
    environment: { QUEUE_NAME: 'INKVERSE_HIGH_PRIORITY' },
    secretNames: WORKER_SECRETS,
    grantSqs: true,
  },
  common,
);

// --- Scheduled jobs (EventBridge -> RunTask) ---
new ScheduledJobStack(
  app,
  'InkverseSendNotificationDigest',
  {
    serviceName: 'send-notification-digest',
    dockerfile: 'Dockerfile-worker-run-daily-digest',
    arch: 'arm64',
    schedule: 'cron(5 14 * * ? *)',
    secretNames: BASE_JOB_SECRETS,
    grantSqs: true,
    grantSes: true,
  },
  common,
);

new ScheduledJobStack(
  app,
  'InkverseSitemapGenerator',
  {
    serviceName: 'sitemap-generator',
    dockerfile: 'Dockerfile-build-sitemap',
    arch: 'arm64',
    schedule: 'cron(0 1 * * ? *)',
    secretNames: BASE_JOB_SECRETS,
  },
  common,
);

new ScheduledJobStack(
  app,
  'InkverseDeleteOldNotifications',
  {
    serviceName: 'delete-old-notifications',
    dockerfile: 'Dockerfile-worker-run-delete-old-notifications',
    arch: 'arm64',
    schedule: 'cron(25 16 * * ? *)',
    secretNames: BASE_JOB_SECRETS,
  },
  common,
);

new ScheduledJobStack(
  app,
  'InkverseRefreshHostingProviderTokens',
  {
    serviceName: 'refresh-hosting-provider-tokens',
    dockerfile: 'Dockerfile-refresh-hosting-provider-access-tokens',
    arch: 'arm64',
    schedule: 'cron(0 6 ? * MON *)',
    secretNames: BASE_JOB_SECRETS,
  },
  common,
);

new ScheduledJobStack(
  app,
  'InkverseAuditImages',
  {
    serviceName: 'audit-images-height-and-width',
    dockerfile: 'Dockerfile-audit-images',
    arch: 'arm64',
    schedule: 'cron(0 6 ? * SUN *)',
    secretNames: BASE_JOB_SECRETS,
  },
  common,
);

// --- Ad-hoc tasks (run via scripts/run-task.sh) ---
new AdHocTaskStack(
  app,
  'InkverseMigrateTask',
  {
    serviceName: 'migrate',
    family: 'inkverse-migrate',
    dockerfile: 'Dockerfile-db-migrate',
    arch: 'arm64',
    secretNames: BASE_JOB_SECRETS,
  },
  common,
);

new AdHocTaskStack(
  app,
  'InkverseAdHocTask',
  {
    serviceName: 'adhoc',
    family: 'inkverse-adhoc',
    dockerfile: 'Dockerfile-ad-hoc-worker',
    arch: 'arm64',
    secretNames: ADHOC_SECRETS,
    grantSqs: true,
    grantSes: true,
  },
  common,
);

app.synth();
