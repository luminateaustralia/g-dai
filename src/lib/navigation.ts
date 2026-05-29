import {
  Bot,
  Download,
  Heart,
  Home,
  Lightbulb,
  Route,
  Upload,
  type LucideIcon,
} from "lucide-react";

export type NavSubItem = {
  href: string;
  label: string;
  external?: boolean;
  icon?: LucideIcon;
};

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  children?: NavSubItem[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  {
    href: "/donations",
    label: "Impact",
    icon: Route,
    children: [
      { href: "/donations", label: "Dashboard" },
      { href: "/donations/ledger", label: "Donation ledger" },
      { href: "/donations/queue", label: "Review queue" },
      { href: "/donations/shelters", label: "Shelters" },
      { href: "/donations/thank-you", label: "Thank-you emails" },
      {
        href: "/donations/export",
        label: "Partner-safe export",
        external: true,
        icon: Download,
      },
    ],
  },
  { href: "/wellbeing", label: "Wellbeing", icon: Heart },
  {
    href: "/future",
    label: "Future",
    icon: Lightbulb,
    children: [{ href: "/future/wellness", label: "Wellbeing vision" }],
  },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/import", label: "Import", icon: Upload },
  { href: "/ai", label: "AI", icon: Bot },
];

export function isNavActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function isSubNavActive(pathname: string, href: string) {
  if (href === "/donations") {
    return pathname === "/donations";
  }
  if (href === "/donations/ledger") {
    return (
      pathname.startsWith("/donations/ledger") ||
      pathname.startsWith("/donations/donors") ||
      pathname.startsWith("/donations/traces")
    );
  }
  if (href === "/donations/queue") {
    return pathname.startsWith("/donations/queue");
  }
  if (href === "/donations/shelters") {
    return pathname.startsWith("/donations/shelters");
  }
  if (href === "/donations/thank-you") {
    return pathname.startsWith("/donations/thank-you");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
