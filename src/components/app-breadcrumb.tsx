"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  buildBreadcrumbs,
  type BreadcrumbItem as BreadcrumbConfig,
} from "@/lib/breadcrumbs";
import { cn } from "@/lib/utils";

type AppBreadcrumbProps = {
  items?: BreadcrumbConfig[];
  lastLabel?: string;
  className?: string;
};

export function AppBreadcrumb({
  items,
  lastLabel,
  className,
}: AppBreadcrumbProps) {
  const pathname = usePathname();
  const crumbs = items ?? buildBreadcrumbs(pathname, { lastLabel });

  return (
    <Breadcrumb className={cn(className)}>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
