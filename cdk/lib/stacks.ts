/**
 * One CloudFormation stack per compute unit (independent deploys, like Copilot).
 * Each stack imports the env (VPC/cluster/SG/listener) into its own scope — the
 * imports are static lookups, so duplicating them per stack is free and avoids
 * cross-stack references.
 */
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { importEnv } from './env-imports';
import { WebService, WebServiceProps } from './constructs/web-service';
import { WorkerService, WorkerServiceProps } from './constructs/worker-service';
import { ScheduledJob, ScheduledJobProps } from './constructs/scheduled-job';
import { AdHocTask, AdHocTaskProps } from './constructs/ad-hoc-task';

type ServiceArgs<T> = Omit<T, 'env'>;

export class WebServiceStack extends Stack {
  readonly web: WebService;
  constructor(scope: Construct, id: string, args: ServiceArgs<WebServiceProps>, props?: StackProps) {
    super(scope, id, props);
    this.web = new WebService(this, 'Service', { env: importEnv(this), ...args });
  }
}

export class WorkerServiceStack extends Stack {
  readonly worker: WorkerService;
  constructor(scope: Construct, id: string, args: ServiceArgs<WorkerServiceProps>, props?: StackProps) {
    super(scope, id, props);
    this.worker = new WorkerService(this, 'Service', { env: importEnv(this), ...args });
  }
}

export class ScheduledJobStack extends Stack {
  readonly job: ScheduledJob;
  constructor(scope: Construct, id: string, args: ServiceArgs<ScheduledJobProps>, props?: StackProps) {
    super(scope, id, props);
    this.job = new ScheduledJob(this, 'Job', { env: importEnv(this), ...args });
  }
}

export class AdHocTaskStack extends Stack {
  readonly task: AdHocTask;
  constructor(scope: Construct, id: string, args: ServiceArgs<AdHocTaskProps>, props?: StackProps) {
    super(scope, id, props);
    this.task = new AdHocTask(this, 'Task', { env: importEnv(this), ...args });
  }
}
