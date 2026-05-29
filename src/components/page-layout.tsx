import { AppBreadcrumb } from "@/components/app-breadcrumb";
import type { BreadcrumbItem } from "@/lib/breadcrumbs";
import { cn } from "@/lib/utils";

type PageLayoutProps = {
  children: React.ReactNode;
  className?: string;
  breadcrumbs?: BreadcrumbItem[];
  breadcrumbLabel?: string;
};

export function PageLayout({
  children,
  className,
  breadcrumbs,
  breadcrumbLabel,
}: PageLayoutProps) {
  return (
    <main
      className={cn("mx-auto w-full max-w-7xl px-4 py-10 sm:px-6", className)}
    >
      <AppBreadcrumb
        items={breadcrumbs}
        lastLabel={breadcrumbLabel}
        className="mb-6"
      />
      {children}
    </main>
  );
}
