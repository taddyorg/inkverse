/**
 * Shared helper for the one-off task scripts.
 *
 * Reads the infra identifiers straight from cdk/config.local.ts (via lib/config —
 * the single source of truth, no env vars to export) and starts a one-off Fargate
 * task with the awsvpc network configuration. Credentials/region come from the
 * ambient AWS credential chain + config.region (same as the old `aws` CLI calls).
 */
import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';
import { config } from '../lib/config';

export async function runFargateTask(family: string, command?: string[]): Promise<void> {
  const client = new ECSClient({ region: config.region });

  const res = await client.send(
    new RunTaskCommand({
      cluster: config.clusterName,
      taskDefinition: family,
      launchType: 'FARGATE',
      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: config.privateSubnetIds,
          securityGroups: [config.environmentSecurityGroupId],
          assignPublicIp: 'DISABLED',
        },
      },
      overrides: command
        ? { containerOverrides: [{ name: 'app', command }] }
        : undefined,
    }),
  );

  const failures = res.failures ?? [];
  if (failures.length) {
    console.error('run-task failures:', JSON.stringify(failures, null, 2));
    process.exit(1);
  }

  const arn = res.tasks?.[0]?.taskArn;
  console.log(`Started ${family}: ${arn ?? '(no task arn returned)'}`);
}
