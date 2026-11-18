/**
 * Static copy and clearly fake sample data for the `/welcome` scroll story.
 * Nothing here comes from the data adapter; venues and people are placeholders.
 */

export const LANDING_TAGLINE = "Find the move. Bring your people.";

export const HOOK_STATEMENT =
  "Friday's plans live in four group chats, two story posts, and one friend who “knows a spot.” Sesh puts the whole night in one place.";

export type FeedBucket = "Happening Now" | "Tonight" | "This Weekend";

export interface SampleEvent {
  id: string;
  bucket: FeedBucket;
  title: string;
  venue: string;
  time: string;
  going: number;
  hue: number;
}

export const FEED_BUCKETS: FeedBucket[] = [
  "Happening Now",
  "Tonight",
  "This Weekend",
];

export const SAMPLE_EVENTS: SampleEvent[] = [
  {
    id: "s1",
    bucket: "Happening Now",
    title: "Sample Trivia Night",
    venue: "The Example Pub",
    time: "Live · ends 11 PM",
    going: 42,
    hue: 330,
  },
  {
    id: "s2",
    bucket: "Happening Now",
    title: "Placeholder Pickup Game",
    venue: "Demo Courts",
    time: "Live · open run",
    going: 12,
    hue: 25,
  },
  {
    id: "s3",
    bucket: "Tonight",
    title: "Lorem Ipsum Rooftop",
    venue: "Rooftop TBD · Midtown",
    time: "Tonight · 9 PM",
    going: 87,
    hue: 275,
  },
  {
    id: "s4",
    bucket: "Tonight",
    title: "Mock House Party",
    venue: "Address hidden",
    time: "Tonight · 10 PM",
    going: 31,
    hue: 200,
  },
  {
    id: "s5",
    bucket: "This Weekend",
    title: "Fake Fest Day Party",
    venue: "Somewhere Park",
    time: "Sat · 2 PM",
    going: 140,
    hue: 50,
  },
  {
    id: "s6",
    bucket: "This Weekend",
    title: "Demo DJ Set",
    venue: "Club Placeholder",
    time: "Sat · 11 PM",
    going: 64,
    hue: 300,
  },
];

export interface SampleMember {
  initials: string;
  name: string;
  isFriend: boolean;
  hue: number;
}

export const SAMPLE_ROSTER: SampleMember[] = [
  { initials: "AJ", name: "Alex J.", isFriend: true, hue: 330 },
  { initials: "MR", name: "Maya R.", isFriend: true, hue: 25 },
  { initials: "DK", name: "Dev K.", isFriend: true, hue: 200 },
  { initials: "?", name: "Someone", isFriend: false, hue: 260 },
  { initials: "?", name: "Someone", isFriend: false, hue: 260 },
  { initials: "?", name: "Someone", isFriend: false, hue: 260 },
  { initials: "?", name: "Someone", isFriend: false, hue: 260 },
  { initials: "?", name: "Someone", isFriend: false, hue: 260 },
];

export interface StoryChapter {
  id: "feed" | "groups" | "privacy" | "location" | "host";
  eyebrow: string;
  title: string;
  body: string;
  /** Relative scroll length; longer chapters scrub slower. */
  weight: number;
}

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: "feed",
    eyebrow: "The live feed",
    title: "Everything happening, live.",
    body: "See what's happening around you, from bars to rooftops to house parties. Happening now, tonight, and this weekend, all in one feed.",
    weight: 1.6,
  },
  {
    id: "groups",
    eyebrow: "Move Groups",
    title: "Don't go alone.",
    body: "Start a Move Group, invite your people, and let others ask to join.",
    weight: 1.1,
  },
  {
    id: "privacy",
    eyebrow: "Privacy you control",
    title: "Your night, your audience.",
    body: "You decide who sees what. Friends show up by name. Everyone else stays a mystery until they join.",
    weight: 1.1,
  },
  {
    id: "location",
    eyebrow: "Find your people",
    title: "Find each other. Then go dark.",
    body: "Share your location with who you choose, for as long as you choose. Off by default, and it auto-expires.",
    weight: 1.1,
  },
  {
    id: "host",
    eyebrow: "Host your own move",
    title: "Throwing something?",
    body: "Post it in under a minute and send the link anywhere. House-party addresses stay hidden until you approve who's coming.",
    weight: 1.3,
  },
];

export const GUARDRAILS = [
  {
    title: "18+ only",
    body: "Sesh is built for adults. Every account confirms they're 18 or older.",
  },
  {
    title: "Block and report, everywhere",
    body: "Every profile, event, and Move Group has block and report one tap away.",
  },
  {
    title: "Location off by default",
    body: "Sharing is opt-in, limited to people you pick, and expires on its own.",
  },
  {
    title: "Hosts control the door",
    body: "Private addresses only reach guests the host approves.",
  },
] as const;
