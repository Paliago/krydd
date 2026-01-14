import { Link, useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { requireSession } from "~/lib/auth.server";
import type { Route } from "./+types/start";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Vision" }, { name: "description", content: "Vision" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { properties, headers } = await requireSession(request);

  return { 
    user: { email: properties.email, name: properties.name || properties.email },
    headers
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const user = loaderData?.user;
  const logoutFetcher = useFetcher();
  const loginFetcher = useFetcher();
  const isLoggingOut = logoutFetcher.state !== "idle";
  const isLoggingIn = loginFetcher.state !== "idle";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight">Welcome</h1>
        <p className="text-xl text-muted-foreground">Vision</p>

        {user ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Logged in as: <code>{user.name}</code>
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link to="/dashboard" prefetch="intent">
                  Dashboard
                </Link>
              </Button>
              <logoutFetcher.Form action="/logout" method="post">
                <Button variant="outline" type="submit" disabled={isLoggingOut}>
                  {isLoggingOut ? "Logging out..." : "Log out"}
                </Button>
              </logoutFetcher.Form>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <loginFetcher.Form action="/login" method="post">
              <Button size="lg" type="submit" disabled={isLoggingIn}>
                {isLoggingIn ? "Logging in..." : "Log in"}
              </Button>
            </loginFetcher.Form>
          </div>
        )}
      </div>
    </main>
  );
}
