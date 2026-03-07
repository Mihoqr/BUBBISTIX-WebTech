import dotenv from "dotenv";
dotenv.config();

import { S3Client } from "@aws-sdk/client-s3";

// Create AWS S3 client using region and credentials from environment variables
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

export default s3;