import type {
  EventFilterCriteria,
  EventResponseType,
  EventView,
} from "@/types/domain";
import { thenBy, type Comparator } from "@/lib/collections/comparators";
import type { Predicate } from "@/lib/collections/filter-pipeline";
import {
  filterEvents,
  groupEventsByTimeSection,
  type GroupedEventsHubSections,
} from "@/lib/events-filter";

/**
 * Immutable, chainable query wrapper over viewer-projected events. Every
 * query returns a new collection, so results can be composed without
 * mutating the source list.
 */
export class EventCollection implements Iterable<EventView> {
  private constructor(private readonly events: readonly EventView[]) {}

  static from(events: Iterable<EventView>): EventCollection {
    return new EventCollection([...events]);
  }

  get size(): number {
    return this.events.length;
  }

  [Symbol.iterator](): Iterator<EventView> {
    return this.events[Symbol.iterator]();
  }

  toArray(): EventView[] {
    return [...this.events];
  }

  first(): EventView | undefined {
    return this.events[0];
  }

  where(predicate: Predicate<EventView>): EventCollection {
    return new EventCollection(this.events.filter(predicate));
  }

  /** Hub filter criteria (time window, category, price, search, drafts). */
  filter(criteria: EventFilterCriteria, nowIso: string): EventCollection {
    return new EventCollection(filterEvents([...this.events], criteria, nowIso));
  }

  /** Stable multi-key sort; earlier comparators take precedence. */
  sortBy(...comparators: Comparator<EventView>[]): EventCollection {
    return new EventCollection(this.events.toSorted(thenBy(...comparators)));
  }

  hostedBy(userId: string): EventCollection {
    return this.where((event) => event.hostId === userId);
  }

  /** Events the viewer responded to; pass types to narrow (e.g. "GOING"). */
  withViewerResponse(...types: EventResponseType[]): EventCollection {
    return this.where(
      (event) =>
        event.viewerResponse !== null &&
        (types.length === 0 || types.includes(event.viewerResponse))
    );
  }

  groupByTimeSection(nowIso: string): GroupedEventsHubSections {
    return groupEventsByTimeSection([...this.events], nowIso);
  }
}
