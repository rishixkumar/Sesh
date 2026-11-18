export type Comparator<T> = (a: T, b: T) => number;

/**
 * Builds a comparator from a numeric or string sort key. Pair with
 * `Array#toSorted` (stable), so equal keys keep their input order.
 */
export function compareBy<T>(
  keyFn: (item: T) => number | string,
  direction: "asc" | "desc" = "asc"
): Comparator<T> {
  const sign = direction === "asc" ? 1 : -1;
  return (a, b) => {
    const ka = keyFn(a);
    const kb = keyFn(b);
    if (typeof ka === "number" && typeof kb === "number") {
      return (ka - kb) * sign;
    }
    return (ka < kb ? -1 : ka > kb ? 1 : 0) * sign;
  };
}

/** Multi-key sort: the first comparator that returns non-zero decides. */
export function thenBy<T>(...comparators: Comparator<T>[]): Comparator<T> {
  return (a, b) => {
    for (const compare of comparators) {
      const result = compare(a, b);
      if (result !== 0) return result;
    }
    return 0;
  };
}

/** Sort key for UTC ISO-8601 timestamps. */
export function isoTime(iso: string): number {
  return new Date(iso).getTime();
}
