import { Minus, Plus } from "lucide-react";
import * as React from "react";
import { Link, useLocation } from "react-router";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "~/components/ui/sidebar";

export type NavSubItem = {
  title: string;
  url: string;
  isActive?: boolean;
};

export type NavItem = {
  title: string;
  url?: string; // URL is optional ONLY if it has sub-items
  icon?: React.ElementType;
  items?: NavSubItem[];
  defaultOpen?: boolean;
};

export function NavMain({ items = [] }: { items?: NavItem[] }) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          if (item.items && item.items.length > 0) {
            // Collapsible item
            return (
              <Collapsible
                key={item.title}
                defaultOpen={item.defaultOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      {item.icon && (
                        <item.icon
                          className="h-5 w-5 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      {item.title}{" "}
                      <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                      <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.url}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={
                              location.pathname === subItem.url ||
                              location.pathname.startsWith(subItem.url + "/")
                            }
                          >
                            <Link to={subItem.url}>{subItem.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          } else if (item.url) {
            // Non-collapsible item (must have a URL)
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={
                    !!(
                      location.pathname === item.url ||
                      location.pathname.startsWith(item.url + "/")
                    )
                  }
                >
                  <Link to={item.url}>
                    {item.icon && (
                      <item.icon
                        className="h-5 w-5 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span className="flex-grow">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }
          return null;
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
