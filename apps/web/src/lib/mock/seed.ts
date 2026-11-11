import {
  CAMPUS_SCHOOL_ID,
  type EventRecord,
  type EventResponse,
  type Invitation,
  type MoveGroupRecord,
  type User,
} from "@/types/domain";
import { buildRelativeNyIso, getNyParts } from "@/lib/dates";

/**
 * Deterministic fallback anchor used ONLY before client hydration or in static tests.
 * On the client, the mock store computes a day-anchored ISO from the real current date
 * so seed events always populate Happening Now, Tonight, This Weekend, and Upcoming.
 */
export const STATIC_FALLBACK_ANCHOR_ISO = "2026-11-11T21:00:00.000Z";

export const SEED_USERS: User[] = [
  {
    id: "user-maya",
    displayName: "Maya Patel",
    username: "mayapatel",
    schoolId: CAMPUS_SCHOOL_ID,
    verifiedStudent: true,
    graduationYear: 2027,
    bio: "CS @ Georgia Tech · Tech Square coffee & West Midtown live sets",
    friendIds: ["user-jordan", "user-priya", "user-marcus"],
  },
  {
    id: "user-jordan",
    displayName: "Jordan Brooks",
    username: "jbrooks",
    schoolId: CAMPUS_SCHOOL_ID,
    verifiedStudent: true,
    graduationYear: 2026,
    bio: "IE @ GT · Intramural soccer & Midtown rooftop nights",
    friendIds: ["user-maya", "user-priya", "user-chloe"],
  },
  {
    id: "user-tyler",
    displayName: "Tyler Nguyen",
    username: "tylernguyen",
    schoolId: CAMPUS_SCHOOL_ID,
    verifiedStudent: true,
    graduationYear: 2028,
    bio: "ME @ GT · New transfer looking for concert & game-day crews",
    friendIds: ["user-chloe"],
  },
  {
    id: "user-priya",
    displayName: "Priya Nair",
    username: "priyanair",
    schoolId: CAMPUS_SCHOOL_ID,
    verifiedStudent: true,
    graduationYear: 2027,
    bio: "BME @ GT · Klaus late-night survivor & indie concert regular",
    friendIds: ["user-maya", "user-jordan", "user-scpc"],
  },
  {
    id: "user-marcus",
    displayName: "Marcus Vance",
    username: "mvance",
    schoolId: CAMPUS_SCHOOL_ID,
    verifiedStudent: true,
    graduationYear: 2026,
    bio: "ECE @ GT · Vinyl DJ sets & Home Park backyard kickbacks",
    friendIds: ["user-maya", "user-chloe"],
  },
  {
    id: "user-chloe",
    displayName: "Chloe Kim",
    username: "chloekim",
    schoolId: CAMPUS_SCHOOL_ID,
    verifiedStudent: true,
    graduationYear: 2028,
    bio: "Design @ GT · Poncey-Highland galleries & night markets",
    friendIds: ["user-jordan", "user-marcus", "user-tyler"],
  },
  {
    id: "user-scpc",
    displayName: "Ramblin' Nights Collective",
    username: "gt_ramblinnights",
    schoolId: CAMPUS_SCHOOL_ID,
    verifiedStudent: true,
    bio: "Fictional student-run campus programming board at Georgia Tech",
    friendIds: ["user-priya"],
  },
];

export const DEMO_SWITCHABLE_USERS: User[] = [
  SEED_USERS[0], // Maya Patel — Primary Demo Member
  SEED_USERS[1], // Jordan Brooks — Friend Demo Member (great for testing join requests!)
  SEED_USERS[2], // Tyler Nguyen — Non-friend GT Member (great for testing roster masking!)
];

function shiftHoursIso(baseIso: string, deltaHours: number): string {
  return new Date(
    new Date(baseIso).getTime() + deltaHours * 60 * 60 * 1000
  ).toISOString();
}

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Computes day offset from `anchorIso` to the next Friday/Saturday/Sunday so
 * "This Weekend" always has seed events regardless of which day of the week today is.
 */
function getWeekendOffsets(anchorIso: string): {
  fridayOffset: number;
  saturdayOffset: number;
  sundayOffset: number;
} {
  const parts = getNyParts(anchorIso);
  const dow = WEEKDAY_MAP[parts.weekday] ?? 3;

  if (dow === 5) {
    return { fridayOffset: 0, saturdayOffset: 1, sundayOffset: 2 };
  }
  if (dow === 6) {
    return { fridayOffset: 6, saturdayOffset: 0, sundayOffset: 1 };
  }
  if (dow === 0) {
    return { fridayOffset: 5, saturdayOffset: 6, sundayOffset: 0 };
  }
  return {
    fridayOffset: 5 - dow,
    saturdayOffset: 6 - dow,
    sundayOffset: 7 - dow,
  };
}

export interface SeedDataset {
  users: User[];
  events: EventRecord[];
  responses: EventResponse[];
  moveGroups: MoveGroupRecord[];
  invitations: Invitation[];
}

/**
 * Builds 14 fictional Georgia Tech / Atlanta seed events, attendance responses,
 * and coordinated Move Groups relative to `anchorIso`.
 *
 * NOTE: All venues, hosts, street names, and chat URLs are 100% fictional demo data.
 */
export function createSeedDataset(anchorIso: string): SeedDataset {
  const createdAt = shiftHoursIso(anchorIso, -48);
  const { fridayOffset, saturdayOffset, sundayOffset } =
    getWeekendOffsets(anchorIso);

  // Ensure weekend offsets used for "THIS_WEEKEND" cards are at least 1 day ahead when today is Sat/Sun
  const fri = fridayOffset === 0 ? 7 : fridayOffset;
  const sat = saturdayOffset === 0 ? 7 : saturdayOffset;
  const sun = sundayOffset === 0 ? 7 : sundayOffset;

  const events: EventRecord[] = [
    // 1 — HAPPENING NOW (Public, Free, Organization Events)
    {
      id: "evt-tech-green-sunset",
      schoolId: CAMPUS_SCHOOL_ID,
      title: "Tech Green Sunset Beats & Mocktails",
      description:
        "Fictional campus quad warm-up hosted by Ramblin' Nights Collective. Student DJs spinning house & funk on Tech Green with free citrus spritzers, picnic blankets, and wristband giveaways before Midtown nights kick off.",
      category: "Organization Events",
      startAt: shiftHoursIso(anchorIso, -1),
      endAt: shiftHoursIso(anchorIso, 2),
      venue: "Tech Green Amphitheater (Fictional Demo Setup)",
      publicDisplayLocation: "Tech Green · Central Campus",
      addressPrivacy: "PUBLIC_VENUE",
      visibility: "PUBLIC",
      status: "PUBLISHED",
      hostId: "user-scpc",
      capacity: 250,
      admission: { isFree: true, priceLabel: "Free w/ BuzzCard" },
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
    // 2 — HAPPENING NOW (Public, Free, Bars)
    {
      id: "evt-cypress-trivia",
      schoolId: CAMPUS_SCHOOL_ID,
      title: "Tech Square Patio Pint & Trivia Hour",
      description:
        "Fictional 18+ college trivia & patio hangout two blocks east of Tech Square. Bring a team of up to 6 for Atlanta music + GT lore rounds.",
      category: "Bars",
      startAt: shiftHoursIso(anchorIso, -0.5),
      endAt: shiftHoursIso(anchorIso, 2.5),
      venue: "The Brass Whistle Patio (Fictional Venue)",
      publicDisplayLocation: "Tech Square · Midtown",
      addressPrivacy: "PUBLIC_VENUE",
      visibility: "PUBLIC",
      status: "PUBLISHED",
      hostId: "user-jordan",
      capacity: 90,
      admission: { isFree: true, priceLabel: "No cover (food & drinks separate)" },
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
    // 3 — TONIGHT (Public, Paid, Clubs)
    {
      id: "evt-west-midtown-neon",
      schoolId: CAMPUS_SCHOOL_ID,
      title: " Buzz After Dark: Warehouse House & UKG Night",
      description:
        "Fictional 18+ student-friendly club night in West Midtown featuring three GT alum DJs, dual rooms (UK garage + melodic house), and late-night food trucks outside.",
      category: "Clubs",
      startAt: shiftHoursIso(anchorIso, 2.5),
      endAt: shiftHoursIso(anchorIso, 6.5),
      venue: "Foundry Loft 404 (Fictional Club)",
      publicDisplayLocation: "West Midtown · Marietta St Corridor",
      addressPrivacy: "PUBLIC_VENUE",
      visibility: "PUBLIC",
      status: "PUBLISHED",
      hostId: "user-maya",
      capacity: 300,
      admission: {
        isFree: false,
        priceLabel: "$12 early · $18 at door (18+)",
        amountUsd: 12,
      },
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
    // 4 — TONIGHT (Public w/ RSVP_GOING_ONLY Private Address, Free, House Parties)
    {
      id: "evt-home-park-vinyl",
      schoolId: CAMPUS_SCHOOL_ID,
      title: "Home Park String-Light Vinyl Kickback",
      description:
        "Fictional chill backyard vinyl spin & rooftop projector hangout for GT students. Exact street number is masked publicly and unlocks only for verified members who RSVP Going or join an approved Move Group.",
      category: "House Parties",
      startAt: shiftHoursIso(anchorIso, 3),
      endAt: shiftHoursIso(anchorIso, 6.5),
      venue: "Home Park Backyard Deck (Fictional)",
      publicDisplayLocation: "Home Park (approx. near 10th & State St)",
      privateAddress:
        "042 Fictional Yellow Jacket Way NW, Back Gate Code #1996 (Demo Only)",
      addressPrivacy: "RSVP_GOING_ONLY",
      visibility: "PUBLIC",
      status: "PUBLISHED",
      hostId: "user-marcus",
      capacity: 65,
      admission: { isFree: true, priceLabel: "Free · BYO non-glass" },
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
    // 5 — TONIGHT (FRIENDS visibility — hidden from Guests & non-friends!, House Parties)
    {
      id: "evt-friends-rooftop-sesh",
      schoolId: CAMPUS_SCHOOL_ID,
      title: "Friends-Only Sq5 Rooftop Pre-Link",
      description:
        "Fictional friends-only rooftop warm-up hosted by Maya before heading to West Midtown. Restricted visibility demo: hidden from Guest mode and non-friends.",
      category: "House Parties",
      startAt: shiftHoursIso(anchorIso, 1.5),
      endAt: shiftHoursIso(anchorIso, 3),
      venue: "Midtown Student Skydeck (Fictional)",
      publicDisplayLocation: "Tech Square North (Friends Only)",
      privateAddress:
        "099 Fictional Spring St Sky Lounge, Tower B Floor 19 (Demo Only)",
      addressPrivacy: "APPROVED_GROUP_OR_HOST",
      visibility: "FRIENDS",
      status: "PUBLISHED",
      hostId: "user-maya",
      capacity: 25,
      admission: { isFree: true, priceLabel: "Friends list only" },
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
    // 6 — THIS WEEKEND Friday (Public, Paid, Concerts)
    {
      id: "evt-eastern-indie-show",
      schoolId: CAMPUS_SCHOOL_ID,
      title: "BeltLine Indie & Alt-R&B Showcase",
      description:
        "Fictional 18+ live band showcase on the Eastside Trail with Atlanta indie-soul headliners and a GT student opener. Coordinate rideshare splits via Move Groups.",
      category: "Concerts",
      startAt: buildRelativeNyIso(anchorIso, fri, "20:00"),
      endAt: buildRelativeNyIso(anchorIso, fri, "23:45"),
      venue: "Signal Box Stage (Fictional Concert Hall)",
      publicDisplayLocation: "Reynoldstown · Eastside BeltLine",
      addressPrivacy: "PUBLIC_VENUE",
      visibility: "PUBLIC",
      status: "PUBLISHED",
      hostId: "user-priya",
      capacity: 450,
      admission: {
        isFree: false,
        priceLabel: "$22 student advance",
        amountUsd: 22,
      },
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
    // 7 — THIS WEEKEND Friday Late (Public, Paid, Bars)
    {
      id: "evt-midtown-karaoke-crawl",
      schoolId: CAMPUS_SCHOOL_ID,
      title: "Crescent Ave Neon Karaoke & Late Bites",
      description:
        "Fictional Friday night 18+ vocal booth takeover in Midtown with half-off mocktails & wings before 11 PM.",
      category: "Bars",
      startAt: buildRelativeNyIso(anchorIso, fri, "21:30"),
      endAt: buildRelativeNyIso(anchorIso, sat, "01:30"),
      venue: "Echo Room Midtown (Fictional Lounge)",
      publicDisplayLocation: "Midtown · Crescent Ave",
      addressPrivacy: "PUBLIC_VENUE",
      visibility: "PUBLIC",
      status: "PUBLISHED",
      hostId: "user-chloe",
      capacity: 120,
      admission: {
        isFree: false,
        priceLabel: "$8 wristband entry",
        amountUsd: 8,
      },
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
    // 8 — THIS WEEKEND Saturday (Public, Free, Sports)
    {
      id: "evt-bobby-dodd-tailgate",
      schoolId: CAMPUS_SCHOOL_ID,
      title: "Goldout Tailgate & Wreck Walk Meetup",
      description:
        "Fictional student section pre-game rally on North Ave Lawn before kickoff at Bobby Dodd. Free iced coffee, cornhole brackets, and group walk-in 45 minutes prior to kickoff.",
      category: "Sports",
      startAt: buildRelativeNyIso(anchorIso, sat, "16:30"),
      endAt: buildRelativeNyIso(anchorIso, sat, "20:00"),
      venue: "North Lawn by Historic Tech Tower (Fictional Tailgate Zone)",
      publicDisplayLocation: "Bobby Dodd Perimeter · North Campus",
      addressPrivacy: "PUBLIC_VENUE",
      visibility: "PUBLIC",
      status: "PUBLISHED",
      hostId: "user-jordan",
      capacity: 200,
      admission: { isFree: true, priceLabel: "Free student tailgate" },
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
    // 9 — THIS WEEKEND Saturday Night (Public, Paid, Clubs)
    {
      id: "evt-poncey-latin-rooftop",
      schoolId: CAMPUS_SCHOOL_ID,
      title: "Ponce Rooftop Reggaeton & Baile Funk",
      description:
        "Fictional Saturday night open-air dance floor overlooking the Atlanta skyline. 18+ college night with student shuttle groups departing from North Ave MARTA.",
      category: "Clubs",
      startAt: buildRelativeNyIso(anchorIso, sat, "22:00"),
      endAt: buildRelativeNyIso(anchorIso, sun, "02:00"),
      venue: "Mirador Sky Terrace (Fictional Venue)",
      publicDisplayLocation: "Poncey-Highland · Ponce Corridor",
      addressPrivacy: "PUBLIC_VENUE",
      visibility: "PUBLIC",
      status: "PUBLISHED",
      hostId: "user-marcus",
      capacity: 220,
      admission: {
        isFree: false,
        priceLabel: "$15 cover · $10 before 10:30 PM",
        amountUsd: 15,
      },
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
    // 10 — THIS WEEKEND Sunday (Public, Free, Other)
    {
      id: "evt-piedmont-sunset-market",
      schoolId: CAMPUS_SCHOOL_ID,
      title: "Piedmont Park Vintage Swap & Matcha Social",
      description:
        "Fictional Sunday afternoon student thrift pop-up, film camera walk, and iced matcha cart on the Piedmont Park meadow.",
      category: "Other",
      startAt: buildRelativeNyIso(anchorIso, sun, "17:00"),
      endAt: buildRelativeNyIso(anchorIso, sun, "20:00"),
      venue: "Oak Hill Meadow Pop-Up (Fictional)",
      publicDisplayLocation: "Piedmont Park · 10th St Gate",
      addressPrivacy: "PUBLIC_VENUE",
      visibility: "PUBLIC",
      status: "PUBLISHED",
      hostId: "user-chloe",
      capacity: 150,
      admission: { isFree: true, priceLabel: "Free admission" },
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
    // 11 — UPCOMING Next Week (Public, Free, Organization Events)
    {
      id: "evt-startup-demo-mixer",
      schoolId: CAMPUS_SCHOOL_ID,
      title: "Create-X Student Builders Night & Pitch Jam",
      description:
        "Fictional campus founder mixer in Tech Square with 90-second lightning demos, free wood-fired pizza, and co-founder speed matching.",
      category: "Organization Events",
      startAt: buildRelativeNyIso(anchorIso, 8, "18:30"),
      endAt: buildRelativeNyIso(anchorIso, 8, "21:00"),
      venue: "Coda Atrium Commons (Fictional Event Space)",
      publicDisplayLocation: "Tech Square · Coda Plaza",
      addressPrivacy: "PUBLIC_VENUE",
      visibility: "PUBLIC",
      status: "PUBLISHED",
      hostId: "user-maya",
      capacity: 180,
      admission: { isFree: true, priceLabel: "Free RSVP" },
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
    // 12 — UPCOMING Next Week (Public, Paid, Concerts)
    {
      id: "evt-westside-jazz-fusion",
      schoolId: CAMPUS_SCHOOL_ID,
      title: "Westside Brass & Electronic Jazz Jam",
      description:
        "Fictional live horn section + modular synth night featuring GT music tech ensembles and local Atlanta session players.",
      category: "Concerts",
      startAt: buildRelativeNyIso(anchorIso, 9, "20:00"),
      endAt: buildRelativeNyIso(anchorIso, 9, "23:00"),
      venue: "Velvet Furnace Listening Room (Fictional)",
      publicDisplayLocation: "West Midtown · Howell Mill",
      addressPrivacy: "PUBLIC_VENUE",
      visibility: "PUBLIC",
      status: "PUBLISHED",
      hostId: "user-priya",
      capacity: 140,
      admission: {
        isFree: false,
        priceLabel: "$14 student ticket",
        amountUsd: 14,
      },
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
    // 13 — UPCOMING Next Week (Public, Free, Sports)
    {
      id: "evt-crc-glow-volleyball",
      schoolId: CAMPUS_SCHOOL_ID,
      title: "CRC Stampede Field Blacklight Volleyball",
      description:
        "Fictional 6v6 glow-in-the-dark turf volleyball tournament under the West Campus lights. Solo signups welcome via Move Groups.",
      category: "Sports",
      startAt: buildRelativeNyIso(anchorIso, 10, "19:30"),
      endAt: buildRelativeNyIso(anchorIso, 10, "22:30"),
      venue: "West Campus Rec Turf (Fictional Court)",
      publicDisplayLocation: "West Campus · CRC Fields",
      addressPrivacy: "PUBLIC_VENUE",
      visibility: "PUBLIC",
      status: "PUBLISHED",
      hostId: "user-scpc",
      capacity: 96,
      admission: { isFree: true, priceLabel: "Free for GT students" },
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
    // 14 — UPCOMING Next Week (Public w/ APPROVED_GROUP_OR_HOST Private Address, Other)
    {
      id: "evt-inman-supper-club",
      schoolId: CAMPUS_SCHOOL_ID,
      title: "Midtown Late-Night Ramen & Board Game Loft",
      description:
        "Fictional small-group student ramen pop-up and strategy game night. Exact loft unit is visible only to the host and accepted Move Group members.",
      category: "Other",
      startAt: buildRelativeNyIso(anchorIso, 11, "19:00"),
      endAt: buildRelativeNyIso(anchorIso, 11, "22:30"),
      venue: "Artisan Loft Kitchen (Fictional)",
      publicDisplayLocation: "Inman Park · BeltLine Access",
      privateAddress:
        "077 Fictional Highland Studio #4B, Buzz #402 (Demo Only)",
      addressPrivacy: "APPROVED_GROUP_OR_HOST",
      visibility: "PUBLIC",
      status: "PUBLISHED",
      hostId: "user-priya",
      capacity: 24,
      admission: {
        isFree: false,
        priceLabel: "$10 ingredients split",
        amountUsd: 10,
      },
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
  ];

  const responses: EventResponse[] = [
    // Tech Green Sunset
    { userId: "user-maya", eventId: "evt-tech-green-sunset", response: "GOING", updatedAt: createdAt },
    { userId: "user-jordan", eventId: "evt-tech-green-sunset", response: "GOING", updatedAt: createdAt },
    { userId: "user-priya", eventId: "evt-tech-green-sunset", response: "GOING", updatedAt: createdAt },
    { userId: "user-tyler", eventId: "evt-tech-green-sunset", response: "INTERESTED", updatedAt: createdAt },
    // West Midtown Neon
    { userId: "user-maya", eventId: "evt-west-midtown-neon", response: "GOING", updatedAt: createdAt },
    { userId: "user-jordan", eventId: "evt-west-midtown-neon", response: "GOING", updatedAt: createdAt },
    { userId: "user-marcus", eventId: "evt-west-midtown-neon", response: "GOING", updatedAt: createdAt },
    { userId: "user-chloe", eventId: "evt-west-midtown-neon", response: "INTERESTED", updatedAt: createdAt },
    // Home Park Vinyl
    { userId: "user-marcus", eventId: "evt-home-park-vinyl", response: "GOING", updatedAt: createdAt },
    { userId: "user-jordan", eventId: "evt-home-park-vinyl", response: "GOING", updatedAt: createdAt },
    { userId: "user-maya", eventId: "evt-home-park-vinyl", response: "SAVED", updatedAt: createdAt },
    // BeltLine Indie Show
    { userId: "user-priya", eventId: "evt-eastern-indie-show", response: "GOING", updatedAt: createdAt },
    { userId: "user-maya", eventId: "evt-eastern-indie-show", response: "INTERESTED", updatedAt: createdAt },
    { userId: "user-chloe", eventId: "evt-eastern-indie-show", response: "GOING", updatedAt: createdAt },
    // Bobby Dodd Tailgate
    { userId: "user-jordan", eventId: "evt-bobby-dodd-tailgate", response: "GOING", updatedAt: createdAt },
    { userId: "user-maya", eventId: "evt-bobby-dodd-tailgate", response: "GOING", updatedAt: createdAt },
    { userId: "user-priya", eventId: "evt-bobby-dodd-tailgate", response: "GOING", updatedAt: createdAt },
  ];

  const moveGroups: MoveGroupRecord[] = [
    // Group 1 — Owned by Maya Patel (Primary Demo Member) with a pending request from Tyler Nguyen!
    {
      id: "mg-west-midtown-rideshare",
      eventId: "evt-west-midtown-neon",
      creatorId: "user-maya",
      name: "Tech Square Rideshare Split (10:15 PM)",
      note: "Splitting two XL rideshares from Tech Square Waffle House corner so nobody walks back solo late. Request to join!",
      capacity: 6,
      discoverability: "PUBLIC",
      joinMode: "REQUEST_TO_JOIN",
      meetupTime: shiftHoursIso(anchorIso, 2.0),
      meetupSpot: "Tech Square · 5th St Bridge Benches",
      externalChatLink: "https://chat.example.com/sesh-demo-west-midtown",
      members: [
        { userId: "user-maya", role: "CREATOR", joinedAt: createdAt },
        { userId: "user-priya", role: "MEMBER", joinedAt: createdAt },
        { userId: "user-chloe", role: "MEMBER", joinedAt: createdAt },
      ],
      joinRequests: [
        {
          id: "jr-seed-1",
          userId: "user-tyler",
          status: "PENDING",
          note: "Hey! Heading from West Campus, down to split the ride.",
          createdAt: shiftHoursIso(anchorIso, -2),
        },
      ],
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
    // Group 2 — Owned by Chloe Kim (NOT Maya's friend), includes Jordan (Maya's friend) + Tyler (NOT Maya's friend)
    // Demonstrates roster masking immediately when viewed as Maya:
    // Creator Chloe visible + Friend Jordan visible + "+1 other member" anonymous!
    {
      id: "mg-indie-beltline-walk",
      eventId: "evt-eastern-indie-show",
      creatorId: "user-chloe",
      name: "MARTA to Inman Park + BeltLine Walk Crew",
      note: "Riding Gold/Blue line from North Ave Station together and grabbing tacos before doors open.",
      capacity: 6,
      discoverability: "PUBLIC",
      joinMode: "REQUEST_TO_JOIN",
      meetupTime: buildRelativeNyIso(anchorIso, fri, "19:00"),
      meetupSpot: "North Avenue MARTA West Entrance",
      externalChatLink: "https://chat.example.com/sesh-demo-beltline-crew",
      members: [
        { userId: "user-chloe", role: "CREATOR", joinedAt: createdAt },
        { userId: "user-jordan", role: "MEMBER", joinedAt: createdAt },
        { userId: "user-tyler", role: "MEMBER", joinedAt: createdAt },
      ],
      joinRequests: [],
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
    // Group 3 — Open Join group on Tech Green Sunset
    {
      id: "mg-tech-green-blanket",
      eventId: "evt-tech-green-sunset",
      creatorId: "user-priya",
      name: "Campanile Lawn Blanket & Card Games",
      note: "Open group by the Campanile fountain — bring Uno or spikeball!",
      capacity: 8,
      discoverability: "PUBLIC",
      joinMode: "OPEN_JOIN",
      meetupTime: shiftHoursIso(anchorIso, -0.75),
      meetupSpot: "Kessler Campanile Steps",
      externalChatLink: "https://chat.example.com/sesh-demo-campanile",
      members: [
        { userId: "user-priya", role: "CREATOR", joinedAt: createdAt },
        { userId: "user-jordan", role: "MEMBER", joinedAt: createdAt },
      ],
      joinRequests: [],
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
    // Group 4 — Full capacity group on Home Park Vinyl (tests capacity enforcement)
    {
      id: "mg-home-park-walk-over",
      eventId: "evt-home-park-vinyl",
      creatorId: "user-marcus",
      name: "Klaus Courtyard Walk-Over Trio",
      note: "Small 3-person walk group from Klaus stairs right after study block.",
      capacity: 3,
      discoverability: "PUBLIC",
      joinMode: "OPEN_JOIN",
      meetupTime: shiftHoursIso(anchorIso, 2.75),
      meetupSpot: "Klaus Binary Bridge",
      externalChatLink: "https://chat.example.com/sesh-demo-homepark-walk",
      members: [
        { userId: "user-marcus", role: "CREATOR", joinedAt: createdAt },
        { userId: "user-jordan", role: "MEMBER", joinedAt: createdAt },
        { userId: "user-chloe", role: "MEMBER", joinedAt: createdAt },
      ],
      joinRequests: [],
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
    // Group 5 — Invite-only group (hidden from unauthorized users & Guests!)
    {
      id: "mg-rooftop-invite-crew",
      eventId: "evt-friends-rooftop-sesh",
      creatorId: "user-maya",
      name: "Sq5 Elevator Escort Group",
      note: "Invite-only group so Maya can buzz everyone up together at 9:15 PM.",
      capacity: 5,
      discoverability: "INVITE_ONLY",
      joinMode: "INVITE_ONLY",
      meetupTime: shiftHoursIso(anchorIso, 1.4),
      meetupSpot: "Spring St Lobby Coffee Counter",
      externalChatLink: "https://chat.example.com/sesh-demo-sq5-private",
      members: [
        { userId: "user-maya", role: "CREATOR", joinedAt: createdAt },
        { userId: "user-jordan", role: "MEMBER", joinedAt: createdAt },
      ],
      invitedUserIds: ["user-priya"],
      joinRequests: [],
      createdAt,
      updatedAt: createdAt,
      source: "SEED",
    },
  ];

  const invitations: Invitation[] = [
    {
      id: "inv-demo-1",
      targetType: "MOVE_GROUP",
      targetId: "mg-west-midtown-rideshare",
      createdById: "user-maya",
      token: "demo-preview-token-not-cryptographic",
      expiresAt: shiftHoursIso(anchorIso, 24),
      maxUses: 10,
      usedCount: 1,
      permission: "JOIN",
    },
  ];

  return {
    users: SEED_USERS,
    events,
    responses,
    moveGroups,
    invitations,
  };
}
