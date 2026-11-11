import type { EventFilterCriteria, EventView } from "@/types/domain";
import {
  classifyEventTimeWindow,
  matchesTimeWindowFilter,
  type EventTimeBucket,
} from "@/lib/dates";

export interface GroupedEventsHubSections {
  happeningNow: EventView[];
  tonight: EventView[];
  thisWeekend: EventView[];
  upcoming: EventView[];
  drafts: EventView[];
}

export function filterEvents(
  events: EventView[],
  criteria: EventFilterCriteria,
  nowIso: string
): EventView[] {
  const query = criteria.search?.trim().toLowerCase() ?? "";
  const category = criteria.category ?? "ALL";
  const price = criteria.price ?? "ALL";
  const timeWindow = criteria.timeWindow ?? "ALL";

  return events
    .filter((event) => {
      if (event.status === "DRAFT") {
        return Boolean(criteria.includeDraftsOwnedByViewer && event.canEdit);
      }

      if (!matchesTimeWindowFilter(event.startAt, event.endAt, nowIso, timeWindow)) {
        return false;
      }

      if (category !== "ALL" && event.category !== category) {
        return false;
      }

      if (price === "FREE" && !event.admission.isFree) {
        return false;
      }

      if (price === "PAID" && event.admission.isFree) {
        return false;
      }

      if (query.length > 0) {
        const haystack = [
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

        if (!haystack.includes(query)) {
          return false;
        }
      }

      return true;
    })
    .toSorted(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
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

    switch (bucket) {
      case "HAPPENING_NOW":
        sections.happeningNow.push(event);
        break;
      case "TONIGHT":
        sections.tonight.push(event);
        break;
      case "THIS_WEEKEND":
        sections.thisWeekend.push(event);
        break;
      case "UPCOMING":
        sections.upcoming.push(event);
        break;
      case "PAST":
      default:
        break;
    }
  }

  return sections;
}
