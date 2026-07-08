/**
 * Template for cdk/config.local.ts (which is gitignored).
 *
 *   cp config.example.ts config.local.ts
 *
 * Then fill in the real values. Produce them with:
 *
 *   # VPC / subnets / cluster / env SG / ALB listener  (Copilot env stack)
 *   aws cloudformation describe-stacks --stack-name inkverse-prod \
 *     --query 'Stacks[0].Outputs'
 *
 *   # DB security group (Copilot api addons stack)
 *   aws cloudformation describe-stacks \
 *     --stack-name $(aws cloudformation list-stacks \
 *       --query "StackSummaries[?contains(StackName,'inkverse-prod-api-AddonsStack')].StackName | [0]" \
 *       --output text) --query 'Stacks[0].Outputs'
 *
 *   # HTTPS listener ARN
 *   # ALB listener ARN is the HTTPListenerArn output of the env stack (HTTP:80;
 *   # TLS terminates at Cloudflare). The ALB security group:
 *   aws elbv2 describe-load-balancers \
 *     --query "LoadBalancers[?contains(LoadBalancerName,'inkver')].SecurityGroups" --output text
 *
 * SES ARNs come from copilot/api/addons/addons.parameters.yml.
 */
import type { InkverseConfig } from './lib/config';

export const config: InkverseConfig = {
  account: 'xxxxxxx',
  region: 'us-xxxx-x',
  vpcId: 'vpc-xxxxxxxx',
  availabilityZones: ['us-xxxx-x', 'us-xxxx-y'],
  publicSubnetIds: ['subnet-xxxx', 'subnet-yyyy'],
  privateSubnetIds: ['subnet-aaaa', 'subnet-bbbb'],
  clusterName: 'inkverse-prod-Cluster-XXXXXXXX',
  environmentSecurityGroupId: 'sg-xxxxxxxx',
  albListenerArn:
    'arn:aws:elasticloadbalancing:us-west-2:253384754083:listener/app/xxxx/yyyy/zzzz',
  albSecurityGroupId: 'sg-yyyyyyyy',
  databaseSecurityGroupId: 'sg-dddddddd',
  sesIdentityArn: 'arn:aws:ses:*:xxxxxxx:identity/inkverse.co',
  sesConfigSetArn:
    'arn:aws:ses:us-xxxx-x:xxxxxxx:configuration-set/managed_email',
};
