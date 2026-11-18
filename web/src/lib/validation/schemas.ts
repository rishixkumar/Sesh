import { z } from "zod";
import {
  ADDRESS_PRIVACY_OPTIONS,
  EVENT_CATEGORIES,
  EVENT_VISIBILITIES,
  MOVE_GROUP_DISCOVERABILITIES,
  MOVE_GROUP_JOIN_MODES,
} from "@/types/domain";
import { nyLocalInputToUtcIso } from "@/lib/dates";

const optionalHttpUrlSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (val) => {
      if (!val || val.length === 0) return true;
      try {
        const parsed = new URL(val);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Enter a valid http:// or https:// URL." }
  );

const optionalCapacityStringSchema = z
  .string()
  .trim()
  .optional()
  .refine(
    (val) => {
      if (!val || val.length === 0) return true;
      const num = Number(val);
      return Number.isInteger(num) && num >= 1 && num <= 50000;
    },
    { message: "Capacity must be a positive whole number." }
  );

export const moveFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Move title must be at least 3 characters.")
      .max(100, "Move title cannot exceed 100 characters."),
    description: z
      .string()
      .trim()
      .min(10, "Include a short description (at least 10 characters).")
      .max(2000, "Description cannot exceed 2,000 characters."),
    category: z.enum(EVENT_CATEGORIES, {
      message: "Choose an event category.",
    }),
    /** NY local wall-clock input string `YYYY-MM-DDTHH:mm` or ISO string */
    startLocal: z.string().trim().min(1, "Start date and time are required."),
    /** NY local wall-clock input string `YYYY-MM-DDTHH:mm` or ISO string */
    endLocal: z.string().trim().min(1, "End date and time are required."),
    venue: z
      .string()
      .trim()
      .min(2, "Venue or location text is required.")
      .max(120, "Venue cannot exceed 120 characters."),
    publicDisplayLocation: z
      .string()
      .trim()
      .max(120, "Approximate location cannot exceed 120 characters.")
      .optional(),
    privateAddress: z
      .string()
      .trim()
      .max(180, "Private address cannot exceed 180 characters.")
      .optional(),
    addressPrivacy: z.enum(ADDRESS_PRIVACY_OPTIONS),
    visibility: z.enum(EVENT_VISIBILITIES),
    capacityText: optionalCapacityStringSchema,
    pricingMode: z.enum(["FREE", "PAID"]),
    priceLabel: z
      .string()
      .trim()
      .max(60, "Price note cannot exceed 60 characters.")
      .optional(),
    coverImage: optionalHttpUrlSchema,
  })
  .superRefine((values, ctx) => {
    const startIso = nyLocalInputToUtcIso(values.startLocal);
    const endIso = nyLocalInputToUtcIso(values.endLocal);

    if (!startIso) {
      ctx.addIssue({
        code: "custom",
        path: ["startLocal"],
        message: "Enter a valid start date and time.",
      });
    }

    if (!endIso) {
      ctx.addIssue({
        code: "custom",
        path: ["endLocal"],
        message: "Enter a valid end date and time.",
      });
    }

    if (startIso && endIso) {
      const startMs = new Date(startIso).getTime();
      const endMs = new Date(endIso).getTime();
      if (endMs <= startMs) {
        ctx.addIssue({
          code: "custom",
          path: ["endLocal"],
          message: "End time must occur after the start time.",
        });
      }
    }

    if (
      values.pricingMode === "PAID" &&
      (!values.priceLabel || values.priceLabel.trim().length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["priceLabel"],
        message: "Specify cover/ticket info for paid events (e.g. \"$10 cover\").",
      });
    }

    if (
      values.addressPrivacy !== "PUBLIC_VENUE" &&
      (!values.publicDisplayLocation ||
        values.publicDisplayLocation.trim().length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["publicDisplayLocation"],
        message:
          "Provide a safe public approximate area (e.g. \"Home Park near 10th St\") when exact address is private.",
      });
    }
  });

export type MoveFormValues = z.infer<typeof moveFormSchema>;

export const moveGroupFormSchema = z
  .object({
    eventId: z.string().trim().min(1, "Select an associated event."),
    name: z
      .string()
      .trim()
      .min(3, "Group name must be at least 3 characters.")
      .max(80, "Group name cannot exceed 80 characters."),
    note: z
      .string()
      .trim()
      .min(5, "Add a short coordination note (at least 5 characters).")
      .max(600, "Note cannot exceed 600 characters."),
    capacity: z
      .number({ message: "Capacity must be a positive whole number." })
      .int("Capacity must be a whole number.")
      .min(2, "Move Group capacity must be at least 2 (including you).")
      .max(50, "Move Group capacity cannot exceed 50."),
    discoverability: z.enum(MOVE_GROUP_DISCOVERABILITIES),
    joinMode: z.enum(MOVE_GROUP_JOIN_MODES),
    meetupTimeLocal: z
      .string()
      .trim()
      .min(1, "Meet-up date and time are required."),
    meetupSpot: z
      .string()
      .trim()
      .min(2, "Meeting spot is required.")
      .max(140, "Meeting spot cannot exceed 140 characters."),
    externalChatLink: optionalHttpUrlSchema,
  })
  .superRefine((values, ctx) => {
    const meetupIso = nyLocalInputToUtcIso(values.meetupTimeLocal);
    if (!meetupIso) {
      ctx.addIssue({
        code: "custom",
        path: ["meetupTimeLocal"],
        message: "Enter a valid meet-up date and time.",
      });
    }
  });

export type MoveGroupFormValues = z.infer<typeof moveGroupFormSchema>;
