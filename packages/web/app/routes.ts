import {
  index,
  layout,
  prefix,
  type RouteConfig,
  route,
} from "@react-router/dev/routes";

export default [
  layout("./layouts/protected.tsx", { id: "protected" }, [
    index("routes/dashboard.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),

  route("start", "routes/start.tsx"),

  ...prefix("auth", [
    route("email", "routes/auth/email.tsx"),
    route("code", "routes/auth/code.tsx"),
    route("callback", "routes/auth/callback.tsx"),
    route("select", "routes/auth/select.tsx"),
  ]),

  route("login", "routes/auth/login.tsx"),
  route("logout", "routes/auth/logout.tsx"),

  route("set-theme", "routes/api/set-theme.tsx"),
  route("set-mode", "routes/api/set-mode.tsx"),
  route("set-sidebar", "routes/api/set-sidebar.tsx"),

  // TODO: add fallback routes
] satisfies RouteConfig;
