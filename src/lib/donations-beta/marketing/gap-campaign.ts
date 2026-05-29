import type { AllocationPool } from "@/db/schema";

export type GapCampaignStats = {
  totalGap: number;
  totalAllocated: number;
  byPool: Record<
    AllocationPool,
    { allocated: number; gap: number; carryForward: number }
  >;
};

export type SocialPost = {
  id: string;
  platform: "Instagram" | "LinkedIn" | "Facebook";
  headline: string;
  graphicSub: string;
  caption: string;
  hashtags: string;
};

export type EmailCampaign = {
  subject: string;
  previewText: string;
  body: string;
};

export type GapCampaignContent = {
  headline: string;
  subheadline: string;
  socialPosts: SocialPost[];
  email: EmailCampaign;
};

function gapBreakdown(stats: GapCampaignStats): string {
  const parts: string[] = [];
  if (stats.byPool.meal.gap > 0) {
    parts.push(`${stats.byPool.meal.gap} meals`);
  }
  if (stats.byPool.care_pack.gap > 0) {
    parts.push(`${stats.byPool.care_pack.gap} care packs`);
  }
  return parts.length ? parts.join(" and ") : `${stats.totalGap} items`;
}

function fundedLine(stats: GapCampaignStats): string {
  if (stats.totalAllocated <= 0) return "";
  return `Donor generosity has already funded ${stats.totalAllocated} meals and care packs this cycle — but shelters are still asking for more.`;
}

export function buildGapCampaignContent(stats: GapCampaignStats): GapCampaignContent {
  const breakdown = gapBreakdown(stats);
  const funded = fundedLine(stats);
  const hasGap = stats.totalGap > 0;

  const headline = hasGap
    ? `${stats.totalGap} still needed this week`
    : "Campaign templates ready";

  const subheadline = hasGap
    ? `Too Good is covering a shortfall of ${breakdown}. Turn community attention into donations with these ready-to-use posts.`
    : "Shelter demand is fully funded this cycle. Save these templates for the next time a gap appears.";

  const socialPosts: SocialPost[] = [
    {
      id: "instagram",
      platform: "Instagram",
      headline: hasGap ? `${stats.totalGap} meals still needed` : "Every donation reaches a shelter",
      graphicSub: hasGap
        ? `Too Good is covering ${breakdown} this week.`
        : "Donor orders matched to real shelter demand.",
      caption: hasGap
        ? `This week, women's shelters asked for more than donors could cover — and Two Good stepped in to fill the gap.\n\nWe're bridging ${breakdown} so no woman goes without a meal or care pack. But we can't do it alone forever.\n\nDonate a meal or care pack today. Every order goes straight to a shelter that needs it.\n\nBuy Good. Do Good.`
        : `Every meal and care pack you donate reaches a women's shelter through Two Good Co.\n\nWhen donor orders meet shelter demand, the whole community wins. When they don't, we cover the gap — but sustained giving keeps us ahead.\n\nDonate today. Buy Good. Do Good.`,
      hashtags:
        "#TwoGoodCo #BuyGoodDoGood #WomensShelters #DonateMeals #CarePacks #CloseTheLoop #SocialImpact",
    },
    {
      id: "linkedin",
      platform: "LinkedIn",
      headline: hasGap ? "Closing the loop means showing the gap" : "Transparent impact, week by week",
      graphicSub: hasGap
        ? `A shortfall of ${breakdown} covered so shelters did not go without.`
        : "Donor contributions matched to shelter fulfilment.",
      caption: hasGap
        ? `Close the Loop update: donor fulfilment is working — and it is also revealing where demand outpaces supply.\n\nThis cycle, Two Good Co covered a shortfall of ${breakdown} so shelters did not go without. ${funded}\n\nWe are sharing this transparently because closing the loop means showing the gap, not hiding it. If your organisation wants to fund meals or care packs for women's shelters, we would love to partner with you.\n\nLearn more at twogood.com.au`
        : `At Two Good Co, we match every donor contribution to real shelter fulfilment — and we report when demand exceeds supply.\n\nTransparent impact data helps partners, donors, and our team act early. This cycle, donor orders met shelter need. Next cycle, we may need your help again.\n\nBuy Good. Do Good.`,
      hashtags:
        "#SocialEnterprise #CorporatePartnerships #ImpactMeasurement #WomensSupport",
    },
    {
      id: "facebook",
      platform: "Facebook",
      headline: hasGap ? "Can you help us get ahead?" : "Shelter demand fully funded",
      graphicSub: hasGap
        ? `Shelters needed ${breakdown} more than donations covered.`
        : "Thank you to everyone who donated this week.",
      caption: hasGap
        ? `Shelters needed ${breakdown} more than donations covered this week — so Too Good filled the gap.\n\nThat is what Close the Loop is about: knowing exactly what shelters asked for, what donors gave, and what still needs funding.\n\nCan you help us get ahead next week? A single meal or care pack donation makes a direct difference to a woman in crisis.\n\nTap the link to donate. Thank you for showing up for our community.`
        : `Great news — donor orders fully funded shelter demand this week at Two Good Co.\n\nThank you to everyone who donated meals and care packs. Your support goes directly to women's shelters across our network.\n\nKeep an eye out — we will share when shelters need extra help. Together, we close the loop.`,
      hashtags: "#TwoGoodCo #CommunitySupport #DonateLocal",
    },
  ];

  const email: EmailCampaign = {
    subject: hasGap
      ? `Shelters still need ${stats.totalGap} meals and care packs — can you help?`
      : "Help us stay ahead of shelter demand",
    previewText: hasGap
      ? `Too Good covered the gap this week. Your donation can reduce the shortfall next time.`
      : "Donor-funded impact, tracked week by week.",
    body: hasGap
      ? `Hi there,

This week, women's shelters in our network requested more meals and care packs than donor orders could fully fund.

The numbers:
• Donor-funded fulfilment: ${stats.totalAllocated}
• Shortfall Too Good covered: ${stats.totalGap} (${breakdown})

We closed the loop so no shelter went without — but covering the gap ourselves is not sustainable every week.

When you donate a meal or care pack through Two Good Co, your contribution is matched to real shelter demand. You see the impact. Shelters get what they need.

Donate today: https://twogood.com.au

Thank you for being part of a community that shows up.

With gratitude,
The Two Good Co team

Buy Good. Do Good.`
      : `Hi there,

Donor orders fully funded shelter demand in our latest Close the Loop cycle — thank you.

The numbers:
• Donor-funded fulfilment: ${stats.totalAllocated}
• Shortfall covered by Too Good: 0

Sustained giving helps us stay ahead when demand spikes. Share our mission with friends, teams, and partners who care about women's shelters.

Donate or partner with us: https://twogood.com.au

With gratitude,
The Two Good Co team

Buy Good. Do Good.`,
  };

  return { headline, subheadline, socialPosts, email };
}
