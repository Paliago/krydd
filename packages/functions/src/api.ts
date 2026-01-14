import { createClient } from "@openauthjs/openauth/client";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { logger } from "hono/logger";
import { Resource } from "sst/resource";
import userRoute from "./api/user";

export const client = createClient({
  clientID: "jwt-api",
  issuer: Resource.AuthApi.url,
});

const app = new Hono().use(logger()).basePath("/api");

const routes = app
  .route("/user", userRoute);

export type AppType = typeof routes;

export const handler = handle(app);
