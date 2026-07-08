/**
 * Shared helpers for the service/job constructs: repo paths, the app container,
 * and the IAM grants that Copilot previously wired via addon managed policies.
 */
import * as path from 'path';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { config } from '../config';
import { EnvImports } from '../env-imports';

/** Docker build context = monorepo root (Dockerfiles COPY from there). */
export const REPO_ROOT = path.join(__dirname, '..', '..', '..');

/** The single container name used across all task defs (matches exec / run-task). */
export const CONTAINER_NAME = 'app';

export type Arch = 'arm64' | 'x86_64';

export function cpuArchitecture(arch: Arch): ecs.CpuArchitecture {
  return arch === 'x86_64' ? ecs.CpuArchitecture.X86_64 : ecs.CpuArchitecture.ARM64;
}

/**
 * Fargate capacity for a service. `desiredCount` controls *how many* tasks; this
 * controls *which provider* they land on (orthogonal). The two presets cover the
 * common cases; pass a raw `CapacityProviderStrategy[]` for arbitrary base/weight splits.
 *  - on-demand          → standard FARGATE (default launchType)
 *  - spot               → all tasks on FARGATE_SPOT (cheapest; reclaimable)
 *  - [ ...strategy ]    → verbatim, e.g. on-demand base + Spot overflow:
 *                         [{FARGATE, base:1, weight:0}, {FARGATE_SPOT, weight:1}]
 */
export type Capacity = 'on-demand' | 'spot' | ecs.CapacityProviderStrategy[];

/** Strategy array for a `FargateService` — `undefined` keeps the default on-demand launchType.
 * base is the minimum number of tasks to run on the capacity provider.
 * weight is the relative weight of the capacity provider to use.
*/
export function capacityStrategies(
  capacity: Capacity = 'on-demand',
): ecs.CapacityProviderStrategy[] | undefined {
  if (Array.isArray(capacity)) {
    return capacity.length ? capacity : undefined;
  }
  return capacity === 'spot'
    ? [{ capacityProvider: 'FARGATE_SPOT', weight: 1 }]
    : undefined;
}

function assetPlatform(arch: Arch): ecr_assets.Platform {
  return arch === 'x86_64'
    ? ecr_assets.Platform.LINUX_AMD64
    : ecr_assets.Platform.LINUX_ARM64;
}

/** Build a container image from a Dockerfile at the repo root, for the given arch. */
export function imageFromDockerfile(dockerfile: string, arch: Arch): ecs.ContainerImage {
  return ecs.ContainerImage.fromAsset(REPO_ROOT, {
    file: dockerfile,
    platform: assetPlatform(arch),
  });
}

export interface AppContainerOptions {
  serviceName: string;
  dockerfile: string;
  arch: Arch;
  port?: number;
  environment?: Record<string, string>;
  secrets?: Record<string, ecs.Secret>;
  /** Override the image CMD (used by the ad-hoc task). */
  command?: string[];
  logRetention?: logs.RetentionDays;
}

/** Add the standard `app` container (awslogs + LogGroup with retention) to a task def. */
export function addAppContainer(
  scope: Construct,
  taskDef: ecs.FargateTaskDefinition,
  opts: AppContainerOptions,
): ecs.ContainerDefinition {
  const logGroup = new logs.LogGroup(scope, 'LogGroup', {
    logGroupName: `/inkverse/${opts.serviceName}`,
    retention: opts.logRetention ?? logs.RetentionDays.ONE_MONTH,
  });

  return taskDef.addContainer(CONTAINER_NAME, {
    image: imageFromDockerfile(opts.dockerfile, opts.arch),
    command: opts.command,
    environment: opts.environment,
    secrets: opts.secrets,
    logging: ecs.LogDrivers.awsLogs({ streamPrefix: opts.serviceName, logGroup }),
    portMappings: opts.port ? [{ containerPort: opts.port }] : undefined,
    stopTimeout: Duration.seconds(30),
  });
}

/** Build an ecs secrets map from SSM SecureString param names. */
export function buildSecrets(
  scope: Construct,
  env: EnvImports,
  names?: string[],
): Record<string, ecs.Secret> | undefined {
  if (!names || names.length === 0) return undefined;
  return Object.fromEntries(names.map((n) => [n, env.secret(scope, n)]));
}

/** SQS access (mirrors copilot <svc> addons/sqspermissions.yml). */
export function grantSqs(taskRole: iam.IRole): void {
  taskRole.addToPrincipalPolicy(
    new iam.PolicyStatement({
      sid: 'SQSActions',
      actions: [
        'sqs:DeleteMessage',
        'sqs:GetQueueUrl',
        'sqs:ChangeMessageVisibility',
        'sqs:ReceiveMessage',
        'sqs:SendMessage',
        'sqs:GetQueueAttributes',
        'sqs:SetQueueAttributes',
      ],
      resources: [`arn:aws:sqs:*:${config.account}:*`],
    }),
  );
}

/** SES send access (mirrors copilot <svc> addons/sespermissions.yml). */
export function grantSes(taskRole: iam.IRole): void {
  taskRole.addToPrincipalPolicy(
    new iam.PolicyStatement({
      sid: 'SESActions',
      actions: ['ses:SendEmail'],
      resources: [config.sesIdentityArn, config.sesConfigSetArn],
    }),
  );
}
