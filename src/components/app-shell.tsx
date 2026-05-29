"use client";

import { type ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, useSidebar } from "@/components/sidebar-provider";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/db/schema";

type AppShellProps = {
  children: ReactNode;
  userName: string;
  userRole: AppRole;
};

function AppShellLayout({ children, userName, userRole }: AppShellProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-svh bg-background">
      <AppSidebar />
      <div
        className={cn(
          "flex min-h-svh flex-col transition-[margin] duration-200 ease-in-out",
          collapsed ? "md:ml-16" : "md:ml-60"
        )}
      >
        <SiteHeader userName={userName} userRole={userRole} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

export function AppShell({ children, userName, userRole }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppShellLayout userName={userName} userRole={userRole}>
        {children}
      </AppShellLayout>
    </SidebarProvider>
  );
}
