import { email } from "./email";
import { router } from "./router";
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from "./secret";
import { table } from "./storage";

export const auth = new sst.aws.Auth("AuthApi", {
  domain: "krydd.app",
  issuer: {
    handler: "packages/functions/src/auth.handler",
    link: [table, email, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET],
    environment: {
      AUTH_FRONTEND_URL: $dev ? "http://localhost:5173" : router.url,
      APP_NAME: "Krydd",
    },
  },
});
