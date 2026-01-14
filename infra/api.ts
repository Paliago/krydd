import { auth } from "./auth";
import { router } from "./router";
import { recipesTable, mealPlansTable } from "./tables";
import { imagesBucket, vectorBucket } from "./storage";

export const api = new sst.aws.Function("Api", {
  url: true,
  handler: "packages/functions/src/api.handler",
  link: [
    auth,
    router,
    recipesTable,
    mealPlansTable,
    imagesBucket,
    vectorBucket,
  ],
  environment: {
    AWS_REGION: "us-east-1", // Required for Bedrock access
  },
});
