"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  CalendarIcon,
  CalendarX2Icon,
  ClockIcon,
  FilePenLineIcon,
  GlobeIcon,
  LockIcon,
  MapPinIcon,
  PencilIcon,
  ShieldAlertIcon,
  SparklesIcon,
  TicketIcon,
  UnlockIcon,
  UsersIcon,
} from "lucide-react";
import { EventMoveGroupsSection } from "@/components/events/event-move-groups-section";
import { FriendsGoingCard } from "@/components/events/friends-going-card";
import { ReportEventDialog } from "@/components/events/report-event-dialog";
import { RsvpControls } from "@/components/events/rsvp-controls";
import { ShareEventButton } from "@/components/events/share-event-button";
import { DemoNoticeBanner } from "@/components/shared/demo-notice-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailPageSkeleton } from "@/components/shared/loading-skeletons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSesh } from "@/lib/context/sesh-provider";
import {
  classifyEventTimeWindow,
  formatEventDateTime,
  formatEventTimeRange,
  type EventTimeBucket,
} from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  CAMPUS_AREA_LABEL,
  type EventCategory,
  type EventView,
  type EventVisibility,
} from "@/types/domain";

const CATEGORY_BANNER_STYLES: Record<EventCategory, string> = {
  Bars: "from-amber-500/20 via-orange-500/10 to-background",
  Clubs: "from-fuchsia-500/20 via-violet-500/15 to-background",
  "House Parties": "from-rose-500/20 via-amber-500/10 to-background",
  "Organization Events": "from-sky-500/20 via-cyan-500/10 to-background",
  Sports: "from-emerald-500/20 via-teal-500/10 to-background",
  Concerts: "from-indigo-500/20 via-purple-500/15 to-background",
  Other: "from-slate-500/20 via-zinc-500/10 to-background",
};

function formatVisibilityBadge(visibility: EventVisibility): {
  label: string;
  isRestricted: boolean;
} {
  switch (visibility) {
    case "PUBLIC":
      return { label: "Public", isRestricted: false };
    case "FRIENDS":
      return { label: "Friends Only", isRestricted: true };
    case "CUSTOM":
      return { label: "Custom List", isRestricted: true };
    case "INVITE_ONLY":
      return { label: "Invite-Only", isRestricted: true };
  }
}

function formatTimeBucketBadge(bucket: EventTimeBucket): {
  label: string;
  live?: boolean;
} {
  switch (bucket) {
    case "HAPPENING_NOW":
      return { label: "Happening Now", live: true };
    case "TONIGHT":
      return { label: "Tonight" };
    case "THIS_WEEKEND":
      return { label: "This Weekend" };
    case "UPCOMING":
      return { label: "Upcoming" };
    case "PAST":
      return { label: "Past Move" };
  }
}

function formatUnlockedAddressExplanation(event: EventView): string {
  if (event.canEdit) {
    return "Visible because you are the host of this Move.";
  }
  switch (event.addressPrivacy) {
    case "PUBLIC_VENUE":
      return "Visible to verified GT members because the host set location privacy to Public Venue.";
    case "RSVP_GOING_ONLY":
      return event.viewerResponse === "GOING"
        ? "Unlocked because your Demo Member session is marked as Going."
        : "Unlocked because your Demo Member session is in an accepted Event Move Group.";
    case "APPROVED_GROUP_OR_HOST":
      return "Unlocked because your Demo Member session is an accepted member of an Event Move Group.";
    case "HOST_ONLY":
      return "Visible only to the Move host.";
  }
}

export interface EventDetailViewProps {
  eventId: string;
}

export function EventDetailView({ eventId }: EventDetailViewProps) {
  const { adapter, viewer, nowIso, isHydrated, requireDemoMember } =
    useSesh();
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);

  const lookup = adapter.getEvent(eventId, viewer);

  // Wait for browser hydration before resolving local-demo IDs or persisted viewer permissions
  if (!isHydrated) {
    return <DetailPageSkeleton />;
  }

  if (lookup.status === "NOT_FOUND") {
    return (
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/">
              <ArrowLeftIcon className="size-4" />
              <span>Back to Events Hub</span>
            </Link>
          </Button>
        </div>

        <EmptyState
          icon={<CalendarX2Icon className="size-6" />}
          title="Move Not Found"
          description="We couldn't find a campus Move at this link. It may have been removed, cancelled, or created in another browser's local demo storage."
          action={
            <Button asChild>
              <Link href="/">Browse Campus Moves</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (lookup.status === "RESTRICTED") {
    return (
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/">
              <ArrowLeftIcon className="size-4" />
              <span>Back to Events Hub</span>
            </Link>
          </Button>
        </div>

        <Card className="border-amber-500/30">
          <CardHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlertIcon className="size-5" />
            </div>
            <CardTitle className="text-xl">Restricted Campus Move</CardTitle>
            <CardDescription>{lookup.reason}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-xs text-muted-foreground">
              {viewer.mode === "GUEST" ? (
                <p>
                  You are currently browsing in <strong className="font-medium text-foreground">Guest mode</strong>.
                  Event titles, host details, and private addresses for restricted Moves are never
                  exposed to unauthenticated visitors. Use the Demo Identity Switcher or sign in
                  below to test member permissions.
                </p>
              ) : (
                <p>
                  Your active demo identity (
                  <strong className="font-medium text-foreground">
                    {viewer.user.displayName}
                  </strong>{" "}
                  · @{viewer.user.username}) is outside this Move&apos;s allowed audience. You can
                  switch demo personas in the top navigation bar to test host or friend access.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {viewer.mode === "GUEST" ? (
                <Button
                  type="button"
                  onClick={() =>
                    requireDemoMember("view restricted campus Moves")
                  }
                >
                  Sign In as Demo Member
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/">Back to Events Hub</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { event } = lookup;
  const visibilityInfo = formatVisibilityBadge(event.visibility);
  const timeBucket = classifyEventTimeWindow(
    event.startAt,
    event.endAt,
    nowIso
  );
  const timeBadge = formatTimeBucketBadge(timeBucket);
  const showCoverImage = Boolean(
    event.coverImage && failedCoverUrl !== event.coverImage
  );
  const pricingLabel = event.admission.isFree
    ? event.admission.priceLabel || "Free"
    : event.admission.priceLabel ||
      (event.admission.amountUsd !== undefined
        ? `$${event.admission.amountUsd}`
        : "Paid entry");

  return (
    <div className="space-y-8">
      {/* Top breadcrumb & quick actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/">
            <ArrowLeftIcon className="size-4" />
            <span>Back to Events Hub</span>
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {event.canEdit ? (
            <Button asChild variant="default" size="sm">
              <Link href={`/events/${event.id}/edit`}>
                <PencilIcon className="size-3.5" />
                <span>Edit Move</span>
              </Link>
            </Button>
          ) : null}

          <ShareEventButton
            eventTitle={event.title}
            publicLocation={event.publicDisplayLocation}
          />
          <ReportEventDialog eventId={event.id} eventTitle={event.title} />
        </div>
      </div>

      {/* Host Draft Banner */}
      {event.status === "DRAFT" ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <FilePenLineIcon className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-0.5 text-sm">
              <p className="font-semibold text-foreground">
                Unpublished Draft — Visible only to you
              </p>
              <p className="text-xs text-muted-foreground">
                Other campus members cannot discover this Move or create Move Groups until you
                publish it.
              </p>
            </div>
          </div>
          {event.canEdit ? (
            <Button asChild size="sm" variant="outline" className="shrink-0">
              <Link href={`/events/${event.id}/edit`}>Edit &amp; Publish</Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* Hero Cover / Category Banner */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {showCoverImage ? (
          <div className="relative h-56 w-full bg-muted sm:h-72">
            <img
              src={event.coverImage}
              alt={event.title}
              onError={() => setFailedCoverUrl(event.coverImage ?? null)}
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-background/90 text-foreground backdrop-blur-xs">
                {event.category}
              </Badge>
              <Badge
                variant={timeBadge.live ? "default" : "secondary"}
                className="bg-background/90 text-foreground backdrop-blur-xs"
              >
                {timeBadge.live ? (
                  <span className="mr-1 inline-block size-2 rounded-full bg-emerald-500" />
                ) : null}
                {timeBadge.label}
              </Badge>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "relative flex h-44 flex-col justify-between bg-gradient-to-br p-6 sm:h-52",
              CATEGORY_BANNER_STYLES[event.category]
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <SparklesIcon className="size-3.5" />
                {CAMPUS_AREA_LABEL}
              </span>
              <Badge variant={timeBadge.live ? "default" : "secondary"}>
                {timeBadge.live ? (
                  <span className="mr-1 inline-block size-2 rounded-full bg-emerald-400" />
                ) : null}
                {timeBadge.label}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{event.category}</Badge>
              <span className="text-xs text-muted-foreground">
                {event.publicDisplayLocation}
              </span>
            </div>
          </div>
        )}

        {/* Header metadata block */}
        <div className="space-y-5 p-6">
          {/* Status / Visibility / Source / Pricing badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{event.category}</Badge>

            <Badge variant="outline">
              {visibilityInfo.isRestricted ? (
                <LockIcon className="size-3" />
              ) : (
                <GlobeIcon className="size-3" />
              )}
              <span>{visibilityInfo.label}</span>
            </Badge>

            {event.status === "DRAFT" ? (
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              >
                DRAFT
              </Badge>
            ) : null}

            <Badge
              variant={event.admission.isFree ? "secondary" : "outline"}
              className={cn(
                event.admission.isFree &&
                  "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              )}
            >
              <TicketIcon className="size-3" />
              <span>{event.admission.isFree ? `Free · ${pricingLabel}` : pricingLabel}</span>
            </Badge>

            <Badge variant="outline" className="text-muted-foreground">
              {event.source === "LOCAL_DEMO" ? "Local Demo" : "Campus Seed"}
            </Badge>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {event.title}
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              {formatEventTimeRange(event.startAt, event.endAt)} ·{" "}
              {event.publicDisplayLocation}
            </p>
          </div>

          <Separator />

          {/* Host Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <UserAvatar user={event.host} className="size-10" />
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-foreground">
                    {event.host.displayName}
                  </span>
                  {event.host.verifiedStudent ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:text-sky-300">
                      <BadgeCheckIcon className="size-3" />
                      Verified GT
                    </span>
                  ) : null}
                  {event.canEdit ? (
                    <Badge variant="secondary" className="text-[11px]">
                      You&apos;re hosting
                    </Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  @{event.host.username}
                  {event.host.graduationYear
                    ? ` · Class of ${event.host.graduationYear}`
                    : " · Campus Host"}
                </p>
              </div>
            </div>

            {event.canEdit ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/events/${event.id}/edit`}>
                  <PencilIcon className="size-3.5" />
                  <span>Edit Move Details</span>
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Two-Column Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Schedule, Venue & Privacy Address, Description */}
        <div className="space-y-6 lg:col-span-2">
          {/* Schedule & Location Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">When &amp; Where</CardTitle>
              <CardDescription>
                All times shown in Georgia Tech campus time (America/New_York)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                  <CalendarIcon className="size-4" />
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-foreground">
                    {formatEventTimeRange(event.startAt, event.endAt)}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="size-3" />
                      Starts: {formatEventDateTime(event.startAt)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="size-3" />
                      Ends: {formatEventDateTime(event.endAt)}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Public Location & Venue */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <MapPinIcon className="size-4" />
                  </div>
                  <div className="space-y-0.5 text-sm">
                    <p className="font-medium text-foreground">
                      {event.publicDisplayLocation}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Venue: {event.venue}
                    </p>
                  </div>
                </div>

                {/* Unlocked Private Exact Address OR Locked Privacy Card */}
                {event.unlockedPrivateAddress ? (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <UnlockIcon className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                          Unlocked Exact Address
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {event.unlockedPrivateAddress}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatUnlockedAddressExplanation(event)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : event.hasPrivateAddress ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4">
                    <div className="flex items-start gap-3">
                      <LockIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                          Exact Street Address Locked
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.privateAddressUnlockHint ??
                            "Exact street address is protected by host privacy settings."}
                        </p>
                        {viewer.mode === "GUEST" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            className="mt-1"
                            onClick={() =>
                              requireDemoMember(
                                "unlock exact event addresses when eligible"
                              )
                            }
                          >
                            Switch to Demo Member
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* About / Full Description & Capacity Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">About This Move</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                {event.description}
              </p>

              <Separator />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Admission</p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {event.admission.isFree ? "Free Entry" : "Paid Entry"}
                  </p>
                  <p className="text-xs text-muted-foreground">{pricingLabel}</p>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Capacity</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <UsersIcon className="size-3.5 text-muted-foreground" />
                    <span>
                      {event.capacity
                        ? `${event.capacity} max capacity`
                        : "Open capacity"}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {event.goingCount} Going · {event.interestedCount} Interested
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Move Groups</p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {event.moveGroupCount}{" "}
                    {event.moveGroupCount === 1 ? "active crew" : "active crews"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Visible to your current session
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: RSVP & Friends Going */}
        <div className="space-y-6">
          <RsvpControls event={event} />
          <FriendsGoingCard event={event} />
        </div>
      </div>

      {/* Associated Move Groups Section */}
      <Separator />
      <EventMoveGroupsSection event={event} />

      <DemoNoticeBanner>
        RSVPs, saved Moves, Move Groups, and address privacy unlocks are simulated locally in
        your browser for Milestone 1. Switch demo identities in the header to test Guest,
        Friend, Non-Friend, and Host views.
      </DemoNoticeBanner>
    </div>
  );
}
