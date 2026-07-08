/**
 * Internet-facing Fargate service behind the imported ALB.
 *
 * Serves both `api` and `website` — they differ only in args (port, path,
 * healthcheck, secrets). Registers a new target group + listener rule on the
 * existing HTTPS listener at an explicit, non-colliding priority.
 */
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Duration } from 'aws-cdk-lib';
import { EnvImports } from '../env-imports';
import {
  Arch,
  Capacity,
  CONTAINER_NAME,
  addAppContainer,
  buildSecrets,
  capacityStrategies,
  cpuArchitecture,
  grantSes,
  grantSqs,
} from './common';

export interface WebServiceProps {
  env: EnvImports;
  serviceName: string;
  dockerfile: string;
  arch: Arch;
  port: number;
  /** ALB path patterns routed to this service, e.g. ['/api', '/api/*']. */
  pathPatterns: string[];
  /** Listener-rule priority — must be unique across all rules on the listener. */
  priority: number;
  /** Target-group health-check path. */
  healthCheckPath: string;
  cpu?: number;
  memoryMiB?: number;
  desiredCount?: number;
  /** Fargate capacity (default 'on-demand'). Spot is only sensible at desiredCount >= 2
   *  (a reclaim of a single task means downtime) — pass a raw strategy with an on-demand
   *  base + Spot overflow there, e.g. [{FARGATE, base:1, weight:0}, {FARGATE_SPOT, weight:1}]. */
  capacity?: Capacity;
  environment?: Record<string, string>;
  /** SSM SecureString param names under /copilot/inkverse/prod/secrets/. */
  secretNames?: string[];
  grantSqs?: boolean;
  grantSes?: boolean;
}

export class WebService extends Construct {
  readonly service: ecs.FargateService;

  constructor(scope: Construct, id: string, props: WebServiceProps) {
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
      port: props.port,
      environment: props.environment,
      secrets: buildSecrets(this, env, props.secretNames),
    });

    if (props.grantSqs) grantSqs(taskDef.taskRole);
    if (props.grantSes) grantSes(taskDef.taskRole);

    this.service = new ecs.FargateService(this, 'Service', {
      cluster: env.cluster,
      taskDefinition: taskDef,
      desiredCount: props.desiredCount ?? 1,
      // Join the shared SG so RDS (which only allows ingress from it) is reachable.
      securityGroups: [env.environmentSecurityGroup],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      capacityProviderStrategies: capacityStrategies(props.capacity),
      enableExecuteCommand: true,
      // Copilot rolls back failed deploys by default — preserve that.
      circuitBreaker: { rollback: true },
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc: env.vpc,
      port: props.port,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      targets: [
        this.service.loadBalancerTarget({
          containerName: CONTAINER_NAME,
          containerPort: props.port,
        }),
      ],
      healthCheck: {
        path: props.healthCheckPath,
        healthyHttpCodes: '200-399',
        interval: Duration.seconds(30),
        timeout: Duration.seconds(10),
      },
      deregistrationDelay: Duration.seconds(30),
    });

    new elbv2.ApplicationListenerRule(this, 'ListenerRule', {
      listener: env.listener,
      priority: props.priority,
      conditions: [elbv2.ListenerCondition.pathPatterns(props.pathPatterns)],
      targetGroups: [targetGroup],
    });
  }
}
