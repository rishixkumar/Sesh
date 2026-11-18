class TrieNode<V> {
  readonly children = new Map<string, TrieNode<V>>();
  /** Values of every key that passes through (has this node's path as prefix). */
  readonly values = new Set<V>();
}

const EMPTY: ReadonlySet<never> = new Set();

/**
 * Prefix tree keyed by Unicode code points. Each node stores the values of all
 * keys beneath it, so `withPrefix` is O(prefix length) with no subtree walk,
 * at the cost of O(key length) memory per inserted key.
 */
export class Trie<V> {
  private readonly root = new TrieNode<V>();

  insert(key: string, value: V): void {
    let node = this.root;
    node.values.add(value);
    for (const char of key) {
      let next = node.children.get(char);
      if (!next) {
        next = new TrieNode<V>();
        node.children.set(char, next);
      }
      next.values.add(value);
      node = next;
    }
  }

  /** Values of all keys that start with `prefix` (all values for ""). */
  withPrefix(prefix: string): ReadonlySet<V> {
    let node: TrieNode<V> | undefined = this.root;
    for (const char of prefix) {
      node = node.children.get(char);
      if (!node) return EMPTY;
    }
    return node.values;
  }
}
