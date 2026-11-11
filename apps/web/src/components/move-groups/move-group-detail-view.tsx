"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  CopyIcon,
  LockIcon,
  LogOutIcon,
  MapPinIcon,
  MessageSquareIcon,
  SendIcon,
  Settings2Icon,
  ShieldAlertIcon,
  SparklesIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DemoNoticeBanner } from "@/components/shared/demo-notice-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailPageSkeleton } from "@/components/shared/loading-skeletons";
import { PageHeader } from "@/components/shared/page-header";
import {
  DISCOVERABILITY_META,
  JOIN_MODE_META,
  VIEWER_RELATION_META,
} from "@/components/move-groups/move-group-card";
import { MoveGroupInviteDialog } from "@/components/move-groups/move-group-invite-dialog";
import { MoveGroupRoster } from "@/components/move-groups/move-group-roster";
import { useSesh } from "@/lib/context/sesh-provider";
import { SeshAdapterError } from "@/lib/data/adapter";
import { formatEventTimeRange, formatMeetupTime } from "@/lib/dates";

export interface MoveGroupDetailViewProps {
  groupId: string;
}

export function MoveGroupDetailView({ groupId }: MoveGroupDetailViewProps) {
  const { adapter, viewer, isHydrated, requireDemoMember } = useSesh();

  const [requestNote, setRequestNote] = useState("");
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [copiedChatLink, setCopiedChatLink] = useState(false);

  const lookup = adapter.getMoveGroup(groupId, viewer);

  // Wait for client hydration so browser-local Move Groups (`mg-local-*`) and
  // saved Demo Identity sessions resolve cleanly on refresh without flashing Not Found.
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
              Back to Campus Hub
            </Link>
          </Button>
        </div>

        <EmptyState
          icon={<UsersIcon className="size-6" />}
          title="Move Group not found"
          description="We couldn't find a Move Group with that ID in the seed dataset or your browser's local demo storage."
          action={
            <Button asChild>
              <Link href="/">Browse Campus Hub</Link>
            </Button>
          }
          secondaryAction={
            <Button asChild variant="outline">
              <Link href="/move-groups/new">Start a Move Group</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (lookup.status === "DISBANDED") {
    return (
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/">
              <ArrowLeftIcon className="size-4" />
              Back to Campus Hub
            </Link>
          </Button>
        </div>

        <EmptyState
          icon={<AlertCircleIcon className="size-6" />}
          title="This Move Group has been disbanded"
          description="The host closed coordination for this Move Group. Browse the Campus Hub to check the parent event or join another active student crew."
          action={
            <Button asChild>
              <Link href="/">Explore Active Events</Link>
            </Button>
          }
          secondaryAction={
            <Button asChild variant="outline">
              <Link href="/move-groups/new">Start a New Move Group</Link>
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
              Back to Campus Hub
            </Link>
          </Button>
        </div>

        <EmptyState
          icon={<ShieldAlertIcon className="size-6" />}
          title="Restricted Move Group"
          description={lookup.reason}
          action={
            viewer.mode === "GUEST" ? (
              <Button
                type="button"
                onClick={() => requireDemoMember("view restricted Move Groups")}
              >
                Switch to Demo Member Identity
              </Button>
            ) : (
              <Button asChild>
                <Link href="/">Back to Campus Hub</Link>
              </Button>
            )
          }
          secondaryAction={
            viewer.mode === "GUEST" ? (
              <Button asChild variant="outline">
                <Link href="/">Back to Campus Hub</Link>
              </Button>
            ) : undefined
          }
        />

        <DemoNoticeBanner title="Privacy & Access Projection">
          Group names, meetup spots, chat links, and member rosters are withheld
          before rendering when your current identity does not satisfy
          discoverability rules. Use the Demo Identity switcher in the top
          header (for example, switch to{" "}
          <span className="font-medium text-foreground">Maya Patel</span> or{" "}
          <span className="font-medium text-foreground">Jordan Brooks</span>) to
          test authorized access.
        </DemoNoticeBanner>
      </div>
    );
  }

  const { group } = lookup;
  const discoverabilityInfo = DISCOVERABILITY_META[group.discoverability];
  const joinModeInfo = JOIN_MODE_META[group.joinMode];
  const relationInfo = VIEWER_RELATION_META[group.viewerRelation];
  const pendingCount = group.ownerManagement?.pendingRequests.length ?? 0;

  const handleJoinOrRequest = () => {
    if (viewer.mode === "GUEST") {
      requireDemoMember("join or request this Move Group");
      return;
    }

    try {
      const updated = adapter.requestJoin(group.id, viewer, {
        note:
          group.joinMode !== "OPEN_JOIN"
            ? requestNote.trim() || undefined
            : undefined,
        nowIso: new Date().toISOString(),
      });

      setRequestNote("");
      if (updated.viewerRelation === "MEMBER") {
        toast.success(
          "Joined Move Group! Full crew roster and coordination details are now unlocked."
        );
      } else {
        toast.success(
          "Join request sent! Switch to the host's Demo Identity to test approving it live."
        );
      }
    } catch (err) {
      const message =
        err instanceof SeshAdapterError
          ? err.message
          : "Unable to submit join request.";
      toast.error(message);
    }
  };

  const handleLeaveGroup = () => {
    try {
      adapter.leaveMoveGroup(group.id, viewer);
      toast.success("You have left this Move Group.");
    } catch (err) {
      const message =
        err instanceof SeshAdapterError
          ? err.message
          : "Unable to leave Move Group.";
      toast.error(message);
    }
  };

  const handleCopyChatLink = async (chatLink: string) => {
    try {
      await navigator.clipboard.writeText(chatLink);
      setCopiedChatLink(true);
      toast.success("Members-only chat link copied to clipboard.");
      window.setTimeout(() => setCopiedChatLink(false), 2000);
    } catch {
      toast.error("Unable to copy link automatically.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/events/${group.eventId}`}>
            <ArrowLeftIcon className="size-4" />
            Back to {group.eventSummary.title}
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow={
          <div className="flex flex-wrap items-center gap-1.5 normal-case tracking-normal">
            <Badge variant="outline">{discoverabilityInfo.label}</Badge>
            <Badge variant="secondary">{joinModeInfo.label}</Badge>
            <Badge variant={relationInfo.variant}>{relationInfo.label}</Badge>
            <Badge variant="outline">
              {group.source === "LOCAL_DEMO"
                ? "Local Browser Crew"
                : "Seeded Demo Crew"}
            </Badge>
          </div>
        }
        title={group.name}
        description={`Student crew coordinating for ${group.eventSummary.title}`}
        actions={
          <>
            <MoveGroupInviteDialog group={group} />
            {group.canManage ? (
              <Button asChild size="sm">
                <Link href={`/move-groups/${group.id}/manage`}>
                  <Settings2Icon className="size-3.5" />
                  Manage Group
                  {pendingCount > 0 ? (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-4 px-1.5 text-[10px]"
                    >
                      {pendingCount}
                    </Badge>
                  ) : null}
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Associated Event Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <CalendarIcon className="size-3.5" />
                    <span>Associated Event</span>
                    <Badge variant="outline" className="text-[11px]">
                      {group.eventSummary.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">
                    <Link
                      href={`/events/${group.eventId}`}
                      className="hover:text-primary hover:underline underline-offset-4"
                    >
                      {group.eventSummary.title}
                    </Link>
                  </CardTitle>
                </div>

                <Button asChild variant="outline" size="sm">
                  <Link href={`/events/${group.eventId}`}>
                    View Event
                    <ArrowUpRightIcon className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon className="size-3.5 shrink-0" />
                {formatEventTimeRange(
                  group.eventSummary.startAt,
                  group.eventSummary.endAt
                )}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="size-3.5 shrink-0" />
                {group.eventSummary.publicDisplayLocation}
              </span>
            </CardContent>
          </Card>

          {/* Coordination Details & Logistics */}
          <Card>
            <CardHeader>
              <CardTitle>Meet-up Plan & Coordination</CardTitle>
              <CardDescription>
                Pre-event meetup time, rally point, and crew capacity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border border-border/70 bg-muted/25 p-3.5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {group.note}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border/80 bg-background p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <ClockIcon className="size-3.5" />
                    Meet-up Time
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-foreground">
                    {formatMeetupTime(group.meetupTime)}
                  </p>
                </div>

                <div className="rounded-lg border border-border/80 bg-background p-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <MapPinIcon className="size-3.5" />
                    Meeting Spot
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-foreground">
                    {group.meetupSpot}
                  </p>
                </div>

                <div className="rounded-lg border border-border/80 bg-background p-3">
                  <div className="flex items-center justify-between gap-1.5 text-xs font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <UsersIcon className="size-3.5" />
                      Crew Capacity
                    </span>
                    {group.isFull ? (
                      <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">
                        Full
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-foreground">
                    {group.roster.totalMemberCount} / {group.capacity} members
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {group.isFull
                      ? "0 spots remaining"
                      : `${group.spotsRemaining} spot${group.spotsRemaining === 1 ? "" : "s"} remaining`}
                  </p>
                </div>
              </div>

              {/* Members-only External Chat Link */}
              {group.unlockedExternalChatLink ? (
                <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MessageSquareIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-semibold text-foreground">
                          Group Chat Link (Members Only)
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          Unlocked
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Visible because you are an accepted member of this Move
                        Group.
                      </p>
                      <a
                        href={group.unlockedExternalChatLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 break-all font-mono text-xs font-medium text-primary hover:underline"
                      >
                        {group.unlockedExternalChatLink}
                        <ArrowUpRightIcon className="size-3.5 shrink-0" />
                      </a>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopyChatLink(group.unlockedExternalChatLink!)
                      }
                    >
                      {copiedChatLink ? (
                        <>
                          <CheckIcon className="size-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <CopyIcon className="size-3.5" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : group.hasExternalChatLink ? (
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/35 p-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <LockIcon className="size-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-foreground">
                      External group chat link unlocks once you&apos;re an
                      accepted member
                    </p>
                    <p className="text-xs text-muted-foreground">
                      The chat URL is stripped by the adapter for non-members
                      and pending requesters.
                    </p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Privacy-Projected Crew Roster */}
          <MoveGroupRoster roster={group.roster} capacity={group.capacity} />
        </div>

        {/* Sidebar — Membership Actions & Tester Tip */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Crew Status</CardTitle>
              <CardDescription>
                {group.viewerRelation === "CREATOR"
                  ? "You are hosting this Move Group."
                  : group.viewerRelation === "MEMBER"
                    ? "You are an accepted member of this crew."
                    : group.joinMode === "OPEN_JOIN"
                      ? "Open Join — eligible GT members join immediately."
                      : group.joinMode === "REQUEST_TO_JOIN"
                        ? "Request to Join — host reviews incoming requests."
                        : "Invite-only — restricted to invited students."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-xs">
                <span className="text-muted-foreground">Current Status</span>
                <Badge variant={relationInfo.variant}>
                  {relationInfo.label}
                </Badge>
              </div>

              {/* Creator View */}
              {group.canManage ? (
                <div className="space-y-3">
                  {pendingCount > 0 ? (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-xs">
                      <p className="font-medium text-foreground">
                        {pendingCount} pending join request
                        {pendingCount === 1 ? "" : "s"} awaiting review
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        Approve or decline incoming student requests in Manage
                        Group.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Manage join requests, edit meetup details, or remove
                      members anytime.
                    </p>
                  )}

                  <Button asChild className="w-full" size="lg">
                    <Link href={`/move-groups/${group.id}/manage`}>
                      <Settings2Icon className="size-4" />
                      Manage Group
                      {pendingCount > 0 ? (
                        <Badge
                          variant="secondary"
                          className="ml-1 h-4 px-1.5 text-[10px]"
                        >
                          {pendingCount}
                        </Badge>
                      ) : null}
                    </Link>
                  </Button>
                </div>
              ) : null}

              {/* Accepted Non-Creator Member View */}
              {group.viewerRelation === "MEMBER" ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    You have full access to the member roster and coordination
                    details. Need to change plans? You can leave the crew below.
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={() => setLeaveConfirmOpen(true)}
                  >
                    <LogOutIcon className="size-4" />
                    Leave Group
                  </Button>
                </div>
              ) : null}

              {/* Guest Mode Action */}
              {viewer.mode === "GUEST" ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {group.isFull
                      ? "This Move Group is currently at capacity. Sign in as a Demo Member to explore or create another crew."
                      : "Browsing in Guest Mode. Choose a Demo Member identity to join or request a spot in this Move Group."}
                  </p>
                  <Button
                    type="button"
                    className="w-full"
                    size="lg"
                    onClick={handleJoinOrRequest}
                  >
                    <UserPlusIcon className="size-4" />
                    {group.joinMode === "OPEN_JOIN"
                      ? "Join Group"
                      : "Request to Join"}
                  </Button>
                </div>
              ) : null}

              {/* Signed-In Member Eligible to Join or Request */}
              {viewer.mode === "MEMBER" &&
              group.viewerRelation !== "CREATOR" &&
              group.viewerRelation !== "MEMBER" ? (
                group.canRequestOrJoin ? (
                  group.joinMode === "OPEN_JOIN" ? (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Spots are open! Joining immediately unlocks the full
                        crew roster and any members-only group chat link.
                      </p>
                      <Button
                        type="button"
                        className="w-full"
                        size="lg"
                        onClick={handleJoinOrRequest}
                      >
                        <SparklesIcon className="size-4" />
                        Join Group
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="mg-join-request-note"
                          className="text-xs"
                        >
                          Short Intro Note (Optional)
                        </Label>
                        <Textarea
                          id="mg-join-request-note"
                          rows={3}
                          maxLength={240}
                          value={requestNote}
                          onChange={(e) => setRequestNote(e.target.value)}
                          placeholder="e.g., Walking from West Campus — down to split the rideshare!"
                        />
                        <p className="text-[11px] text-muted-foreground">
                          Shared privately with {group.roster.creator.displayName}
                          .
                        </p>
                      </div>

                      <Button
                        type="button"
                        className="w-full"
                        size="lg"
                        onClick={handleJoinOrRequest}
                      >
                        <SendIcon className="size-4" />
                        Request to Join
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    {group.joinBlockedReason ? (
                      <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">
                          {group.viewerRelation === "PENDING_REQUEST"
                            ? "Request Pending Review"
                            : group.viewerRelation === "DECLINED_REQUEST"
                              ? "Request Declined"
                              : group.isFull
                                ? "Capacity Reached"
                                : "Invite Required"}
                        </p>
                        <p className="mt-1">{group.joinBlockedReason}</p>
                      </div>
                    ) : null}

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      {group.viewerRelation === "PENDING_REQUEST"
                        ? "Join Request Pending"
                        : group.viewerRelation === "DECLINED_REQUEST"
                          ? "Request Declined"
                          : group.isFull
                            ? "Move Group Full"
                            : "Invite-Only Group"}
                    </Button>
                  </div>
                )
              ) : null}

              <Separator />

              <div className="text-xs text-muted-foreground">
                Want to organize a separate crew for this event?{" "}
                <Link
                  href={`/move-groups/new?event=${group.eventId}`}
                  className="font-medium text-primary hover:underline"
                >
                  Start another Move Group
                </Link>
              </div>
            </CardContent>
          </Card>

          <DemoNoticeBanner title="Live Multi-User Testing Tip">
            Switch Demo Identity in the top header (for example, between{" "}
            <span className="font-medium text-foreground">Jordan Brooks</span>,{" "}
            <span className="font-medium text-foreground">Tyler Nguyen</span>,
            and{" "}
            <span className="font-medium text-foreground">Maya Patel</span>) to
            test sending a join request, observing friend-only roster masking,
            and approving requests live!
          </DemoNoticeBanner>
        </div>
      </div>

      <ConfirmDialog
        open={leaveConfirmOpen}
        onOpenChange={setLeaveConfirmOpen}
        title="Leave this Move Group?"
        description={`You will lose access to ${group.name}'s full member roster and any members-only chat link.`}
        confirmLabel="Leave Group"
        variant="destructive"
        onConfirm={handleLeaveGroup}
      />
    </div>
  );
}
