import { api } from "./api";
import { auth } from "./auth";
import { router } from "./router";

new sst.aws.React("React", {
  path: "packages/web",
  link: [auth, api],
  environment: {
    VITE_AUTH_URL: auth.url,
    VITE_API_URL: api.url,
    VITE_SITE_URL: $dev ? "http://localhost:5173" : router.url,
  },
  router: {
    instance: router,
  },
});
