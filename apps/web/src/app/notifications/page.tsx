"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  BellIcon,
  BellRingIcon,
  CalendarCheck2Icon,
  CompassIcon,
  KeyRoundIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DemoNoticeBanner } from "@/components/shared/demo-notice-banner";
import { EmptyState } from "@/components/shared/empty-state";
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
import { formatEventDateTime, formatMeetupTime } from "@/lib/dates";

const PLANNED_NOTIFICATION_CHANNELS = [
  {
    icon: UserPlusIcon,
    title: "Move Group Join Requests & Approvals",
    detail:
      "Instant alerts when a Georgia Tech student requests to join your rideshare/walk group or approves your spot.",
  },
  {
    icon: KeyRoundIcon,
    title: "Private Address & Chat Link Unlocks",
    detail:
      "Confirmation when exact house-party directions or group coordination links unlock for your session.",
  },
  {
    icon: UsersIcon,
    title: "Friends-Only Move Drops",
    detail:
      "Opt-in notifications when accepted GT friends publish a new Move or RSVP Going tonight.",
  },
  {
    icon: CalendarCheck2Icon,
    title: "Departure & Meetup Spot Reminders",
    detail:
      "15-minute pre-departure nudges for Tech Square, Campanile, or MARTA group meetup times.",
  },
] as const;

export default function NotificationsPlaceholderPage() {
  const {
    adapter,
    viewer,
    availableDemoUsers,
    setDemoIdentity,
    nowIso,
    revision,
  } = useSesh();

  const { pendingRequestsForHost, myPendingJoinGroups, upcomingGoingEvents } =
    useMemo(() => {
      void revision;
      if (viewer.mode !== "MEMBER") {
        return {
          pendingRequestsForHost: [],
          myPendingJoinGroups: [],
          upcomingGoingEvents: [],
        };
      }

      const groups = adapter.listMoveGroups(viewer);
      const events = adapter.listEvents(viewer, {}, nowIso);

      const hostRequests = groups.flatMap((group) =>
        (group.ownerManagement?.pendingRequests ?? []).map((req) => ({
          group,
          request: req,
        }))
      );

      const viewerPending = groups.filter(
        (group) => group.viewerRelation === "PENDING_REQUEST"
      );

      const going = events
        .filter((evt) => evt.viewerResponse === "GOING")
        .slice(0, 3);

      return {
        pendingRequestsForHost: hostRequests,
        myPendingJoinGroups: viewerPending,
        upcomingGoingEvents: going,
      };
    }, [adapter, viewer, nowIso, revision]);

  const totalSimulatedItems =
    pendingRequestsForHost.length +
    myPendingJoinGroups.length +
    upcomingGoingEvents.length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <>
            <BellIcon className="size-3.5 text-primary" />
            <span>Prototype Activity Center</span>
          </>
        }
        title="Notifications"
        description="Simulated campus coordination state for your active Demo Identity. Real push, SMS, and background activity delivery arrive in a later milestone."
        actions={
          <Button variant="outline" asChild>
            <Link href="/">
              <CompassIcon className="size-4" />
              <span>Back to Events Hub</span>
            </Link>
          </Button>
        }
      />

      <DemoNoticeBanner title="Real Push & Activity Streams Deferred">
        Milestone 1 runs locally in your browser without a background push
        service. Below is a live preview derived from your active Demo
        Identity&apos;s Move Groups and RSVPs so you can jump straight to
        actionable flows.
      </DemoNoticeBanner>

      {viewer.mode === "GUEST" ? (
        <EmptyState
          icon={<BellRingIcon className="size-6" />}
          title="No Notifications in Guest Mode"
          description="Unauthenticated visitors don't have RSVPs, Move Group memberships, or host queues. Switch to Maya Patel to test incoming Move Group join requests."
          action={
            <Button
              type="button"
              onClick={() => {
                const maya = availableDemoUsers[0];
                setDemoIdentity(maya.id);
                toast.success(`Switched Demo Identity to ${maya.displayName}`);
              }}
            >
              Switch to {availableDemoUsers[0].displayName}
            </Button>
          }
          secondaryAction={
            <Button variant="outline" asChild>
              <Link href="/">Browse Events Hub</Link>
            </Button>
          }
        />
      ) : totalSimulatedItems === 0 ? (
        <EmptyState
          icon={<BellIcon className="size-6" />}
          title="All Caught Up in Prototype State"
          description={`No pending Move Group join requests or active Going RSVPs for ${viewer.user.displayName} right now.`}
          action={
            <Button asChild>
              <Link href="/">Explore Campus Moves</Link>
            </Button>
          }
        />
      ) : (
        <section
          aria-labelledby="simulated-activity-heading"
          className="space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h2
              id="simulated-activity-heading"
              className="text-base font-semibold text-foreground"
            >
              Simulated Activity for {viewer.user.displayName}
            </h2>
            <Badge variant="secondary">
              {totalSimulatedItems}{" "}
              {totalSimulatedItems === 1 ? "item" : "items"}
            </Badge>
          </div>

          <div className="space-y-2.5">
            {pendingRequestsForHost.map(({ group, request }) => (
              <Card
                key={request.id}
                size="sm"
                className="border-amber-500/35 bg-amber-500/5"
              >
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      user={request.user}
                      className="mt-0.5 size-9 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge className="h-4 px-1.5 text-[10px]">
                          Action Needed
                        </Badge>
                        <span className="text-sm font-semibold text-foreground">
                          {request.user.displayName} requested to join{" "}
                          {group.name}
                        </span>
                      </div>
                      {request.note ? (
                        <p className="text-xs text-muted-foreground">
                          &ldquo;{request.note}&rdquo;
                        </p>
                      ) : null}
                      <p className="text-[11px] text-muted-foreground">
                        For {group.eventSummary.title} · Requested{" "}
                        {formatEventDateTime(request.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" asChild className="shrink-0">
                    <Link href={`/move-groups/${group.id}`}>
                      <span>Review Request</span>
                      <ArrowRightIcon className="size-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}

            {myPendingJoinGroups.map((group) => (
              <Card key={group.id} size="sm">
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                        Pending Approval
                      </Badge>
                      <span className="text-sm font-medium text-foreground">
                        Your request to join {group.name} is awaiting{" "}
                        {group.roster.creator.displayName}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Meetup: {group.meetupSpot} ·{" "}
                      {formatMeetupTime(group.meetupTime)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild className="shrink-0">
                    <Link href={`/move-groups/${group.id}`}>View Group</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}

            {upcomingGoingEvents.map((event) => (
              <Card key={event.id} size="sm">
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className="h-4 px-1.5 text-[10px]"
                      >
                        RSVP Going
                      </Badge>
                      <span className="text-sm font-medium text-foreground">
                        {event.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatEventDateTime(event.startAt)} ·{" "}
                      {event.publicDisplayLocation}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild className="shrink-0">
                    <Link href={`/events/${event.id}`}>Open Move</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section
        aria-labelledby="planned-notifications-heading"
        className="space-y-3 border-t border-border pt-6"
      >
        <h2
          id="planned-notifications-heading"
          className="text-base font-semibold text-foreground"
        >
          Deferred Backend Notification Channels
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          {PLANNED_NOTIFICATION_CHANNELS.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} size="sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">
                      {item.title}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs leading-relaxed">
                    {item.detail}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
