/**
 * Secret name lists per service, mirroring the `secrets:` blocks in the Copilot
 * manifests. Each name resolves to /copilot/inkverse/prod/secrets/<NAME>.
 */

/** Shared by all 5 scheduled jobs (the "standard set"). */
export const BASE_JOB_SECRETS = [
  'SENTRY_URL',
  'DATABASE_USERNAME',
  'DATABASE_PASSWORD',
  'DATABASE_ENDPOINT',
  'SQS_BASE_URL',
  'TADDY_USER_ID',
  'TADDY_CLIENT_ID',
  'TADDY_API_KEY',
  'TADDY_WEBHOOK_SECRET',
  'TADDY_WEBHOOK_ENDPOINT_URL',
  'STELLATE_API_TOKEN',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_TADDY_ZONE_ID',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_ACCESS_KEY',
  'CLOUDFLARE_SECRET_KEY',
];

/** worker-high-priority = base + Expo push. */
export const WORKER_SECRETS = [...BASE_JOB_SECRETS, 'EXPO_PUSH_ACCESS_TOKEN'];

/**
 * inkverse-adhoc one-off task = worker set + any ad-hoc-only secrets.
 * Add a name here (and create the SSM SecureString) then `cdk deploy InkverseAdHocTask`
 * to make a new secret available to `./scripts/run-task.sh` runs.
 */
export const ADHOC_SECRETS = [...WORKER_SECRETS];

/** api (Load Balanced Web Service). */
export const API_SECRETS = [
  'DATABASE_USERNAME',
  'DATABASE_PASSWORD',
  'DATABASE_ENDPOINT',
  'PRIVATE_JWT',
  'PUBLIC_JWT',
  'SQS_BASE_URL',
  'TADDY_USER_ID',
  'TADDY_CLIENT_ID',
  'TADDY_CLIENT_SECRET',
  'TADDY_API_KEY',
  'TADDY_WEBHOOK_SECRET',
  'TADDY_WEBHOOK_ENDPOINT_URL',
  'SLACK_WEBHOOKS',
  'EMAIL_LISTS',
  'EMAIL_OCTOPUS_API_KEY',
  'ADMIN_USER_IDS',
  'STELLATE_API_TOKEN',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_TADDY_ZONE_ID',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_ACCESS_KEY',
  'CLOUDFLARE_SECRET_KEY',
  'SENTRY_URL',
  'GOOGLE_CLIENT_ID_WEB',
  'GOOGLE_CLIENT_ID_ANDROID',
  'GOOGLE_CLIENT_ID_IOS',
  'APPLE_CLIENT_ID',
  'APPLE_SERVICE_ID',
  'BLUESKY_APP_PASSWORD',
  'CANNY_SSO_PRIVATE_KEY',
  'CANNY_COMPANY_ID',
];
