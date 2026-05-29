"use client";

import { useTransition } from "react";
import { UserCog } from "lucide-react";

import { APP_ROLES, type AppRole } from "@/db/schema";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { setActiveRole } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function RoleSwitcher({ activeRole }: { activeRole: AppRole }) {
  const [isPending, startTransition] = useTransition();

  function handleChange(role: string) {
    startTransition(() => {
      void setActiveRole(role as AppRole);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" disabled={isPending}>
            <UserCog />
            <span className="hidden sm:inline">{ROLE_LABELS[activeRole]}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuRadioGroup value={activeRole} onValueChange={handleChange}>
          <DropdownMenuLabel>Acting as role (prototype)</DropdownMenuLabel>
          {APP_ROLES.map((role) => (
            <DropdownMenuRadioItem key={role} value={role}>
              {ROLE_LABELS[role]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
