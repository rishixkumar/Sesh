"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarClockIcon,
  CalendarDaysIcon,
  CompassIcon,
  FilePenLineIcon,
  FilterXIcon,
  MapPinIcon,
  MoonStarIcon,
  PlusIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventFilters } from "@/components/events/event-filters";
import { EventSection } from "@/components/events/event-section";
import { DemoNoticeBanner } from "@/components/shared/demo-notice-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useSesh } from "@/lib/context/sesh-provider";
import { formatEventTimeRange } from "@/lib/dates";
import { groupEventsByTimeSection } from "@/lib/events-filter";
import {
  CAMPUS_AREA_LABEL,
  CAMPUS_NAME,
  type EventCategory,
  type PriceFilter,
  type TimeWindowFilter,
} from "@/types/domain";

const SECTION_META: Record<
  Exclude<TimeWindowFilter, "ALL">,
  {
    id: string;
    title: string;
    subtitle: string;
    isLive?: boolean;
    icon?: React.ReactNode;
  }
> = {
  HAPPENING_NOW: {
    id: "happening-now",
    title: "Happening Now",
    subtitle: "Active right now across Georgia Tech & Midtown (ET)",
    isLive: true,
  },
  TONIGHT: {
    id: "tonight",
    title: "Tonight",
    subtitle: "Starting later tonight around campus, Tech Square & West Midtown",
    icon: <MoonStarIcon className="size-4" />,
  },
  THIS_WEEKEND: {
    id: "this-weekend",
    title: "This Weekend",
    subtitle: "Friday evening through Sunday night plans",
    icon: <SparklesIcon className="size-4" />,
  },
  UPCOMING: {
    id: "upcoming",
    title: "Upcoming",
    subtitle: "Next week and beyond on the Georgia Tech calendar",
    icon: <CalendarDaysIcon className="size-4" />,
  },
};

export function EventsHub() {
  const { adapter, viewer, nowIso, revision } = useSesh();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlQuery = searchParams.get("q") ?? "";

  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  const [search, setSearch] = useState(urlQuery);
  const [category, setCategory] = useState<"ALL" | EventCategory>("ALL");
  const [price, setPrice] = useState<PriceFilter>("ALL");
  const [timeWindow, setTimeWindow] = useState<TimeWindowFilter>("ALL");

  // Sync local search input whenever external `?q=` query param changes (e.g. header search)
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setSearch(urlQuery);
  }

  const events = useMemo(() => {
    // Reference `revision` so adapter mutations (RSVPs, edits, resets) invalidate memo cleanly
    void revision;
    return adapter.listEvents(
      viewer,
      {
        search,
        category,
        price,
        timeWindow,
        includeDraftsOwnedByViewer: viewer.mode === "MEMBER",
      },
      nowIso
    );
  }, [adapter, viewer, search, category, price, timeWindow, nowIso, revision]);

  const sections = useMemo(
    () => groupEventsByTimeSection(events, nowIso),
    [events, nowIso]
  );

  const publishedCount =
    sections.happeningNow.length +
    sections.tonight.length +
    sections.thisWeekend.length +
    sections.upcoming.length;

  const hasActiveFilters =
    search.trim().length > 0 ||
    category !== "ALL" ||
    price !== "ALL" ||
    timeWindow !== "ALL";

  const handleSearchChange = (nextValue: string) => {
    setSearch(nextValue);
    if (nextValue === "" && urlQuery.length > 0) {
      setPrevUrlQuery("");
      router.replace(pathname, { scroll: false });
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategory("ALL");
    setPrice("ALL");
    setTimeWindow("ALL");
    if (urlQuery.length > 0) {
      setPrevUrlQuery("");
      router.replace(pathname, { scroll: false });
    }
  };

  const getSectionEvents = (bucket: Exclude<TimeWindowFilter, "ALL">) => {
    switch (bucket) {
      case "HAPPENING_NOW":
        return sections.happeningNow;
      case "TONIGHT":
        return sections.tonight;
      case "THIS_WEEKEND":
        return sections.thisWeekend;
      case "UPCOMING":
        return sections.upcoming;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Campus Header & Primary Actions */}
      <PageHeader
        eyebrow={
          <>
            <span className="inline-flex items-center gap-1 text-foreground/80">
              <MapPinIcon className="size-3.5 text-amber-600 dark:text-amber-400" />
              {CAMPUS_AREA_LABEL}
            </span>
            <span aria-hidden="true">·</span>
            <span>18+ Campus Social Discovery</span>
            <span aria-hidden="true">·</span>
            <Badge variant="outline" className="text-[10px] font-medium normal-case">
              {viewer.mode === "MEMBER"
                ? `Viewing as ${viewer.user.displayName}`
                : "Guest Public Feed"}
            </Badge>
          </>
        }
        title={CAMPUS_NAME}
        description="See what's happening across campus, Tech Square, Home Park, and Midtown Atlanta — then join or start a Move Group so nobody pulls up solo."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/move-groups/new">
                <UsersIcon className="size-4" />
                Start a Move Group
              </Link>
            </Button>
            <Button asChild>
              <Link href="/events/new">
                <PlusIcon className="size-4" />
                Create a Move
              </Link>
            </Button>
          </>
        }
      />

      {/* Demo & Fictional Campus Seed Notice */}
      <DemoNoticeBanner title="Fictional Georgia Tech demo feed">
        All venues, hosts, addresses, and Move Groups are fictional Milestone 1
        seed data. Changes you make (RSVPs, Saved Moves, Drafts, and Move
        Groups) persist locally in this browser only.
      </DemoNoticeBanner>

      {/* Signed-in Member Unpublished Drafts Section */}
      {viewer.mode === "MEMBER" && sections.drafts.length > 0 ? (
        <section
          aria-labelledby="saved-drafts-heading"
          className="rounded-xl border border-amber-500/35 bg-amber-500/5 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
            <div className="flex items-center gap-2">
              <CalendarClockIcon className="size-4 text-amber-600 dark:text-amber-400" />
              <h2
                id="saved-drafts-heading"
                className="text-sm font-semibold text-foreground"
              >
                Your Saved Drafts
              </h2>
              <Badge variant="secondary" className="tabular-nums">
                {sections.drafts.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Visible only to you until published
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {sections.drafts.map((draft) => (
              <div
                key={draft.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 shadow-2xs"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">
                      {draft.category}
                    </Badge>
                    <Link
                      href={`/events/${draft.id}`}
                      className="truncate text-sm font-medium text-foreground hover:underline"
                    >
                      {draft.title}
                    </Link>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatEventTimeRange(draft.startAt, draft.endAt)} ·{" "}
                    {draft.publicDisplayLocation}
                  </p>
                </div>

                <Button variant="outline" size="xs" asChild className="shrink-0">
                  <Link href={`/events/${draft.id}/edit`}>
                    <FilePenLineIcon className="size-3" />
                    Continue editing
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Search & Discovery Filter Controls */}
      <EventFilters
        search={search}
        category={category}
        price={price}
        timeWindow={timeWindow}
        totalResultsCount={publishedCount}
        hasActiveFilters={hasActiveFilters}
        onSearchChange={handleSearchChange}
        onCategoryChange={setCategory}
        onPriceChange={setPrice}
        onTimeWindowChange={setTimeWindow}
        onClearFilters={handleClearFilters}
      />

      {/* Populated Time-Window Sections or Friendly Empty State */}
      {publishedCount === 0 ? (
        <EmptyState
          icon={<CompassIcon className="size-6" />}
          title={
            hasActiveFilters
              ? "No Moves match your current filters"
              : "No upcoming Moves on the feed right now"
          }
          description={
            hasActiveFilters
              ? "Try broadening your search, switching time windows, or clearing active filters to see everything happening around Georgia Tech and Midtown."
              : "Be the first to post a campus hangout, concert crew, or pre-game Move for Georgia Tech students."
          }
          action={
            hasActiveFilters ? (
              <Button type="button" onClick={handleClearFilters}>
                <FilterXIcon className="size-4" />
                Clear all filters
              </Button>
            ) : (
              <Button asChild>
                <Link href="/events/new">
                  <PlusIcon className="size-4" />
                  Create a Move
                </Link>
              </Button>
            )
          }
          secondaryAction={
            hasActiveFilters ? (
              <Button variant="outline" asChild>
                <Link href="/events/new">
                  <PlusIcon className="size-4" />
                  Create a Move
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : timeWindow === "ALL" ? (
        <div className="space-y-10">
          <EventSection
            id={SECTION_META.HAPPENING_NOW.id}
            title={SECTION_META.HAPPENING_NOW.title}
            subtitle={SECTION_META.HAPPENING_NOW.subtitle}
            events={sections.happeningNow}
            isLive
          />
          <EventSection
            id={SECTION_META.TONIGHT.id}
            title={SECTION_META.TONIGHT.title}
            subtitle={SECTION_META.TONIGHT.subtitle}
            events={sections.tonight}
            icon={SECTION_META.TONIGHT.icon}
          />
          <EventSection
            id={SECTION_META.THIS_WEEKEND.id}
            title={SECTION_META.THIS_WEEKEND.title}
            subtitle={SECTION_META.THIS_WEEKEND.subtitle}
            events={sections.thisWeekend}
            icon={SECTION_META.THIS_WEEKEND.icon}
          />
          <EventSection
            id={SECTION_META.UPCOMING.id}
            title={SECTION_META.UPCOMING.title}
            subtitle={SECTION_META.UPCOMING.subtitle}
            events={sections.upcoming}
            icon={SECTION_META.UPCOMING.icon}
          />
        </div>
      ) : (
        <EventSection
          id={SECTION_META[timeWindow].id}
          title={SECTION_META[timeWindow].title}
          subtitle={SECTION_META[timeWindow].subtitle}
          events={getSectionEvents(timeWindow)}
          isLive={SECTION_META[timeWindow].isLive}
          icon={SECTION_META[timeWindow].icon}
        />
      )}
    </div>
  );
}
