import { CAMPUS_TIMEZONE, type TimeWindowFilter } from "@/types/domain";

export type EventTimeBucket =
  | "HAPPENING_NOW"
  | "TONIGHT"
  | "THIS_WEEKEND"
  | "UPCOMING"
  | "PAST";

interface NyDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: string; // "Sun" | "Mon" | ...
}

const nyPartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CAMPUS_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  weekday: "short",
});

const nyDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CAMPUS_TIMEZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const nyShortDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CAMPUS_TIMEZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});

const nyTimeOnlyFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CAMPUS_TIMEZONE,
  hour: "numeric",
  minute: "2-digit",
});

export function getNyParts(iso: string): NyDateParts {
  const date = new Date(iso);
  const parts = nyPartsFormatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }
  const rawHour = Number(map.hour ?? "0");
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: rawHour === 24 ? 0 : rawHour,
    minute: Number(map.minute ?? "0"),
    weekday: map.weekday ?? "Mon",
  };
}

export function getNyDateKey(iso: string): string {
  const p = getNyParts(iso);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function formatEventDateTime(iso: string): string {
  return `${nyDateTimeFormatter.format(new Date(iso))} ET`;
}

export function formatEventTimeRange(startIso: string, endIso: string): string {
  const startDateKey = getNyDateKey(startIso);
  const endDateKey = getNyDateKey(endIso);
  const startDateLabel = nyShortDateFormatter.format(new Date(startIso));
  const startTimeLabel = nyTimeOnlyFormatter.format(new Date(startIso));
  const endTimeLabel = nyTimeOnlyFormatter.format(new Date(endIso));

  if (startDateKey === endDateKey) {
    return `${startDateLabel} · ${startTimeLabel} – ${endTimeLabel} ET`;
  }
  const endDateLabel = nyShortDateFormatter.format(new Date(endIso));
  return `${startDateLabel}, ${startTimeLabel} – ${endDateLabel}, ${endTimeLabel} ET`;
}

export function formatMeetupTime(iso: string): string {
  return `${nyDateTimeFormatter.format(new Date(iso))} ET`;
}

/**
 * Converts a UTC ISO string into `YYYY-MM-DDTHH:mm` in America/New_York
 * for `<input type="datetime-local" />` controls.
 */
export function utcIsoToNyLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = getNyParts(iso);
  const yyyy = String(p.year).padStart(4, "0");
  const mm = String(p.month).padStart(2, "0");
  const dd = String(p.day).padStart(2, "0");
  const hh = String(p.hour).padStart(2, "0");
  const min = String(p.minute).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

/**
 * Converts a `YYYY-MM-DDTHH:mm` wall-clock value in America/New_York into a UTC ISO string.
 */
export function nyLocalInputToUtcIso(localValue: string): string {
  if (!localValue) return "";
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
      localValue.trim()
    );
  if (!match) {
    const fallback = new Date(localValue);
    return Number.isNaN(fallback.getTime()) ? "" : fallback.toISOString();
  }
  const [, yStr, mStr, dStr, hStr, minStr] = match;
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  const hour = Number(hStr);
  const minute = Number(minStr);

  // Iteratively align UTC candidate so its America/New_York wall clock matches target
  let candidateMs = Date.UTC(year, month - 1, day, hour + 5, minute, 0, 0);
  for (let i = 0; i < 3; i++) {
    const p = getNyParts(new Date(candidateMs).toISOString());
    const observedAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute);
    const diff = targetAsUtc - observedAsUtc;
    if (diff === 0) break;
    candidateMs += diff;
  }
  return new Date(candidateMs).toISOString();
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Classifies an event into a campus discovery bucket relative to `nowIso` in America/New_York.
 */
export function classifyEventTimeWindow(
  startIso: string,
  endIso: string,
  nowIso: string
): EventTimeBucket {
  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();
  const nowMs = new Date(nowIso).getTime();

  if (endMs <= nowMs) {
    return "PAST";
  }

  if (startMs <= nowMs && endMs > nowMs) {
    return "HAPPENING_NOW";
  }

  const nowNy = getNyParts(nowIso);
  const startNy = getNyParts(startIso);
  const sameNyDay =
    nowNy.year === startNy.year &&
    nowNy.month === startNy.month &&
    nowNy.day === startNy.day;

  // Late-night campus events starting before 4 AM next morning also count as "Tonight"
  const nextMorningCutoffMs = nowMs + 14 * 60 * 60 * 1000;
  const isLateNightTonight =
    nowNy.hour >= 15 && startMs <= nextMorningCutoffMs && startNy.hour < 4;

  if (sameNyDay || isLateNightTonight) {
    return "TONIGHT";
  }

  // Determine upcoming/current weekend window (Friday 16:00 ET through Sunday 23:59 ET)
  const nowWeekday = WEEKDAY_INDEX[nowNy.weekday] ?? 1;
  const daysUntilSunday = (7 - nowWeekday) % 7;
  // Build Sunday 23:59 ET for the current week in NY
  const sundayEndIso = nyLocalInputToUtcIso(
    shiftNyDateString(nowIso, daysUntilSunday, "23:59")
  );
  const daysUntilFriday =
    nowWeekday === 0 ? -2 : 5 - nowWeekday;
  const fridayStartIso = nyLocalInputToUtcIso(
    shiftNyDateString(nowIso, daysUntilFriday, "16:00")
  );

  const fridayStartMs = new Date(fridayStartIso).getTime();
  const sundayEndMs = new Date(sundayEndIso).getTime();

  if (startMs >= fridayStartMs && startMs <= sundayEndMs) {
    return "THIS_WEEKEND";
  }

  return "UPCOMING";
}

function shiftNyDateString(
  baseIso: string,
  deltaDays: number,
  hhmm: string
): string {
  const p = getNyParts(baseIso);
  const utcNoon = new Date(Date.UTC(p.year, p.month - 1, p.day + deltaDays, 12, 0, 0));
  const y = utcNoon.getUTCFullYear();
  const m = String(utcNoon.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utcNoon.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}T${hhmm}`;
}

export function matchesTimeWindowFilter(
  startIso: string,
  endIso: string,
  nowIso: string,
  filter: TimeWindowFilter = "ALL"
): boolean {
  const bucket = classifyEventTimeWindow(startIso, endIso, nowIso);
  if (bucket === "PAST") return false;
  if (filter === "ALL") return true;
  return bucket === filter;
}

/**
 * Helper to create a UTC ISO string relative to an anchor NY date + day offset + NY wall-clock time.
 */
export function buildRelativeNyIso(
  anchorIso: string,
  dayOffset: number,
  nyTimeHhMm: string
): string {
  return nyLocalInputToUtcIso(shiftNyDateString(anchorIso, dayOffset, nyTimeHhMm));
}
