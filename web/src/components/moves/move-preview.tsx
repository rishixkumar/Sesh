"use client";

import React, { useState } from "react";
import {
  Calendar,
  Eye,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Ticket,
  Unlock,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatEventTimeRange, nyLocalInputToUtcIso } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { MoveFormValues } from "@/lib/validation/schemas";
import type {
  AddressPrivacy,
  EventCategory,
  EventStatus,
  EventVisibility,
  PublicUserSummary,
} from "@/types/domain";

export interface MovePreviewProps {
  values: MoveFormValues;
  host: PublicUserSummary;
  currentStatus?: EventStatus;
  className?: string;
}

const VISIBILITY_LABELS: Record<EventVisibility, string> = {
  PUBLIC: "Public · Campus Feed",
  FRIENDS: "Friends Only",
  CUSTOM: "Custom Audience",
  INVITE_ONLY: "Invite-Only",
};

const PRIVACY_UNLOCK_EXPLANATIONS: Record<AddressPrivacy, string> = {
  PUBLIC_VENUE: "Public venue — full location is visible to anyone who can view this Move.",
  RSVP_GOING_ONLY:
    "Exact address unlocks for verified GT students who RSVP Going or join an Event Move Group.",
  APPROVED_GROUP_OR_HOST:
    "Exact address is shared only with accepted Move Group members and you (the host).",
  HOST_ONLY:
    "Exact address stays hidden on Sesh from all attendees until you share it directly.",
};

const CATEGORY_GRADIENTS: Record<EventCategory, string> = {
  Bars: "from-amber-500/20 via-orange-500/10 to-background",
  Clubs: "from-fuchsia-500/20 via-purple-500/10 to-background",
  "House Parties": "from-indigo-500/20 via-violet-500/10 to-background",
  "Organization Events": "from-sky-500/20 via-cyan-500/10 to-background",
  Sports: "from-emerald-500/20 via-teal-500/10 to-background",
  Concerts: "from-rose-500/20 via-pink-500/10 to-background",
  Other: "from-slate-500/20 via-zinc-500/10 to-background",
};

function isValidHttpUrl(raw?: string): boolean {
  if (!raw || raw.trim().length === 0) return false;
  try {
    const parsed = new URL(raw.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function MovePreview({
  values,
  host,
  currentStatus,
  className,
}: MovePreviewProps) {
  const [perspective, setPerspective] = useState<"GENERAL" | "UNLOCKED">(
    "GENERAL"
  );

  const title = values.title.trim() || "Untitled Campus Move";
  const description =
    values.description.trim() ||
    "Your Move description will appear here so Georgia Tech students know the vibe, timing, and plan.";
  const venue = values.venue.trim() || "Venue or campus spot";
  const publicLocation =
    values.publicDisplayLocation?.trim() || venue || "Midtown / Georgia Tech";
  const privateAddress = values.privateAddress?.trim() || "";
  const hasPrivateAddress = privateAddress.length > 0;

  const startIso = nyLocalInputToUtcIso(values.startLocal);
  const endIso = nyLocalInputToUtcIso(values.endLocal);
  const hasValidRange =
    Boolean(startIso && endIso) &&
    Date.parse(endIso) > Date.parse(startIso);

  const timeRangeLabel = hasValidRange
    ? formatEventTimeRange(startIso, endIso)
    : startIso
      ? "Set an end time after the start time"
      : "Select start & end times (ET)";

  const admissionLabel =
    values.pricingMode === "FREE"
      ? values.priceLabel?.trim() || "Free"
      : values.priceLabel?.trim() || "Paid entry";

  const parsedCapacity =
    values.capacityText &&
    values.capacityText.trim().length > 0 &&
    Number.isInteger(Number(values.capacityText.trim())) &&
    Number(values.capacityText.trim()) >= 1
      ? Number(values.capacityText.trim())
      : null;

  const hasCoverImage = isValidHttpUrl(values.coverImage);

  const isGeneralView = perspective === "GENERAL";
  const canAttendeeUnlockExact =
    values.addressPrivacy === "PUBLIC_VENUE" ||
    values.addressPrivacy === "RSVP_GOING_ONLY" ||
    values.addressPrivacy === "APPROVED_GROUP_OR_HOST";

  const showExactAddressInCurrentTab =
    hasPrivateAddress &&
    (values.addressPrivacy === "PUBLIC_VENUE" ||
      (!isGeneralView && canAttendeeUnlockExact));

  return (
    <Card className={cn("border-border", className)}>
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Eye className="size-4 text-primary" />
            <CardTitle>Move Preview</CardTitle>
          </div>
          {currentStatus ? (
            <Badge
              variant={currentStatus === "PUBLISHED" ? "default" : "secondary"}
            >
              {currentStatus === "PUBLISHED" ? "Published" : "Draft"}
            </Badge>
          ) : (
            <Badge variant="outline">Live Preview</Badge>
          )}
        </div>
        <CardDescription>
          Compare what general campus browsers see versus unlocked attendees.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <Tabs
          value={perspective}
          onValueChange={(val) =>
            setPerspective(val === "UNLOCKED" ? "UNLOCKED" : "GENERAL")
          }
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="GENERAL" type="button">
              <Lock className="size-3.5" />
              General Viewer
            </TabsTrigger>
            <TabsTrigger value="UNLOCKED" type="button">
              <Unlock className="size-3.5" />
              Unlocked Attendee
            </TabsTrigger>
          </TabsList>

          <TabsContent value={perspective} className="mt-3 space-y-3">
            {isGeneralView && values.visibility !== "PUBLIC" ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  Restricted audience ({VISIBILITY_LABELS[values.visibility]}):{" "}
                </span>
                {values.visibility === "FRIENDS"
                  ? "Guests and non-friends cannot see this Move in the campus feed."
                  : "Hidden from general campus browse; only invited or permitted students can open this Move."}
              </div>
            ) : null}

            {/* Simulated Move Card */}
            <div className="overflow-hidden rounded-xl border border-border bg-background shadow-xs">
              <div
                className={cn(
                  "relative flex min-h-36 flex-col justify-between bg-gradient-to-br p-4",
                  CATEGORY_GRADIENTS[values.category] ?? CATEGORY_GRADIENTS.Other
                )}
              >
                {hasCoverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={values.coverImage!.trim()}
                    alt={title}
                    className="absolute inset-0 h-full w-full object-cover opacity-85"
                  />
                ) : null}
                {hasCoverImage ? (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
                ) : null}

                <div className="relative z-10 flex flex-wrap items-center justify-between gap-1.5">
                  <Badge variant="secondary">{values.category}</Badge>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant={
                        values.pricingMode === "FREE" ? "secondary" : "outline"
                      }
                      className={cn(
                        hasCoverImage &&
                          "border-white/30 bg-black/55 text-white"
                      )}
                    >
                      <Ticket className="size-3" />
                      {admissionLabel}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        hasCoverImage
                          ? "border-white/30 bg-black/55 text-white"
                          : "bg-background/80"
                      )}
                    >
                      {VISIBILITY_LABELS[values.visibility]}
                    </Badge>
                  </div>
                </div>

                <div className="relative z-10 mt-6">
                  <h3
                    className={cn(
                      "text-lg leading-snug font-semibold tracking-tight break-words",
                      hasCoverImage ? "text-white" : "text-foreground"
                    )}
                  >
                    {title}
                  </h3>
                </div>
              </div>

              <div className="space-y-3.5 p-4">
                {/* Date & Time */}
                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <Calendar className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">
                      {timeRangeLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Georgia Tech Campus Time (America/New_York)
                    </p>
                  </div>
                </div>

                {/* Location & Address Privacy Simulation */}
                <div className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {values.addressPrivacy === "PUBLIC_VENUE" ? (
                      <div>
                        <p className="font-medium text-foreground">{venue}</p>
                        {values.publicDisplayLocation?.trim() &&
                        values.publicDisplayLocation.trim() !== venue ? (
                          <p className="text-xs text-muted-foreground">
                            {values.publicDisplayLocation.trim()}
                          </p>
                        ) : null}
                        {hasPrivateAddress ? (
                          <p className="mt-0.5 text-xs text-foreground">
                            {privateAddress}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-foreground">
                          {publicLocation}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Venue: {venue}
                        </p>
                      </div>
                    )}

                    {/* Privacy state banner */}
                    {values.addressPrivacy !== "PUBLIC_VENUE" ? (
                      showExactAddressInCurrentTab ? (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-2 text-xs">
                          <div className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
                            <Unlock className="size-3.5 shrink-0" />
                            <span>Unlocked Exact Address</span>
                          </div>
                          <p className="mt-0.5 font-medium text-foreground break-words">
                            {privateAddress}
                          </p>
                        </div>
                      ) : !isGeneralView &&
                        values.addressPrivacy === "HOST_ONLY" &&
                        hasPrivateAddress ? (
                        <div className="rounded-lg border border-border bg-muted/60 px-2.5 py-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5 font-medium text-foreground">
                            <Lock className="size-3.5 shrink-0" />
                            <span>Host-Only Exact Address</span>
                          </div>
                          <p className="mt-0.5">
                            Even RSVP&apos;d attendees still see{" "}
                            <span className="font-medium text-foreground">
                              {publicLocation}
                            </span>{" "}
                            until you share the address directly.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-border bg-muted/60 px-2.5 py-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5 font-medium text-foreground">
                            <Lock className="size-3.5 shrink-0" />
                            <span>Exact Address Masked</span>
                          </div>
                          <p className="mt-0.5">
                            {PRIVACY_UNLOCK_EXPLANATIONS[values.addressPrivacy]}
                          </p>
                          {hasPrivateAddress ? (
                            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                              <ShieldCheck className="size-3.5 shrink-0" />
                              Protected: &ldquo;{privateAddress}&rdquo; is never
                              sent to general viewers.
                            </p>
                          ) : (
                            <p className="mt-1 text-[11px] italic">
                              Add an optional private exact address in the form
                              to test unlocking.
                            </p>
                          )}
                        </div>
                      )
                    ) : null}
                  </div>
                </div>

                {/* Description */}
                <p className="line-clamp-4 text-xs leading-relaxed whitespace-pre-line text-muted-foreground sm:text-sm">
                  {description}
                </p>

                {/* Host & Capacity Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar user={host} className="size-6" />
                    <div className="text-xs">
                      <span className="font-medium text-foreground">
                        {host.displayName}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        @{host.username}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {parsedCapacity ? (
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" />
                        Cap {parsedCapacity}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Sparkles className="size-3.5" />
                        Open capacity
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
