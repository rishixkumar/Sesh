"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  AlertCircle,
  Calendar,
  Eye,
  Image as ImageIcon,
  Info,
  Lock,
  MapPin,
  Save,
  Send,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { MovePreview } from "@/components/moves/move-preview";
import { useSesh } from "@/lib/context/sesh-provider";
import {
  buildRelativeNyIso,
  getNyParts,
  nyLocalInputToUtcIso,
  utcIsoToNyLocalInput,
} from "@/lib/dates";
import { toPublicUserSummary } from "@/lib/permissions/policies";
import {
  moveFormSchema,
  type MoveFormValues,
} from "@/lib/validation/schemas";
import {
  ADDRESS_PRIVACY_OPTIONS,
  EVENT_CATEGORIES,
  EVENT_VISIBILITIES,
  type AddressPrivacy,
  type CreateOrUpdateEventInput,
  type EventView,
  type EventVisibility,
} from "@/types/domain";

export interface MoveFormProps {
  mode: "create" | "edit";
  initialEvent?: EventView;
}

const ADDRESS_PRIVACY_META: Record<
  AddressPrivacy,
  { label: string; helper: string }
> = {
  PUBLIC_VENUE: {
    label: "Public venue",
    helper: "Venue and location are visible to anyone who can view this Move.",
  },
  RSVP_GOING_ONLY: {
    label: "Unlock on RSVP Going or Move Group",
    helper:
      "Exact address unlocks for verified GT students who mark Going or join an Event Move Group.",
  },
  APPROVED_GROUP_OR_HOST: {
    label: "Approved Move Group members & host only",
    helper:
      "Exact address is revealed only to accepted Move Group members and you.",
  },
  HOST_ONLY: {
    label: "Host only (keep private)",
    helper:
      "Exact address stays hidden on Sesh from everyone else until you share it directly.",
  },
};

const VISIBILITY_META: Record<
  EventVisibility,
  { label: string; helper: string }
> = {
  PUBLIC: {
    label: "Public (Georgia Tech campus feed)",
    helper: "Discoverable in the campus event feed and viewable by all visitors.",
  },
  FRIENDS: {
    label: "Friends",
    helper: "Visible only to your accepted Georgia Tech friends on Sesh.",
  },
  CUSTOM: {
    label: "Custom",
    helper: "Restricted list — hidden from public campus browse.",
  },
  INVITE_ONLY: {
    label: "Invite-only",
    helper: "Accessible only to explicitly invited campus members.",
  },
};

function computeDefaultTimesFromAnchor(anchorIso: string): {
  startLocal: string;
  endLocal: string;
} {
  const nyParts = getNyParts(anchorIso);
  const dayOffset = nyParts.hour < 19 ? 0 : 1;
  const startIso = buildRelativeNyIso(anchorIso, dayOffset, "21:00");
  const endIso = buildRelativeNyIso(anchorIso, dayOffset, "23:30");
  return {
    startLocal: utcIsoToNyLocalInput(startIso),
    endLocal: utcIsoToNyLocalInput(endIso),
  };
}

function buildInitialFormValues(
  mode: "create" | "edit",
  nowIso: string,
  initialEvent?: EventView
): MoveFormValues {
  if (mode === "edit" && initialEvent) {
    const rawPriceLabel = initialEvent.admission.priceLabel ?? "";
    const cleanedFreeNote =
      initialEvent.admission.isFree && rawPriceLabel === "Free"
        ? ""
        : rawPriceLabel;

    return {
      title: initialEvent.title,
      description: initialEvent.description,
      category: initialEvent.category,
      startLocal: utcIsoToNyLocalInput(initialEvent.startAt),
      endLocal: utcIsoToNyLocalInput(initialEvent.endAt),
      venue: initialEvent.venue,
      publicDisplayLocation:
        initialEvent.publicDisplayLocation === initialEvent.venue &&
        initialEvent.addressPrivacy === "PUBLIC_VENUE"
          ? ""
          : initialEvent.publicDisplayLocation,
      privateAddress: initialEvent.unlockedPrivateAddress ?? "",
      addressPrivacy: initialEvent.addressPrivacy,
      visibility: initialEvent.visibility,
      capacityText:
        initialEvent.capacity !== undefined ? String(initialEvent.capacity) : "",
      pricingMode: initialEvent.admission.isFree ? "FREE" : "PAID",
      priceLabel: cleanedFreeNote,
      coverImage: initialEvent.coverImage ?? "",
    };
  }

  const defaults = computeDefaultTimesFromAnchor(nowIso);
  return {
    title: "",
    description: "",
    category: "House Parties",
    startLocal: defaults.startLocal,
    endLocal: defaults.endLocal,
    venue: "",
    publicDisplayLocation: "",
    privateAddress: "",
    addressPrivacy: "PUBLIC_VENUE",
    visibility: "PUBLIC",
    capacityText: "",
    pricingMode: "FREE",
    priceLabel: "",
    coverImage: "",
  };
}

function parseOptionalUsdAmount(priceLabel?: string): number | null {
  if (!priceLabel) return null;
  const match = /\$?\s*(\d+(?:\.\d{1,2})?)/.exec(priceLabel.trim());
  if (!match) return null;
  const num = Number(match[1]);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-center gap-1.5 text-xs font-medium text-destructive"
    >
      <AlertCircle className="size-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

export function MoveForm({ mode, initialEvent }: MoveFormProps) {
  const router = useRouter();
  const { adapter, viewer, nowIso, isHydrated, requireDemoMember } = useSesh();
  const [submittingIntent, setSubmittingIntent] = useState<
    "DRAFT" | "PUBLISHED" | null
  >(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  const initialValues = useMemo(
    () => buildInitialFormValues(mode, nowIso, initialEvent),
    // Intentionally compute initial defaults once per mode/event identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, initialEvent?.id]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<MoveFormValues>({
    resolver: zodResolver(moveFormSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  // Once client clock hydrates in create mode, align default start/end times to live NY date if untouched
  useEffect(() => {
    if (mode !== "create" || !isHydrated) return;
    const freshDefaults = computeDefaultTimesFromAnchor(nowIso);
    if (!dirtyFields.startLocal) {
      setValue("startLocal", freshDefaults.startLocal, { shouldDirty: false });
    }
    if (!dirtyFields.endLocal) {
      setValue("endLocal", freshDefaults.endLocal, { shouldDirty: false });
    }
  }, [
    mode,
    isHydrated,
    nowIso,
    dirtyFields.startLocal,
    dirtyFields.endLocal,
    setValue,
  ]);

  const watched = useWatch({ control });
  const liveValues: MoveFormValues = useMemo(
    () => ({
      ...initialValues,
      ...watched,
      category: watched.category ?? initialValues.category,
      addressPrivacy: watched.addressPrivacy ?? initialValues.addressPrivacy,
      visibility: watched.visibility ?? initialValues.visibility,
      pricingMode: watched.pricingMode ?? initialValues.pricingMode,
      title: watched.title ?? initialValues.title,
      description: watched.description ?? initialValues.description,
      startLocal: watched.startLocal ?? initialValues.startLocal,
      endLocal: watched.endLocal ?? initialValues.endLocal,
      venue: watched.venue ?? initialValues.venue,
    }),
    [initialValues, watched]
  );

  const hostSummary = useMemo(() => {
    if (viewer.mode === "MEMBER") {
      return toPublicUserSummary(viewer.user);
    }
    if (initialEvent) {
      return initialEvent.host;
    }
    return {
      id: "demo-host",
      displayName: "GT Student Host",
      username: "gt_student",
      schoolId: "school-gt",
      verifiedStudent: true,
    };
  }, [viewer, initialEvent]);

  const submitWithStatus = (
    values: MoveFormValues,
    targetStatus: "DRAFT" | "PUBLISHED"
  ) => {
    if (
      !requireDemoMember(
        targetStatus === "DRAFT" ? "save a Move draft" : "publish a Move"
      )
    ) {
      return;
    }

    setSubmittingIntent(targetStatus);

    try {
      const startAt = nyLocalInputToUtcIso(values.startLocal);
      const endAt = nyLocalInputToUtcIso(values.endLocal);
      const trimmedCap = values.capacityText?.trim() ?? "";
      const capacity = trimmedCap.length > 0 ? Number(trimmedCap) : null;
      const isFree = values.pricingMode === "FREE";

      const payload: CreateOrUpdateEventInput = {
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        startAt,
        endAt,
        venue: values.venue.trim(),
        publicDisplayLocation:
          values.publicDisplayLocation?.trim() || values.venue.trim(),
        privateAddress: values.privateAddress?.trim() || undefined,
        addressPrivacy: values.addressPrivacy,
        visibility: values.visibility,
        status: targetStatus,
        coverImage: values.coverImage?.trim() || undefined,
        capacity,
        isFree,
        priceLabel: values.priceLabel?.trim() || undefined,
        amountUsd: isFree ? null : parseOptionalUsdAmount(values.priceLabel),
      };

      const submitTimestampIso = new Date().toISOString();
      const saved =
        mode === "edit" && initialEvent
          ? adapter.updateEvent(
              initialEvent.id,
              payload,
              viewer,
              submitTimestampIso
            )
          : adapter.createEvent(payload, viewer, submitTimestampIso);

      if (targetStatus === "DRAFT") {
        toast.success("Draft saved locally in your browser", {
          description:
            "Only you can view or edit this draft until you publish it.",
        });
        router.push(`/events/${saved.id}`);
      } else {
        toast.success(
          mode === "edit"
            ? "Move updated and published!"
            : "Move published to Georgia Tech!",
          {
            description:
              "Want a small crew to head over together? Start a Move Group for this Move.",
            action: {
              label: "Create Move Group",
              onClick: () => router.push(`/move-groups/new?event=${saved.id}`),
            },
          }
        );
        router.push(
          mode === "create"
            ? `/events/${saved.id}?justCreated=1`
            : `/events/${saved.id}`
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while saving your Move.";
      toast.error(message);
      setSubmittingIntent(null);
    }
  };

  const isBusy = submittingIntent !== null;
  const requiresApproxLocation = liveValues.addressPrivacy !== "PUBLIC_VENUE";

  return (
    <div className="space-y-6">
      <DemoNoticeBanner title="Local browser persistence (Milestone 1)">
        Created and edited Moves are saved in your browser&apos;s{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">
          localStorage
        </code>{" "}
        so drafts and published events survive page refreshes. No real
        invitations, emails, or push notifications are sent yet.
      </DemoNoticeBanner>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Main Form Column */}
        <form
          onSubmit={handleSubmit((vals) => submitWithStatus(vals, "PUBLISHED"))}
          noValidate
          className="space-y-6 lg:col-span-7"
        >
          {/* Section 1: Core Event Details */}
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <CardTitle>Move Basics</CardTitle>
              </div>
              <CardDescription>
                Define what&apos;s happening so students across campus can decide
                whether to go or form a Move Group.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-5">
              {/* Event Title */}
              <div className="space-y-1.5">
                <Label htmlFor="move-title">Event title *</Label>
                <Input
                  id="move-title"
                  placeholder="e.g., Tech Square Rooftop Social or Home Park Backyard DJ Set"
                  aria-invalid={Boolean(errors.title)}
                  {...register("title")}
                />
                <p className="text-xs text-muted-foreground">
                  Keep it clear and memorable (3–100 characters).
                </p>
                <FieldError message={errors.title?.message} />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label htmlFor="move-category">Category *</Label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) => field.onChange(val)}
                    >
                      <SelectTrigger
                        id="move-category"
                        className="w-full"
                        aria-invalid={Boolean(errors.category)}
                      >
                        <SelectValue placeholder="Choose a category" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {EVENT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.category?.message} />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="move-description">Description *</Label>
                  <span className="text-xs text-muted-foreground">
                    {liveValues.description.length}/2000
                  </span>
                </div>
                <Textarea
                  id="move-description"
                  rows={4}
                  placeholder="Share the vibe, music, schedule, entry requirements (e.g. BuzzCard at door), or what to expect..."
                  aria-invalid={Boolean(errors.description)}
                  {...register("description")}
                />
                <FieldError message={errors.description?.message} />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Date & Time */}
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                <CardTitle>Schedule (Eastern Time)</CardTitle>
              </div>
              <CardDescription>
                All Move times use Georgia Tech campus time (
                <span className="font-medium text-foreground">
                  America/New_York · ET
                </span>
                ).
              </CardDescription>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-5 pt-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="move-start">Start date &amp; time (ET) *</Label>
                <Input
                  id="move-start"
                  type="datetime-local"
                  aria-invalid={Boolean(errors.startLocal)}
                  {...register("startLocal")}
                />
                <FieldError message={errors.startLocal?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="move-end">End date &amp; time (ET) *</Label>
                <Input
                  id="move-end"
                  type="datetime-local"
                  aria-invalid={Boolean(errors.endLocal)}
                  {...register("endLocal")}
                />
                <p className="text-xs text-muted-foreground">
                  Must occur after the start date and time.
                </p>
                <FieldError message={errors.endLocal?.message} />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Location & Address Privacy */}
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <CardTitle>Location &amp; Address Privacy</CardTitle>
              </div>
              <CardDescription>
                Public venues can show full details upfront, while house parties
                or off-campus gatherings can mask exact street addresses behind
                privacy rules.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-5">
              {/* Venue */}
              <div className="space-y-1.5">
                <Label htmlFor="move-venue">Venue or location text *</Label>
                <Input
                  id="move-venue"
                  placeholder="e.g., Cypress Street Pint & Plate, Klaus Courtyard, or Home Park Duplex"
                  aria-invalid={Boolean(errors.venue)}
                  {...register("venue")}
                />
                <p className="text-xs text-muted-foreground">
                  Name of the venue, campus building, or general spot.
                </p>
                <FieldError message={errors.venue?.message} />
              </div>

              {/* Address Privacy Setting */}
              <div className="space-y-1.5">
                <Label htmlFor="move-address-privacy">
                  Address privacy setting *
                </Label>
                <Controller
                  control={control}
                  name="addressPrivacy"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) => field.onChange(val)}
                    >
                      <SelectTrigger
                        id="move-address-privacy"
                        className="w-full"
                        aria-invalid={Boolean(errors.addressPrivacy)}
                      >
                        <SelectValue placeholder="Choose address privacy" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {ADDRESS_PRIVACY_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {ADDRESS_PRIVACY_META[opt].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Lock className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    {ADDRESS_PRIVACY_META[liveValues.addressPrivacy].helper}
                  </span>
                </p>
                <FieldError message={errors.addressPrivacy?.message} />
              </div>

              {/* Public Approximate Location */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="move-public-location">
                    Public approximate location{" "}
                    {requiresApproxLocation ? "*" : "(optional)"}
                  </Label>
                  {requiresApproxLocation ? (
                    <Badge variant="secondary">
                      Required when exact address is private
                    </Badge>
                  ) : null}
                </div>
                <Input
                  id="move-public-location"
                  placeholder="e.g., Home Park near 10th St or Midtown near Tech Square"
                  aria-invalid={Boolean(errors.publicDisplayLocation)}
                  {...register("publicDisplayLocation")}
                />
                <p className="text-xs text-muted-foreground">
                  Safe neighborhood or landmark shown on browse cards before an
                  attendee unlocks the exact address.
                </p>
                <FieldError message={errors.publicDisplayLocation?.message} />
              </div>

              <Separator />

              {/* Private Exact Address (Demo-only) */}
              <div className="space-y-2 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="move-private-address">
                    Private exact address (optional · Demo-only)
                  </Label>
                  <Badge variant="outline">Demo-only field</Badge>
                </div>
                <Input
                  id="move-private-address"
                  placeholder="e.g., 942 Fictional Tech Way NW, Unit B (use fictional street numbers)"
                  aria-invalid={Boolean(errors.privateAddress)}
                  className="bg-background"
                  {...register("privateAddress")}
                />
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    <strong className="font-medium text-foreground">
                      Safety note:
                    </strong>{" "}
                    Use fictional street numbers only in this prototype. Sesh
                    masks this field from Guests and unauthorized viewers based
                    on your privacy rule above.
                  </span>
                </p>
                <FieldError message={errors.privateAddress?.message} />
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Audience, Capacity, Pricing & Cover */}
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <CardTitle>Audience, Admission &amp; Cover</CardTitle>
              </div>
              <CardDescription>
                Control who can see your Move, entry cost, optional attendee cap,
                and cover image.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-5">
              {/* Event Audience / Visibility */}
              <div className="space-y-1.5">
                <Label htmlFor="move-visibility">Event audience *</Label>
                <Controller
                  control={control}
                  name="visibility"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(val) => field.onChange(val)}
                    >
                      <SelectTrigger
                        id="move-visibility"
                        className="w-full"
                        aria-invalid={Boolean(errors.visibility)}
                      >
                        <SelectValue placeholder="Choose audience" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {EVENT_VISIBILITIES.map((vis) => (
                          <SelectItem key={vis} value={vis}>
                            {VISIBILITY_META[vis].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {VISIBILITY_META[liveValues.visibility].helper}
                </p>
                <div className="flex items-start gap-1.5 rounded-md bg-muted/60 px-2.5 py-2 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-foreground" />
                  <span>
                    Milestone 1 note: Audience visibility filters locally across
                    demo personas; real invitations and notifications are not
                    dispatched yet.
                  </span>
                </div>
                <FieldError message={errors.visibility?.message} />
              </div>

              {/* Pricing Mode + Price Note */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="move-pricing-mode">Admission *</Label>
                  <Controller
                    control={control}
                    name="pricingMode"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(val) => field.onChange(val)}
                      >
                        <SelectTrigger
                          id="move-pricing-mode"
                          className="w-full"
                          aria-invalid={Boolean(errors.pricingMode)}
                        >
                          <SelectValue placeholder="Free or Paid" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="FREE">Free entry</SelectItem>
                          <SelectItem value="PAID">
                            Paid / Cover / Ticket
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.pricingMode?.message} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="move-price-label">
                    {liveValues.pricingMode === "PAID"
                      ? "Cover or ticket details *"
                      : "Admission note (optional)"}
                  </Label>
                  <Input
                    id="move-price-label"
                    placeholder={
                      liveValues.pricingMode === "PAID"
                        ? "e.g., $10 cover or $15 presale"
                        : "e.g., Free w/ BuzzCard"
                    }
                    aria-invalid={Boolean(errors.priceLabel)}
                    {...register("priceLabel")}
                  />
                  <FieldError message={errors.priceLabel?.message} />
                </div>
              </div>

              {/* Optional Capacity & Cover Image */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="move-capacity">
                    Event capacity (optional)
                  </Label>
                  <Input
                    id="move-capacity"
                    inputMode="numeric"
                    placeholder="Leave blank for open capacity (e.g., 80)"
                    aria-invalid={Boolean(errors.capacityText)}
                    {...register("capacityText")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Positive whole number if space is limited.
                  </p>
                  <FieldError message={errors.capacityText?.message} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="move-cover-image">
                    <ImageIcon className="size-3.5 text-muted-foreground" />
                    Cover image URL (optional)
                  </Label>
                  <Input
                    id="move-cover-image"
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    aria-invalid={Boolean(errors.coverImage)}
                    {...register("coverImage")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional{" "}
                    <code className="font-mono text-[11px]">https://</code>{" "}
                    image link; leave blank for a category banner.
                  </p>
                  <FieldError message={errors.coverImage?.message} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Bar: Preview Dialog + Cancel + Save Draft + Publish Move */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Dialog
                open={previewDialogOpen}
                onOpenChange={setPreviewDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    <Eye className="size-4" />
                    Preview Move
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Preview Before Publishing</DialogTitle>
                    <DialogDescription>
                      Toggle between General Viewer and Unlocked Attendee to
                      verify your location privacy settings.
                    </DialogDescription>
                  </DialogHeader>
                  <MovePreview
                    values={liveValues}
                    host={hostSummary}
                    currentStatus={initialEvent?.status}
                    className="ring-0"
                  />
                  <DialogFooter showCloseButton />
                </DialogContent>
              </Dialog>

              <Button type="button" variant="ghost" asChild>
                <Link
                  href={
                    mode === "edit" && initialEvent
                      ? `/events/${initialEvent.id}`
                      : "/"
                  }
                >
                  Cancel
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                disabled={isBusy}
                onClick={handleSubmit((vals) =>
                  submitWithStatus(vals, "DRAFT")
                )}
              >
                <Save className="size-4" />
                {submittingIntent === "DRAFT" ? "Saving Draft..." : "Save Draft"}
              </Button>

              <Button type="submit" disabled={isBusy}>
                <Send className="size-4" />
                {submittingIntent === "PUBLISHED"
                  ? "Publishing..."
                  : mode === "edit" && initialEvent?.status === "PUBLISHED"
                    ? "Update & Publish Move"
                    : "Publish Move"}
              </Button>
            </div>
          </div>
        </form>

        {/* Sticky Live Preview Sidebar on Desktop */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:col-span-5">
          <MovePreview
            values={liveValues}
            host={hostSummary}
            currentStatus={initialEvent?.status}
          />
          <div className="rounded-xl border border-border bg-card/60 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">
              Move vs. Move Group — what&apos;s next?
            </p>
            <p className="mt-1 leading-relaxed">
              Publishing this <strong className="text-foreground">Move</strong>{" "}
              posts the event itself. Right after publishing, you (or any
              attending student) can spin up a{" "}
              <strong className="text-foreground">Move Group</strong> to
              coordinate a pre-game, meetup spot, or walk-over crew.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
