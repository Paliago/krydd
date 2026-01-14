import { data as rrData } from "react-router";
import { z } from "zod";
import { modeCookie } from "~/lib/cookies.server";
import type { Route } from "./+types/set-mode";

const modes = z.enum(["light", "dark", "system"]);

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const mode = formData.get("mode");

  // Zod validation for type safety
  const parsedMode = modes.safeParse(mode);

  if (!parsedMode.success) {
    return rrData({ success: false, error: "Invalid mode" }, { status: 400 });
  }

  const cookieHeader = await modeCookie.serialize(mode);

  return rrData(
    { success: true },
    {
      headers: {
        "Set-Cookie": cookieHeader,
      },
    },
  );
}
