/**
 * Idempotent seed applicator — upserts fixed-UUID rows; safe to re-run.
 */

import { sql } from "drizzle-orm";
import type { Database } from "../client.js";
import {
  consentRecords,
  eventAudienceMembers,
  eventResponses,
  events,
  eventSaves,
  externalAuthIdentities,
  friendships,
  moveGroupInvites,
  moveGroupJoinRequests,
  moveGroupMembers,
  moveGroups,
  schoolAffiliations,
  schools,
  userProfiles,
  users,
  venues,
} from "../schema/index.js";
import {
  eventAudienceSeeds,
  eventResponseSeeds,
  eventSaveSeeds,
  eventSeeds,
  friendshipSeeds,
  moveGroupInviteSeeds,
  moveGroupJoinRequestSeeds,
  moveGroupMemberSeeds,
  moveGroupSeeds,
  orderedPair,
  schoolSeed,
  SEED_CONSENT_VERSION,
  userSeeds,
  venueSeeds,
} from "./data.js";
import { SEED_SCHOOL_ID } from "./ids.js";

/** Drizzle DB handle (postgres.js via `createDb`). */
export type SeedDatabase = Database;

export type SeedApplyResult = {
  schoolId: string;
  userCount: number;
  eventCount: number;
  friendshipCount: number;
  moveGroupCount: number;
  pendingJoinRequestCount: number;
};

/**
 * Apply the full deterministic seed set inside a single transaction.
 * Re-running updates the same fixed primary keys — no duplicate rows.
 */
export async function applySeeds(db: SeedDatabase): Promise<SeedApplyResult> {
  await db.transaction(async (tx) => {
    const client = tx as unknown as SeedDatabase;

    await client
      .insert(schools)
      .values(schoolSeed)
      .onConflictDoUpdate({
        target: schools.id,
        set: {
          slug: schoolSeed.slug,
          name: schoolSeed.name,
          shortName: schoolSeed.shortName,
          areaLabel: schoolSeed.areaLabel,
          timezone: schoolSeed.timezone,
          updatedAt: sql`now()`,
        },
      });

    for (const user of userSeeds) {
      await client
        .insert(users)
        .values({
          id: user.id,
          email: user.email,
          username: user.username,
          status: "ACTIVE",
          primarySchoolId: SEED_SCHOOL_ID,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: user.email,
            username: user.username,
            status: "ACTIVE",
            primarySchoolId: SEED_SCHOOL_ID,
            updatedAt: sql`now()`,
          },
        });

      await client
        .insert(userProfiles)
        .values({
          userId: user.id,
          displayName: user.displayName,
          bio: user.bio,
          graduationYear: user.graduationYear,
          verifiedStudent: true,
          avatarUrl: null,
        })
        .onConflictDoUpdate({
          target: userProfiles.userId,
          set: {
            displayName: user.displayName,
            bio: user.bio,
            graduationYear: user.graduationYear,
            verifiedStudent: true,
            updatedAt: sql`now()`,
          },
        });

      await client
        .insert(schoolAffiliations)
        .values({
          id: user.affiliationId,
          userId: user.id,
          schoolId: SEED_SCHOOL_ID,
          status: "VERIFIED",
          verifiedAt: new Date("2026-11-01T00:00:00.000Z"),
        })
        .onConflictDoUpdate({
          target: schoolAffiliations.id,
          set: {
            userId: user.id,
            schoolId: SEED_SCHOOL_ID,
            status: "VERIFIED",
            verifiedAt: new Date("2026-11-01T00:00:00.000Z"),
            updatedAt: sql`now()`,
          },
        });

      await client
        .insert(externalAuthIdentities)
        .values({
          id: user.authId,
          userId: user.id,
          provider: "DEV_TEST",
          providerSubject: user.authSubject,
          emailAtProvider: user.email,
        })
        .onConflictDoUpdate({
          target: externalAuthIdentities.id,
          set: {
            userId: user.id,
            provider: "DEV_TEST",
            providerSubject: user.authSubject,
            emailAtProvider: user.email,
            updatedAt: sql`now()`,
          },
        });

      await client
        .insert(consentRecords)
        .values({
          id: user.consentId,
          userId: user.id,
          consentType: "TERMS_OF_SERVICE",
          version: SEED_CONSENT_VERSION,
          metadata: { source: "seed", fictional: true },
        })
        .onConflictDoUpdate({
          target: consentRecords.id,
          set: {
            userId: user.id,
            consentType: "TERMS_OF_SERVICE",
            version: SEED_CONSENT_VERSION,
            metadata: { source: "seed", fictional: true },
          },
        });
    }

    for (const venue of venueSeeds) {
      await client
        .insert(venues)
        .values({
          id: venue.id,
          schoolId: SEED_SCHOOL_ID,
          name: venue.name,
          publicDisplayLocation: venue.publicDisplayLocation,
          privateAddress: venue.privateAddress,
          location: venue.location,
        })
        .onConflictDoUpdate({
          target: venues.id,
          set: {
            schoolId: SEED_SCHOOL_ID,
            name: venue.name,
            publicDisplayLocation: venue.publicDisplayLocation,
            privateAddress: venue.privateAddress,
            location: venue.location,
            updatedAt: sql`now()`,
          },
        });
    }

    for (const event of eventSeeds) {
      await client
        .insert(events)
        .values({
          id: event.id,
          schoolId: SEED_SCHOOL_ID,
          hostId: event.hostId,
          venueId: event.venueId,
          title: event.title,
          description: event.description,
          category: event.category,
          startAt: event.startAt,
          endAt: event.endAt,
          venueName: event.venueName,
          publicDisplayLocation: event.publicDisplayLocation,
          privateAddress: event.privateAddress,
          addressPrivacy: event.addressPrivacy,
          visibility: event.visibility,
          status: event.status,
          capacity: event.capacity,
          admissionIsFree: event.admissionIsFree,
          admissionPriceLabel: event.admissionPriceLabel,
          admissionAmountUsd: event.admissionAmountUsd,
          location: event.location,
        })
        .onConflictDoUpdate({
          target: events.id,
          set: {
            schoolId: SEED_SCHOOL_ID,
            hostId: event.hostId,
            venueId: event.venueId,
            title: event.title,
            description: event.description,
            category: event.category,
            startAt: event.startAt,
            endAt: event.endAt,
            venueName: event.venueName,
            publicDisplayLocation: event.publicDisplayLocation,
            privateAddress: event.privateAddress,
            addressPrivacy: event.addressPrivacy,
            visibility: event.visibility,
            status: event.status,
            capacity: event.capacity,
            admissionIsFree: event.admissionIsFree,
            admissionPriceLabel: event.admissionPriceLabel,
            admissionAmountUsd: event.admissionAmountUsd,
            location: event.location,
            updatedAt: sql`now()`,
          },
        });
    }

    for (const row of eventAudienceSeeds) {
      await client
        .insert(eventAudienceMembers)
        .values(row)
        .onConflictDoNothing({
          target: [eventAudienceMembers.eventId, eventAudienceMembers.userId],
        });
    }

    for (const row of eventResponseSeeds) {
      await client
        .insert(eventResponses)
        .values({
          eventId: row.eventId,
          userId: row.userId,
          response: row.response,
        })
        .onConflictDoUpdate({
          target: [eventResponses.eventId, eventResponses.userId],
          set: {
            response: row.response,
            updatedAt: sql`now()`,
          },
        });
    }

    for (const row of eventSaveSeeds) {
      await client
        .insert(eventSaves)
        .values(row)
        .onConflictDoNothing({
          target: [eventSaves.eventId, eventSaves.userId],
        });
    }

    for (const row of friendshipSeeds) {
      const pair = orderedPair(row.requesterId, row.addresseeId);
      await client
        .insert(friendships)
        .values({
          id: row.id,
          requesterId: row.requesterId,
          addresseeId: row.addresseeId,
          userLowId: pair.userLowId,
          userHighId: pair.userHighId,
          status: row.status,
          respondedAt: row.respondedAt,
        })
        .onConflictDoUpdate({
          target: friendships.id,
          set: {
            requesterId: row.requesterId,
            addresseeId: row.addresseeId,
            userLowId: pair.userLowId,
            userHighId: pair.userHighId,
            status: row.status,
            respondedAt: row.respondedAt,
            updatedAt: sql`now()`,
          },
        });
    }

    for (const group of moveGroupSeeds) {
      await client
        .insert(moveGroups)
        .values({
          id: group.id,
          eventId: group.eventId,
          schoolId: SEED_SCHOOL_ID,
          creatorId: group.creatorId,
          name: group.name,
          note: group.note,
          capacity: group.capacity,
          discoverability: group.discoverability,
          joinMode: group.joinMode,
          meetupTime: group.meetupTime,
          meetupSpot: group.meetupSpot,
          meetupLocation: group.meetupLocation,
          externalChatLink: group.externalChatLink,
          status: "ACTIVE",
        })
        .onConflictDoUpdate({
          target: moveGroups.id,
          set: {
            eventId: group.eventId,
            schoolId: SEED_SCHOOL_ID,
            creatorId: group.creatorId,
            name: group.name,
            note: group.note,
            capacity: group.capacity,
            discoverability: group.discoverability,
            joinMode: group.joinMode,
            meetupTime: group.meetupTime,
            meetupSpot: group.meetupSpot,
            meetupLocation: group.meetupLocation,
            externalChatLink: group.externalChatLink,
            status: "ACTIVE",
            updatedAt: sql`now()`,
          },
        });
    }

    for (const member of moveGroupMemberSeeds) {
      await client
        .insert(moveGroupMembers)
        .values({
          id: member.id,
          moveGroupId: member.moveGroupId,
          userId: member.userId,
          role: member.role,
          leftAt: null,
        })
        .onConflictDoUpdate({
          target: moveGroupMembers.id,
          set: {
            moveGroupId: member.moveGroupId,
            userId: member.userId,
            role: member.role,
            leftAt: null,
          },
        });
    }

    for (const request of moveGroupJoinRequestSeeds) {
      await client
        .insert(moveGroupJoinRequests)
        .values({
          id: request.id,
          moveGroupId: request.moveGroupId,
          userId: request.userId,
          status: request.status,
          note: request.note,
          decidedByUserId: request.decidedByUserId,
          decidedAt: request.decidedAt,
          createdAt: request.createdAt,
        })
        .onConflictDoUpdate({
          target: moveGroupJoinRequests.id,
          set: {
            moveGroupId: request.moveGroupId,
            userId: request.userId,
            status: request.status,
            note: request.note,
            decidedByUserId: request.decidedByUserId,
            decidedAt: request.decidedAt,
          },
        });
    }

    for (const invite of moveGroupInviteSeeds) {
      await client
        .insert(moveGroupInvites)
        .values(invite)
        .onConflictDoUpdate({
          target: moveGroupInvites.id,
          set: {
            moveGroupId: invite.moveGroupId,
            invitedUserId: invite.invitedUserId,
            invitedByUserId: invite.invitedByUserId,
          },
        });
    }
  });

  return {
    schoolId: SEED_SCHOOL_ID,
    userCount: userSeeds.length,
    eventCount: eventSeeds.length,
    friendshipCount: friendshipSeeds.length,
    moveGroupCount: moveGroupSeeds.length,
    pendingJoinRequestCount: moveGroupJoinRequestSeeds.length,
  };
}
