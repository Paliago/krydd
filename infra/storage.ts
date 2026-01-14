import { router } from "./router";

export const bucket = new sst.aws.Bucket("Storage", { access: "cloudfront" });
router.routeBucket("/files", bucket, {
  rewrite: {
    regex: "^/files/(.*)$",
    to: "/$1",
  },
});

export const table = new sst.aws.Dynamo("Table", {
  fields: {
    pk: "string",
    sk: "string",
    gsi1pk: "string",
    gsi1sk: "string",
    gsi2pk: "string",
    gsi2sk: "string",
  },
  primaryIndex: { hashKey: "pk", rangeKey: "sk" },
  globalIndexes: {
    GSI1: { hashKey: "gsi1pk", rangeKey: "gsi1sk" },
    GSI2: { hashKey: "gsi2pk", rangeKey: "gsi2sk" },
  },
  stream: "new-and-old-images",
  ttl: "expireAt",
});
