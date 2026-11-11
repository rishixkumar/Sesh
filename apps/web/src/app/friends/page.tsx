"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2Icon,
  CompassIcon,
  EyeOffIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DemoNoticeBanner } from "@/components/shared/demo-notice-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { UserAvatar } from "@/components/shared/user-avatar";
import { DEMO_PERSONA_META } from "@/components/layout/demo-identity-switcher";
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
import { SEED_USERS } from "@/lib/mock/seed";
import { CAMPUS_NAME } from "@/types/domain";

export default function FriendsNetworkPage() {
  const {
    adapter,
    viewer,
    availableDemoUsers,
    setDemoIdentity,
    nowIso,
    revision,
  } = useSesh();

  const visibleEvents = useMemo(() => {
    void revision;
    return adapter.listEvents(viewer, {}, nowIso);
  }, [adapter, viewer, nowIso, revision]);

  const switchableIds = useMemo(
    () => new Set(availableDemoUsers.map((u) => u.id)),
    [availableDemoUsers]
  );

  const { friends, nonFriendCampusUsers } = useMemo(() => {
    if (viewer.mode !== "MEMBER") {
      return { friends: [], nonFriendCampusUsers: SEED_USERS };
    }
    const friendIdSet = new Set(viewer.user.friendIds);
    return {
      friends: SEED_USERS.filter((u) => friendIdSet.has(u.id)),
      nonFriendCampusUsers: SEED_USERS.filter(
        (u) => u.id !== viewer.user.id && !friendIdSet.has(u.id)
      ),
    };
  }, [viewer]);

  const handleSwitchPersona = (userId: string, displayName: string) => {
    setDemoIdentity(userId);
    toast.success(`Switched Demo Identity to ${displayName}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <>
            <UsersIcon className="size-3.5 text-primary" />
            <span>{CAMPUS_NAME} Social Graph (Simulated)</span>
          </>
        }
        title="Campus Friends"
        description="Your Georgia Tech friend network powers Friends-Only event access, social proof on the Events Hub, and privacy-preserving Move Group rosters."
        actions={
          <Button variant="outline" asChild>
            <Link href="/">
              <CompassIcon className="size-4" />
              <span>Explore Events Hub</span>
            </Link>
          </Button>
        }
      />

      <DemoNoticeBanner title="Simulated Friend Graph · Backend Social Graph Upcoming">
        Friend requests, mutual-friend search, blocking, and verified{" "}
        <code className="font-mono text-[11px]">@gatech.edu</code> student
        onboarding land in the backend milestone. In Milestone 1, switch Demo
        Identities to inspect how friend edges change event visibility and Move
        Group roster masking immediately.
      </DemoNoticeBanner>

      {viewer.mode === "GUEST" ? (
        <div className="space-y-6">
          <EmptyState
            icon={<UsersIcon className="size-6" />}
            title="Guest Mode Has No Campus Friend Network"
            description="Because Guest (Unauthenticated) represents an unverified visitor, Friends-Only Moves are hidden, friend attendance badges are empty, and non-creator Move Group members stay masked."
            action={
              <Button
                type="button"
                onClick={() =>
                  handleSwitchPersona(
                    availableDemoUsers[0].id,
                    availableDemoUsers[0].displayName
                  )
                }
              >
                Switch to {availableDemoUsers[0].displayName} (Primary Host)
              </Button>
            }
            secondaryAction={
              <Button variant="outline" asChild>
                <Link href="/">Browse Public Moves</Link>
              </Button>
            }
          />

          <section aria-labelledby="demo-personas-heading" className="space-y-3">
            <h2
              id="demo-personas-heading"
              className="text-base font-semibold text-foreground"
            >
              Try a Simulated Georgia Tech Persona
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {availableDemoUsers.map((persona) => {
                const meta = DEMO_PERSONA_META[persona.id];
                return (
                  <Card key={persona.id} size="sm" className="justify-between">
                    <CardHeader>
                      <div className="flex items-center gap-2.5">
                        <UserAvatar user={persona} className="size-9" />
                        <div className="min-w-0">
                          <CardTitle className="truncate text-sm">
                            {persona.displayName}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            @{persona.username} · {persona.friendIds.length} GT{" "}
                            {persona.friendIds.length === 1
                              ? "friend"
                              : "friends"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs text-muted-foreground">
                      {meta ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {meta.roleBadge}
                        </Badge>
                      ) : null}
                      <p className="leading-relaxed">
                        {meta?.roleHint ?? persona.bio}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          handleSwitchPersona(persona.id, persona.displayName)
                        }
                      >
                        Browse as {persona.displayName.split(" ")[0]}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-8">
          <Card size="sm">
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar user={viewer.user} className="size-10" />
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">
                      Viewing {viewer.user.displayName}&apos;s GT Network
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {friends.length}{" "}
                      {friends.length === 1 ? "Accepted Friend" : "Accepted Friends"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Friends appear by name when they RSVP Going or join Move
                    Groups you haven&apos;t joined yet.
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/profile">Switch Demo Persona</Link>
              </Button>
            </CardContent>
          </Card>

          <section aria-labelledby="accepted-friends-heading" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2
                id="accepted-friends-heading"
                className="flex items-center gap-2 text-base font-semibold text-foreground"
              >
                <UserCheckIcon className="size-4 text-primary" />
                <span>Accepted Georgia Tech Friends ({friends.length})</span>
              </h2>
            </div>

            {friends.length === 0 ? (
              <EmptyState
                icon={<UsersIcon className="size-6" />}
                title="No Accepted Friends Yet"
                description="This demo persona currently has no accepted GT friends."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {friends.map((friend) => {
                  const hostedMoves = visibleEvents.filter(
                    (evt) => evt.hostId === friend.id
                  );
                  const goingMoves = visibleEvents.filter((evt) =>
                    evt.friendsGoing.some((fg) => fg.id === friend.id)
                  );
                  const isSwitchable = switchableIds.has(friend.id);

                  return (
                    <Card key={friend.id} size="sm" className="justify-between">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <UserAvatar user={friend} className="size-10 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <CardTitle className="truncate text-sm font-semibold">
                                {friend.displayName}
                              </CardTitle>
                              {friend.verifiedStudent ? (
                                <CheckCircle2Icon
                                  className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                                  aria-label="Verified GT student"
                                />
                              ) : null}
                            </div>
                            <CardDescription className="text-xs">
                              @{friend.username}
                              {friend.graduationYear
                                ? ` · Class of ${friend.graduationYear}`
                                : ""}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {friend.bio ? (
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {friend.bio}
                          </p>
                        ) : null}

                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-[10px]">
                            Hosting {hostedMoves.length}{" "}
                            {hostedMoves.length === 1 ? "Move" : "Moves"}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            Going to {goingMoves.length}{" "}
                            {goingMoves.length === 1 ? "Move" : "Moves"}
                          </Badge>
                        </div>

                        {goingMoves[0] ? (
                          <div className="rounded-lg border border-border/70 bg-muted/40 px-2.5 py-2 text-xs">
                            <span className="text-muted-foreground">
                              Next Move:{" "}
                            </span>
                            <Link
                              href={`/events/${goingMoves[0].id}`}
                              className="font-medium text-foreground underline-offset-4 hover:underline"
                            >
                              {goingMoves[0].title}
                            </Link>
                          </div>
                        ) : null}
                      </CardContent>

                      <CardFooter className="flex items-center justify-between gap-2">
                        <Button variant="ghost" size="xs" asChild>
                          <Link
                            href={`/?q=${encodeURIComponent(friend.username)}`}
                          >
                            View Hosted Moves
                          </Link>
                        </Button>
                        {isSwitchable ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() =>
                              handleSwitchPersona(friend.id, friend.displayName)
                            }
                          >
                            Switch to Persona
                          </Button>
                        ) : null}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          <section
            aria-labelledby="non-friends-heading"
            className="space-y-3 border-t border-border pt-6"
          >
            <div className="space-y-1">
              <h2
                id="non-friends-heading"
                className="flex items-center gap-2 text-base font-semibold text-foreground"
              >
                <EyeOffIcon className="size-4 text-muted-foreground" />
                <span>
                  Other Campus Members Outside {viewer.user.displayName.split(" ")[0]}
                  &apos;s Friend Graph ({nonFriendCampusUsers.length})
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                To protect student privacy, non-friends in Move Groups you have
                not joined are masked as anonymous counts (e.g.,{" "}
                <span className="font-medium text-foreground">
                  &ldquo;+1 other member&rdquo;
                </span>
                ) unless they are the group creator.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {nonFriendCampusUsers.map((campusUser) => {
                const isSwitchable = switchableIds.has(campusUser.id);
                return (
                  <Card
                    key={campusUser.id}
                    size="sm"
                    className="border-dashed bg-card/60"
                  >
                    <CardContent className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <UserAvatar user={campusUser} className="size-8 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="truncate text-xs font-semibold text-foreground">
                              {campusUser.displayName}
                            </span>
                            <ShieldCheckIcon className="size-3 shrink-0 text-muted-foreground" />
                          </div>
                          <p className="truncate text-[11px] text-muted-foreground">
                            @{campusUser.username} · Not in friend list
                          </p>
                        </div>
                      </div>
                      {isSwitchable ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() =>
                            handleSwitchPersona(
                              campusUser.id,
                              campusUser.displayName
                            )
                          }
                        >
                          Test Persona
                        </Button>
                      ) : (
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          Masked in Rosters
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
