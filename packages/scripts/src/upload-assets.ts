import { uploadFile } from "@vision/core/lib/s3";
import fs from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Resource } from "sst";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workspaceRoot = path.resolve(__dirname, "../../../");

const filesToUpload = [
  {
    localPath: path.join(workspaceRoot, "packages/web/public/logo-light.png"),
    s3Key: "public/logo-light.png",
    contentType: "image/png",
  },
  {
    localPath: path.join(workspaceRoot, "packages/web/public/favicon.ico"),
    s3Key: "public/favicon.ico",
    contentType: "image/x-icon",
  },
];

async function uploadStaticAssets() {
  console.log(`Target S3 Bucket: ${Resource.Storage.name}`);

  for (const file of filesToUpload) {
    try {
      console.log(`Uploading ${file.s3Key}...`);
      const fileBuffer = fs.readFileSync(file.localPath);
      await uploadFile(file.s3Key, fileBuffer, file.contentType);
      console.log(`Successfully uploaded ${file.s3Key}`);
    } catch (error) {
      console.error(`Failed to upload ${file.s3Key}:`, error);
    }
  }
}

uploadStaticAssets()
  .then(() => console.log("Script finished."))
  .catch((err) => {
    console.error("Script failed:", err);
    process.exit(1);
  });
