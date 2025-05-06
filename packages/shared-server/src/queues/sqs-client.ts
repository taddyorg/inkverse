import dotenv from 'dotenv'
import { SQSClient } from "@aws-sdk/client-sqs";
import { fileURLToPath } from 'url';

import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

const REGION = { region: "us-west-2" };

function getEndpoint() {
	if (process.env.NODE_ENV === 'production') { return {} }
	else if (process.env.SQS_BASE_URL) { 
		return { endpoint: process.env.SQS_BASE_URL?.split('/').slice(0, 3).join('/') || '' } 
	}
}

const awsConfig = {
	...REGION,
	...getEndpoint()
}

// Create SQS service object.
export const sqsClient = new SQSClient(awsConfig);