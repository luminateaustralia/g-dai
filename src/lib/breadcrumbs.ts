export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BuildBreadcrumbsOptions = {
  lastLabel?: string;
};

const HOME: BreadcrumbItem = { label: "Home", href: "/" };
const IMPACT: BreadcrumbItem = { label: "Impact", href: "/donations" };
const WELLBEING: BreadcrumbItem = { label: "Wellbeing", href: "/wellbeing" };

function withLastLabel(
  crumbs: BreadcrumbItem[],
  lastLabel?: string
): BreadcrumbItem[] {
  if (!lastLabel || crumbs.length === 0) {
    return crumbs;
  }

  const next = [...crumbs];
  next[next.length - 1] = { label: lastLabel };
  return next;
}

export function buildBreadcrumbs(
  pathname: string,
  options?: BuildBreadcrumbsOptions
): BreadcrumbItem[] {
  if (pathname === "/") {
    return [{ label: "Home" }];
  }

  const routes: Array<{
    pattern: RegExp;
    crumbs: (match: RegExpMatchArray) => BreadcrumbItem[];
  }> = [
    {
      pattern: /^\/donations$/,
      crumbs: () => [HOME, { label: "Impact" }],
    },
    {
      pattern: /^\/donations\/ledger$/,
      crumbs: () => [HOME, IMPACT, { label: "Donation ledger" }],
    },
    {
      pattern: /^\/donations\/shelters$/,
      crumbs: () => [HOME, IMPACT, { label: "Shelters" }],
    },
    {
      pattern: /^\/donations\/shelters\/[^/]+$/,
      crumbs: () => [
        HOME,
        IMPACT,
        { label: "Shelters", href: "/donations/shelters" },
        { label: "Shelter" },
      ],
    },
    {
      pattern: /^\/donations\/thank-you$/,
      crumbs: () => [HOME, IMPACT, { label: "Thank-you emails" }],
    },
    {
      pattern: /^\/donations\/traces\/[^/]+$/,
      crumbs: () => [
        HOME,
        IMPACT,
        {
          label: "Donation ledger",
          href: "/donations/ledger?view=needs_attention",
        },
        { label: "Donation trace" },
      ],
    },
    {
      pattern: /^\/donations\/donors\/[^/]+$/,
      crumbs: () => [
        HOME,
        IMPACT,
        { label: "Donation ledger", href: "/donations/ledger" },
        { label: "Donor" },
      ],
    },
    {
      pattern: /^\/wellbeing$/,
      crumbs: () => [HOME, { label: "Wellbeing" }],
    },
    {
      pattern: /^\/wellbeing\/reports\/[^/]+$/,
      crumbs: () => [
        HOME,
        WELLBEING,
        { label: "Report" },
      ],
    },
    {
      pattern: /^\/wellbeing\/review\/[^/]+$/,
      crumbs: () => [
        HOME,
        WELLBEING,
        { label: "Review import" },
      ],
    },
    {
      pattern: /^\/import$/,
      crumbs: () => [HOME, { label: "Import" }],
    },
    {
      pattern: /^\/ai$/,
      crumbs: () => [HOME, { label: "AI" }],
    },
    {
      pattern: /^\/presentation$/,
      crumbs: () => [HOME, { label: "Presentation" }],
    },
    {
      pattern: /^\/future$/,
      crumbs: () => [HOME, { label: "Future" }],
    },
    {
      pattern: /^\/future\/impact$/,
      crumbs: () => [
        HOME,
        { label: "Future", href: "/future" },
        { label: "Impact vision" },
      ],
    },
    {
      pattern: /^\/future\/wellness$/,
      crumbs: () => [
        HOME,
        { label: "Future", href: "/future" },
        { label: "Wellbeing vision" },
      ],
    },
  ];

  for (const route of routes) {
    const match = pathname.match(route.pattern);
    if (match) {
      return withLastLabel(route.crumbs(match), options?.lastLabel);
    }
  }

  const segments = pathname.split("/").filter(Boolean);
  const fallback: BreadcrumbItem[] = [HOME];

  let href = "";
  for (const segment of segments) {
    href += `/${segment}`;
    fallback.push({
      label: formatSegmentLabel(segment),
      href: href === pathname ? undefined : href,
    });
  }

  if (fallback.length > 0) {
    fallback[fallback.length - 1].href = undefined;
  }

  return withLastLabel(fallback, options?.lastLabel);
}

function formatSegmentLabel(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
