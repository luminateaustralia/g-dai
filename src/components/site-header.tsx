"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

import { RoleSwitcher } from "@/components/role-switcher";
import { useSidebar } from "@/components/sidebar-provider";
import type { AppRole } from "@/db/schema";
import { Button } from "@/components/ui/button";

type SiteHeaderProps = {
  userName: string;
  userRole: AppRole;
};

export function SiteHeader({ userName, userRole }: SiteHeaderProps) {
  const { toggleMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 print:hidden">
      <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={toggleMobile}
          aria-label="Open navigation"
        >
          <Menu />
        </Button>
        <Link
          href="/"
          className="flex items-center md:hidden"
          aria-label="Close the Loop home"
        >
          <Image
            src="/two-good-logo.svg"
            alt="Two Good Co"
            width={28}
            height={28}
            priority
          />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground lg:inline">
            {userName}
          </span>
          <RoleSwitcher activeRole={userRole} />
        </div>
      </div>
    </header>
  );
}
