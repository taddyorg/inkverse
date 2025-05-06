import { SESv2Client } from "@aws-sdk/client-sesv2";

const REGION = { region: "us-west-2" }; 

const awsConfig = {
	...REGION,
}

export const emailCient = new SESv2Client(awsConfig);