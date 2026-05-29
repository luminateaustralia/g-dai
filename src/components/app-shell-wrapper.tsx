import { getCurrentUser } from "@/lib/auth/session";

import { AppShell } from "@/components/app-shell";

export async function AppShellWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <AppShell userName={user.name} userRole={user.role}>
      {children}
    </AppShell>
  );
}
