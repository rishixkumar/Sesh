import { describe, expect, it } from "vitest";
import { Queue } from "@/lib/collections";
import { FriendshipGraph } from "@/lib/social/friendship-graph";
import { SEED_USERS } from "@/lib/mock/seed";

const node = (id: string, friendIds: string[]) => ({ id, friendIds });

describe("Queue", () => {
  it("dequeues in FIFO order and reports size", () => {
    const queue = new Queue([1, 2]);
    queue.enqueue(3);
    expect(queue.size).toBe(3);
    expect(queue.peek()).toBe(1);
    expect([queue.dequeue(), queue.dequeue(), queue.dequeue()]).toEqual([
      1, 2, 3,
    ]);
    expect(queue.isEmpty()).toBe(true);
    expect(queue.dequeue()).toBeUndefined();
  });

  it("stays correct across internal compaction", () => {
    const queue = new Queue<number>();
    const out: number[] = [];
    for (let i = 0; i < 50; i += 1) {
      queue.enqueue(i);
      if (i % 3 === 0) out.push(queue.dequeue()!);
    }
    while (!queue.isEmpty()) out.push(queue.dequeue()!);
    expect(out).toEqual(Array.from({ length: 50 }, (_, i) => i));
  });
});

describe("FriendshipGraph", () => {
  // a -> b is one-way; b <-> c and c <-> d are mutual.
  const graph = FriendshipGraph.fromUsers([
    node("a", ["b"]),
    node("b", ["c"]),
    node("c", ["b", "d"]),
    node("d", ["c"]),
  ]);

  it("keeps edges directed for hasEdge and undirected for areConnected", () => {
    expect(graph.hasEdge("a", "b")).toBe(true);
    expect(graph.hasEdge("b", "a")).toBe(false);
    expect(graph.areConnected("b", "a")).toBe(true);
    expect(graph.areConnected("a", "d")).toBe(false);
  });

  it("treats unknown users as isolated nodes", () => {
    expect(graph.friendsOf("ghost").size).toBe(0);
    expect(graph.hasEdge("ghost", "a")).toBe(false);
    expect(graph.degree("ghost")).toBe(0);
  });

  it("computes mutual friends by set intersection", () => {
    expect(graph.mutualFriends("b", "d")).toEqual(["c"]);
    expect(graph.mutualFriends("a", "c")).toEqual(["b"]);
    expect(graph.mutualFriends("a", "d")).toEqual([]);
  });

  it("partitions candidates into friends and others, excluding the viewer", () => {
    const users = [node("a", []), node("b", []), node("c", []), node("d", [])];
    const { friends, others } = graph.partition("c", users);
    expect(friends.map((u) => u.id)).toEqual(["b", "d"]);
    expect(others.map((u) => u.id)).toEqual(["a"]);
  });

  it("finds friend-of-friend suggestions with BFS, bounded by depth", () => {
    expect(graph.suggestFriends("a").map((s) => s.userId)).toEqual(["c"]);
    expect(graph.suggestFriends("a", { maxDepth: 3 })).toEqual([
      { userId: "c", depth: 2, mutualFriendIds: ["b"] },
      { userId: "d", depth: 3, mutualFriendIds: [] },
    ]);
    expect(graph.suggestFriends("d", { maxDepth: 1 })).toEqual([]);
  });

  it("ranks suggestions by mutual friend count before hop distance", () => {
    const ranked = FriendshipGraph.fromUsers([
      node("me", ["f1", "f2"]),
      node("f1", ["me", "x", "y"]),
      node("f2", ["me", "y"]),
      node("x", ["f1"]),
      node("y", ["f1", "f2"]),
    ]).suggestFriends("me");
    expect(ranked.map((s) => [s.userId, s.mutualFriendIds.length])).toEqual([
      ["y", 2],
      ["x", 1],
    ]);
  });

  it("reproduces the seed campus network for Maya", () => {
    const seedGraph = FriendshipGraph.fromUsers(SEED_USERS);
    expect(seedGraph.nodeCount).toBe(SEED_USERS.length);
    expect(
      seedGraph
        .suggestFriends("user-maya", { maxDepth: 3 })
        .map((s) => [s.userId, s.depth, s.mutualFriendIds.length])
    ).toEqual([
      ["user-chloe", 2, 2],
      ["user-scpc", 2, 1],
      ["user-tyler", 3, 0],
    ]);
  });
});
