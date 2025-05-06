import * as fs from 'fs';
import { Upload } from '@aws-sdk/lib-storage';
import { r2Client } from './setup.js';

interface UploadFileParams {
  bucketName: string;
  fileName: string;
  filePath: string;
  metadata?: Record<string, string>;
}

export async function uploadFile({ bucketName, fileName, filePath, metadata }: UploadFileParams): Promise<void> {
  const file = fs.readFileSync(filePath);
  const properties = fs.statSync(filePath);
  const fileSizeInBytes = properties.size || 0;

  if (fileSizeInBytes === 0) { throw new Error("uploadFile - File is empty!"); }

  const uploadParams = {
    Bucket: bucketName,
    Key: fileName,
    Body: file,
    ...(metadata && { Metadata: metadata }),
  };

  const parallelUploads = new Upload({
    client: r2Client,
    queueSize: 2, // optional concurrency configuration
    leavePartsOnError: false, // optional manually handle dropped parts
    params: uploadParams,
  });

  // parallelUploads.on("httpUploadProgress", (progress) => {
  //   console.log(progress);
  // });

  await parallelUploads.done();
}
