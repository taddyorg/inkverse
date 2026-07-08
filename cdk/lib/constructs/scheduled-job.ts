/**
 * EventBridge-scheduled Fargate task (cron job).
 *
 * Note: a direct EventBridge -> RunTask (no Step Functions retry wrapper, unlike
 * Copilot). A failed run waits for the next cron — acceptable for these idempotent
 * maintenance jobs. Disable temporarily via `enabled: false` (or `aws events
 * disable-rule`).
 */
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as events from 'aws-cdk-lib/aws-events';
import { EnvImports } from '../env-imports';
import {
  Arch,
  addAppContainer,
  buildSecrets,
  cpuArchitecture,
  grantSes,
  grantSqs,
} from './common';

export interface ScheduledJobProps {
  env: EnvImports;
  serviceName: string;
  dockerfile: string;
  arch: Arch;
  /** Cron expression, e.g. 'cron(0 1 * * ? *)'. */
  schedule: string;
  cpu?: number;
  memoryMiB?: number;
  enabled?: boolean;
  environment?: Record<string, string>;
  /** SSM SecureString param names under /copilot/inkverse/prod/secrets/. */
  secretNames?: string[];
  grantSqs?: boolean;
  grantSes?: boolean;
}

export class ScheduledJob extends Construct {
  readonly task: ecsPatterns.ScheduledFargateTask;

  constructor(scope: Construct, id: string, props: ScheduledJobProps) {
    super(scope, id);
    const { env } = props;

    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: props.cpu ?? 256,
      memoryLimitMiB: props.memoryMiB ?? 512,
      runtimePlatform: {
        cpuArchitecture: cpuArchitecture(props.arch),
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    addAppContainer(this, taskDef, {
      serviceName: props.serviceName,
      dockerfile: props.dockerfile,
      arch: props.arch,
      environment: props.environment,
      secrets: buildSecrets(this, env, props.secretNames),
    });

    if (props.grantSqs) grantSqs(taskDef.taskRole);
    if (props.grantSes) grantSes(taskDef.taskRole);

    this.task = new ecsPatterns.ScheduledFargateTask(this, 'ScheduledTask', {
      cluster: env.cluster,
      schedule: events.Schedule.expression(props.schedule),
      scheduledFargateTaskDefinitionOptions: { taskDefinition: taskDef },
      vpc: env.vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [env.environmentSecurityGroup],
      enabled: props.enabled ?? true,
    });
    // Scheduled jobs stay on-demand: Spot savings on seconds-per-day runs are
    // negligible, and a reclaim mid-run would just fail until the next cron
    // (we don't wrap jobs in Step Functions retries).
  }
}
