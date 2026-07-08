/**
 * InkverseDataStack — the stateful layer.
 *
 * This is an L1 (Cfn*) MIRROR of copilot/api/addons/rds.yml, matching the live
 * resources property-for-property so the existing RDS instance can be adopted via
 * `cdk import` WITHOUT recreation. After Step 5 (Retain policies on the Copilot
 * addon) leaves the resources orphaned, import them into this stack:
 *
 *   npx cdk import InkverseDataStack
 *   npx cdk diff  InkverseDataStack   # MUST show zero changes
 *
 * Every resource uses RETAIN so no deploy can destroy data.
 */
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { config } from './config';

const DB_PASSWORD_SSM = '/copilot/inkverse/prod/secrets/DATABASE_PASSWORD';
const DB_ENDPOINT_SSM = '/copilot/inkverse/prod/secrets/DATABASE_ENDPOINT';

export class InkverseDataStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // --- Subnet group (mirrors DBSubnetGroup) ---
    const subnetGroup = new rds.CfnDBSubnetGroup(this, 'DBSubnetGroup', {
      dbSubnetGroupDescription: 'Group of subnets to place DB into',
      subnetIds: config.privateSubnetIds,
    });
    subnetGroup.applyRemovalPolicy(RemovalPolicy.RETAIN);

    // --- Security group + ingress (mirrors DatabaseSecurityGroup / DBIngress) ---
    const dbSecurityGroup = new ec2.CfnSecurityGroup(this, 'DatabaseSecurityGroup', {
      groupDescription: 'DB Security Group',
      vpcId: config.vpcId,
    });
    dbSecurityGroup.applyRemovalPolicy(RemovalPolicy.RETAIN);

    const dbIngress = new ec2.CfnSecurityGroupIngress(this, 'DBIngress', {
      description: 'Ingress from Fargate containers',
      groupId: dbSecurityGroup.ref,
      ipProtocol: 'tcp',
      fromPort: 5432,
      toPort: 5432,
      sourceSecurityGroupId: config.environmentSecurityGroupId,
    });
    dbIngress.applyRemovalPolicy(RemovalPolicy.RETAIN);

    // --- Parameter group (mirrors DBPG18) ---
    const parameterGroup = new rds.CfnDBParameterGroup(this, 'DBPG18', {
      dbParameterGroupName: 'inkverse-postgres18',
      family: 'postgres18',
      description: 'Inkverse PG18 + logical replication',
      parameters: {
        'rds.logical_replication': '1',
        'rds.force_ssl': '1',
      },
    });
    parameterGroup.applyRemovalPolicy(RemovalPolicy.RETAIN);

    // --- The instance (mirrors DBInstance) ---
    const dbInstance = new rds.CfnDBInstance(this, 'DBInstance', {
      engine: 'postgres',
      engineVersion: '18.4',
      dbInstanceClass: 'db.t4g.micro',
      allocatedStorage: '20',
      storageType: 'gp3',
      multiAz: false,
      allowMajorVersionUpgrade: true,
      autoMinorVersionUpgrade: true,
      deletionProtection: true,
      enablePerformanceInsights: true,
      caCertificateIdentifier: 'rds-ca-ecc384-g1',
      dbName: 'inkverse',
      masterUsername: 'dmathewwws',
      // Import ignores the password; kept for parity with the original template.
      masterUserPassword: `{{resolve:ssm-secure:${DB_PASSWORD_SSM}}}`,
      dbSubnetGroupName: subnetGroup.ref,
      dbParameterGroupName: parameterGroup.ref,
      vpcSecurityGroups: [dbSecurityGroup.ref],
    });
    dbInstance.applyRemovalPolicy(RemovalPolicy.RETAIN);

    // --- Endpoint SSM param (mirrors EndpointAddressParam) ---
    const endpointParam = new ssm.CfnParameter(this, 'EndpointAddressParam', {
      name: DB_ENDPOINT_SSM,
      type: 'String',
      value: dbInstance.attrEndpointAddress,
    });
    endpointParam.applyRemovalPolicy(RemovalPolicy.RETAIN);
  }
}
