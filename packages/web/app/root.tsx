import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { LinksFunction, MetaFunction } from "react-router";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  data as rrData,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import { ThemeProvider } from "~/hooks/theme-provider";
import { cn } from "~/lib/utils";
import type { Route } from "./+types/root";
import "./app.css";
import { getClientHintCheckScript, getHints } from "./lib/client-hints.server";
import { modeCookie, sidebarCookie, themeCookie } from "./lib/cookies.server";
import { getEnv } from "./lib/env.server";

export type RootLoaderData = {
  ENV: ReturnType<typeof getEnv>;
  initialTheme: string;
  initialMode: "light" | "dark" | "system";
  prefersDark: boolean;
  initialSidebarState: boolean;
  clientHintCheckScript: string;
};

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  // Sans-serif fonts
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap",
  },
  // Serif fonts
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Merriweather:ital,opsz,wght@0,18..144,300..900;1,18..144,300..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&display=swap",
  },
  // Monospace fonts
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Ubuntu+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap",
  },
];

export const meta: MetaFunction = () => {
  return [{ title: "Vision" }, { name: "description", content: "Vision" }];
};

export async function loader({ request }: Route.LoaderArgs) {
  const ENV = getEnv();
  const cookieHeader = request.headers.get("Cookie");

  // Use Epic Web client hints for reliable theme detection
  const hints = getHints(request);
  const prefersDark = hints.theme === "dark";

  const parsedThemeValue = await themeCookie.parse(cookieHeader);
  const parsedModeValue = await modeCookie.parse(cookieHeader);
  const parsedSidebarValue = await sidebarCookie.parse(cookieHeader);

  return rrData({
    ENV,
    initialTheme: parsedThemeValue || "default",
    initialMode: parsedModeValue || "system",
    prefersDark,
    initialSidebarState: parsedSidebarValue ?? true,
    clientHintCheckScript: getClientHintCheckScript(),
  });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { ENV, initialTheme, initialMode, prefersDark, clientHintCheckScript } =
    useLoaderData<RootLoaderData>();

  const initialBodyClasses = cn(
    "antialiased",
    initialTheme ? `theme-${initialTheme}` : "",
    initialTheme?.endsWith("-scaled") ? "theme-scaled" : "",
  );

  const initialHtmlClasses = cn(
    initialMode === "dark" ? "dark" : "",
    initialMode === "light" ? "light" : "",
    initialMode === "system" && prefersDark ? "dark" : "",
    initialMode === "system" && !prefersDark ? "light" : "",
  );

  return (
    <html lang="en" className={initialHtmlClasses} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: clientHintCheckScript,
          }}
        />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className={initialBodyClasses}>
        <ThemeProvider initialTheme={initialTheme} initialMode={initialMode}>
          {children}
          <script
            dangerouslySetInnerHTML={{
              __html: `window.ENV = ${JSON.stringify(ENV ?? {})}`,
            }}
          />
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: { error: unknown }) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
