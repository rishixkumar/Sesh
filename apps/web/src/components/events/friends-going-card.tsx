"use client";

import React from "react";
import { BadgeCheckIcon, LockIcon, UsersIcon } from "lucide-react";
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
import { useSesh } from "@/lib/context/sesh-provider";
import { cn } from "@/lib/utils";
import type { EventView } from "@/types/domain";

export interface FriendsGoingCardProps {
  event: EventView;
  className?: string;
}

export function FriendsGoingCard({ event, className }: FriendsGoingCardProps) {
  const { viewer, requireDemoMember } = useSesh();

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <UsersIcon className="size-4 text-muted-foreground" />
            <span>Friends Going</span>
          </CardTitle>
          <Badge variant="secondary">
            {event.goingCount} {event.goingCount === 1 ? "student" : "students"} Going
          </Badge>
        </div>
        <CardDescription>
          Campus social proof scoped to your Georgia Tech network
        </CardDescription>
      </CardHeader>

      <CardContent>
        {viewer.mode === "GUEST" ? (
          <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-3.5">
            <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
              <LockIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p>
                Signing in as a <strong className="font-medium text-foreground">Demo Member</strong>{" "}
                reveals which of your connected Georgia Tech friends have marked{" "}
                <strong className="font-medium text-foreground">Going</strong> ({event.goingCount}{" "}
                campus-wide right now).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                requireDemoMember("see which campus friends are Going")
              }
            >
              Sign In as Demo Member
            </Button>
          </div>
        ) : event.friendsGoing.length > 0 ? (
          <div className="space-y-2.5">
            <ul className="divide-y divide-border/60">
              {event.friendsGoing.map((friend) => (
                <li
                  key={friend.id}
                  className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <UserAvatar user={friend} className="size-8 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                        <span className="truncate">{friend.displayName}</span>
                        {friend.verifiedStudent ? (
                          <BadgeCheckIcon
                            className="size-3.5 shrink-0 text-sky-600 dark:text-sky-400"
                            aria-label="Verified GT student"
                          />
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        @{friend.username}
                        {friend.graduationYear
                          ? ` · GT '${String(friend.graduationYear).slice(-2)}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[11px]">
                    Friend · Going
                  </Badge>
                </li>
              ))}
            </ul>

            {event.goingCount > event.friendsGoing.length ? (
              <p className="pt-1 text-xs text-muted-foreground">
                Plus {event.goingCount - event.friendsGoing.length} other GT{" "}
                {event.goingCount - event.friendsGoing.length === 1
                  ? "student"
                  : "students"}{" "}
                marked Going campus-wide.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">
              None of your connected friends have marked Going yet.
            </p>
            <p className="mt-1">
              {event.goingCount > 0
                ? `${event.goingCount} GT ${
                    event.goingCount === 1 ? "student has" : "students have"
                  } marked Going campus-wide — mark Going or start a Move Group to rally your crew.`
                : "Be the first on campus to mark Going and invite your crew."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
