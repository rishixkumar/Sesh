/**
 * Deterministic fictional Georgia Tech seed payloads (MS3 §2.7).
 * Personas mirror the frontend demo cast; emails/addresses are fake @sesh.test data.
 */

import {
  SEED_AFFILIATION_IDS,
  SEED_AUTH_IDS,
  SEED_CONSENT_IDS,
  SEED_EVENT_IDS,
  SEED_FRIENDSHIP_IDS,
  SEED_INVITE_IDS,
  SEED_JOIN_REQUEST_IDS,
  SEED_MEMBER_IDS,
  SEED_MOVE_GROUP_IDS,
  SEED_SCHOOL_ID,
  SEED_USER_IDS,
  SEED_VENUE_IDS,
} from "./ids.js";

/** Fixed anchor so re-seeding is byte-stable across runs. */
export const SEED_ANCHOR_ISO = "2026-11-11T21:00:00.000Z";

const ANCHOR_MS = Date.parse(SEED_ANCHOR_ISO);

function hoursFromAnchor(deltaHours: number): Date {
  return new Date(ANCHOR_MS + deltaHours * 60 * 60 * 1000);
}

/** Lexicographic UUID pair order (matches PG uuid ordering for canonical hex form). */
export function orderedPair(
  a: string,
  b: string,
): { userLowId: string; userHighId: string } {
  return a < b
    ? { userLowId: a, userHighId: b }
    : { userLowId: b, userHighId: a };
}

/** Approximate Tech Green / Midtown WGS84 pins [lon, lat]. */
export const GT_COORDS = {
  techGreen: [-84.3963, 33.7756] as [number, number],
  techSquare: [-84.3892, 33.7765] as [number, number],
  westMidtown: [-84.413, 33.787] as [number, number],
  homePark: [-84.4045, 33.7855] as [number, number],
  northAveMarta: [-84.3924, 33.7719] as [number, number],
  inmanPark: [-84.3527, 33.7575] as [number, number],
};

export const schoolSeed = {
  id: SEED_SCHOOL_ID,
  slug: "georgia-tech",
  name: "Georgia Institute of Technology",
  shortName: "Georgia Tech",
  areaLabel: "Midtown Atlanta · GT Campus",
  timezone: "America/New_York",
};

export const userSeeds = [
  {
    id: SEED_USER_IDS.maya,
    email: "maya.patel@sesh.test",
    username: "mayapatel",
    displayName: "Maya Patel",
    bio: "CS @ Georgia Tech · Tech Square coffee & West Midtown live sets (fictional demo)",
    graduationYear: 2027,
    authSubject: "dev-test-maya-patel",
    affiliationId: SEED_AFFILIATION_IDS.maya,
    authId: SEED_AUTH_IDS.maya,
    consentId: SEED_CONSENT_IDS.mayaTos,
  },
  {
    id: SEED_USER_IDS.jordan,
    email: "jordan.brooks@sesh.test",
    username: "jbrooks",
    displayName: "Jordan Brooks",
    bio: "IE @ GT · Intramural soccer & Midtown rooftop nights (fictional demo)",
    graduationYear: 2026,
    authSubject: "dev-test-jordan-brooks",
    affiliationId: SEED_AFFILIATION_IDS.jordan,
    authId: SEED_AUTH_IDS.jordan,
    consentId: SEED_CONSENT_IDS.jordanTos,
  },
  {
    id: SEED_USER_IDS.tyler,
    email: "tyler.nguyen@sesh.test",
    username: "tylernguyen",
    displayName: "Tyler Nguyen",
    bio: "ME @ GT · New transfer looking for concert & game-day crews (fictional demo)",
    graduationYear: 2028,
    authSubject: "dev-test-tyler-nguyen",
    affiliationId: SEED_AFFILIATION_IDS.tyler,
    authId: SEED_AUTH_IDS.tyler,
    consentId: SEED_CONSENT_IDS.tylerTos,
  },
  {
    id: SEED_USER_IDS.priya,
    email: "priya.nair@sesh.test",
    username: "priyanair",
    displayName: "Priya Nair",
    bio: "BME @ GT · Klaus late-night survivor & indie concert regular (fictional demo)",
    graduationYear: 2027,
    authSubject: "dev-test-priya-nair",
    affiliationId: SEED_AFFILIATION_IDS.priya,
    authId: SEED_AUTH_IDS.priya,
    consentId: SEED_CONSENT_IDS.priyaTos,
  },
  {
    id: SEED_USER_IDS.marcus,
    email: "marcus.vance@sesh.test",
    username: "mvance",
    displayName: "Marcus Vance",
    bio: "ECE @ GT · Vinyl DJ sets & Home Park backyard kickbacks (fictional demo)",
    graduationYear: 2026,
    authSubject: "dev-test-marcus-vance",
    affiliationId: SEED_AFFILIATION_IDS.marcus,
    authId: SEED_AUTH_IDS.marcus,
    consentId: SEED_CONSENT_IDS.marcusTos,
  },
  {
    id: SEED_USER_IDS.chloe,
    email: "chloe.kim@sesh.test",
    username: "chloekim",
    displayName: "Chloe Kim",
    bio: "Design @ GT · Poncey-Highland galleries & night markets (fictional demo)",
    graduationYear: 2028,
    authSubject: "dev-test-chloe-kim",
    affiliationId: SEED_AFFILIATION_IDS.chloe,
    authId: SEED_AUTH_IDS.chloe,
    consentId: SEED_CONSENT_IDS.chloeTos,
  },
  {
    id: SEED_USER_IDS.scpc,
    email: "ramblin.nights@sesh.test",
    username: "gt_ramblinnights",
    displayName: "Ramblin' Nights Collective",
    bio: "Fictional student-run campus programming board at Georgia Tech",
    graduationYear: null,
    authSubject: "dev-test-ramblin-nights",
    affiliationId: SEED_AFFILIATION_IDS.scpc,
    authId: SEED_AUTH_IDS.scpc,
    consentId: SEED_CONSENT_IDS.scpcTos,
  },
] as const;

export const venueSeeds = [
  {
    id: SEED_VENUE_IDS.techGreen,
    name: "Tech Green Amphitheater (Fictional Demo Setup)",
    publicDisplayLocation: "Tech Green · Central Campus",
    privateAddress: null,
    location: GT_COORDS.techGreen,
  },
  {
    id: SEED_VENUE_IDS.foundryLoft,
    name: "Foundry Loft 404 (Fictional Club)",
    publicDisplayLocation: "West Midtown · Marietta St Corridor",
    privateAddress: "404 Fictional Foundry Lane NW (Demo Only)",
    location: GT_COORDS.westMidtown,
  },
  {
    id: SEED_VENUE_IDS.homePark,
    name: "Home Park Backyard Deck (Fictional)",
    publicDisplayLocation: "Home Park (approx. near 10th & State St)",
    privateAddress:
      "042 Fictional Yellow Jacket Way NW, Back Gate Code #1996 (Demo Only)",
    location: GT_COORDS.homePark,
  },
  {
    id: SEED_VENUE_IDS.signalBox,
    name: "Signal Box Stage (Fictional Concert Hall)",
    publicDisplayLocation: "Reynoldstown · Eastside BeltLine",
    privateAddress: null,
    location: GT_COORDS.inmanPark,
  },
] as const;

export const eventSeeds = [
  {
    id: SEED_EVENT_IDS.techGreenSunset,
    hostId: SEED_USER_IDS.scpc,
    venueId: SEED_VENUE_IDS.techGreen,
    title: "Tech Green Sunset Beats & Mocktails",
    description:
      "Fictional campus quad warm-up hosted by Ramblin' Nights Collective. Student DJs spinning house & funk on Tech Green with free citrus spritzers.",
    category: "Organization Events" as const,
    startAt: hoursFromAnchor(-1),
    endAt: hoursFromAnchor(2),
    venueName: "Tech Green Amphitheater (Fictional Demo Setup)",
    publicDisplayLocation: "Tech Green · Central Campus",
    privateAddress: null,
    addressPrivacy: "PUBLIC_VENUE" as const,
    visibility: "PUBLIC" as const,
    status: "PUBLISHED" as const,
    capacity: 250,
    admissionIsFree: true,
    admissionPriceLabel: "Free w/ BuzzCard",
    admissionAmountUsd: null,
    location: GT_COORDS.techGreen,
  },
  {
    id: SEED_EVENT_IDS.westMidtownNeon,
    hostId: SEED_USER_IDS.maya,
    venueId: SEED_VENUE_IDS.foundryLoft,
    title: "Buzz After Dark: Warehouse House & UKG Night",
    description:
      "Fictional 18+ student-friendly club night in West Midtown featuring three GT alum DJs and late-night food trucks outside.",
    category: "Clubs" as const,
    startAt: hoursFromAnchor(2.5),
    endAt: hoursFromAnchor(6.5),
    venueName: "Foundry Loft 404 (Fictional Club)",
    publicDisplayLocation: "West Midtown · Marietta St Corridor",
    privateAddress: null,
    addressPrivacy: "PUBLIC_VENUE" as const,
    visibility: "PUBLIC" as const,
    status: "PUBLISHED" as const,
    capacity: 300,
    admissionIsFree: false,
    admissionPriceLabel: "$12 early · $18 at door (18+)",
    admissionAmountUsd: "12.00",
    location: GT_COORDS.westMidtown,
  },
  {
    id: SEED_EVENT_IDS.homeParkVinyl,
    hostId: SEED_USER_IDS.marcus,
    venueId: SEED_VENUE_IDS.homePark,
    title: "Home Park String-Light Vinyl Kickback",
    description:
      "Fictional chill backyard vinyl spin for GT students. Exact street number unlocks only for Going RSVPs or approved Move Groups.",
    category: "House Parties" as const,
    startAt: hoursFromAnchor(3),
    endAt: hoursFromAnchor(6.5),
    venueName: "Home Park Backyard Deck (Fictional)",
    publicDisplayLocation: "Home Park (approx. near 10th & State St)",
    privateAddress:
      "042 Fictional Yellow Jacket Way NW, Back Gate Code #1996 (Demo Only)",
    addressPrivacy: "RSVP_GOING_ONLY" as const,
    visibility: "PUBLIC" as const,
    status: "PUBLISHED" as const,
    capacity: 65,
    admissionIsFree: true,
    admissionPriceLabel: "Free · BYO non-glass",
    admissionAmountUsd: null,
    location: GT_COORDS.homePark,
  },
  {
    id: SEED_EVENT_IDS.friendsRooftop,
    hostId: SEED_USER_IDS.maya,
    venueId: null,
    title: "Friends-Only Sq5 Rooftop Pre-Link",
    description:
      "Fictional friends-only rooftop warm-up hosted by Maya. Restricted visibility demo: hidden from guests and non-friends.",
    category: "House Parties" as const,
    startAt: hoursFromAnchor(1.5),
    endAt: hoursFromAnchor(3),
    venueName: "Midtown Student Skydeck (Fictional)",
    publicDisplayLocation: "Tech Square North (Friends Only)",
    privateAddress:
      "099 Fictional Spring St Sky Lounge, Tower B Floor 19 (Demo Only)",
    addressPrivacy: "APPROVED_GROUP_OR_HOST" as const,
    visibility: "FRIENDS" as const,
    status: "PUBLISHED" as const,
    capacity: 25,
    admissionIsFree: true,
    admissionPriceLabel: "Friends list only",
    admissionAmountUsd: null,
    location: GT_COORDS.techSquare,
  },
  {
    id: SEED_EVENT_IDS.easternIndie,
    hostId: SEED_USER_IDS.priya,
    venueId: SEED_VENUE_IDS.signalBox,
    title: "BeltLine Indie & Alt-R&B Showcase",
    description:
      "Fictional 18+ live band showcase on the Eastside Trail with a GT student opener. Coordinate rideshare splits via Move Groups.",
    category: "Concerts" as const,
    startAt: hoursFromAnchor(48),
    endAt: hoursFromAnchor(51.75),
    venueName: "Signal Box Stage (Fictional Concert Hall)",
    publicDisplayLocation: "Reynoldstown · Eastside BeltLine",
    privateAddress: null,
    addressPrivacy: "PUBLIC_VENUE" as const,
    visibility: "PUBLIC" as const,
    status: "PUBLISHED" as const,
    capacity: 450,
    admissionIsFree: false,
    admissionPriceLabel: "$22 student advance",
    admissionAmountUsd: "22.00",
    location: GT_COORDS.inmanPark,
  },
  {
    id: SEED_EVENT_IDS.inviteOnlyLoft,
    hostId: SEED_USER_IDS.priya,
    venueId: null,
    title: "Midtown Late-Night Ramen & Board Game Loft",
    description:
      "Fictional invite-only small-group ramen pop-up. Audience list gates discovery; address is host/group only.",
    category: "Other" as const,
    startAt: hoursFromAnchor(72),
    endAt: hoursFromAnchor(75.5),
    venueName: "Artisan Loft Kitchen (Fictional)",
    publicDisplayLocation: "Inman Park · BeltLine Access",
    privateAddress: "077 Fictional Highland Studio #4B, Buzz #402 (Demo Only)",
    addressPrivacy: "APPROVED_GROUP_OR_HOST" as const,
    visibility: "INVITE_ONLY" as const,
    status: "PUBLISHED" as const,
    capacity: 24,
    admissionIsFree: false,
    admissionPriceLabel: "$10 ingredients split",
    admissionAmountUsd: "10.00",
    location: GT_COORDS.inmanPark,
  },
] as const;

/** INVITE_ONLY loft audience (host need not be listed). */
export const eventAudienceSeeds = [
  {
    eventId: SEED_EVENT_IDS.inviteOnlyLoft,
    userId: SEED_USER_IDS.maya,
  },
  {
    eventId: SEED_EVENT_IDS.inviteOnlyLoft,
    userId: SEED_USER_IDS.jordan,
  },
  {
    eventId: SEED_EVENT_IDS.inviteOnlyLoft,
    userId: SEED_USER_IDS.chloe,
  },
] as const;

export const eventResponseSeeds = [
  {
    eventId: SEED_EVENT_IDS.techGreenSunset,
    userId: SEED_USER_IDS.maya,
    response: "GOING" as const,
  },
  {
    eventId: SEED_EVENT_IDS.techGreenSunset,
    userId: SEED_USER_IDS.jordan,
    response: "GOING" as const,
  },
  {
    eventId: SEED_EVENT_IDS.techGreenSunset,
    userId: SEED_USER_IDS.priya,
    response: "GOING" as const,
  },
  {
    eventId: SEED_EVENT_IDS.techGreenSunset,
    userId: SEED_USER_IDS.tyler,
    response: "INTERESTED" as const,
  },
  {
    eventId: SEED_EVENT_IDS.westMidtownNeon,
    userId: SEED_USER_IDS.maya,
    response: "GOING" as const,
  },
  {
    eventId: SEED_EVENT_IDS.westMidtownNeon,
    userId: SEED_USER_IDS.jordan,
    response: "GOING" as const,
  },
  {
    eventId: SEED_EVENT_IDS.westMidtownNeon,
    userId: SEED_USER_IDS.marcus,
    response: "GOING" as const,
  },
  {
    eventId: SEED_EVENT_IDS.westMidtownNeon,
    userId: SEED_USER_IDS.chloe,
    response: "INTERESTED" as const,
  },
  {
    eventId: SEED_EVENT_IDS.homeParkVinyl,
    userId: SEED_USER_IDS.marcus,
    response: "GOING" as const,
  },
  {
    eventId: SEED_EVENT_IDS.homeParkVinyl,
    userId: SEED_USER_IDS.jordan,
    response: "GOING" as const,
  },
  {
    eventId: SEED_EVENT_IDS.friendsRooftop,
    userId: SEED_USER_IDS.jordan,
    response: "GOING" as const,
  },
  {
    eventId: SEED_EVENT_IDS.easternIndie,
    userId: SEED_USER_IDS.priya,
    response: "GOING" as const,
  },
  {
    eventId: SEED_EVENT_IDS.easternIndie,
    userId: SEED_USER_IDS.maya,
    response: "INTERESTED" as const,
  },
  {
    eventId: SEED_EVENT_IDS.easternIndie,
    userId: SEED_USER_IDS.chloe,
    response: "GOING" as const,
  },
] as const;

export const eventSaveSeeds = [
  {
    eventId: SEED_EVENT_IDS.homeParkVinyl,
    userId: SEED_USER_IDS.maya,
  },
  {
    eventId: SEED_EVENT_IDS.easternIndie,
    userId: SEED_USER_IDS.tyler,
  },
  {
    eventId: SEED_EVENT_IDS.westMidtownNeon,
    userId: SEED_USER_IDS.priya,
  },
] as const;

type FriendshipSeed = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: "ACCEPTED" | "PENDING";
  respondedAt: Date | null;
};

function friendship(
  id: string,
  requesterId: string,
  addresseeId: string,
  status: "ACCEPTED" | "PENDING",
): FriendshipSeed {
  return {
    id,
    requesterId,
    addresseeId,
    status,
    respondedAt: status === "ACCEPTED" ? hoursFromAnchor(-24) : null,
  };
}

export const friendshipSeeds: FriendshipSeed[] = [
  friendship(
    SEED_FRIENDSHIP_IDS.mayaJordan,
    SEED_USER_IDS.maya,
    SEED_USER_IDS.jordan,
    "ACCEPTED",
  ),
  friendship(
    SEED_FRIENDSHIP_IDS.mayaPriya,
    SEED_USER_IDS.maya,
    SEED_USER_IDS.priya,
    "ACCEPTED",
  ),
  friendship(
    SEED_FRIENDSHIP_IDS.mayaMarcus,
    SEED_USER_IDS.maya,
    SEED_USER_IDS.marcus,
    "ACCEPTED",
  ),
  friendship(
    SEED_FRIENDSHIP_IDS.jordanPriya,
    SEED_USER_IDS.jordan,
    SEED_USER_IDS.priya,
    "ACCEPTED",
  ),
  friendship(
    SEED_FRIENDSHIP_IDS.jordanChloe,
    SEED_USER_IDS.jordan,
    SEED_USER_IDS.chloe,
    "ACCEPTED",
  ),
  friendship(
    SEED_FRIENDSHIP_IDS.tylerChloe,
    SEED_USER_IDS.tyler,
    SEED_USER_IDS.chloe,
    "ACCEPTED",
  ),
  friendship(
    SEED_FRIENDSHIP_IDS.marcusChloe,
    SEED_USER_IDS.marcus,
    SEED_USER_IDS.chloe,
    "ACCEPTED",
  ),
  friendship(
    SEED_FRIENDSHIP_IDS.priyaScpc,
    SEED_USER_IDS.priya,
    SEED_USER_IDS.scpc,
    "ACCEPTED",
  ),
  friendship(
    SEED_FRIENDSHIP_IDS.jordanPendingTyler,
    SEED_USER_IDS.jordan,
    SEED_USER_IDS.tyler,
    "PENDING",
  ),
];

export const moveGroupSeeds = [
  {
    id: SEED_MOVE_GROUP_IDS.westMidtownRideshare,
    eventId: SEED_EVENT_IDS.westMidtownNeon,
    creatorId: SEED_USER_IDS.maya,
    name: "Tech Square Rideshare Split (10:15 PM)",
    note: "Splitting two XL rideshares from Tech Square so nobody walks back solo late. Request to join!",
    capacity: 6,
    discoverability: "PUBLIC" as const,
    joinMode: "REQUEST_TO_JOIN" as const,
    meetupTime: hoursFromAnchor(2),
    meetupSpot: "Tech Square · 5th St Bridge Benches",
    meetupLocation: GT_COORDS.techSquare,
    externalChatLink: "https://chat.example.com/sesh-demo-west-midtown",
  },
  {
    id: SEED_MOVE_GROUP_IDS.beltlineWalk,
    eventId: SEED_EVENT_IDS.easternIndie,
    creatorId: SEED_USER_IDS.chloe,
    name: "MARTA to Inman Park + BeltLine Walk Crew",
    note: "Riding Gold/Blue line from North Ave Station together and grabbing tacos before doors open.",
    capacity: 6,
    discoverability: "PUBLIC" as const,
    joinMode: "REQUEST_TO_JOIN" as const,
    meetupTime: hoursFromAnchor(46),
    meetupSpot: "North Avenue MARTA West Entrance",
    meetupLocation: GT_COORDS.northAveMarta,
    externalChatLink: "https://chat.example.com/sesh-demo-beltline-crew",
  },
  {
    id: SEED_MOVE_GROUP_IDS.techGreenBlanket,
    eventId: SEED_EVENT_IDS.techGreenSunset,
    creatorId: SEED_USER_IDS.priya,
    name: "Campanile Lawn Blanket & Card Games",
    note: "Open group by the Campanile fountain — bring Uno or spikeball!",
    capacity: 8,
    discoverability: "PUBLIC" as const,
    joinMode: "OPEN_JOIN" as const,
    meetupTime: hoursFromAnchor(-0.75),
    meetupSpot: "Kessler Campanile Steps",
    meetupLocation: GT_COORDS.techGreen,
    externalChatLink: "https://chat.example.com/sesh-demo-campanile",
  },
  {
    id: SEED_MOVE_GROUP_IDS.rooftopInvite,
    eventId: SEED_EVENT_IDS.friendsRooftop,
    creatorId: SEED_USER_IDS.maya,
    name: "Sq5 Elevator Escort Group",
    note: "Invite-only group so Maya can buzz everyone up together at 9:15 PM.",
    capacity: 5,
    discoverability: "INVITE_ONLY" as const,
    joinMode: "INVITE_ONLY" as const,
    meetupTime: hoursFromAnchor(1.4),
    meetupSpot: "Spring St Lobby Coffee Counter",
    meetupLocation: GT_COORDS.techSquare,
    externalChatLink: "https://chat.example.com/sesh-demo-sq5-private",
  },
] as const;

export const moveGroupMemberSeeds = [
  {
    id: SEED_MEMBER_IDS.westMaya,
    moveGroupId: SEED_MOVE_GROUP_IDS.westMidtownRideshare,
    userId: SEED_USER_IDS.maya,
    role: "CREATOR" as const,
  },
  {
    id: SEED_MEMBER_IDS.westPriya,
    moveGroupId: SEED_MOVE_GROUP_IDS.westMidtownRideshare,
    userId: SEED_USER_IDS.priya,
    role: "MEMBER" as const,
  },
  {
    id: SEED_MEMBER_IDS.westChloe,
    moveGroupId: SEED_MOVE_GROUP_IDS.westMidtownRideshare,
    userId: SEED_USER_IDS.chloe,
    role: "MEMBER" as const,
  },
  {
    id: SEED_MEMBER_IDS.beltChloe,
    moveGroupId: SEED_MOVE_GROUP_IDS.beltlineWalk,
    userId: SEED_USER_IDS.chloe,
    role: "CREATOR" as const,
  },
  {
    id: SEED_MEMBER_IDS.beltJordan,
    moveGroupId: SEED_MOVE_GROUP_IDS.beltlineWalk,
    userId: SEED_USER_IDS.jordan,
    role: "MEMBER" as const,
  },
  {
    id: SEED_MEMBER_IDS.beltTyler,
    moveGroupId: SEED_MOVE_GROUP_IDS.beltlineWalk,
    userId: SEED_USER_IDS.tyler,
    role: "MEMBER" as const,
  },
  {
    id: SEED_MEMBER_IDS.greenPriya,
    moveGroupId: SEED_MOVE_GROUP_IDS.techGreenBlanket,
    userId: SEED_USER_IDS.priya,
    role: "CREATOR" as const,
  },
  {
    id: SEED_MEMBER_IDS.greenJordan,
    moveGroupId: SEED_MOVE_GROUP_IDS.techGreenBlanket,
    userId: SEED_USER_IDS.jordan,
    role: "MEMBER" as const,
  },
  {
    id: SEED_MEMBER_IDS.roofMaya,
    moveGroupId: SEED_MOVE_GROUP_IDS.rooftopInvite,
    userId: SEED_USER_IDS.maya,
    role: "CREATOR" as const,
  },
  {
    id: SEED_MEMBER_IDS.roofJordan,
    moveGroupId: SEED_MOVE_GROUP_IDS.rooftopInvite,
    userId: SEED_USER_IDS.jordan,
    role: "MEMBER" as const,
  },
] as const;

export const moveGroupJoinRequestSeeds = [
  {
    id: SEED_JOIN_REQUEST_IDS.tylerWestMidtown,
    moveGroupId: SEED_MOVE_GROUP_IDS.westMidtownRideshare,
    userId: SEED_USER_IDS.tyler,
    status: "PENDING" as const,
    note: "Hey! Heading from West Campus, down to split the ride.",
    decidedByUserId: null,
    decidedAt: null,
    createdAt: hoursFromAnchor(-2),
  },
  {
    id: SEED_JOIN_REQUEST_IDS.marcusBeltline,
    moveGroupId: SEED_MOVE_GROUP_IDS.beltlineWalk,
    userId: SEED_USER_IDS.marcus,
    status: "PENDING" as const,
    note: "Can I tag along from Midtown? Happy to grab an extra taco round.",
    decidedByUserId: null,
    decidedAt: null,
    createdAt: hoursFromAnchor(-1),
  },
] as const;

export const moveGroupInviteSeeds = [
  {
    id: SEED_INVITE_IDS.priyaRooftop,
    moveGroupId: SEED_MOVE_GROUP_IDS.rooftopInvite,
    invitedUserId: SEED_USER_IDS.priya,
    invitedByUserId: SEED_USER_IDS.maya,
  },
] as const;

export const SEED_CONSENT_VERSION = "2026-11-01";
