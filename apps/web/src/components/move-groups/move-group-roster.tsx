"use client";

import React from "react";
import {
  CheckCircle2Icon,
  EyeOffIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";
import type { MoveGroupRosterProjection } from "@/types/domain";

export interface MoveGroupRosterProps {
  roster: MoveGroupRosterProjection;
  capacity: number;
  className?: string;
}

export function MoveGroupRoster({
  roster,
  capacity,
  className,
}: MoveGroupRosterProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="border-b border-border/70">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <UsersIcon className="size-4 text-muted-foreground" />
              Crew Roster
            </CardTitle>
            <CardDescription>
              {roster.totalMemberCount} of {capacity} spots filled
            </CardDescription>
          </div>
          <Badge variant={roster.isFullRosterVisible ? "secondary" : "outline"}>
            {roster.isFullRosterVisible
              ? "Full Roster Unlocked"
              : "Privacy-Masked Roster"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-4">
        <ul className="divide-y divide-border/70 rounded-lg border border-border/80 bg-background/60">
          {/* Group Creator / Host — Always visible on viewable Move Groups */}
          <li className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-3">
            <div className="flex items-center gap-3">
              <UserAvatar user={roster.creator} className="size-9" />
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    {roster.creator.displayName}
                  </span>
                  {roster.creator.verifiedStudent ? (
                    <span
                      title="Verified Georgia Tech Student"
                      className="inline-flex items-center gap-0.5 text-[11px] text-emerald-600 dark:text-emerald-400"
                    >
                      <CheckCircle2Icon className="size-3.5" />
                      <span className="sr-only">Verified GT student</span>
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  @{roster.creator.username}
                  {roster.creator.graduationYear
                    ? ` · GT '${String(roster.creator.graduationYear).slice(-2)}`
                    : ""}
                </p>
              </div>
            </div>
            <Badge variant="default">Host / Creator</Badge>
          </li>

          {/* Projected Visible Members (all members for accepted crew; friends ONLY for non-members) */}
          {roster.visibleMembers.map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-3"
            >
              <div className="flex items-center gap-3">
                <UserAvatar user={member} className="size-9" />
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">
                      {member.displayName}
                    </span>
                    {member.verifiedStudent ? (
                      <span
                        title="Verified Georgia Tech Student"
                        className="inline-flex items-center gap-0.5 text-[11px] text-emerald-600 dark:text-emerald-400"
                      >
                        <CheckCircle2Icon className="size-3.5" />
                        <span className="sr-only">Verified GT student</span>
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    @{member.username}
                    {member.graduationYear
                      ? ` · GT '${String(member.graduationYear).slice(-2)}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {member.isFriend ? (
                  <Badge variant="secondary">Friend</Badge>
                ) : null}
                {roster.isFullRosterVisible ? (
                  <Badge variant="outline">Member</Badge>
                ) : null}
              </div>
            </li>
          ))}

          {/* Masked Anonymous Non-Friend Members Summary Row */}
          {roster.anonymousMemberCount > 0 ? (
            <li className="flex items-center gap-3 bg-muted/35 px-3.5 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-muted text-muted-foreground">
                <EyeOffIcon className="size-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  +{roster.anonymousMemberCount} other student member
                  {roster.anonymousMemberCount === 1 ? "" : "s"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Identities visible to accepted group members
                </p>
              </div>
            </li>
          ) : null}
        </ul>

        <div className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-muted/25 px-3 py-2.5 text-xs text-muted-foreground">
          <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            <span className="font-medium text-foreground">
              Privacy-projected roster:
            </span>{" "}
            Roster masking is computed inside the data adapter before rendering
            so unauthorized components never receive hidden member IDs,
            usernames, or avatars. A production backend API will enforce this
            projection server-side.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
