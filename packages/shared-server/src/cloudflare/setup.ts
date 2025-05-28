import { S3Client } from "@aws-sdk/client-s3";

import path from 'path';
import { fileURLToPath } from "url";
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

interface CloudflareConfig {
  region: string;
  endpoint: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

const cloudflareConfig: CloudflareConfig = {
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY ?? "",
    secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY ?? "",
  },
};

const r2Client = new S3Client(cloudflareConfig);

export { r2Client };