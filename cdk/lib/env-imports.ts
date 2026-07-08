/**
 * Imports of the existing Copilot-generated environment.
 *
 * Nothing here is created or managed by CDK — these are read-only references to the
 * VPC, ECS cluster, shared security group, ALB listener, and SSM secret params that
 * the compute stacks attach to. All `from*Attributes` calls are static (no AWS lookup
 * at synth time), so the IDs come straight from config.local.ts.
 */
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { config } from './config';

const SECRETS_PREFIX = `/copilot/inkverse/prod/secrets`;

export interface EnvImports {
  vpc: ec2.IVpc;
  cluster: ecs.ICluster;
  /** Shared SG every service must join — RDS only allows ingress from it. */
  environmentSecurityGroup: ec2.ISecurityGroup;
  /** Existing ALB listener (HTTP:80; TLS terminates at Cloudflare). */
  listener: elbv2.IApplicationListener;
  /** Pull a SecureString secret stored at /copilot/inkverse/prod/secrets/<name>. */
  secret(scope: Construct, name: string): ecs.Secret;
}

export function importEnv(scope: Construct): EnvImports {
  const vpc = ec2.Vpc.fromVpcAttributes(scope, 'ImportedVpc', {
    vpcId: config.vpcId,
    availabilityZones: config.availabilityZones,
    publicSubnetIds: config.publicSubnetIds,
    privateSubnetIds: config.privateSubnetIds,
  });

  const environmentSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
    scope,
    'EnvSecurityGroup',
    config.environmentSecurityGroupId,
    { mutable: false },
  );

  const cluster = ecs.Cluster.fromClusterAttributes(scope, 'ImportedCluster', {
    clusterName: config.clusterName,
    vpc,
    securityGroups: [environmentSecurityGroup],
  });

  const albSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
    scope,
    'AlbSecurityGroup',
    config.albSecurityGroupId,
    { mutable: false },
  );

  const listener = elbv2.ApplicationListener.fromApplicationListenerAttributes(
    scope,
    'AlbListener',
    {
      listenerArn: config.albListenerArn,
      securityGroup: albSecurityGroup,
    },
  );

  const secret = (s: Construct, name: string): ecs.Secret =>
    ecs.Secret.fromSsmParameter(
      ssm.StringParameter.fromSecureStringParameterAttributes(s, `Secret-${name}`, {
        parameterName: `${SECRETS_PREFIX}/${name}`,
      }),
    );

  return { vpc, cluster, environmentSecurityGroup, listener, secret };
}
