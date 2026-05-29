"use client";

import { useMemo, useState } from "react";
import {
  Bookmark,
  Copy,
  Globe,
  Heart,
  Mail,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Send,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TWO_GOOD_BRAND } from "@/lib/email/brand";
import {
  buildGapCampaignContent,
  type EmailCampaign,
  type GapCampaignStats,
  type SocialPost,
} from "@/lib/donations-beta/marketing/gap-campaign";
import { cn } from "@/lib/utils";

const BRAND_WARM = "#C8522A";
const BRAND_WARM_LIGHT = "#FAECE7";
const DONATE_URL = "twogood.com.au";

type GapStatCardProps = {
  stats: GapCampaignStats;
};

async function copyToClipboard(content: string) {
  try {
    await navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Could not copy to clipboard");
  }
}

export function GapStatCard({ stats }: GapStatCardProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"social" | "email">("social");
  const campaign = useMemo(() => buildGapCampaignContent(stats), [stats]);

  return (
    <div className="rounded-lg border px-3 py-2">
      <p className="text-xs text-muted-foreground">Too Good gap</p>
      <p className="text-xl font-semibold tabular-nums">{stats.totalGap}</p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="mt-2 h-7 w-full gap-1.5 text-xs"
            />
          }
        >
          <Megaphone className="size-3.5" />
          Start marketing campaign
        </DialogTrigger>
        <DialogContent className="flex max-h-[90vh] w-[min(1140px,calc(100%-2rem))] flex-col overflow-hidden p-0 sm:max-w-[min(1140px,calc(100%-2rem))]">
          <div
            className="px-5 py-4"
            style={{ backgroundColor: TWO_GOOD_BRAND.backgroundColour }}
          >
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={TWO_GOOD_BRAND.logoUrl}
                alt="Two Good Co"
                className="h-7 w-auto"
              />
              <div className="min-w-0">
                <p
                  className="text-[11px] font-semibold tracking-[0.08em] uppercase"
                  style={{ color: BRAND_WARM }}
                >
                  {TWO_GOOD_BRAND.tagline}
                </p>
                <p className="truncate text-sm font-medium text-zinc-900">
                  Gap fill campaign kit
                </p>
              </div>
            </div>
          </div>

          <DialogHeader className="px-5 pt-4">
            <DialogTitle>{campaign.headline}</DialogTitle>
            <DialogDescription>{campaign.subheadline}</DialogDescription>
          </DialogHeader>

          <div className="px-5 pt-3">
            <div className="inline-flex gap-1 rounded-xl border bg-muted/40 p-1">
              <TabButton
                active={tab === "social"}
                onClick={() => setTab("social")}
                icon={<Share2 className="size-3.5" />}
                label="Social posts"
              />
              <TabButton
                active={tab === "email"}
                onClick={() => setTab("email")}
                icon={<Mail className="size-3.5" />}
                label="Email campaign"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-5">
            {tab === "social" ? (
              <div className="grid gap-4 md:grid-cols-3 md:items-start">
                {campaign.socialPosts.map((post) => (
                  <SocialPostFrame key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="mx-auto max-w-2xl">
                <EmailFrame email={campaign.email} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-zinc-900 text-white"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function BrandGraphic({ post }: { post: SocialPost }) {
  return (
    <div
      className="relative flex aspect-square w-full flex-col justify-between overflow-hidden p-6"
      style={{
        background: `linear-gradient(150deg, ${BRAND_WARM} 0%, #9e3f1f 100%)`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center rounded-full bg-white px-3 py-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={TWO_GOOD_BRAND.logoUrl}
            alt="Two Good Co"
            className="h-4 w-auto"
          />
        </span>
        <Globe className="size-4 text-white/70" />
      </div>

      <div className="space-y-2">
        <p className="text-2xl leading-tight font-semibold text-white sm:text-3xl">
          {post.headline}
        </p>
        <p className="max-w-[85%] text-sm leading-snug text-white/85">
          {post.graphicSub}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium tracking-widest text-white/80 uppercase">
          {TWO_GOOD_BRAND.tagline}
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-zinc-900">
          Donate now
        </span>
      </div>

      <div
        className="pointer-events-none absolute -right-10 -bottom-12 size-44 rounded-full"
        style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
      />
    </div>
  );
}

function SocialPostFrame({ post }: { post: SocialPost }) {
  const fullText = `${post.caption}\n\n${post.hashtags}`;

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-9 items-center justify-center overflow-hidden rounded-full border p-1.5"
            style={{ backgroundColor: "#ffffff" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={TWO_GOOD_BRAND.logoUrl}
              alt="Two Good Co"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="leading-tight">
            <p className="text-[13px] font-semibold text-zinc-900">
              twogoodco
            </p>
            <p className="text-[11px] text-zinc-500">
              {post.platform === "LinkedIn"
                ? "Social enterprise · Promoted"
                : "Sponsored"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
            {post.platform}
          </span>
          <MoreHorizontal className="size-4 text-zinc-400" />
        </div>
      </div>

      <BrandGraphic post={post} />

      <PostActions platform={post.platform} />

      <div className="space-y-2 px-3 pb-3">
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-zinc-800">
          {post.caption}
        </p>
        <p className="text-[13px] font-medium" style={{ color: BRAND_WARM }}>
          {post.hashtags}
        </p>
        <div className="flex justify-end pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => copyToClipboard(fullText)}
          >
            <Copy className="size-3.5" />
            Copy caption
          </Button>
        </div>
      </div>
    </div>
  );
}

function PostActions({ platform }: { platform: SocialPost["platform"] }) {
  if (platform === "Instagram") {
    return (
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-4 text-zinc-800">
          <Heart className="size-5" />
          <MessageCircle className="size-5" />
          <Send className="size-5" />
        </div>
        <Bookmark className="size-5 text-zinc-800" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-around border-t px-3 py-1.5 text-zinc-500">
      <button type="button" className="flex items-center gap-1.5 py-1 text-xs font-medium">
        <ThumbsUp className="size-4" /> Like
      </button>
      <button type="button" className="flex items-center gap-1.5 py-1 text-xs font-medium">
        <MessageCircle className="size-4" /> Comment
      </button>
      <button type="button" className="flex items-center gap-1.5 py-1 text-xs font-medium">
        <Repeat2 className="size-4" /> Repost
      </button>
      <button type="button" className="flex items-center gap-1.5 py-1 text-xs font-medium">
        <Send className="size-4" /> Send
      </button>
    </div>
  );
}

function EmailFrame({ email }: { email: EmailCampaign }) {
  const fullEmail = `Subject: ${email.subject}\n\n${email.body}`;
  const paragraphs = email.body
    .split("\n")
    .map((line) => line.trimEnd());

  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center gap-1.5 border-b bg-zinc-100 px-3 py-2">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-[11px] text-zinc-500">New campaign email</span>
      </div>

      <div className="space-y-1.5 border-b px-4 py-3 text-[12px]">
        <div className="flex gap-2">
          <span className="w-14 shrink-0 text-zinc-400">From</span>
          <span className="font-medium text-zinc-800">
            Two Good Co &lt;hello@twogood.com.au&gt;
          </span>
        </div>
        <div className="flex gap-2">
          <span className="w-14 shrink-0 text-zinc-400">To</span>
          <span className="text-zinc-800">Our donor community</span>
        </div>
        <div className="flex gap-2">
          <span className="w-14 shrink-0 text-zinc-400">Subject</span>
          <span className="font-semibold text-zinc-900">{email.subject}</span>
        </div>
        <div className="flex gap-2">
          <span className="w-14 shrink-0 text-zinc-400">Preview</span>
          <span className="text-zinc-500 italic">{email.previewText}</span>
        </div>
      </div>

      <div style={{ backgroundColor: TWO_GOOD_BRAND.backgroundColour }}>
        <div
          className="px-6 py-5 text-center"
          style={{ backgroundColor: BRAND_WARM_LIGHT }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={TWO_GOOD_BRAND.logoUrl}
            alt="Two Good Co"
            className="mx-auto h-8 w-auto"
          />
          <p
            className="mt-2 text-[11px] font-semibold tracking-[0.14em] uppercase"
            style={{ color: BRAND_WARM }}
          >
            {TWO_GOOD_BRAND.tagline}
          </p>
        </div>

        <div className="mx-4 my-4 rounded-xl bg-white px-5 py-5 shadow-sm">
          <div className="space-y-3 text-[13px] leading-relaxed text-zinc-700">
            {paragraphs.map((line, index) => {
              if (line === "") return <div key={index} className="h-1" />;
              if (line.startsWith("•")) {
                return (
                  <p
                    key={index}
                    className="border-l-2 pl-3 text-zinc-800"
                    style={{ borderColor: BRAND_WARM }}
                  >
                    {line.replace(/^•\s*/, "")}
                  </p>
                );
              }
              if (line.toLowerCase().includes("twogood.com.au")) {
                return null;
              }
              return <p key={index}>{line}</p>;
            })}
          </div>

          <div className="mt-5 text-center">
            <span
              className="inline-block rounded-full px-6 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: BRAND_WARM }}
            >
              Donate now
            </span>
            <p className="mt-2 text-[11px] text-zinc-400">{DONATE_URL}</p>
          </div>
        </div>

        <div className="px-6 pb-5 text-center text-[10px] text-zinc-400">
          Two Good Co · {DONATE_URL} · You are receiving this because you support
          our mission.
        </div>
      </div>

      <div className="flex justify-end border-t px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={() => copyToClipboard(fullEmail)}
        >
          <Copy className="size-3.5" />
          Copy email
        </Button>
      </div>
    </div>
  );
}
