import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Resource } from "sst/resource";
export const s3 = new S3Client({});

export async function uploadFile(
  key: string,
  file: Buffer,
  contentType: string,
) {
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: Resource.Storage.name,
      Key: key,
      Body: file,
      ContentType: contentType,
    },
  });

  await upload.done();
  return key;
}
