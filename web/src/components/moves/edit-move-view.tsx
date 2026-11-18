"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarX2, Lock, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DemoNoticeBanner } from "@/components/shared/demo-notice-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailPageSkeleton } from "@/components/shared/loading-skeletons";
import { PageHeader } from "@/components/shared/page-header";
import { MoveForm } from "@/components/moves/move-form";
import { useSesh } from "@/lib/context/sesh-provider";

export interface EditMoveViewProps {
  eventId: string;
}

export function EditMoveView({ eventId }: EditMoveViewProps) {
  const { adapter, viewer, isHydrated, revision, requireDemoMember } =
    useSesh();

  const lookup = useMemo(() => {
    if (!isHydrated) return null;
    // Touch revision so edits/resets re-run projection cleanly
    void revision;
    return adapter.getEvent(eventId, viewer);
  }, [adapter, eventId, viewer, isHydrated, revision]);

  if (!isHydrated || !lookup) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <DetailPageSkeleton />
      </div>
    );
  }

  if (lookup.status === "NOT_FOUND") {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <EmptyState
          icon={<CalendarX2 className="size-6" />}
          title="Move not found"
          description="This Move doesn't exist or isn't saved in your browser's local demo storage."
          action={
            <Button asChild>
              <Link href="/">Back to Campus Events</Link>
            </Button>
          }
          secondaryAction={
            <Button variant="outline" asChild>
              <Link href="/events/new">Create a New Move</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (lookup.status === "RESTRICTED") {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <DemoNoticeBanner>
          Switch demo personas in the top bar if you created this Move under a
          different Georgia Tech student identity.
        </DemoNoticeBanner>
        <EmptyState
          icon={<Lock className="size-6" />}
          title="Host-only Move access"
          description={`${lookup.reason} Only the student host who created this Move can open its editor.`}
          action={
            viewer.mode === "GUEST" ? (
              <Button
                type="button"
                onClick={() =>
                  requireDemoMember("sign in as the host to edit this Move")
                }
              >
                <UserCheck className="size-4" />
                Switch to Demo Member
              </Button>
            ) : (
              <Button asChild>
                <Link href="/">Back to Campus Events</Link>
              </Button>
            )
          }
          secondaryAction={
            viewer.mode === "GUEST" ? (
              <Button variant="outline" asChild>
                <Link href="/">Browse Public Campus Events</Link>
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  const { event } = lookup;
  const isAuthorizedHost =
    viewer.mode === "MEMBER" &&
    event.canEdit &&
    event.hostId === viewer.user.id;

  if (!isAuthorizedHost) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <DemoNoticeBanner>
          Only a Move&apos;s creator can edit its details or view host-protected
          settings. Switch to{" "}
          <strong className="font-medium text-foreground">
            {event.host.displayName} (@{event.host.username})
          </strong>{" "}
          in the Demo Identity switcher if you want to test host editing.
        </DemoNoticeBanner>
        <EmptyState
          icon={<Lock className="size-6" />}
          title="Only the Move host can edit this event"
          description={
            viewer.mode === "GUEST"
              ? `You're browsing as a Guest. Sign in as ${event.host.displayName} (@${event.host.username}) to edit "${event.title}".`
              : `"${event.title}" is hosted by ${event.host.displayName} (@${event.host.username}). Non-hosts cannot edit Move settings.`
          }
          action={
            viewer.mode === "GUEST" ? (
              <Button
                type="button"
                onClick={() =>
                  requireDemoMember("sign in as the Move host to edit")
                }
              >
                <UserCheck className="size-4" />
                Switch to Demo Member
              </Button>
            ) : (
              <Button asChild>
                <Link href={`/events/${event.id}`}>View Move Page</Link>
              </Button>
            )
          }
          secondaryAction={
            viewer.mode === "GUEST" ? (
              <Button variant="outline" asChild>
                <Link href={`/events/${event.id}`}>View Move Page</Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link href="/">Back to Campus Events</Link>
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow={
          <>
            <Link
              href={`/events/${event.id}`}
              className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Back to Move
            </Link>
            <span>·</span>
            <Badge
              variant={event.status === "PUBLISHED" ? "default" : "secondary"}
            >
              {event.status === "PUBLISHED" ? "Published" : "Draft"}
            </Badge>
            <Badge variant="outline">
              {event.source === "LOCAL_DEMO"
                ? "Browser-local Move"
                : "Campus Seed Move"}
            </Badge>
          </>
        }
        title="Edit Move"
        description="Update your Move — a user-created campus event (distinct from a Move Group, which is a small group coordinating attendance at an event)."
      />

      <MoveForm
        key={`${event.id}-${viewer.user.id}-${event.updatedAt}`}
        mode="edit"
        initialEvent={event}
      />
    </div>
  );
}
