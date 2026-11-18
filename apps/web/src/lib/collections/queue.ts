/**
 * FIFO queue with amortized O(1) `enqueue` / `dequeue`.
 *
 * Uses a head pointer instead of `Array#shift` (which is O(n)), compacting the
 * backing array once the consumed prefix outgrows the live items.
 */
export class Queue<T> {
  private items: T[] = [];
  private head = 0;

  constructor(initial: Iterable<T> = []) {
    for (const item of initial) {
      this.items.push(item);
    }
  }

  get size(): number {
    return this.items.length - this.head;
  }

  isEmpty(): boolean {
    return this.size === 0;
  }

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const item = this.items[this.head];
    this.head += 1;
    if (this.head * 2 >= this.items.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
    return item;
  }

  peek(): T | undefined {
    return this.isEmpty() ? undefined : this.items[this.head];
  }
}
