"use client";

import React from "react";
import { BookmarkIcon, CheckCircle2Icon, KeyRoundIcon, StarIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSesh } from "@/lib/context/sesh-provider";
import { SeshAdapterError } from "@/lib/data/adapter";
import { cn } from "@/lib/utils";
import type { EventResponseType, EventView } from "@/types/domain";

export interface RsvpControlsProps {
  event: EventView;
  className?: string;
}

export function RsvpControls({ event, className }: RsvpControlsProps) {
  const { adapter, viewer, nowIso, requireDemoMember } = useSesh();

  const handleToggleResponse = (target: EventResponseType) => {
    if (!requireDemoMember("RSVP or save this event")) {
      return;
    }

    const nextResponse = event.viewerResponse === target ? null : target;

    try {
      const updated = adapter.setEventResponse(
        event.id,
        nextResponse,
        viewer,
        nowIso
      );

      if (nextResponse === null) {
        toast.info("Cleared your response for this Move");
      } else if (nextResponse === "GOING") {
        if (
          !event.unlockedPrivateAddress &&
          updated.unlockedPrivateAddress
        ) {
          toast.success("You're marked as Going!", {
            description:
              "Exact host address is now unlocked in the Location section.",
          });
        } else {
          toast.success("You're marked as Going!");
        }
      } else if (nextResponse === "INTERESTED") {
        toast.success("Marked as Interested");
      } else if (nextResponse === "SAVED") {
        toast.success("Saved to your Moves");
      }
    } catch (err) {
      const message =
        err instanceof SeshAdapterError
          ? err.message
          : "Unable to update RSVP right now.";
      toast.error(message);
    }
  };

  const options: Array<{
    type: EventResponseType;
    label: string;
    activeLabel: string;
    count: number;
    icon: React.ReactNode;
  }> = [
    {
      type: "GOING",
      label: "Going",
      activeLabel: "Going",
      count: event.goingCount,
      icon: <CheckCircle2Icon className="size-4" />,
    },
    {
      type: "INTERESTED",
      label: "Interested",
      activeLabel: "Interested",
      count: event.interestedCount,
      icon: <StarIcon className="size-4" />,
    },
    {
      type: "SAVED",
      label: "Save",
      activeLabel: "Saved",
      count: event.savedCount,
      icon: <BookmarkIcon className="size-4" />,
    },
  ];

  const showGoingUnlockHint =
    event.hasPrivateAddress &&
    !event.unlockedPrivateAddress &&
    event.addressPrivacy === "RSVP_GOING_ONLY";

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Your Move Status</CardTitle>
        <CardDescription>
          {viewer.mode === "MEMBER"
            ? `Signed in as ${viewer.user.displayName} (@${viewer.user.username})`
            : "Browsing in Guest mode — sign in as a Demo Member to RSVP or save"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {options.map((opt) => {
            const isActive = event.viewerResponse === opt.type;
            return (
              <Button
                key={opt.type}
                type="button"
                variant={isActive ? "default" : "outline"}
                aria-pressed={isActive}
                onClick={() => handleToggleResponse(opt.type)}
                className={cn(
                  "flex h-auto flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium",
                  isActive &&
                    "ring-2 ring-primary/30"
                )}
              >
                <div className="flex items-center gap-1.5">
                  {opt.icon}
                  <span>{isActive ? opt.activeLabel : opt.label}</span>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {opt.count}
                </span>
              </Button>
            );
          })}
        </div>

        {showGoingUnlockHint ? (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <KeyRoundIcon className="mt-0.5 size-3.5 shrink-0 text-foreground/80" />
            <span>
              Marking <strong className="font-medium text-foreground">Going</strong> as a
              verified GT member unlocks the host&apos;s exact street address.
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
