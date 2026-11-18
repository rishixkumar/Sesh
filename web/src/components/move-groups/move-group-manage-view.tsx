"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CheckIcon,
  ClockIcon,
  LockIcon,
  SaveIcon,
  ShieldAlertIcon,
  Trash2Icon,
  UserMinusIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DemoNoticeBanner } from "@/components/shared/demo-notice-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { DetailPageSkeleton } from "@/components/shared/loading-skeletons";
import { PageHeader } from "@/components/shared/page-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DISCOVERABILITY_META,
  JOIN_MODE_META,
} from "@/components/move-groups/move-group-card";
import { MoveGroupInviteDialog } from "@/components/move-groups/move-group-invite-dialog";
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
  type MaskedMemberEntry,
  type MoveGroupView,
} from "@/types/domain";

export interface MoveGroupManageViewProps {
  groupId: string;
}

export function MoveGroupManageView({ groupId }: MoveGroupManageViewProps) {
  const { adapter, viewer, isHydrated, requireDemoMember } = useSesh();

  const lookup = adapter.getMoveGroup(groupId, viewer);

  if (!isHydrated) {
    return <DetailPageSkeleton />;
  }

  if (lookup.status === "NOT_FOUND") {
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

        <EmptyState
          icon={<UsersIcon className="size-6" />}
          title="Move Group not found"
          description="This Move Group does not exist in seed data or your browser's local demo store."
          action={
            <Button asChild>
              <Link href="/">Browse Campus Hub</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (lookup.status === "DISBANDED") {
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

        <EmptyState
          icon={<AlertTriangleIcon className="size-6" />}
          title="Move Group disbanded"
          description="This Move Group has already been disbanded and can no longer be managed."
          action={
            <Button asChild>
              <Link href="/">Back to Campus Hub</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // STRICT OWNER-ONLY GUARD:
  // Never render management controls for Guests, restricted viewers, or non-creator members.
  if (
    viewer.mode === "GUEST" ||
    lookup.status === "RESTRICTED" ||
    !lookup.group.canManage ||
    !lookup.group.ownerManagement
  ) {
    const creatorHintName =
      lookup.status === "OK"
        ? lookup.group.roster.creator.displayName
        : "the Move Group creator (e.g., Maya Patel)";

    return (
      <div className="space-y-6">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href={`/move-groups/${groupId}`}>
              <ArrowLeftIcon className="size-4" />
              Back to Move Group
            </Link>
          </Button>
        </div>

        <PageHeader
          eyebrow="Access Restricted"
          title="Owner-Only Access"
          description="Only the student who created this Move Group can review join requests, manage members, or edit crew settings."
        />

        <EmptyState
          icon={<ShieldAlertIcon className="size-6" />}
          title="You don't have permission to manage this Move Group"
          description={`Switch your Demo Identity in the top header to ${creatorHintName} if you are testing host management workflows.`}
          action={
            <Button asChild>
              <Link href={`/move-groups/${groupId}`}>
                Return to Move Group Page
              </Link>
            </Button>
          }
          secondaryAction={
            viewer.mode === "GUEST" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => requireDemoMember("manage this Move Group")}
              >
                Choose Demo Member Identity
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  return <OwnerManageMoveGroupContent group={lookup.group} />;
}

function OwnerManageMoveGroupContent({ group }: { group: MoveGroupView }) {
  const router = useRouter();
  const { adapter, viewer } = useSesh();
  const [memberPendingRemoval, setMemberPendingRemoval] =
    useState<MaskedMemberEntry | null>(null);
  const [disbandConfirmOpen, setDisbandConfirmOpen] = useState(false);

  const ownerData = group.ownerManagement!;

  const form = useForm<MoveGroupFormValues>({
    resolver: zodResolver(moveGroupFormSchema),
    defaultValues: {
      eventId: group.eventId,
      name: group.name,
      note: group.note,
      capacity: group.capacity,
      discoverability: group.discoverability,
      joinMode: group.joinMode,
      meetupTimeLocal: utcIsoToNyLocalInput(group.meetupTime),
      meetupSpot: group.meetupSpot,
      externalChatLink: group.unlockedExternalChatLink ?? "",
    },
  });

  const watchedDiscoverability = useWatch({
    control: form.control,
    name: "discoverability",
  });
  const watchedJoinMode = useWatch({
    control: form.control,
    name: "joinMode",
  });

  useEffect(() => {
    if (!form.formState.isDirty) {
      form.reset({
        eventId: group.eventId,
        name: group.name,
        note: group.note,
        capacity: group.capacity,
        discoverability: group.discoverability,
        joinMode: group.joinMode,
        meetupTimeLocal: utcIsoToNyLocalInput(group.meetupTime),
        meetupSpot: group.meetupSpot,
        externalChatLink: group.unlockedExternalChatLink ?? "",
      });
    }
  }, [
    group.id,
    group.updatedAt,
    group.eventId,
    group.name,
    group.note,
    group.capacity,
    group.discoverability,
    group.joinMode,
    group.meetupTime,
    group.meetupSpot,
    group.unlockedExternalChatLink,
    form,
  ]);

  const handleApproveRequest = (requestId: string, requesterName: string) => {
    try {
      adapter.approveJoin(
        group.id,
        requestId,
        viewer,
        new Date().toISOString()
      );
      toast.success(
        `Approved ${requesterName}! They now have full crew access.`
      );
    } catch (err) {
      const message =
        err instanceof SeshAdapterError
          ? err.message
          : "Unable to approve join request.";
      toast.error(message);
    }
  };

  const handleDeclineRequest = (requestId: string, requesterName: string) => {
    try {
      adapter.declineJoin(
        group.id,
        requestId,
        viewer,
        new Date().toISOString()
      );
      toast.success(`Declined join request from ${requesterName}.`);
    } catch (err) {
      const message =
        err instanceof SeshAdapterError
          ? err.message
          : "Unable to decline join request.";
      toast.error(message);
    }
  };

  const handleConfirmRemoveMember = () => {
    if (!memberPendingRemoval) return;
    try {
      adapter.removeMember(group.id, memberPendingRemoval.id, viewer);
      toast.success(
        `Removed ${memberPendingRemoval.displayName} from the Move Group.`
      );
      setMemberPendingRemoval(null);
    } catch (err) {
      const message =
        err instanceof SeshAdapterError
          ? err.message
          : "Unable to remove member.";
      toast.error(message);
    }
  };

  const handleUpdateSettings = (values: MoveGroupFormValues) => {
    const meetupTime = nyLocalInputToUtcIso(values.meetupTimeLocal);
    if (!meetupTime) {
      form.setError("meetupTimeLocal", {
        message: "Enter a valid meet-up date and time.",
      });
      return;
    }

    try {
      const updated = adapter.updateMoveGroup(
        group.id,
        {
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

      form.reset({
        eventId: updated.eventId,
        name: updated.name,
        note: updated.note,
        capacity: updated.capacity,
        discoverability: updated.discoverability,
        joinMode: updated.joinMode,
        meetupTimeLocal: utcIsoToNyLocalInput(updated.meetupTime),
        meetupSpot: updated.meetupSpot,
        externalChatLink: updated.unlockedExternalChatLink ?? "",
      });

      toast.success("Move Group settings saved.");
    } catch (err) {
      const message =
        err instanceof SeshAdapterError
          ? err.message
          : "Unable to update Move Group settings.";
      if (
        err instanceof SeshAdapterError &&
        err.code === "VALIDATION_ERROR" &&
        err.message.toLowerCase().includes("capacity")
      ) {
        form.setError("capacity", { message: err.message });
      }
      toast.error(message);
    }
  };

  const handleConfirmDisband = () => {
    try {
      const targetEventId = group.eventId;
      adapter.disbandMoveGroup(group.id, viewer);
      toast.success("Move Group disbanded.");
      router.push(`/events/${targetEventId}`);
    } catch (err) {
      const message =
        err instanceof SeshAdapterError
          ? err.message
          : "Unable to disband Move Group.";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={`/move-groups/${group.id}`}>
            <ArrowLeftIcon className="size-4" />
            Back to Move Group
          </Link>
        </Button>

        <Button asChild variant="link" size="sm">
          <Link href={`/events/${group.eventId}`}>
            Parent Event: {group.eventSummary.title}
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow={
          <div className="flex flex-wrap items-center gap-1.5 normal-case tracking-normal">
            <Badge variant="default">Host Management</Badge>
            <Badge variant={group.isFull ? "destructive" : "outline"}>
              {group.roster.totalMemberCount} / {group.capacity} members
              {group.isFull ? " · Full" : ""}
            </Badge>
          </div>
        }
        title={`Manage: ${group.name}`}
        description="Review join requests, manage accepted members, update coordination logistics, or disband your Move Group."
        actions={<MoveGroupInviteDialog group={group} />}
      />

      <DemoNoticeBanner title="Host Controls (Browser-Local Sync)">
        Approvals, declines, member removals, and edits update immediately
        across all views. Switch Demo Identity in the top header to verify what
        applicants and non-members see!
      </DemoNoticeBanner>

      {/* Section 1: Pending Join Requests */}
      <Card>
        <CardHeader className="border-b border-border/70">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                Pending Join Requests
                <Badge
                  variant={
                    ownerData.pendingRequests.length > 0
                      ? "default"
                      : "secondary"
                  }
                >
                  {ownerData.pendingRequests.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                Approve students to add them to the crew and unlock your full
                roster and chat link.
              </CardDescription>
            </div>
            {group.isFull && ownerData.pendingRequests.length > 0 ? (
              <Badge variant="destructive">
                At capacity ({group.capacity}/{group.capacity}) — increase
                capacity or free a spot to approve
              </Badge>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {ownerData.pendingRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/25 px-4 py-6 text-center text-sm text-muted-foreground">
              No pending join requests right now.
            </div>
          ) : (
            <ul className="divide-y divide-border/70 rounded-lg border border-border">
              {ownerData.pendingRequests.map((req) => (
                <li
                  key={req.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <UserAvatar user={req.user} className="mt-0.5 size-9" />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {req.user.displayName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @{req.user.username}
                          {req.user.graduationYear
                            ? ` · GT '${String(req.user.graduationYear).slice(-2)}`
                            : ""}
                        </span>
                      </div>

                      {req.note ? (
                        <p className="rounded-md bg-muted/50 px-2.5 py-1.5 text-xs text-foreground">
                          &ldquo;{req.note}&rdquo;
                        </p>
                      ) : null}

                      <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <ClockIcon className="size-3" />
                        Requested {formatEventDateTime(req.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDeclineRequest(req.id, req.user.displayName)
                      }
                    >
                      <XIcon className="size-3.5" />
                      Decline
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        handleApproveRequest(req.id, req.user.displayName)
                      }
                    >
                      <CheckIcon className="size-3.5" />
                      Approve
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {ownerData.declinedRequests.length > 0 ? (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Declined Requests History ({ownerData.declinedRequests.length})
              </h4>
              <ul className="divide-y divide-border/60 rounded-lg border border-border/70 bg-muted/20">
                {ownerData.declinedRequests.map((req) => (
                  <li
                    key={req.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserAvatar user={req.user} className="size-7" />
                      <div>
                        <span className="font-medium text-foreground">
                          {req.user.displayName}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          (@{req.user.username})
                        </span>
                        {req.note ? (
                          <p className="text-[11px] text-muted-foreground">
                            Note: &ldquo;{req.note}&rdquo;
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.decidedAt ? (
                        <span className="text-[11px] text-muted-foreground">
                          {formatEventDateTime(req.decidedAt)}
                        </span>
                      ) : null}
                      <Badge variant="outline">Declined</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Section 2: Current Members */}
      <Card>
        <CardHeader className="border-b border-border/70">
          <CardTitle className="flex items-center gap-2">
            Current Members
            <Badge variant="secondary">
              {group.roster.totalMemberCount} / {group.capacity}
            </Badge>
          </CardTitle>
          <CardDescription>
            Accepted crew members who have access to the full roster and group
            coordination details.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <ul className="divide-y divide-border/70 rounded-lg border border-border">
            <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <UserAvatar user={group.roster.creator} className="size-9" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {group.roster.creator.displayName} (You)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{group.roster.creator.username}
                  </p>
                </div>
              </div>
              <Badge variant="default">Host / Creator</Badge>
            </li>

            {ownerData.removableMembers.map((member) => (
              <li
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar user={member} className="size-9" />
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground">
                        {member.displayName}
                      </span>
                      {member.isFriend ? (
                        <Badge variant="secondary" className="text-[10px]">
                          Friend
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      @{member.username} · Joined{" "}
                      {formatEventDateTime(member.joinedAt)}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setMemberPendingRemoval(member)}
                >
                  <UserMinusIcon className="size-3.5" />
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Section 3: Edit Group Settings */}
      <Card>
        <CardHeader className="border-b border-border/70">
          <CardTitle>Edit Group Settings</CardTitle>
          <CardDescription>
            Update your crew name, coordination plan, privacy settings, or
            members-only group chat link.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5">
          <form
            onSubmit={form.handleSubmit(handleUpdateSettings)}
            className="space-y-5"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="manage-mg-name">Group Name *</Label>
              <Input
                id="manage-mg-name"
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
              <Label htmlFor="manage-mg-note">Coordination Note *</Label>
              <Textarea
                id="manage-mg-note"
                rows={3}
                aria-invalid={Boolean(form.formState.errors.note)}
                {...form.register("note")}
              />
              {form.formState.errors.note ? (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.note.message}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="manage-mg-meetup-time">
                  Meet-up Time (Atlanta / ET) *
                </Label>
                <Input
                  id="manage-mg-meetup-time"
                  type="datetime-local"
                  aria-invalid={Boolean(form.formState.errors.meetupTimeLocal)}
                  {...form.register("meetupTimeLocal")}
                />
                {form.formState.errors.meetupTimeLocal ? (
                  <p className="text-xs font-medium text-destructive">
                    {form.formState.errors.meetupTimeLocal.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="manage-mg-capacity">
                  Capacity (min {Math.max(2, group.roster.totalMemberCount)},
                  max 50) *
                </Label>
                <Controller
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <Input
                      id="manage-mg-capacity"
                      type="number"
                      min={Math.max(2, group.roster.totalMemberCount)}
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
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manage-mg-meetup-spot">Meeting Spot *</Label>
              <Input
                id="manage-mg-meetup-spot"
                aria-invalid={Boolean(form.formState.errors.meetupSpot)}
                {...form.register("meetupSpot")}
              />
              {form.formState.errors.meetupSpot ? (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.meetupSpot.message}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="manage-mg-discoverability">
                  Discoverability *
                </Label>
                <Controller
                  control={form.control}
                  name="discoverability"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="manage-mg-discoverability"
                        className="w-full"
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
                <Label htmlFor="manage-mg-join-mode">Join Mode *</Label>
                <Controller
                  control={form.control}
                  name="joinMode"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="manage-mg-join-mode"
                        className="w-full"
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
              <Label
                htmlFor="manage-mg-chat-link"
                className="flex items-center gap-1.5"
              >
                <LockIcon className="size-3.5 text-muted-foreground" />
                External Group Chat Link (Accepted Members Only)
              </Label>
              <Input
                id="manage-mg-chat-link"
                type="url"
                placeholder="https://groupme.com/join_group/... (leave empty to remove)"
                aria-invalid={Boolean(form.formState.errors.externalChatLink)}
                {...form.register("externalChatLink")}
              />
              {form.formState.errors.externalChatLink ? (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.externalChatLink.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Visible exclusively to you and accepted Move Group members.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <SaveIcon className="size-4" />
                {form.formState.isSubmitting
                  ? "Saving Changes..."
                  : "Save Group Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Section 4: Danger Zone — Disband Group */}
      <Card className="border border-destructive/30 ring-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangleIcon className="size-4" />
            Danger Zone — Disband Move Group
          </CardTitle>
          <CardDescription>
            Disbanding permanently closes this Move Group, removes it from the
            parent event&apos;s crew list, and revokes coordination access for
            all members.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Parent event <span className="font-medium text-foreground">{group.eventSummary.title}</span>{" "}
            will remain active.
          </p>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setDisbandConfirmOpen(true)}
          >
            <Trash2Icon className="size-4" />
            Disband Move Group
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(memberPendingRemoval)}
        onOpenChange={(open) => {
          if (!open) setMemberPendingRemoval(null);
        }}
        title={
          memberPendingRemoval
            ? `Remove ${memberPendingRemoval.displayName}?`
            : "Remove member?"
        }
        description={
          memberPendingRemoval
            ? `${memberPendingRemoval.displayName} will be removed from ${group.name} and lose access to the full roster and members-only chat link.`
            : ""
        }
        confirmLabel="Remove Member"
        variant="destructive"
        onConfirm={handleConfirmRemoveMember}
      />

      <ConfirmDialog
        open={disbandConfirmOpen}
        onOpenChange={setDisbandConfirmOpen}
        title={`Disband "${group.name}"?`}
        description="This Move Group will be marked as disbanded and removed from event discovery. This action cannot be undone unless you reset all demo data."
        confirmLabel="Disband Group"
        variant="destructive"
        onConfirm={handleConfirmDisband}
      />
    </div>
  );
}
