import { redirect } from "react-router";
import { handleAuthCallback } from "~/lib/auth.server";
import type { Route } from "./+types/callback";

export async function loader({ request }: Route.LoaderArgs) {
  const { headers } = await handleAuthCallback(request);

  return redirect("/", {
    headers,
  });
}
