"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookmarkIcon,
  CalendarRangeIcon,
  CheckCircle2Icon,
  EyeIcon,
  FlaskConicalIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DemoNoticeBanner } from "@/components/shared/demo-notice-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DEMO_PERSONA_META,
  DemoIdentitySwitcher,
} from "@/components/layout/demo-identity-switcher";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSesh, type DemoIdentityChoice } from "@/lib/context/sesh-provider";
import { formatEventTimeRange, formatMeetupTime } from "@/lib/dates";
import { CAMPUS_NAME, type EventResponseType } from "@/types/domain";
import { cn } from "@/lib/utils";

const RESPONSE_BADGE_LABELS: Record<EventResponseType, string> = {
  GOING: "Going",
  INTERESTED: "Interested",
  SAVED: "Saved",
};

export default function ProfilePage() {
  const {
    adapter,
    viewer,
    availableDemoUsers,
    setDemoIdentity,
    nowIso,
    revision,
    resetAllDemoData,
  } = useSesh();

  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const { hostedMoves, rsvpAndSavedMoves, myMoveGroups } = useMemo(() => {
    void revision;
    if (viewer.mode !== "MEMBER") {
      return {
        hostedMoves: [],
        rsvpAndSavedMoves: [],
        myMoveGroups: [],
      };
    }

    const events = adapter.listEvents(
      viewer,
      { includeDraftsOwnedByViewer: true },
      nowIso
    );
    const groups = adapter.listMoveGroups(viewer);

    return {
      hostedMoves: events.filter((evt) => evt.hostId === viewer.user.id),
      rsvpAndSavedMoves: events.filter((evt) => evt.viewerResponse !== null),
      myMoveGroups: groups.filter(
        (grp) =>
          grp.viewerRelation === "CREATOR" ||
          grp.viewerRelation === "MEMBER" ||
          grp.viewerRelation === "PENDING_REQUEST"
      ),
    };
  }, [adapter, viewer, nowIso, revision]);

  const activeChoice: DemoIdentityChoice =
    viewer.mode === "GUEST" ? "GUEST" : viewer.user.id;

  const handleIdentitySelect = (
    choice: DemoIdentityChoice,
    label: string
  ) => {
    if (choice === activeChoice) return;
    setDemoIdentity(choice);
    if (choice === "GUEST") {
      toast.info("Switched Demo Identity to Guest (Unauthenticated)");
    } else {
      toast.success(`Switched Demo Identity to ${label}`);
    }
  };

  const handleConfirmReset = () => {
    resetAllDemoData();
    toast.success(
      "Local demo data reset to the initial Georgia Tech seed state."
    );
  };

  const activePersonaMeta =
    viewer.mode === "MEMBER" ? DEMO_PERSONA_META[viewer.user.id] : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <>
            <FlaskConicalIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
            <span>Demo Identity & Activity</span>
          </>
        }
        title="Profile & Prototype Controls"
        description="Inspect your active Georgia Tech Demo Identity, review hosted Moves, RSVPs, and Move Groups, or reset local browser demo state."
        actions={
          <>
            <Button asChild>
              <Link href="/events/new">
                <PlusIcon className="size-4" />
                <span>Create a Move</span>
              </Link>
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setResetDialogOpen(true)}
            >
              <RotateCcwIcon className="size-4" />
              <span>Reset Local Demo Data</span>
            </Button>
          </>
        }
      />

      <DemoNoticeBanner title="Simulated Demo Session (Not Real Authentication)">
        Identities on this page are browser-local Milestone 1 personas for
        testing permissions, friend visibility, and Move Group coordination.
        Real <code className="font-mono text-[11px]">@gatech.edu</code> student
        verification and 18+ account auth arrive in the backend milestone.
      </DemoNoticeBanner>

      {/* Current Identity Summary Card */}
      <Card>
        <CardHeader className="border-b border-border/70">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {viewer.mode === "MEMBER" ? (
              <div className="flex items-start gap-3.5">
                <UserAvatar
                  user={viewer.user}
                  className="size-14 shrink-0 text-base ring-2 ring-primary/20"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg font-semibold">
                      {viewer.user.displayName}
                    </CardTitle>
                    {viewer.user.verifiedStudent ? (
                      <Badge
                        variant="secondary"
                        className="gap-1 text-[11px]"
                      >
                        <CheckCircle2Icon className="size-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{CAMPUS_NAME} · Verified Demo Student</span>
                      </Badge>
                    ) : null}
                    {activePersonaMeta ? (
                      <Badge variant="outline" className="text-[11px]">
                        {activePersonaMeta.roleBadge}
                      </Badge>
                    ) : null}
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    @{viewer.user.username}
                    {viewer.user.graduationYear
                      ? ` · Class of ${viewer.user.graduationYear}`
                      : ""}
                  </CardDescription>
                  {viewer.user.bio ? (
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {viewer.user.bio}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3.5">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-muted text-muted-foreground">
                  <EyeIcon className="size-6" />
                </span>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg font-semibold">
                      Guest (Unauthenticated)
                    </CardTitle>
                    <Badge variant="outline" className="text-[11px]">
                      Unverified Visitor
                    </Badge>
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    Read-only access to public {CAMPUS_NAME} Moves. Friends-Only
                    events, private addresses, and Move Group rosters remain
                    protected.
                  </CardDescription>
                </div>
              </div>
            )}

            <div className="shrink-0">
              <DemoIdentitySwitcher />
            </div>
          </div>
        </CardHeader>

        {viewer.mode === "MEMBER" ? (
          <CardContent className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4">
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Hosted Moves</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {hostedMoves.length}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">RSVPs & Saved</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {rsvpAndSavedMoves.length}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Move Groups</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {myMoveGroups.length}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">GT Friends</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {viewer.user.friendIds.length}
              </p>
            </div>
          </CardContent>
        ) : null}
      </Card>

      {/* Inline Demo Identity Switcher Grid */}
      <section aria-labelledby="persona-switcher-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="persona-switcher-heading"
            className="flex items-center gap-2 text-base font-semibold text-foreground"
          >
            <SparklesIcon className="size-4 text-primary" />
            <span>Switch Demo Identity</span>
          </h2>
          <span className="text-xs text-muted-foreground">
            Instant browser-local persona toggle
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() =>
              handleIdentitySelect("GUEST", "Guest (Unauthenticated)")
            }
            aria-pressed={activeChoice === "GUEST"}
            className={cn(
              "flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              activeChoice === "GUEST"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
            )}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="flex size-8 items-center justify-center rounded-full border border-dashed border-border bg-muted text-muted-foreground">
                <EyeIcon className="size-4" />
              </span>
              <Badge
                variant={activeChoice === "GUEST" ? "default" : "secondary"}
                className="text-[10px]"
              >
                {activeChoice === "GUEST" ? "Active" : "Unverified"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Guest (Unauthenticated)
              </p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                Public feed only · social actions trigger sign-in dialog
              </p>
            </div>
          </button>

          {availableDemoUsers.map((persona) => {
            const isSelected = activeChoice === persona.id;
            const meta = DEMO_PERSONA_META[persona.id];

            return (
              <button
                key={persona.id}
                type="button"
                onClick={() =>
                  handleIdentitySelect(persona.id, persona.displayName)
                }
                aria-pressed={isSelected}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <UserAvatar user={persona} className="size-8" />
                  <Badge
                    variant={isSelected ? "default" : "outline"}
                    className="text-[10px]"
                  >
                    {isSelected ? "Active" : (meta?.roleBadge ?? "GT Member")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {persona.displayName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    @{persona.username}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">
                    {meta?.roleHint ?? persona.bio}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Activity Tabs (Hosted Moves, RSVPs/Saved, Move Groups) */}
      {viewer.mode === "GUEST" ? (
        <EmptyState
          icon={<EyeIcon className="size-6" />}
          title="Select a Demo Member to View Hosted Moves, RSVPs & Groups"
          description="Guest sessions are unauthenticated and cannot host Moves, RSVP, save events, or join Move Groups. Choose Maya, Jordan, or Tyler above to inspect member activity."
          action={
            <Button
              type="button"
              onClick={() =>
                handleIdentitySelect(
                  availableDemoUsers[0].id,
                  availableDemoUsers[0].displayName
                )
              }
            >
              Switch to {availableDemoUsers[0].displayName}
            </Button>
          }
          secondaryAction={
            <Button variant="outline" asChild>
              <Link href="/">Browse Public Hub</Link>
            </Button>
          }
        />
      ) : (
        <Tabs defaultValue="hosted" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
            <TabsTrigger value="hosted">
              <CalendarRangeIcon className="size-3.5" />
              <span>Hosted Moves ({hostedMoves.length})</span>
            </TabsTrigger>
            <TabsTrigger value="rsvps">
              <BookmarkIcon className="size-3.5" />
              <span>RSVPs & Saved ({rsvpAndSavedMoves.length})</span>
            </TabsTrigger>
            <TabsTrigger value="groups">
              <UsersIcon className="size-3.5" />
              <span>Move Groups ({myMoveGroups.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hosted" className="space-y-3">
            {hostedMoves.length === 0 ? (
              <EmptyState
                icon={<CalendarRangeIcon className="size-6" />}
                title="No Moves Hosted Yet"
                description={`${viewer.user.displayName} hasn't published or drafted any Moves yet.`}
                action={
                  <Button asChild>
                    <Link href="/events/new">Create a Move</Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {hostedMoves.map((event) => (
                  <Card key={event.id} size="sm" className="justify-between">
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={
                            event.status === "DRAFT" ? "outline" : "secondary"
                          }
                          className={cn(
                            "text-[10px]",
                            event.status === "DRAFT" &&
                              "border-amber-500/40 text-amber-700 dark:text-amber-300"
                          )}
                        >
                          {event.status === "DRAFT" ? "Private Draft" : "Published"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {event.category}
                        </Badge>
                        {event.visibility !== "PUBLIC" ? (
                          <Badge variant="outline" className="text-[10px]">
                            {event.visibility.replace("_", " ")}
                          </Badge>
                        ) : null}
                      </div>
                      <CardTitle className="mt-1 text-base font-semibold">
                        <Link
                          href={`/events/${event.id}`}
                          className="hover:underline"
                        >
                          {event.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {formatEventTimeRange(event.startAt, event.endAt)}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPinIcon className="size-3.5 shrink-0" />
                        <span className="truncate">
                          {event.publicDisplayLocation}
                        </span>
                      </div>
                      <p>
                        {event.goingCount} Going · {event.interestedCount}{" "}
                        Interested · {event.moveGroupCount}{" "}
                        {event.moveGroupCount === 1
                          ? "Move Group"
                          : "Move Groups"}
                      </p>
                    </CardContent>

                    <CardFooter className="flex items-center justify-between gap-2">
                      <Button variant="outline" size="xs" asChild>
                        <Link href={`/events/${event.id}`}>View Move</Link>
                      </Button>
                      <Button variant="secondary" size="xs" asChild>
                        <Link href={`/events/${event.id}/edit`}>
                          <PencilIcon className="size-3" />
                          <span>Edit</span>
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rsvps" className="space-y-3">
            {rsvpAndSavedMoves.length === 0 ? (
              <EmptyState
                icon={<BookmarkIcon className="size-6" />}
                title="No RSVPs or Saved Moves"
                description="Mark Going, Interested, or Saved on any campus Move in the Events Hub to track it here."
                action={
                  <Button asChild>
                    <Link href="/">Browse Events Hub</Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {rsvpAndSavedMoves.map((event) => {
                  const responseLabel = event.viewerResponse
                    ? RESPONSE_BADGE_LABELS[event.viewerResponse]
                    : "Saved";

                  return (
                    <Card key={event.id} size="sm" className="justify-between">
                      <CardHeader>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant={
                              event.viewerResponse === "GOING"
                                ? "default"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {responseLabel}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {event.category}
                          </Badge>
                        </div>
                        <CardTitle className="mt-1 text-base font-semibold">
                          <Link
                            href={`/events/${event.id}`}
                            className="hover:underline"
                          >
                            {event.title}
                          </Link>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {formatEventTimeRange(event.startAt, event.endAt)}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPinIcon className="size-3.5 shrink-0" />
                          <span className="truncate">
                            {event.publicDisplayLocation}
                          </span>
                        </div>
                        <p>Hosted by {event.host.displayName}</p>
                      </CardContent>

                      <CardFooter>
                        <Button
                          variant="outline"
                          size="xs"
                          asChild
                          className="w-full"
                        >
                          <Link href={`/events/${event.id}`}>Open Move</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="groups" className="space-y-3">
            {myMoveGroups.length === 0 ? (
              <EmptyState
                icon={<UsersIcon className="size-6" />}
                title="No Move Groups Yet"
                description="Join an open group, request a rideshare/walk spot, or start your own Move Group from any published Move."
                action={
                  <Button asChild>
                    <Link href="/">Find a Move Group</Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {myMoveGroups.map((group) => {
                  const pendingCount =
                    group.ownerManagement?.pendingRequests.length ?? 0;

                  return (
                    <Card key={group.id} size="sm" className="justify-between">
                      <CardHeader>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant={
                              group.viewerRelation === "CREATOR"
                                ? "default"
                                : group.viewerRelation === "MEMBER"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-[10px]"
                          >
                            {group.viewerRelation === "CREATOR"
                              ? "Group Creator"
                              : group.viewerRelation === "MEMBER"
                                ? "Accepted Member"
                                : "Request Pending"}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {group.roster.totalMemberCount}/{group.capacity}{" "}
                            spots
                          </Badge>
                          {pendingCount > 0 ? (
                            <Badge
                              variant="outline"
                              className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300"
                            >
                              {pendingCount} pending{" "}
                              {pendingCount === 1 ? "request" : "requests"}
                            </Badge>
                          ) : null}
                        </div>
                        <CardTitle className="mt-1 text-base font-semibold">
                          <Link
                            href={`/move-groups/${group.id}`}
                            className="hover:underline"
                          >
                            {group.name}
                          </Link>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          For {group.eventSummary.title}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-1.5 text-xs text-muted-foreground">
                        <p>
                          <span className="font-medium text-foreground">
                            Meetup:
                          </span>{" "}
                          {group.meetupSpot}
                        </p>
                        <p>{formatMeetupTime(group.meetupTime)}</p>
                      </CardContent>

                      <CardFooter className="flex items-center justify-between gap-2">
                        <Button variant="outline" size="xs" asChild>
                          <Link href={`/move-groups/${group.id}`}>
                            {group.canManage ? "Manage Group" : "Open Group"}
                          </Link>
                        </Button>
                        <Button variant="ghost" size="xs" asChild>
                          <Link href={`/events/${group.eventId}`}>
                            Parent Move
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Local Demo Reset Card */}
      <Card size="sm" className="border-destructive/25 bg-destructive/3">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              Reset Browser-Local Demo Data
            </p>
            <p className="text-xs text-muted-foreground">
              Clears locally created Moves, edits, RSVPs, Saved items, and Move
              Group changes from browser storage and restores the fresh 14-event
              Georgia Tech seed dataset.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="shrink-0"
            onClick={() => setResetDialogOpen(true)}
          >
            <RotateCcwIcon className="size-3.5" />
            <span>Reset Local Demo Data</span>
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        title="Reset local demo data?"
        description="This will remove all locally created Moves, edits, RSVPs, Saved items, and Move Group changes stored in this browser and restore the original Georgia Tech seed dataset."
        confirmLabel="Reset Local Demo Data"
        cancelLabel="Keep Current Data"
        variant="destructive"
        onConfirm={handleConfirmReset}
      />
    </div>
  );
}
