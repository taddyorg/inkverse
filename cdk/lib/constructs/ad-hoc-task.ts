/**
 * A standalone Fargate task definition with no service and no schedule.
 *
 * Used for `db-migrate` and the general-purpose `ad-hoc` image. Run on demand with
 * `npm run migrate` / `npm run task` (cdk/scripts/run-migrate.ts / run-task.ts).
 * The ad-hoc image's command is overridden per invocation; changing its Dockerfile
 * registers a new task-def revision on `cdk deploy`.
 */
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { CfnOutput } from 'aws-cdk-lib';
import { EnvImports } from '../env-imports';
import {
  Arch,
  addAppContainer,
  buildSecrets,
  cpuArchitecture,
  grantSes,
  grantSqs,
} from './common';

export interface AdHocTaskProps {
  env: EnvImports;
  serviceName: string;
  dockerfile: string;
  arch: Arch;
  /** Family name for the task def, e.g. 'inkverse-migrate' / 'inkverse-adhoc'. */
  family: string;
  cpu?: number;
  memoryMiB?: number;
  environment?: Record<string, string>;
  /** SSM SecureString param names under /copilot/inkverse/prod/secrets/. */
  secretNames?: string[];
  grantSqs?: boolean;
  grantSes?: boolean;
}

export class AdHocTask extends Construct {
  readonly taskDefinition: ecs.FargateTaskDefinition;

  constructor(scope: Construct, id: string, props: AdHocTaskProps) {
    super(scope, id);

    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      family: props.family,
      cpu: props.cpu ?? 256,
      memoryLimitMiB: props.memoryMiB ?? 512,
      runtimePlatform: {
        cpuArchitecture: cpuArchitecture(props.arch),
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    addAppContainer(this, this.taskDefinition, {
      serviceName: props.serviceName,
      dockerfile: props.dockerfile,
      arch: props.arch,
      environment: props.environment,
      secrets: buildSecrets(this, props.env, props.secretNames),
    });

    if (props.grantSqs) grantSqs(this.taskDefinition.taskRole);
    if (props.grantSes) grantSes(this.taskDefinition.taskRole);

    new CfnOutput(this, 'TaskDefFamily', {
      value: props.family,
      description: 'Task definition family — used by npm run task / npm run migrate',
    });
  }
}
