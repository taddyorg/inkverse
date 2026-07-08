/**
 * Infrastructure identifiers for the imported (Copilot-generated) environment.
 *
 * These values are NOT committed. Copy `config.example.ts` to `config.local.ts`
 * (gitignored) and fill in the real IDs/ARNs from your account. See `cdk/README.md`
 * for the `aws cloudformation describe-stacks` commands that produce them.
 *
 */
export interface InkverseConfig {
  /** AWS account id. */
  account: string;
  /** AWS region. */
  region: string;

  // --- Imported env (Copilot `inkverse-prod` stack) ---
  vpcId: string;
  availabilityZones: string[];
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  /** ECS cluster created by the Copilot env stack. */
  clusterName: string;
  /** The shared SG every Copilot service joins; RDS only allows ingress from it. */
  environmentSecurityGroupId: string;
  /** ALB listener that routes to the services (HTTP:80; TLS terminates at Cloudflare). */
  albListenerArn: string;
  /** Security group attached to the public ALB (required to import the listener). */
  albSecurityGroupId: string;

  // --- Imported data layer (RDS) ---
  /** SG that allows ingress to RDS on 5432 (from copilot/api/addons/rds.yml). */
  databaseSecurityGroupId: string;

  // --- SES (from copilot/api/addons/addons.parameters.yml) ---
  sesIdentityArn: string;
  sesConfigSetArn: string;
}

function loadLocal(): InkverseConfig {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('../config.local').config as InkverseConfig;
  } catch (err) {
    // Only the missing file gets the friendly hint; a real error *inside*
    // config.local.ts (syntax error, bad export) is rethrown untouched.
    if (err instanceof Error && (err as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND') {
      throw new Error(
        'cdk/config.local.ts not found. Copy config.example.ts to config.local.ts and fill in ' +
          'your account values (see cdk/README.md).',
      );
    }
    throw err;
  }
}

const local = loadLocal();

export const config: InkverseConfig = local;
