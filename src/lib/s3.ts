import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;
if (!region) {
  throw new Error("AWS_REGION is not set");
}

export const s3 = new S3Client({
  region,
});