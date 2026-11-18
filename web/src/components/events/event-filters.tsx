"use client";

import React from "react";
import { FilterXIcon, SearchIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  EVENT_CATEGORIES,
  type EventCategory,
  type PriceFilter,
  type TimeWindowFilter,
} from "@/types/domain";

export interface EventFiltersProps {
  search: string;
  category: "ALL" | EventCategory;
  price: PriceFilter;
  timeWindow: TimeWindowFilter;
  totalResultsCount: number;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (category: "ALL" | EventCategory) => void;
  onPriceChange: (price: PriceFilter) => void;
  onTimeWindowChange: (timeWindow: TimeWindowFilter) => void;
  onClearFilters: () => void;
}

const TIME_WINDOW_OPTIONS: ReadonlyArray<{
  value: TimeWindowFilter;
  label: string;
  isLive?: boolean;
}> = [
  { value: "ALL", label: "All Times" },
  { value: "HAPPENING_NOW", label: "Happening Now", isLive: true },
  { value: "TONIGHT", label: "Tonight" },
  { value: "THIS_WEEKEND", label: "This Weekend" },
  { value: "UPCOMING", label: "Upcoming" },
];

const PRICE_OPTIONS: ReadonlyArray<{
  value: PriceFilter;
  label: string;
}> = [
  { value: "ALL", label: "All Prices" },
  { value: "FREE", label: "Free" },
  { value: "PAID", label: "Paid" },
];

const CATEGORY_OPTIONS: ReadonlyArray<{
  value: "ALL" | EventCategory;
  label: string;
}> = [
  { value: "ALL", label: "All Categories" },
  ...EVENT_CATEGORIES.map((cat) => ({ value: cat, label: cat })),
];

export function EventFilters({
  search,
  category,
  price,
  timeWindow,
  totalResultsCount,
  hasActiveFilters,
  onSearchChange,
  onCategoryChange,
  onPriceChange,
  onTimeWindowChange,
  onClearFilters,
}: EventFiltersProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3.5 shadow-2xs sm:p-4">
      {/* Row 1: Search Input + Time Window & Free/Paid Segmented Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search Input */}
        <div className="relative w-full lg:max-w-sm">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Moves, venues, Midtown spots, or @hosts..."
            aria-label="Search campus events"
            className="h-9 pr-8 pl-8"
          />
          {search.length > 0 ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search query"
              className="absolute top-1/2 right-2 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <XIcon className="size-3.5" />
            </button>
          ) : null}
        </div>

        {/* Time Window + Price Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Window Filter Group */}
          <div
            role="group"
            aria-label="Filter by time window"
            className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-muted/70 p-1"
          >
            {TIME_WINDOW_OPTIONS.map((opt) => {
              const active = timeWindow === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onTimeWindowChange(opt.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    active
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.isLive ? (
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full bg-emerald-500"
                    />
                  ) : null}
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Free / Paid Filter Group */}
          <div
            role="group"
            aria-label="Filter by admission price"
            className="inline-flex items-center gap-1 rounded-lg bg-muted/70 p-1"
          >
            {PRICE_OPTIONS.map((opt) => {
              const active = price === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onPriceChange(opt.value)}
                  className={cn(
                    "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    active
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Category Filter Pills */}
      <div
        role="group"
        aria-label="Filter by event category"
        className="flex flex-wrap items-center gap-1.5 border-t border-border/60 pt-3"
      >
        {CATEGORY_OPTIONS.map((opt) => {
          const active = category === opt.value;
          return (
            <Button
              key={opt.value}
              type="button"
              size="xs"
              variant={active ? "default" : "outline"}
              aria-pressed={active}
              onClick={() => onCategoryChange(opt.value)}
              className="rounded-full px-3"
            >
              {opt.label}
            </Button>
          );
        })}
      </div>

      {/* Row 3: Active Results Summary Bar + Clear Filters Action */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-1.5">
          <span>
            Showing{" "}
            <strong className="font-semibold text-foreground">
              {totalResultsCount}
            </strong>{" "}
            {totalResultsCount === 1 ? "Move" : "Moves"}
          </span>

          {hasActiveFilters ? (
            <>
              <span aria-hidden="true">·</span>
              {search.trim() ? (
                <Badge variant="secondary" className="font-normal">
                  Query: &ldquo;{search.trim()}&rdquo;
                </Badge>
              ) : null}
              {category !== "ALL" ? (
                <Badge variant="secondary" className="font-normal">
                  {category}
                </Badge>
              ) : null}
              {price !== "ALL" ? (
                <Badge variant="secondary" className="font-normal">
                  {price === "FREE" ? "Free only" : "Paid only"}
                </Badge>
              ) : null}
              {timeWindow !== "ALL" ? (
                <Badge variant="secondary" className="font-normal">
                  {
                    TIME_WINDOW_OPTIONS.find((t) => t.value === timeWindow)
                      ?.label
                  }
                </Badge>
              ) : null}
            </>
          ) : (
            <span>across Georgia Tech &amp; Midtown Atlanta</span>
          )}
        </div>

        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onClearFilters}
            className="text-foreground"
          >
            <FilterXIcon className="size-3" />
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
