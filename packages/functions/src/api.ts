import { createClient } from "@openauthjs/openauth/client";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { Resource } from "sst/resource";
import userRoute from "./api/user";
import recipesRoute from "./api/recipes";
import searchRoute from "./api/search";
import mealPlanRoute from "./api/meal-plan";
import chatRoute from "./api/chat";

export const client = createClient({
  clientID: "krydd-api",
  issuer: Resource.AuthApi.url,
});

// Create Hono app with CORS middleware
const app = new Hono()
  .use(logger())
  .use("/*", cors({
    origin: $dev ? "http://localhost:5173" : Resource.Web.url,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }))
  .basePath("/api");

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "krydd-api",
  });
});

// Mount all routes
const routes = app
  .route("/user", userRoute)
  .route("/recipes", recipesRoute)
  .route("/search", searchRoute)
  .route("/meal-plan", mealPlanRoute)
  .route("/chat", chatRoute);

export type AppType = typeof routes;

export const handler = handle(app);
