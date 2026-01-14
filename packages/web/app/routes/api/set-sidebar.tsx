import { data as rrData } from "react-router";
import { sidebarCookie } from "~/lib/cookies.server";
import type { Route } from "./+types/set-sidebar";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const sidebarState = formData.get("sidebarState");

  if (typeof sidebarState !== "string") {
    return rrData(
      { success: false, error: "Invalid sidebar state" },
      { status: 400 },
    );
  }

  const cookieHeader = await sidebarCookie.serialize(sidebarState === "true");

  return rrData(
    { success: true },
    {
      headers: {
        "Set-Cookie": cookieHeader,
      },
    },
  );
}
