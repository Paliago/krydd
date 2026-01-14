import { Bucket } from "sst/aws/bucket";

// Image bucket for recipe images
export const imagesBucket = new Bucket("Images", {
  name: "krydd-images",
  cors: [
    {
      allowedMethods: ["GET", "PUT", "POST", "DELETE"],
      allowedOrigins: $dev 
        ? ["http://localhost:5173", "http://localhost:3000"]
        : ["https://krydd.app", "https://*.krydd.app"],
      allowedHeaders: ["*"],
      maxAge: 86400, // 24 hours
    },
  ],
  access: "public",
});

// Vector bucket for S3 Vector Search embeddings
export const vectorBucket = new Bucket("Vectors", {
  name: "krydd-vectors",
  access: "private",
});

// Export bucket names
export const IMAGES_BUCKET_NAME = imagesBucket.name;
export const VECTORS_BUCKET_NAME = vectorBucket.name;
