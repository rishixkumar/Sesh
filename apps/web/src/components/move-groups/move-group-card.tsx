"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  LockIcon,
  MapPinIcon,
  MessageSquareIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatMeetupTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type {
  MoveGroupDiscoverability,
  MoveGroupJoinMode,
  MoveGroupView,
  ViewerMoveGroupRelation,
} from "@/types/domain";

export const DISCOVERABILITY_META: Record<
  MoveGroupDiscoverability,
  { label: string; description: string }
> = {
  PUBLIC: {
    label: "Public",
    description: "Visible to anyone who can view the associated event",
  },
  MY_NETWORK: {
    label: "My Network",
    description: "Visible to your campus friends and friends of group members",
  },
  INVITE_ONLY: {
    label: "Invite-only",
    description: "Visible only to invited or accepted members",
  },
};

export const JOIN_MODE_META: Record<
  MoveGroupJoinMode,
  { label: string; description: string }
> = {
  REQUEST_TO_JOIN: {
    label: "Request to Join",
    description: "Interested students request a spot; you approve or decline",
  },
  OPEN_JOIN: {
    label: "Open Join",
    description: "Eligible students join immediately until capacity fills",
  },
  INVITE_ONLY: {
    label: "Invite-only",
    description: "Only explicitly invited students may join",
  },
};

export const VIEWER_RELATION_META: Record<
  ViewerMoveGroupRelation,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  CREATOR: { label: "Group Host", variant: "default" },
  MEMBER: { label: "Accepted Member", variant: "secondary" },
  PENDING_REQUEST: { label: "Join Request Pending", variant: "outline" },
  DECLINED_REQUEST: { label: "Request Declined", variant: "destructive" },
  NONE: { label: "Not Joined", variant: "outline" },
};

export interface MoveGroupCardProps {
  group: MoveGroupView;
  /** Whether to show the parent event link chip at the top of the card (defaults to true) */
  showEventContext?: boolean;
  className?: string;
}

export function MoveGroupCard({
  group,
  showEventContext = true,
  className,
}: MoveGroupCardProps) {
  const discoverabilityInfo = DISCOVERABILITY_META[group.discoverability];
  const joinModeInfo = JOIN_MODE_META[group.joinMode];
  const relationInfo = VIEWER_RELATION_META[group.viewerRelation];
  const pendingCount = group.ownerManagement?.pendingRequests.length ?? 0;

  const friendNames = group.roster.visibleMembers
    .filter((m) => m.isFriend)
    .map((m) => m.displayName.split(" ")[0]);

  return (
    <Card className={cn("flex h-full flex-col justify-between", className)}>
      <div>
        <CardHeader className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">{discoverabilityInfo.label}</Badge>
              <Badge variant="secondary">{joinModeInfo.label}</Badge>
              {group.viewerRelation !== "NONE" ? (
                <Badge variant={relationInfo.variant}>
                  {relationInfo.label}
                </Badge>
              ) : null}
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant={group.isFull ? "destructive" : "outline"}>
                <UsersIcon className="size-3" />
                {group.roster.totalMemberCount}/{group.capacity}
                {group.isFull ? " · Full" : ""}
              </Badge>
            </div>
          </div>

          {showEventContext ? (
            <Link
              href={`/events/${group.eventId}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <CalendarIcon className="size-3.5 shrink-0" />
              <span className="line-clamp-1">{group.eventSummary.title}</span>
            </Link>
          ) : null}

          <CardTitle className="text-base leading-snug sm:text-lg">
            <Link
              href={`/move-groups/${group.id}`}
              className="transition-colors hover:text-primary hover:underline underline-offset-4"
            >
              {group.name}
            </Link>
          </CardTitle>
        </CardHeader>

        <CardContent className="mt-3 space-y-3.5">
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {group.note}
          </p>

          <div className="space-y-1.5 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 text-xs">
            <div className="flex items-center gap-2 text-foreground">
              <ClockIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="font-medium">
                Meetup: {formatMeetupTime(group.meetupTime)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPinIcon className="size-3.5 shrink-0" />
              <span className="line-clamp-1">{group.meetupSpot}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <UserAvatar user={group.roster.creator} className="size-6" />
              <span>
                Hosted by{" "}
                <span className="font-medium text-foreground">
                  {group.roster.creator.displayName}
                </span>
              </span>
            </div>

            {group.hasExternalChatLink ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                {group.unlockedExternalChatLink ? (
                  <>
                    <MessageSquareIcon className="size-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      Chat unlocked
                    </span>
                  </>
                ) : (
                  <>
                    <LockIcon className="size-3" />
                    <span>Members chat</span>
                  </>
                )}
              </span>
            ) : null}
          </div>

          {friendNames.length > 0 || group.roster.anonymousMemberCount > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {friendNames.length > 0 ? (
                <span className="font-medium text-foreground/90">
                  Friends in crew: {friendNames.join(", ")}
                </span>
              ) : null}
              {friendNames.length > 0 && group.roster.anonymousMemberCount > 0 ? (
                <span aria-hidden="true">·</span>
              ) : null}
              {group.roster.anonymousMemberCount > 0 ? (
                <span>
                  +{group.roster.anonymousMemberCount} other student member
                  {group.roster.anonymousMemberCount === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </div>

      <CardFooter className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {group.isFull
            ? "Crew at capacity"
            : `${group.spotsRemaining} spot${group.spotsRemaining === 1 ? "" : "s"} open`}
        </span>

        <div className="flex items-center gap-2">
          {group.canManage ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/move-groups/${group.id}/manage`}>
                <Settings2Icon className="size-3.5" />
                Manage
                {pendingCount > 0 ? (
                  <Badge variant="default" className="ml-0.5 h-4 px-1.5 text-[10px]">
                    {pendingCount}
                  </Badge>
                ) : null}
              </Link>
            </Button>
          ) : null}
          <Button asChild size="sm">
            <Link href={`/move-groups/${group.id}`}>
              View Crew
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
