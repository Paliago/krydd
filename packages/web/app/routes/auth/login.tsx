import { authorize, requireAnonymous } from "~/lib/auth.server";
import type { Route } from "./+types/login";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAnonymous(request);

  throw await authorize(request);
}
