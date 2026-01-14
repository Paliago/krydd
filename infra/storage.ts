import { Bucket } from "sst/aws/bucket";

// Image bucket for recipe images (public access)
export const imagesBucket = new Bucket("Images", {
  name: "krydd-images",
  cors: [
    {
      allowedMethods: ["GET", "PUT", "POST", "DELETE"],
      allowedOrigins: $dev 
        ? ["http://localhost:5173", "http://localhost:3000"]
        : ["https://krydd.app", "https://*.krydd.app"],
      allowedHeaders: ["*"],
      maxAge: 86400,
    },
  ],
  access: "public",
});

// Vector bucket for S3 Vector Search embeddings (private, from Pulumi)
const vectorBucket = new aws.s3.Bucket("VectorBucket", {
  bucket: "krydd-vectors",
  versioning: { enabled: true },
  lifecycleRules: [
    {
      enabled: true,
      noncurrentVersionExpiration: { noncurrentDays: 30 },
    },
  ],
});

// Export for use in other modules via Resource.VectorBucket
export const vectorBucketName = vectorBucket.bucket;
