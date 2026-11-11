"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  LockIcon,
  SparklesIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DemoNoticeBanner } from "@/components/shared/demo-notice-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailPageSkeleton } from "@/components/shared/loading-skeletons";
import { PageHeader } from "@/components/shared/page-header";
import {
  DISCOVERABILITY_META,
  JOIN_MODE_META,
} from "@/components/move-groups/move-group-card";
import { useSesh } from "@/lib/context/sesh-provider";
import { SeshAdapterError } from "@/lib/data/adapter";
import {
  formatEventDateTime,
  nyLocalInputToUtcIso,
  utcIsoToNyLocalInput,
} from "@/lib/dates";
import {
  moveGroupFormSchema,
  type MoveGroupFormValues,
} from "@/lib/validation/schemas";
import {
  MOVE_GROUP_DISCOVERABILITIES,
  MOVE_GROUP_JOIN_MODES,
  type EventView,
} from "@/types/domain";

function computeDefaultMeetupLocal(eventStartIso: string): string {
  const startMs = Date.parse(eventStartIso);
  if (Number.isNaN(startMs)) return "";
  const thirtyMinutesBeforeIso = new Date(startMs - 30 * 60 * 1000).toISOString();
  return utcIsoToNyLocalInput(thirtyMinutesBeforeIso);
}

export function CreateMoveGroupForm() {
  const searchParams = useSearchParams();
  const preselectedEventId = searchParams.get("event")?.trim() ?? "";
  const { viewer, isHydrated, requireDemoMember } = useSesh();

  if (!isHydrated) {
    return <DetailPageSkeleton />;
  }

  const backHref = preselectedEventId ? `/events/${preselectedEventId}` : "/";
  const backLabel = preselectedEventId
    ? "Back to Event"
    : "Back to Campus Hub";

  if (viewer.mode === "GUEST") {
    return (
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href={backHref}>
              <ArrowLeftIcon className="size-4" />
              {backLabel}
            </Link>
          </Button>
        </div>

        <PageHeader
          eyebrow="Crew Coordination"
          title="Start a Move Group"
          description="Coordinate pre-meetup spots, rideshare splits, and walk-ins with fellow Georgia Tech students."
        />

        <EmptyState
          icon={<UserCheckIcon className="size-6" />}
          title="Demo Member session required to create a Move Group"
          description="You are currently browsing in Guest Mode. Switch to a verified GT Demo Member identity to organize a Move Group."
          action={
            <Button
              type="button"
              onClick={() => requireDemoMember("create a Move Group")}
            >
              Choose Demo Member Identity
            </Button>
          }
          secondaryAction={
            <Button asChild variant="outline">
              <Link href={backHref}>{backLabel}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <AuthenticatedCreateMoveGroupForm preselectedEventId={preselectedEventId} />
  );
}

function AuthenticatedCreateMoveGroupForm({
  preselectedEventId,
}: {
  preselectedEventId: string;
}) {
  const router = useRouter();
  const { adapter, viewer, nowIso } = useSesh();

  const listedEvents = adapter
    .listEvents(viewer, {}, nowIso)
    .filter((evt) => evt.status === "PUBLISHED");

  let publishedEvents: EventView[] = listedEvents;
  if (
    preselectedEventId &&
    !listedEvents.some((evt) => evt.id === preselectedEventId)
  ) {
    const lookup = adapter.getEvent(preselectedEventId, viewer);
    if (lookup.status === "OK" && lookup.event.status === "PUBLISHED") {
      publishedEvents = [lookup.event, ...listedEvents];
    }
  }

  const initialEvent = publishedEvents.find(
    (evt) => evt.id === preselectedEventId
  );

  const form = useForm<MoveGroupFormValues>({
    resolver: zodResolver(moveGroupFormSchema),
    defaultValues: {
      eventId: initialEvent?.id ?? "",
      name: "",
      note: "",
      capacity: 6,
      discoverability: "PUBLIC",
      joinMode: "REQUEST_TO_JOIN",
      meetupTimeLocal: initialEvent
        ? computeDefaultMeetupLocal(initialEvent.startAt)
        : "",
      meetupSpot: "",
      externalChatLink: "",
    },
  });

  const watchedEventId = useWatch({ control: form.control, name: "eventId" });
  const watchedDiscoverability = useWatch({
    control: form.control,
    name: "discoverability",
  });
  const watchedJoinMode = useWatch({ control: form.control, name: "joinMode" });

  const selectedEvent = publishedEvents.find(
    (evt) => evt.id === watchedEventId
  );

  const backHref = selectedEvent
    ? `/events/${selectedEvent.id}`
    : preselectedEventId
      ? `/events/${preselectedEventId}`
      : "/";
  const backLabel =
    selectedEvent || preselectedEventId
      ? "Back to Event"
      : "Back to Campus Hub";

  const onSubmit = (values: MoveGroupFormValues) => {
    const meetupTime = nyLocalInputToUtcIso(values.meetupTimeLocal);
    if (!meetupTime) {
      form.setError("meetupTimeLocal", {
        message: "Enter a valid meet-up date and time.",
      });
      return;
    }

    try {
      const created = adapter.createMoveGroup(
        {
          eventId: values.eventId,
          name: values.name,
          note: values.note,
          capacity: values.capacity,
          discoverability: values.discoverability,
          joinMode: values.joinMode,
          meetupTime,
          meetupSpot: values.meetupSpot,
          externalChatLink: values.externalChatLink?.trim() || undefined,
        },
        viewer,
        new Date().toISOString()
      );

      toast.success("Move Group created! Your crew coordination page is ready.");
      router.push(`/move-groups/${created.id}`);
    } catch (err) {
      const message =
        err instanceof SeshAdapterError
          ? err.message
          : "Something went wrong while creating your Move Group.";
      toast.error(message);
    }
  };

  if (publishedEvents.length === 0) {
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

        <PageHeader
          eyebrow="Crew Coordination"
          title="Start a Move Group"
          description="Move Groups attach to a published campus Move."
        />

        <EmptyState
          icon={<CalendarIcon className="size-6" />}
          title="No published events available yet"
          description="Publish a campus Move first or browse upcoming events on the Campus Hub before starting a Move Group."
          action={
            <Button asChild>
              <Link href="/events/new">Create a Move</Link>
            </Button>
          }
          secondaryAction={
            <Button asChild variant="outline">
              <Link href="/">Browse Campus Hub</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={backHref}>
            <ArrowLeftIcon className="size-4" />
            {backLabel}
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow={
          <>
            <UsersIcon className="size-3.5" />
            <span>Event Crew Coordination</span>
          </>
        }
        title="Start a Move Group"
        description="Organize a small pre-meetup, rideshare split, or walk-over crew for a Georgia Tech event."
      />

      <DemoNoticeBanner title="Local Demo Persistence">
        Newly created Move Groups are stored in your browser&apos;s{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
          localStorage
        </code>{" "}
        and automatically mark you as{" "}
        <span className="font-medium text-foreground">Going</span> on the
        associated event.
      </DemoNoticeBanner>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Associated Event Selection */}
        <Card>
          <CardHeader>
            <CardTitle>1. Associated Event</CardTitle>
            <CardDescription>
              Choose which published campus Move your crew is attending together.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mg-event-select">Campus Event *</Label>
              <Controller
                control={form.control}
                name="eventId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(nextEventId) => {
                      field.onChange(nextEventId);
                      const chosen = publishedEvents.find(
                        (e) => e.id === nextEventId
                      );
                      if (
                        chosen &&
                        (!form.formState.dirtyFields.meetupTimeLocal ||
                          !form.getValues("meetupTimeLocal"))
                      ) {
                        form.setValue(
                          "meetupTimeLocal",
                          computeDefaultMeetupLocal(chosen.startAt),
                          { shouldValidate: true }
                        );
                      }
                    }}
                  >
                    <SelectTrigger
                      id="mg-event-select"
                      className="w-full"
                      aria-invalid={Boolean(form.formState.errors.eventId)}
                    >
                      <SelectValue placeholder="Select a published event..." />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {publishedEvents.map((evt) => (
                        <SelectItem key={evt.id} value={evt.id}>
                          {evt.title} ({formatEventDateTime(evt.startAt)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.eventId ? (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.eventId.message}
                </p>
              ) : null}
            </div>

            {selectedEvent ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/35 px-3.5 py-2.5 text-xs">
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">
                    {selectedEvent.title}
                  </p>
                  <p className="text-muted-foreground">
                    Starts {formatEventDateTime(selectedEvent.startAt)} ·{" "}
                    {selectedEvent.publicDisplayLocation}
                  </p>
                </div>
                <Button asChild variant="ghost" size="xs">
                  <Link href={`/events/${selectedEvent.id}`}>View Event</Link>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Crew Identity & Logistics */}
        <Card>
          <CardHeader>
            <CardTitle>2. Crew Details & Meet-up Plan</CardTitle>
            <CardDescription>
              Tell fellow students what your group is planning and where to meet
              before heading over.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="mg-name">Group Name *</Label>
              <Input
                id="mg-name"
                placeholder="e.g., Tech Square Rideshare Split (9:45 PM)"
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name")}
              />
              {form.formState.errors.name ? (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mg-note">Coordination Note *</Label>
              <Textarea
                id="mg-note"
                rows={3}
                placeholder="e.g., Splitting an XL rideshare from Tech Square Waffle House corner and walking in together."
                aria-invalid={Boolean(form.formState.errors.note)}
                {...form.register("note")}
              />
              {form.formState.errors.note ? (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.note.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Share vibe, transit plan, or timing expectations (5–600
                  characters).
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="mg-meetup-time">
                    Meet-up Time (Atlanta / ET) *
                  </Label>
                  {selectedEvent ? (
                    <button
                      type="button"
                      onClick={() =>
                        form.setValue(
                          "meetupTimeLocal",
                          computeDefaultMeetupLocal(selectedEvent.startAt),
                          { shouldDirty: true, shouldValidate: true }
                        )
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                    >
                      <ClockIcon className="size-3" />
                      30m before event
                    </button>
                  ) : null}
                </div>
                <Input
                  id="mg-meetup-time"
                  type="datetime-local"
                  aria-invalid={Boolean(form.formState.errors.meetupTimeLocal)}
                  {...form.register("meetupTimeLocal")}
                />
                {form.formState.errors.meetupTimeLocal ? (
                  <p className="text-xs font-medium text-destructive">
                    {form.formState.errors.meetupTimeLocal.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Defaults to 30 minutes before the chosen event&apos;s start
                    time.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mg-capacity">Crew Capacity (2–50) *</Label>
                <Controller
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <Input
                      id="mg-capacity"
                      type="number"
                      min={2}
                      max={50}
                      step={1}
                      value={Number.isNaN(field.value) ? "" : field.value}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? Number.NaN
                            : Number(e.target.value)
                        )
                      }
                      onBlur={field.onBlur}
                      aria-invalid={Boolean(form.formState.errors.capacity)}
                    />
                  )}
                />
                {form.formState.errors.capacity ? (
                  <p className="text-xs font-medium text-destructive">
                    {form.formState.errors.capacity.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Includes you as the group host.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mg-meetup-spot">Meeting Spot *</Label>
              <Input
                id="mg-meetup-spot"
                placeholder="e.g., Kessler Campanile Steps or North Ave MARTA West Entrance"
                aria-invalid={Boolean(form.formState.errors.meetupSpot)}
                {...form.register("meetupSpot")}
              />
              {form.formState.errors.meetupSpot ? (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.meetupSpot.message}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Privacy, Join Policy & Members-Only Chat */}
        <Card>
          <CardHeader>
            <CardTitle>3. Privacy, Join Rules & Crew Chat</CardTitle>
            <CardDescription>
              Control who can discover your Move Group, how students join, and
              share an optional private chat link for accepted members.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mg-discoverability">Discoverability *</Label>
                <Controller
                  control={form.control}
                  name="discoverability"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="mg-discoverability"
                        className="w-full"
                        aria-invalid={Boolean(
                          form.formState.errors.discoverability
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {MOVE_GROUP_DISCOVERABILITIES.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {DISCOVERABILITY_META[opt].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {DISCOVERABILITY_META[watchedDiscoverability].description}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mg-join-mode">Join Mode *</Label>
                <Controller
                  control={form.control}
                  name="joinMode"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="mg-join-mode"
                        className="w-full"
                        aria-invalid={Boolean(form.formState.errors.joinMode)}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {MOVE_GROUP_JOIN_MODES.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {JOIN_MODE_META[opt].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {JOIN_MODE_META[watchedJoinMode].description}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="mg-chat-link" className="flex items-center gap-1.5">
                <LockIcon className="size-3.5 text-muted-foreground" />
                External Group Chat Link (Optional — Accepted Members Only)
              </Label>
              <Input
                id="mg-chat-link"
                type="url"
                placeholder="https://groupme.com/join_group/... or Discord/WhatsApp invite"
                aria-invalid={Boolean(form.formState.errors.externalChatLink)}
                {...form.register("externalChatLink")}
              />
              {form.formState.errors.externalChatLink ? (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.externalChatLink.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Protected by adapter projection: this URL is{" "}
                  <span className="font-medium text-foreground">
                    shown to accepted Move Group members and you (the host) only
                  </span>
                  — never exposed to Guests or pending requesters.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button asChild type="button" variant="outline" size="lg">
            <Link href={backHref}>Cancel</Link>
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={form.formState.isSubmitting}
          >
            <SparklesIcon className="size-4" />
            {form.formState.isSubmitting
              ? "Creating Move Group..."
              : "Create Move Group"}
          </Button>
        </div>
      </form>
    </div>
  );
}
