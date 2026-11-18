import type { User } from "@/types/domain";
import { Queue } from "@/lib/collections";

export interface FriendSuggestion {
  userId: string;
  /** Shortest hop distance from the source user (always >= 2). */
  depth: number;
  /** Users the source and the candidate both list as friends. */
  mutualFriendIds: string[];
}

const EMPTY_SET: ReadonlySet<string> = new Set();

/**
 * Campus social graph stored as a directed adjacency list
 * (`userId -> Set<friendId>`), where an edge `A -> B` means A lists B in
 * `friendIds`.
 *
 * Edges are kept directed so each privacy rule keeps its exact semantics:
 * some rules check only the viewer's own list (`hasEdge`), others accept an
 * edge in either direction (`areConnected`).
 */
export class FriendshipGraph {
  private constructor(
    private readonly adjacency: Map<string, ReadonlySet<string>>
  ) {}

  static fromUsers(
    users: Iterable<Pick<User, "id" | "friendIds">>
  ): FriendshipGraph {
    const adjacency = new Map<string, ReadonlySet<string>>();
    for (const user of users) {
      adjacency.set(user.id, new Set(user.friendIds));
    }
    return new FriendshipGraph(adjacency);
  }

  get nodeCount(): number {
    return this.adjacency.size;
  }

  /** O(1): true when `fromId` lists `toId` as a friend. */
  hasEdge(fromId: string, toId: string): boolean {
    return this.friendsOf(fromId).has(toId);
  }

  /** O(1): true when either user lists the other as a friend. */
  areConnected(userAId: string, userBId: string): boolean {
    return this.hasEdge(userAId, userBId) || this.hasEdge(userBId, userAId);
  }

  friendsOf(userId: string): ReadonlySet<string> {
    return this.adjacency.get(userId) ?? EMPTY_SET;
  }

  degree(userId: string): number {
    return this.friendsOf(userId).size;
  }

  /**
   * Set intersection of both users' friend lists, iterating the smaller set:
   * O(min(deg(a), deg(b))). Order follows the smaller set's insertion order.
   */
  mutualFriends(userAId: string, userBId: string): string[] {
    const a = this.friendsOf(userAId);
    const b = this.friendsOf(userBId);
    const [small, large] = a.size <= b.size ? [a, b] : [b, a];
    const mutual: string[] = [];
    for (const id of small) {
      if (large.has(id)) mutual.push(id);
    }
    return mutual;
  }

  /**
   * Splits `candidates` into the viewer's direct friends and everyone else,
   * excluding the viewer. Input order is preserved within each side.
   */
  partition<T extends { id: string }>(
    viewerId: string,
    candidates: Iterable<T>
  ): { friends: T[]; others: T[] } {
    const friends: T[] = [];
    const others: T[] = [];
    for (const candidate of candidates) {
      if (candidate.id === viewerId) continue;
      if (this.hasEdge(viewerId, candidate.id)) {
        friends.push(candidate);
      } else {
        others.push(candidate);
      }
    }
    return { friends, others };
  }

  /**
   * Breadth-first search outward from `userId` along friend edges, returning
   * every reachable non-friend within `maxDepth` hops. O(V + E) over the
   * explored subgraph.
   *
   * Ranked by mutual friend count (desc), then hop distance (asc), then BFS
   * discovery order.
   */
  suggestFriends(
    userId: string,
    options: { maxDepth?: number } = {}
  ): FriendSuggestion[] {
    const maxDepth = options.maxDepth ?? 2;
    const depthById = new Map<string, number>([[userId, 0]]);
    const frontier = new Queue<string>([userId]);
    const discovered: string[] = [];

    while (!frontier.isEmpty()) {
      const current = frontier.dequeue()!;
      const depth = depthById.get(current)!;
      if (depth >= maxDepth) continue;

      for (const next of this.friendsOf(current)) {
        if (depthById.has(next)) continue;
        depthById.set(next, depth + 1);
        frontier.enqueue(next);
        if (depth + 1 >= 2 && !this.hasEdge(userId, next)) {
          discovered.push(next);
        }
      }
    }

    return discovered
      .map((candidateId) => ({
        userId: candidateId,
        depth: depthById.get(candidateId)!,
        mutualFriendIds: this.mutualFriends(userId, candidateId),
      }))
      .toSorted(
        (a, b) =>
          b.mutualFriendIds.length - a.mutualFriendIds.length ||
          a.depth - b.depth
      );
  }
}
