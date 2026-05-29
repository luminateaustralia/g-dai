"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

import {
  BOTTOM_NAV_ITEMS,
  NAV_ITEMS,
  isNavActive,
  isSubNavActive,
  type NavItem,
  type NavSubItem,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/sidebar-provider";

const navLinkClass = (active: boolean, collapsed: boolean, sub = false) =>
  cn(
    "flex items-center rounded-lg transition-colors",
    collapsed
      ? "justify-center px-2 py-2 text-sm font-medium"
      : sub
        ? "px-2.5 py-1.5 text-xs font-normal"
        : "gap-3 px-3 py-2 text-sm font-medium",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : sub
        ? "text-sidebar-foreground/60 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
  );

function SidebarNavLink({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const active = isNavActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      onClick={onNavigate}
      className={navLinkClass(active, collapsed)}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

function SidebarNavSubLink({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavSubItem;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  if (collapsed) return null;

  const active = isSubNavActive(pathname, item.href);
  const className = navLinkClass(active, collapsed, true);

  if (item.external) {
    return (
      <a href={item.href} onClick={onNavigate} className={className}>
        <span className="truncate">{item.label}</span>
      </a>
    );
  }

  return (
    <Link href={item.href} onClick={onNavigate} className={className}>
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SidebarNavGroup({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  return (
    <div>
      <SidebarNavLink
        item={item}
        pathname={pathname}
        collapsed={collapsed}
        onNavigate={onNavigate}
      />
      {!collapsed && item.children?.length ? (
        <div className="ml-7 mt-0.5 space-y-0.5 border-l border-sidebar-border/80 pl-2.5">
          {item.children.map((child) => (
            <SidebarNavSubLink
              key={child.href}
              item={child}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, setMobileOpen, toggleCollapsed } = useSidebar();
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/40 md:hidden print:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 ease-in-out print:hidden",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-sidebar-border",
            collapsed ? "justify-center px-2" : "gap-2.5 px-4"
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex min-w-0 items-center",
              collapsed ? "justify-center" : "gap-2.5"
            )}
            onClick={() => setMobileOpen(false)}
          >
            <Image
              src="/two-good-logo.svg"
              alt="Two Good Co"
              width={28}
              height={28}
              priority
            />
            {!collapsed ? (
              <span className="truncate font-heading text-sm font-semibold tracking-tight">
                Close the Loop
              </span>
            ) : null}
          </Link>
          {!collapsed ? (
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto hidden shrink-0 md:inline-flex"
              onClick={toggleCollapsed}
              aria-label="Collapse navigation"
            >
              <PanelLeftClose />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto shrink-0 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-2">
          {NAV_ITEMS.map((item) =>
            item.children?.length ? (
              <SidebarNavGroup
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
                onNavigate={closeMobile}
              />
            ) : (
              <SidebarNavLink
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
                onNavigate={closeMobile}
              />
            )
          )}
        </nav>

        <div className="mt-auto shrink-0 border-t border-sidebar-border p-2">
          {BOTTOM_NAV_ITEMS.map((item) => (
            <SidebarNavLink
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={closeMobile}
            />
          ))}
          {collapsed ? (
            <Button
              variant="ghost"
              size="icon-sm"
              className="mx-auto mt-1 hidden md:flex"
              onClick={toggleCollapsed}
              aria-label="Expand navigation"
            >
              <PanelLeftOpen />
            </Button>
          ) : null}
        </div>
      </aside>
    </>
  );
}
