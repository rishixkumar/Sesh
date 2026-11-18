import { Trie } from "@/lib/search/trie";

/** Maximal runs of letters/digits, which is how both documents and queries are split. */
export function tokenize(text: string): string[] {
  return text.match(/[\p{L}\p{N}]+/gu) ?? [];
}

/**
 * Inverted index for case-insensitive substring search.
 *
 * Every suffix of every token is inserted into a `Trie`, making it a suffix
 * trie: a query token occurs inside some document token exactly when it is a
 * prefix of one of that token's suffixes. Lookup intersects the posting sets
 * of the query's tokens (smallest first), then confirms each candidate with
 * the full-text `includes` check. Results are therefore identical to
 * `text.toLowerCase().includes(query.toLowerCase())`, but only candidate
 * documents are scanned.
 */
export class SearchIndex<Id> {
  private readonly suffixes = new Trie<Id>();
  private readonly textById = new Map<Id, string>();

  get size(): number {
    return this.textById.size;
  }

  add(id: Id, text: string): void {
    const normalized = text.toLowerCase();
    this.textById.set(id, normalized);
    for (const token of new Set(tokenize(normalized))) {
      const chars = Array.from(token);
      for (let start = 0; start < chars.length; start += 1) {
        this.suffixes.insert(chars.slice(start).join(""), id);
      }
    }
  }

  search(query: string): Set<Id> {
    const normalized = query.toLowerCase();
    const queryTokens = [...new Set(tokenize(normalized))];
    if (queryTokens.length === 0) {
      return this.scan(this.textById.keys(), normalized);
    }

    const postings = queryTokens
      .map((token) => this.suffixes.withPrefix(token))
      .toSorted((a, b) => a.size - b.size);

    const [smallest, ...rest] = postings;
    const candidates: Id[] = [];
    for (const id of smallest) {
      if (rest.every((posting) => posting.has(id))) candidates.push(id);
    }
    return this.scan(candidates, normalized);
  }

  private scan(ids: Iterable<Id>, normalizedQuery: string): Set<Id> {
    const matches = new Set<Id>();
    for (const id of ids) {
      if (this.textById.get(id)?.includes(normalizedQuery)) matches.add(id);
    }
    return matches;
  }
}
