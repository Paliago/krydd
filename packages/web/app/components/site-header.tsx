import { MoonIcon, SunIcon } from "lucide-react";
import { useLocation, useRouteLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { useTheme } from "~/hooks/theme-provider";
import type { ProtectedLoaderData } from "~/layouts/protected";

function getPageTitle(pathname: string, extraString?: string): string {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return "Home";

  // Take the last segment and convert to title case
  const lastSegment = segments[segments.length - 1];
  const title = lastSegment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  if (title === "Dashboard")
    return `${title}${extraString ? ` - ${extraString}` : ""}`;

  // You can set specific titles for certain pages here
  if (title === "Settings") return "User Settings";
  return title;
}

export function SiteHeader() {
  const location = useLocation();
  const rootData = useRouteLoaderData<ProtectedLoaderData>("protected");

  // can add extra string to the title here
  const title = getPageTitle(location.pathname);
  const { mode, setMode } = useTheme();

  const handleThemeToggle = (e: React.MouseEvent) => {
    if (mode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const current = mediaQuery.matches ? "dark" : "light";
      setMode(current === "light" ? "dark" : "light", {
        x: e.clientX,
        y: e.clientY,
      });
    }

    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode, { x: e.clientX, y: e.clientY });
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeToggle}
            className="rounded-full cursor-pointer"
          >
            {mode === "light" ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
