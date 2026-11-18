import type { Comparator } from "./comparators";

/**
 * Binary-heap priority queue. `compare(a, b) < 0` means `a` is served first,
 * so popping everything yields the same order as `toSorted(compare)` for
 * distinct keys. Ties are served in no guaranteed order — add a sequence key
 * to the comparator when insertion order matters.
 */
export class PriorityQueue<T> {
  private readonly heap: T[] = [];

  constructor(private readonly compare: Comparator<T>) {}

  /** Builds a queue from `items` with bottom-up heapify in O(n). */
  static from<T>(items: Iterable<T>, compare: Comparator<T>): PriorityQueue<T> {
    const queue = new PriorityQueue(compare);
    queue.heap.push(...items);
    for (let i = (queue.heap.length >> 1) - 1; i >= 0; i -= 1) {
      queue.siftDown(i);
    }
    return queue;
  }

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  peek(): T | undefined {
    return this.heap[0];
  }

  /** O(log n). */
  push(item: T): void {
    this.heap.push(item);
    this.siftUp(this.heap.length - 1);
  }

  /** O(log n). */
  pop(): T | undefined {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last !== undefined) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  /** Swaps the top for `item` in one sift — cheaper than `pop` + `push`. */
  replaceTop(item: T): T | undefined {
    if (this.heap.length === 0) {
      this.heap.push(item);
      return undefined;
    }
    const top = this.heap[0];
    this.heap[0] = item;
    this.siftDown(0);
    return top;
  }

  /** Pops every item in priority order, leaving the queue empty. O(n log n). */
  drain(): T[] {
    const out: T[] = [];
    while (this.heap.length > 0) {
      out.push(this.pop() as T);
    }
    return out;
  }

  private siftUp(index: number): void {
    const { heap, compare } = this;
    let i = index;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (compare(heap[i], heap[parent]) >= 0) break;
      [heap[i], heap[parent]] = [heap[parent], heap[i]];
      i = parent;
    }
  }

  private siftDown(index: number): void {
    const { heap, compare } = this;
    const n = heap.length;
    let i = index;
    for (;;) {
      const left = 2 * i + 1;
      const right = left + 1;
      let best = i;
      if (left < n && compare(heap[left], heap[best]) < 0) best = left;
      if (right < n && compare(heap[right], heap[best]) < 0) best = right;
      if (best === i) return;
      [heap[i], heap[best]] = [heap[best], heap[i]];
      i = best;
    }
  }
}

/**
 * The first `k` items of `items` under `compare`, in order — equivalent to
 * `[...items].toSorted(compare).slice(0, k)` (stable on ties) but O(n log k)
 * time and O(k) space, using a bounded heap whose top is the worst kept item.
 */
export function topK<T>(
  items: Iterable<T>,
  k: number,
  compare: Comparator<T>
): T[] {
  if (k <= 0) return [];

  type Ranked = { item: T; seq: number };
  const rank: Comparator<Ranked> = (a, b) =>
    compare(a.item, b.item) || a.seq - b.seq;
  const worstFirst = new PriorityQueue<Ranked>((a, b) => rank(b, a));

  let seq = 0;
  for (const item of items) {
    const entry = { item, seq: seq++ };
    if (worstFirst.size < k) {
      worstFirst.push(entry);
    } else if (rank(entry, worstFirst.peek() as Ranked) < 0) {
      worstFirst.replaceTop(entry);
    }
  }

  return worstFirst
    .drain()
    .reverse()
    .map((entry) => entry.item);
}
