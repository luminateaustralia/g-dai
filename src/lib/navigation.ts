import {
  Bot,
  Download,
  Heart,
  Home,
  Lightbulb,
  Presentation,
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
      { href: "/donations/shelters", label: "Shelters" },
      { href: "/donations/thank-you", label: "Thank you" },
      {
        href: "/donations/export",
        label: "Partner-safe export",
        external: true,
        icon: Download,
      },
    ],
  },
  {
    href: "/donations-beta",
    label: "Impact (Beta)",
    icon: Route,
    children: [
      { href: "/donations-beta", label: "Dashboard" },
      { href: "/donations-beta/ledger", label: "Allocation ledger" },
      { href: "/donations-beta/reports", label: "Donor reports" },
      {
        href: "/donations-beta/export",
        label: "Ledger export",
        external: true,
        icon: Download,
      },
    ],
  },
  { href: "/wellbeing", label: "Wellbeing", icon: Heart },
  { href: "/presentation", label: "Presentation", icon: Presentation },
  {
    href: "/future",
    label: "Future",
    icon: Lightbulb,
    children: [
      { href: "/future/impact", label: "Impact vision" },
      { href: "/future/wellness", label: "Wellbeing vision" },
    ],
  },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { href: "/import", label: "Import", icon: Upload },
  { href: "/ai", label: "AI", icon: Bot },
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/donations") {
    return (
      pathname === "/donations" ||
      (pathname.startsWith("/donations/") &&
        !pathname.startsWith("/donations-beta"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isSubNavActive(pathname: string, href: string) {
  if (href === "/donations") {
    return pathname === "/donations";
  }
  if (href === "/donations/ledger") {
    return (
      pathname.startsWith("/donations/ledger") ||
      pathname.startsWith("/donations/donors") ||
      pathname.startsWith("/donations/traces") ||
      pathname.startsWith("/donations/queue")
    );
  }
  if (href === "/donations/shelters") {
    return pathname.startsWith("/donations/shelters");
  }
  if (href === "/donations/thank-you") {
    return pathname.startsWith("/donations/thank-you");
  }
  if (href === "/donations-beta") {
    return pathname === "/donations-beta";
  }
  if (href === "/donations-beta/ledger") {
    return pathname.startsWith("/donations-beta/ledger");
  }
  if (href === "/donations-beta/reports") {
    return pathname.startsWith("/donations-beta/reports");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
