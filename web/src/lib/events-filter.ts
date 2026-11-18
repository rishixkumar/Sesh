import type {
  EventFilterCriteria,
  EventView,
  TimeWindowFilter,
} from "@/types/domain";
import {
  classifyEventTimeWindow,
  matchesTimeWindowFilter,
  type EventTimeBucket,
} from "@/lib/dates";
import { FilterPipeline } from "@/lib/collections/filter-pipeline";
import {
  compareBy,
  isoTime,
  type Comparator,
} from "@/lib/collections/comparators";

export interface GroupedEventsHubSections {
  happeningNow: EventView[];
  tonight: EventView[];
  thisWeekend: EventView[];
  upcoming: EventView[];
  drafts: EventView[];
}

export const TIME_WINDOW_SECTION_KEY: Record<
  Exclude<TimeWindowFilter, "ALL">,
  Exclude<keyof GroupedEventsHubSections, "drafts">
> = {
  HAPPENING_NOW: "happeningNow",
  TONIGHT: "tonight",
  THIS_WEEKEND: "thisWeekend",
  UPCOMING: "upcoming",
};

export const byStartTime: Comparator<EventView> = compareBy((event) =>
  isoTime(event.startAt)
);

export function normalizeSearchQuery(search: string | undefined): string {
  return search?.trim().toLowerCase() ?? "";
}

export function hasActiveEventFilters(criteria: EventFilterCriteria): boolean {
  return (
    normalizeSearchQuery(criteria.search).length > 0 ||
    (criteria.category ?? "ALL") !== "ALL" ||
    (criteria.price ?? "ALL") !== "ALL" ||
    (criteria.timeWindow ?? "ALL") !== "ALL"
  );
}

/** Lowercased text an event search query is matched against. */
export function eventSearchText(event: {
  title: string;
  description: string;
  venue: string;
  publicDisplayLocation: string;
  category: string;
  host: { displayName: string; username: string };
}): string {
  return [
    event.title,
    event.description,
    event.venue,
    event.publicDisplayLocation,
    event.category,
    event.host.displayName,
    event.host.username,
  ]
    .join(" ")
    .toLowerCase();
}

export interface EventFilterOptions {
  /**
   * Precomputed ids matching `criteria.search` (e.g. from a `SearchIndex`).
   * When omitted, search falls back to a linear substring scan.
   */
  searchMatches?: ReadonlySet<string>;
}

/**
 * Builds the filter pipeline applied to published events. Stage order is
 * cheapest first: time window (always on, since past events are never
 * listed), category, price, then text search.
 */
export function buildEventFilterPipeline(
  criteria: EventFilterCriteria,
  nowIso: string,
  { searchMatches }: EventFilterOptions = {}
): FilterPipeline<EventView> {
  const query = normalizeSearchQuery(criteria.search);
  const category = criteria.category ?? "ALL";
  const price = criteria.price ?? "ALL";
  const timeWindow = criteria.timeWindow ?? "ALL";

  return FilterPipeline.empty<EventView>()
    .where("timeWindow", (event) =>
      matchesTimeWindowFilter(event.startAt, event.endAt, nowIso, timeWindow)
    )
    .whereIf(category !== "ALL", "category", (event) => event.category === category)
    .whereIf(price === "FREE", "price", (event) => event.admission.isFree)
    .whereIf(price === "PAID", "price", (event) => !event.admission.isFree)
    .whereIf(
      query.length > 0,
      "search",
      searchMatches
        ? (event) => searchMatches.has(event.id)
        : (event) => eventSearchText(event).includes(query)
    );
}

/**
 * Drafts bypass the pipeline: they are listed only for their host (when
 * requested) regardless of other filters. Results are sorted by start time.
 */
export function filterEvents(
  events: EventView[],
  criteria: EventFilterCriteria,
  nowIso: string,
  options: EventFilterOptions = {}
): EventView[] {
  const pipeline = buildEventFilterPipeline(criteria, nowIso, options);
  const includeDrafts = Boolean(criteria.includeDraftsOwnedByViewer);

  return events
    .filter((event) =>
      event.status === "DRAFT"
        ? includeDrafts && event.canEdit
        : pipeline.test(event)
    )
    .toSorted(byStartTime);
}

export function groupEventsByTimeSection(
  events: EventView[],
  nowIso: string
): GroupedEventsHubSections {
  const sections: GroupedEventsHubSections = {
    happeningNow: [],
    tonight: [],
    thisWeekend: [],
    upcoming: [],
    drafts: [],
  };

  for (const event of events) {
    if (event.status === "DRAFT") {
      sections.drafts.push(event);
      continue;
    }

    const bucket: EventTimeBucket = classifyEventTimeWindow(
      event.startAt,
      event.endAt,
      nowIso
    );

    if (bucket !== "PAST") {
      sections[TIME_WINDOW_SECTION_KEY[bucket]].push(event);
    }
  }

  return sections;
}
