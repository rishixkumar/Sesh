"use client";

import React, { useId } from "react";
import { Badge } from "@/components/ui/badge";
import { EventCard } from "@/components/events/event-card";
import { cn } from "@/lib/utils";
import type { EventView } from "@/types/domain";

export interface EventSectionProps {
  id?: string;
  title: string;
  subtitle?: string;
  events: EventView[];
  /** Shows a subtle live campus pulse indicator for "Happening Now" */
  isLive?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function EventSection({
  id,
  title,
  subtitle,
  events,
  isLive = false,
  icon,
  className,
}: EventSectionProps) {
  const generatedHeadingId = useId();
  const headingId = id ? `${id}-heading` : generatedHeadingId;

  if (events.length === 0) {
    return null;
  }

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("space-y-4", className)}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            {isLive ? (
              <span
                aria-hidden="true"
                className="relative flex size-2.5 shrink-0"
              >
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
            ) : icon ? (
              <span className="text-muted-foreground">{icon}</span>
            ) : null}

            <h2
              id={headingId}
              className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
            >
              {title}
            </h2>

            <Badge variant="secondary" className="tabular-nums">
              {events.length}
            </Badge>
          </div>

          {subtitle ? (
            <p className="text-xs text-muted-foreground sm:text-sm">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isHappeningNow={isLive}
          />
        ))}
      </div>
    </section>
  );
}
