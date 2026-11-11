"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  ClockIcon,
  EyeIcon,
  LockIcon,
  MapPinIcon,
  PlusIcon,
  Settings2Icon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSesh } from "@/lib/context/sesh-provider";
import { formatMeetupTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type {
  EventView,
  MoveGroupDiscoverability,
  MoveGroupJoinMode,
  MoveGroupView,
  ViewerMoveGroupRelation,
} from "@/types/domain";

function formatDiscoverabilityLabel(value: MoveGroupDiscoverability): string {
  switch (value) {
    case "PUBLIC":
      return "Public Group";
    case "MY_NETWORK":
      return "My Network";
    case "INVITE_ONLY":
      return "Invite-Only";
  }
}

function formatJoinModeLabel(value: MoveGroupJoinMode): string {
  switch (value) {
    case "OPEN_JOIN":
      return "Open Join";
    case "REQUEST_TO_JOIN":
      return "Request to Join";
    case "INVITE_ONLY":
      return "Invite Only";
  }
}

function renderViewerRelationBadge(relation: ViewerMoveGroupRelation) {
  switch (relation) {
    case "CREATOR":
      return <Badge variant="default">Creator</Badge>;
    case "MEMBER":
      return (
        <Badge
          variant="secondary"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        >
          Member
        </Badge>
      );
    case "PENDING_REQUEST":
      return (
        <Badge
          variant="outline"
          className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        >
          Request Pending
        </Badge>
      );
    case "DECLINED_REQUEST":
      return <Badge variant="destructive">Request Declined</Badge>;
    case "NONE":
      return null;
  }
}

function renderRosterSummaryText(group: MoveGroupView): string {
  const { roster } = group;
  const visibleFriendCount = roster.visibleMembers.filter(
    (m) => m.isFriend
  ).length;

  if (roster.isFullRosterVisible) {
    if (roster.visibleMembers.length === 0) {
      return "Just the organizer so far — full member roster unlocked.";
    }
    const names = roster.visibleMembers.map((m) => m.displayName).join(", ");
    return `With ${names} (full member roster unlocked).`;
  }

  const segments: string[] = [];
  if (roster.visibleMembers.length > 0) {
    const names = roster.visibleMembers.map((m) => m.displayName).join(", ");
    segments.push(
      visibleFriendCount === 1
        ? `Includes your friend ${names}`
        : `Includes your friends ${names}`
    );
  }

  if (roster.anonymousMemberCount > 0) {
    segments.push(
      `+${roster.anonymousMemberCount} other GT ${
        roster.anonymousMemberCount === 1 ? "student" : "students"
      } (identities hidden until joined)`
    );
  }

  if (segments.length === 0) {
    return "Hosted by organizer — spots open to coordinate heading over together.";
  }

  return segments.join(" · ");
}

export interface EventMoveGroupsSectionProps {
  event: EventView;
  className?: string;
}

export function EventMoveGroupsSection({
  event,
  className,
}: EventMoveGroupsSectionProps) {
  const { adapter, viewer, requireDemoMember } = useSesh();

  const moveGroups = adapter.listMoveGroups(viewer, event.id);

  const createHref = `/move-groups/new?event=${encodeURIComponent(event.id)}`;
  const isEventPublished = event.status === "PUBLISHED";

  const renderCreateButton = (size: "default" | "sm" = "default") => {
    if (!isEventPublished) {
      return (
        <Button type="button" size={size} disabled title="Publish this Move first">
          <PlusIcon className="size-4" />
          <span>Publish Move to Add Groups</span>
        </Button>
      );
    }

    if (viewer.mode === "MEMBER") {
      return (
        <Button asChild size={size}>
          <Link href={createHref}>
            <PlusIcon className="size-4" />
            <span>Create Move Group</span>
          </Link>
        </Button>
      );
    }

    return (
      <Button
        type="button"
        size={size}
        onClick={() =>
          requireDemoMember("create a Move Group for this event")
        }
      >
        <PlusIcon className="size-4" />
        <span>Create Move Group</span>
      </Button>
    );
  };

  return (
    <section className={cn("space-y-4", className)} aria-labelledby="move-groups-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="move-groups-heading"
              className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
            >
              Move Groups
            </h2>
            <Badge variant="secondary">{moveGroups.length} visible</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Pre-event crews coordinating meetup spots, walk/rideshare timing, and arrival together.
          </p>
        </div>

        <div className="shrink-0">{renderCreateButton("default")}</div>
      </div>

      {viewer.mode === "GUEST" ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3.5 py-2.5 text-xs text-muted-foreground">
          <LockIcon className="size-3.5 shrink-0" />
          <span>
            Showing <strong className="font-medium text-foreground">Public</strong> Move Groups
            only. Sign in as a Demo Member to view friend-network groups or start your own.
          </span>
        </div>
      ) : null}

      {moveGroups.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="size-5" />}
          title={
            isEventPublished
              ? "No visible Move Groups for this Move yet"
              : "Move Groups unlock once this draft is published"
          }
          description={
            isEventPublished
              ? "Start a Move Group so friends or classmates can meet up on campus and head over together instead of arriving solo."
              : "Edit this draft Move and publish it to start coordinating Move Groups."
          }
          action={renderCreateButton("default")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {moveGroups.map((group) => {
            const pendingCount =
              group.ownerManagement?.pendingRequests.length ?? 0;

            return (
              <Card key={group.id} className="flex flex-col justify-between">
                <CardHeader className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline">
                        {formatDiscoverabilityLabel(group.discoverability)}
                      </Badge>
                      <Badge variant="secondary">
                        {formatJoinModeLabel(group.joinMode)}
                      </Badge>
                      {group.source === "LOCAL_DEMO" ? (
                        <Badge variant="outline" className="text-[11px]">
                          Local Demo
                        </Badge>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {renderViewerRelationBadge(group.viewerRelation)}
                      <Badge
                        variant={group.isFull ? "destructive" : "outline"}
                        className="tabular-nums"
                      >
                        {group.roster.totalMemberCount}/{group.capacity}
                        {group.isFull ? " · Full" : ""}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <CardTitle className="text-base">
                      <Link
                        href={`/move-groups/${group.id}`}
                        className="hover:underline"
                      >
                        {group.name}
                      </Link>
                    </CardTitle>
                    {group.note ? (
                      <CardDescription className="mt-1 line-clamp-2">
                        {group.note}
                      </CardDescription>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Meetup details */}
                  <div className="space-y-1.5 rounded-lg bg-muted/40 p-3 text-xs">
                    <div className="flex items-center gap-2 text-foreground">
                      <ClockIcon className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="font-medium">
                        Meetup: {formatMeetupTime(group.meetupTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPinIcon className="size-3.5 shrink-0" />
                      <span className="truncate">{group.meetupSpot}</span>
                    </div>
                  </div>

                  {/* Privacy-preserving roster summary */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <UserAvatar
                          user={group.roster.creator}
                          className="size-6"
                        />
                        <span className="truncate text-xs text-muted-foreground">
                          Led by{" "}
                          <strong className="font-medium text-foreground">
                            {group.roster.creator.displayName}
                          </strong>{" "}
                          (@{group.roster.creator.username})
                        </span>
                      </div>

                      {group.roster.visibleMembers.length > 0 ? (
                        <div className="flex -space-x-1.5">
                          {group.roster.visibleMembers.slice(0, 3).map((m) => (
                            <UserAvatar
                              key={m.id}
                              user={m}
                              className="size-6 ring-2 ring-card"
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      {group.roster.isFullRosterVisible ? (
                        <ShieldCheckIcon className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <EyeIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span>{renderRosterSummaryText(group)}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {group.isFull
                      ? "Group at capacity"
                      : `${group.spotsRemaining} ${
                          group.spotsRemaining === 1 ? "spot" : "spots"
                        } open`}
                  </span>

                  <div className="flex items-center gap-2">
                    {group.canManage ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/move-groups/${group.id}/manage`}>
                          <Settings2Icon className="size-3.5" />
                          <span>
                            Manage
                            {pendingCount > 0 ? ` (${pendingCount})` : ""}
                          </span>
                        </Link>
                      </Button>
                    ) : null}

                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/move-groups/${group.id}`}>
                        <span>View Group</span>
                        <ArrowRightIcon className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
