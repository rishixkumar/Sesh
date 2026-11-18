"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BeerIcon,
  BookmarkIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CompassIcon,
  Disc3Icon,
  FilePenLineIcon,
  HomeIcon,
  KeyRoundIcon,
  LockIcon,
  MapPinIcon,
  MusicIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useSesh } from "@/lib/context/sesh-provider";
import { classifyEventTimeWindow, formatEventTimeRange } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type {
  EventCategory,
  EventResponseType,
  EventView,
  EventVisibility,
} from "@/types/domain";

export interface EventCardProps {
  event: EventView;
  /** Optional override when rendered inside the "Happening Now" section */
  isHappeningNow?: boolean;
  className?: string;
}

interface CategoryTheme {
  gradient: string;
  accentText: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORY_THEMES: Record<EventCategory, CategoryTheme> = {
  Bars: {
    gradient:
      "from-amber-500/20 via-orange-500/10 to-yellow-500/5 dark:from-amber-500/25 dark:via-orange-500/15 dark:to-background",
    accentText: "text-amber-700 dark:text-amber-300",
    icon: BeerIcon,
  },
  Clubs: {
    gradient:
      "from-violet-500/20 via-fuchsia-500/10 to-indigo-500/5 dark:from-violet-500/30 dark:via-fuchsia-500/15 dark:to-background",
    accentText: "text-violet-700 dark:text-violet-300",
    icon: Disc3Icon,
  },
  "House Parties": {
    gradient:
      "from-rose-500/20 via-pink-500/10 to-amber-500/5 dark:from-rose-500/25 dark:via-pink-500/15 dark:to-background",
    accentText: "text-rose-700 dark:text-rose-300",
    icon: HomeIcon,
  },
  "Organization Events": {
    gradient:
      "from-yellow-500/25 via-amber-500/10 to-slate-500/5 dark:from-yellow-500/25 dark:via-amber-500/10 dark:to-background",
    accentText: "text-yellow-800 dark:text-yellow-300",
    icon: SparklesIcon,
  },
  Sports: {
    gradient:
      "from-emerald-500/20 via-teal-500/10 to-cyan-500/5 dark:from-emerald-500/25 dark:via-teal-500/15 dark:to-background",
    accentText: "text-emerald-700 dark:text-emerald-300",
    icon: TrophyIcon,
  },
  Concerts: {
    gradient:
      "from-sky-500/20 via-indigo-500/10 to-purple-500/5 dark:from-sky-500/25 dark:via-indigo-500/15 dark:to-background",
    accentText: "text-sky-700 dark:text-sky-300",
    icon: MusicIcon,
  },
  Other: {
    gradient:
      "from-teal-500/20 via-slate-500/10 to-zinc-500/5 dark:from-teal-500/25 dark:via-slate-500/15 dark:to-background",
    accentText: "text-teal-700 dark:text-teal-300",
    icon: CompassIcon,
  },
};

function getVisibilityBadgeMeta(visibility: EventVisibility): {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
} | null {
  switch (visibility) {
    case "PUBLIC":
      return null;
    case "FRIENDS":
      return { label: "Friends Only", icon: UsersIcon };
    case "CUSTOM":
      return { label: "Custom List", icon: LockIcon };
    case "INVITE_ONLY":
      return { label: "Invite Only", icon: KeyRoundIcon };
    default:
      return null;
  }
}

export function EventCard({
  event,
  isHappeningNow,
  className,
}: EventCardProps) {
  const { adapter, viewer, nowIso, requireDemoMember } = useSesh();
  const [failedCoverSrc, setFailedCoverSrc] = useState<string | null>(null);

  const theme = CATEGORY_THEMES[event.category] ?? CATEGORY_THEMES.Other;
  const CategoryIcon = theme.icon;

  const isLive =
    isHappeningNow ??
    (event.status === "PUBLISHED" &&
      classifyEventTimeWindow(event.startAt, event.endAt, nowIso) ===
        "HAPPENING_NOW");

  const hasValidCover =
    Boolean(event.coverImage) && failedCoverSrc !== event.coverImage;

  const visibilityMeta = getVisibilityBadgeMeta(event.visibility);
  const formattedTimeRange = formatEventTimeRange(event.startAt, event.endAt);

  const admissionBadgeText = event.admission.isFree
    ? "Free"
    : event.admission.priceLabel || "Paid";

  const secondaryPriceDetail =
    event.admission.isFree &&
    event.admission.priceLabel &&
    event.admission.priceLabel.toLowerCase() !== "free"
      ? event.admission.priceLabel
      : null;

  const handleSetResponse = (nextResponse: EventResponseType | null) => {
    if (viewer.mode === "GUEST") {
      requireDemoMember("save events to your list");
      return;
    }

    try {
      adapter.setEventResponse(event.id, nextResponse, viewer, nowIso);
      if (nextResponse === "SAVED") {
        toast.success("Saved to your Moves", {
          description: event.title,
        });
      } else if (nextResponse === "GOING") {
        toast.success("Marked as Going", {
          description: event.title,
        });
      } else if (nextResponse === "INTERESTED") {
        toast.success("Marked as Interested", {
          description: event.title,
        });
      } else {
        toast("Removed from your Moves", {
          description: event.title,
        });
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not update event response."
      );
    }
  };

  const handleQuickSaveClick = () => {
    if (viewer.mode === "GUEST") {
      requireDemoMember("save events to your list");
      return;
    }

    const nextResponse: EventResponseType | null =
      event.viewerResponse === "SAVED" ? null : "SAVED";
    handleSetResponse(nextResponse);
  };

  const detailHref = `/events/${event.id}`;
  const isDraft = event.status === "DRAFT";

  return (
    <Card
      className={cn(
        "group/event-card flex h-full flex-col pt-0 transition-shadow hover:shadow-md",
        className
      )}
    >
      {/* Visual Cover Banner or Category Header Fallback */}
      <div className="relative h-36 w-full shrink-0 overflow-hidden border-b border-border/60">
        {hasValidCover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.coverImage}
              alt={event.title}
              loading="lazy"
              onError={() => setFailedCoverSrc(event.coverImage ?? null)}
              className="size-full object-cover transition-transform duration-300 group-hover/event-card:scale-[1.02]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/25" />
          </>
        ) : (
          <div
            className={cn(
              "flex size-full items-center justify-center bg-gradient-to-br",
              theme.gradient
            )}
          >
            <div className="flex size-12 items-center justify-center rounded-2xl border border-border/60 bg-background/75 shadow-xs backdrop-blur-xs">
              <CategoryIcon className={cn("size-6", theme.accentText)} />
            </div>
          </div>
        )}

        {/* Top Left Badges: Category + Live / Draft */}
        <div className="absolute top-2.5 left-2.5 flex max-w-[70%] flex-wrap items-center gap-1.5">
          <Badge
            variant="secondary"
            className="bg-background/90 text-foreground shadow-xs backdrop-blur-xs"
          >
            <CategoryIcon className={cn("size-3", theme.accentText)} />
            {event.category}
          </Badge>

          {isLive ? (
            <Badge className="border-emerald-500/30 bg-emerald-600 text-white shadow-xs dark:bg-emerald-500 dark:text-emerald-950">
              <span className="size-1.5 rounded-full bg-current animate-pulse" />
              Live now
            </Badge>
          ) : null}

          {isDraft ? (
            <Badge
              variant="outline"
              className="border-amber-500/50 bg-amber-500/15 text-amber-900 backdrop-blur-xs dark:text-amber-200"
            >
              Draft
            </Badge>
          ) : null}
        </div>

        {/* Top Right Badge: Free / Paid Indicator */}
        <div className="absolute top-2.5 right-2.5">
          <Badge
            variant={event.admission.isFree ? "secondary" : "outline"}
            className={cn(
              "max-w-44 truncate shadow-xs backdrop-blur-xs",
              event.admission.isFree
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200"
                : "bg-background/90 text-foreground"
            )}
            title={
              event.admission.priceLabel ??
              (event.admission.isFree ? "Free" : "Paid entry")
            }
          >
            {admissionBadgeText}
          </Badge>
        </div>
      </div>

      {/* Header: Contextual Visibility/Demo Badges + Title */}
      <CardHeader className="gap-1.5 pb-0">
        {visibilityMeta || event.source === "LOCAL_DEMO" ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {visibilityMeta ? (
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
              >
                <visibilityMeta.icon className="size-3" />
                {visibilityMeta.label}
              </Badge>
            ) : null}

            {event.source === "LOCAL_DEMO" ? (
              <Badge
                variant="outline"
                className="border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300"
              >
                Local Demo
              </Badge>
            ) : null}
          </div>
        ) : null}

        <CardTitle className="line-clamp-2 text-base font-semibold tracking-tight">
          <Link
            href={detailHref}
            className="transition-colors hover:text-primary hover:underline focus-visible:underline focus-visible:outline-none"
          >
            {event.title}
          </Link>
        </CardTitle>
      </CardHeader>

      {/* Body: Time, Safe Location, Privacy Lock, Host, Social Counts */}
      <CardContent className="flex flex-1 flex-col gap-3 text-xs text-muted-foreground">
        <div className="space-y-1.5">
          <div className="flex items-start gap-2 text-foreground/90">
            <CalendarIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <span className="font-medium">{formattedTimeRange}</span>
          </div>

          <div className="flex items-start gap-2">
            <MapPinIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 space-y-0.5">
              <p className="truncate font-medium text-foreground/85">
                {event.publicDisplayLocation}
              </p>
              {event.venue &&
              event.venue !== event.publicDisplayLocation &&
              !event.hasPrivateAddress ? (
                <p className="truncate text-[11px] text-muted-foreground">
                  {event.venue}
                </p>
              ) : null}
              {event.hasPrivateAddress ? (
                <p className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
                  <LockIcon className="size-3 shrink-0" />
                  <span>Approx. area · Exact address protected</span>
                </p>
              ) : null}
            </div>
          </div>

          {secondaryPriceDetail ? (
            <p className="pl-5.5 text-[11px] text-muted-foreground">
              Admission: {secondaryPriceDetail}
            </p>
          ) : null}
        </div>

        {/* Host Row */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <UserAvatar user={event.host} className="size-6 text-[10px]" />
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1">
                <span className="truncate font-medium text-foreground">
                  {event.host.displayName}
                </span>
                {event.host.verifiedStudent ? (
                  <BadgeCheckIcon
                    className="size-3.5 shrink-0 text-sky-600 dark:text-sky-400"
                    aria-label="Verified Georgia Tech student"
                  />
                ) : null}
              </div>
              <p className="truncate text-[11px] text-muted-foreground">
                @{event.host.username}
              </p>
            </div>
          </div>
        </div>

        {/* Attendance, Friends Going & Move Group Counts */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <span className="font-medium text-foreground/85">
            {event.goingCount} going
          </span>

          {event.friendsGoing.length > 0 ? (
            <span
              className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400"
              title={event.friendsGoing.map((f) => f.displayName).join(", ")}
            >
              <UsersIcon className="size-3 shrink-0" />
              {event.friendsGoing.length}{" "}
              {event.friendsGoing.length === 1
                ? "friend going"
                : "friends going"}
            </span>
          ) : null}

          {event.moveGroupCount > 0 ? (
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              {event.moveGroupCount}{" "}
              {event.moveGroupCount === 1 ? "Move Group" : "Move Groups"}
            </span>
          ) : null}
        </div>
      </CardContent>

      {/* Footer: Save / RSVP Quick Action + View Details */}
      <CardFooter className="justify-between gap-2 py-2.5">
        {isDraft ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/events/${event.id}/edit`}>
              <FilePenLineIcon className="size-3.5" />
              Continue editing
            </Link>
          </Button>
        ) : viewer.mode === "MEMBER" &&
          (event.viewerResponse === "GOING" ||
            event.viewerResponse === "INTERESTED") ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={
                  event.viewerResponse === "GOING" ? "default" : "secondary"
                }
                size="sm"
                aria-label={`Current RSVP: ${event.viewerResponse === "GOING" ? "Going" : "Interested"}. Manage response`}
              >
                {event.viewerResponse === "GOING" ? (
                  <CheckCircle2Icon className="size-3.5" />
                ) : (
                  <StarIcon className="size-3.5" />
                )}
                {event.viewerResponse === "GOING" ? "Going" : "Interested"}
                <ChevronDownIcon className="size-3 opacity-75" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel>Your Move status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSetResponse("GOING")}>
                <CheckCircle2Icon className="size-4" />
                Going
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetResponse("INTERESTED")}>
                <StarIcon className="size-4" />
                Interested
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetResponse("SAVED")}>
                <BookmarkIcon className="size-4" />
                Save for later
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => handleSetResponse(null)}
              >
                Clear response
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={event.viewerResponse === "SAVED" ? "secondary" : "outline"}
              size="sm"
              aria-pressed={event.viewerResponse === "SAVED"}
              onClick={handleQuickSaveClick}
            >
              <BookmarkIcon
                className={cn(
                  "size-3.5",
                  event.viewerResponse === "SAVED" && "fill-current"
                )}
              />
              {event.viewerResponse === "SAVED" ? "Saved" : "Save"}
            </Button>

            {viewer.mode === "MEMBER" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="More RSVP options"
                  >
                    <ChevronDownIcon className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                  <DropdownMenuLabel>Quick RSVP</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSetResponse("GOING")}>
                    <CheckCircle2Icon className="size-4" />
                    Mark Going
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSetResponse("INTERESTED")}
                  >
                    <StarIcon className="size-4" />
                    Mark Interested
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      handleSetResponse(
                        event.viewerResponse === "SAVED" ? null : "SAVED"
                      )
                    }
                  >
                    <BookmarkIcon className="size-4" />
                    {event.viewerResponse === "SAVED"
                      ? "Remove Saved"
                      : "Save Move"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        )}

        <Button variant="ghost" size="sm" asChild className="ml-auto">
          <Link href={detailHref}>
            View details
            <ArrowRightIcon className="size-3.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
