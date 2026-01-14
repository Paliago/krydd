import { data as rrData } from "react-router";
import { baseColors } from "~/lib/colors";
import { themeCookie } from "~/lib/cookies.server";
import type { Route } from "./+types/set-theme";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const theme = formData.get("theme");

  // Validate theme against baseColors
  const chosenTheme = baseColors.find((c) => c.name === theme);

  if (!chosenTheme) {
    return rrData({ success: false, error: "Invalid theme" }, { status: 400 });
  }

  // Set the cookie with validated theme
  const cookieHeader = await themeCookie.serialize(chosenTheme.name);

  return rrData(
    { success: true },
    {
      headers: {
        "Set-Cookie": cookieHeader,
      },
    },
  );
}
