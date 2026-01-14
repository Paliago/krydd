import { auth } from "./auth";
import { router } from "./router";
import { table } from "./storage";

export const api = new sst.aws.Function("Api", {
  url: true,
  handler: "packages/functions/src/api.handler",
  link: [table, auth, router],
});
