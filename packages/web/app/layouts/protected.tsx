import { Outlet, useRouteLoaderData } from "react-router";
import { AppSidebar } from "~/components/app-sidebar";
import { SiteHeader } from "~/components/site-header";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { Toaster } from "~/components/ui/sonner";
import { CacheRoute, createClientLoaderCache } from "remix-client-cache";
import { requireSession } from "~/lib/auth.server";
import type { RootLoaderData } from "~/root";
import type { Route } from "./+types/protected";

export type ProtectedLoaderData = typeof loader;

export async function loader({ request }: Route.LoaderArgs) {
  const { properties, headers } = await requireSession(request);

  return {
    user: {
      email: properties.email,
      name: properties.name || properties.email,
    },
    headers,
  };
}

export const clientLoader = createClientLoaderCache<Route.ClientLoaderArgs>();

export default CacheRoute(function ProtectedLayout() {
  const rootData = useRouteLoaderData<RootLoaderData>("root");

  return (
    <SidebarProvider
      defaultOpen={rootData?.initialSidebarState}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="@container/main flex flex-1 flex-col gap-6 px-4 lg:px-6">
            <Outlet />
            <Toaster />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
});
