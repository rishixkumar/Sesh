/**
 * Builds a unique-key hash index over `items`.
 *
 * Duplicate keys resolve last-write-wins (matching `Map#set` semantics), so a
 * later item silently replaces an earlier one with the same key.
 */
export function indexBy<T, K>(
  items: Iterable<T>,
  keyFn: (item: T) => K
): Map<K, T> {
  const index = new Map<K, T>();
  for (const item of items) {
    index.set(keyFn(item), item);
  }
  return index;
}

/**
 * Buckets `items` by key in a single pass. Items keep their original relative
 * order within each group, and groups appear in first-seen key order.
 */
export function groupBy<T, K>(
  items: Iterable<T>,
  keyFn: (item: T) => K
): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return groups;
}
