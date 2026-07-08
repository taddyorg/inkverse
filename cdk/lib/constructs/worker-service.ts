/**
 * Long-running Fargate service with no load balancer (SQS consumer).
 * Used by worker-high-priority (arm64).
 */
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { EnvImports } from '../env-imports';
import {
  Arch,
  Capacity,
  addAppContainer,
  buildSecrets,
  capacityStrategies,
  cpuArchitecture,
  grantSes,
  grantSqs,
} from './common';

export interface WorkerServiceProps {
  env: EnvImports;
  serviceName: string;
  dockerfile: string;
  arch: Arch;
  cpu?: number;
  memoryMiB?: number;
  desiredCount?: number;
  /** Fargate capacity (default 'on-demand'). 'spot' is ~70% cheaper but reclaimable. */
  capacity?: Capacity;
  environment?: Record<string, string>;
  /** SSM SecureString param names under /copilot/inkverse/prod/secrets/. */
  secretNames?: string[];
  grantSqs?: boolean;
  grantSes?: boolean;
}

export class WorkerService extends Construct {
  readonly service: ecs.FargateService;

  constructor(scope: Construct, id: string, props: WorkerServiceProps) {
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

    this.service = new ecs.FargateService(this, 'Service', {
      cluster: env.cluster,
      taskDefinition: taskDef,
      desiredCount: props.desiredCount ?? 1,
      securityGroups: [env.environmentSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      // Providing a capacity-provider strategy makes CDK omit launchType.
      capacityProviderStrategies: capacityStrategies(props.capacity),
      enableExecuteCommand: true,
      circuitBreaker: { rollback: true },
      // Stop the old task before starting the new one — avoids two workers
      // draining the same SQS queue during a deploy.
      minHealthyPercent: 0,
      maxHealthyPercent: 100,
    });
  }
}
