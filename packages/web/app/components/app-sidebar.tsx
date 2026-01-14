import {
  IconBook,
  IconDashboard,
  IconPlus,
  IconReport,
  IconTarget,
} from "@tabler/icons-react";
import * as React from "react";
import { useRouteLoaderData } from "react-router";

import type { NavItem } from "~/components/nav-main";
import { NavMain } from "~/components/nav-main";
import { NavSecondary } from "~/components/nav-secondary";
import { NavUser } from "~/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import type { ProtectedLoaderData } from "~/layouts/protected";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const protectedData = useRouteLoaderData<ProtectedLoaderData>("protected");
  const userData = protectedData?.user;

  const mainItems: NavItem[] = [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Session Journal",
      url: "/sessions",
      icon: IconBook,
    },
    {
      title: "Quest Tracker",
      url: "/quests",
      icon: IconTarget,
    },
    {
      title: "DM Option 1",
      url: "/dm-option-1",
      icon: IconPlus,
    },
    {
      title: "Nested",
      icon: IconReport,
      defaultOpen: true,
      items: [
        { title: "Nested 1", url: "/nested/nested-1" },
        { title: "Nested 2", url: "/nested/nested-2" },
        { title: "Nested 3", url: "/nested/nested-3" },
      ],
    },
  ];

  const userProfile = userData
    ? {
        name: userData.name || userData.email,
        email: userData.email,
        avatar: `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=O${userData.name || userData.email}`,
      }
    : undefined;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <img
                  src="/logo-light.svg"
                  alt="Logo"
                  className="h-5 w-auto [filter:contrast(0)_brightness(45%)] dark:[filter:none]"
                />
                <span className="text-base font-semibold">DM Assistant</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainItems} />
        <NavSecondary className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {userProfile && <NavUser user={userProfile} />}
      </SidebarFooter>
    </Sidebar>
  );
}
