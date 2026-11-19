CREATE TYPE "public"."address_privacy" AS ENUM('PUBLIC_VENUE', 'RSVP_GOING_ONLY', 'APPROVED_GROUP_OR_HOST', 'HOST_ONLY');--> statement-breakpoint
CREATE TYPE "public"."auth_provider" AS ENUM('DEV_TEST', 'CLERK', 'AUTH0', 'GOOGLE', 'APPLE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."consent_type" AS ENUM('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'LOCATION_SHARING', 'MARKETING', 'AGE_CONFIRMATION');--> statement-breakpoint
CREATE TYPE "public"."event_category" AS ENUM('Bars', 'Clubs', 'House Parties', 'Organization Events', 'Sports', 'Concerts', 'Other');--> statement-breakpoint
CREATE TYPE "public"."event_response_type" AS ENUM('GOING', 'INTERESTED');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('PUBLISHED', 'DRAFT', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."event_visibility" AS ENUM('PUBLIC', 'FRIENDS', 'CUSTOM', 'INVITE_ONLY');--> statement-breakpoint
CREATE TYPE "public"."friendship_status" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."join_request_status" AS ENUM('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."move_group_discoverability" AS ENUM('PUBLIC', 'MY_NETWORK', 'INVITE_ONLY');--> statement-breakpoint
CREATE TYPE "public"."move_group_join_mode" AS ENUM('REQUEST_TO_JOIN', 'OPEN_JOIN', 'INVITE_ONLY');--> statement-breakpoint
CREATE TYPE "public"."move_group_member_role" AS ENUM('CREATOR', 'MEMBER');--> statement-breakpoint
CREATE TYPE "public"."move_group_status" AS ENUM('ACTIVE', 'DISBANDED');--> statement-breakpoint
CREATE TYPE "public"."school_affiliation_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."user_account_status" AS ENUM('ACTIVE', 'SUSPENDED', 'DELETED');--> statement-breakpoint
CREATE TABLE "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"area_label" text,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"consent_type" "consent_type" NOT NULL,
	"version" text NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_auth_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "auth_provider" NOT NULL,
	"provider_subject" text NOT NULL,
	"email_at_provider" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_affiliations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"status" "school_affiliation_status" DEFAULT 'PENDING' NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"bio" text,
	"graduation_year" integer,
	"verified_student" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"status" "user_account_status" DEFAULT 'ACTIVE' NOT NULL,
	"primary_school_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"name" text NOT NULL,
	"public_display_location" text NOT NULL,
	"private_address" text,
	"location" "geography_point",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_audience_members" (
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_audience_members_pk" PRIMARY KEY("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "event_responses" (
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"response" "event_response_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_responses_pk" PRIMARY KEY("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "event_saves" (
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_saves_pk" PRIMARY KEY("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"host_id" uuid NOT NULL,
	"venue_id" uuid,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" "event_category" NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"venue_name" text NOT NULL,
	"public_display_location" text NOT NULL,
	"private_address" text,
	"address_privacy" "address_privacy" DEFAULT 'PUBLIC_VENUE' NOT NULL,
	"visibility" "event_visibility" DEFAULT 'PUBLIC' NOT NULL,
	"status" "event_status" DEFAULT 'DRAFT' NOT NULL,
	"cover_image_url" text,
	"capacity" integer,
	"admission_is_free" boolean DEFAULT true NOT NULL,
	"admission_price_label" text,
	"admission_amount_usd" numeric(10, 2),
	"location" "geography_point",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_end_after_start" CHECK ("events"."end_at" > "events"."start_at"),
	CONSTRAINT "events_capacity_positive" CHECK ("events"."capacity" IS NULL OR "events"."capacity" > 0)
);
--> statement-breakpoint
CREATE TABLE "move_group_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"move_group_id" uuid NOT NULL,
	"invited_user_id" uuid NOT NULL,
	"invited_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "move_group_join_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"move_group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "join_request_status" DEFAULT 'PENDING' NOT NULL,
	"note" text,
	"decided_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "move_group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"move_group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "move_group_member_role" DEFAULT 'MEMBER' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "move_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"name" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"capacity" integer NOT NULL,
	"discoverability" "move_group_discoverability" DEFAULT 'PUBLIC' NOT NULL,
	"join_mode" "move_group_join_mode" DEFAULT 'REQUEST_TO_JOIN' NOT NULL,
	"meetup_time" timestamp with time zone NOT NULL,
	"meetup_spot" text NOT NULL,
	"meetup_location" "geography_point",
	"external_chat_link" text,
	"status" "move_group_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "move_groups_capacity_positive" CHECK ("move_groups"."capacity" > 0),
	CONSTRAINT "move_groups_capacity_min_two" CHECK ("move_groups"."capacity" >= 2)
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"blocker_id" uuid NOT NULL,
	"blocked_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocks_pk" PRIMARY KEY("blocker_id","blocked_id"),
	CONSTRAINT "blocks_distinct_users" CHECK ("blocks"."blocker_id" <> "blocks"."blocked_id")
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"addressee_id" uuid NOT NULL,
	"user_low_id" uuid NOT NULL,
	"user_high_id" uuid NOT NULL,
	"status" "friendship_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "friendships_distinct_users" CHECK ("friendships"."requester_id" <> "friendships"."addressee_id"),
	CONSTRAINT "friendships_pair_ordered" CHECK ("friendships"."user_low_id" < "friendships"."user_high_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"school_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"request_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_auth_identities" ADD CONSTRAINT "external_auth_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_affiliations" ADD CONSTRAINT "school_affiliations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_affiliations" ADD CONSTRAINT "school_affiliations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_primary_school_id_schools_id_fk" FOREIGN KEY ("primary_school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_audience_members" ADD CONSTRAINT "event_audience_members_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_audience_members" ADD CONSTRAINT "event_audience_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_responses" ADD CONSTRAINT "event_responses_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_responses" ADD CONSTRAINT "event_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_saves" ADD CONSTRAINT "event_saves_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_saves" ADD CONSTRAINT "event_saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "move_group_invites" ADD CONSTRAINT "move_group_invites_move_group_id_move_groups_id_fk" FOREIGN KEY ("move_group_id") REFERENCES "public"."move_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "move_group_invites" ADD CONSTRAINT "move_group_invites_invited_user_id_users_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "move_group_invites" ADD CONSTRAINT "move_group_invites_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "move_group_join_requests" ADD CONSTRAINT "move_group_join_requests_move_group_id_move_groups_id_fk" FOREIGN KEY ("move_group_id") REFERENCES "public"."move_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "move_group_join_requests" ADD CONSTRAINT "move_group_join_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "move_group_join_requests" ADD CONSTRAINT "move_group_join_requests_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "move_group_members" ADD CONSTRAINT "move_group_members_move_group_id_move_groups_id_fk" FOREIGN KEY ("move_group_id") REFERENCES "public"."move_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "move_group_members" ADD CONSTRAINT "move_group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "move_groups" ADD CONSTRAINT "move_groups_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "move_groups" ADD CONSTRAINT "move_groups_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "move_groups" ADD CONSTRAINT "move_groups_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocked_id_users_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_users_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_low_id_users_id_fk" FOREIGN KEY ("user_low_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_high_id_users_id_fk" FOREIGN KEY ("user_high_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "schools_slug_unique" ON "schools" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "schools_name_ci_unique" ON "schools" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "consent_records_user_type_version_unique" ON "consent_records" USING btree ("user_id","consent_type","version");--> statement-breakpoint
CREATE UNIQUE INDEX "external_auth_provider_subject_unique" ON "external_auth_identities" USING btree ("provider","provider_subject");--> statement-breakpoint
CREATE UNIQUE INDEX "school_affiliations_user_school_unique" ON "school_affiliations" USING btree ("user_id","school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_ci_unique" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_ci_unique" ON "users" USING btree (lower("username"));--> statement-breakpoint
CREATE INDEX "venues_school_id_idx" ON "venues" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "venues_location_gist_idx" ON "venues" USING gist ("location");--> statement-breakpoint
CREATE INDEX "event_audience_members_user_id_idx" ON "event_audience_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_responses_user_id_idx" ON "event_responses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_responses_event_response_idx" ON "event_responses" USING btree ("event_id","response");--> statement-breakpoint
CREATE INDEX "event_saves_user_id_idx" ON "event_saves" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_school_id_idx" ON "events" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "events_host_id_idx" ON "events" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "events_venue_id_idx" ON "events" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "events_school_status_start_idx" ON "events" USING btree ("school_id","status","start_at");--> statement-breakpoint
CREATE INDEX "events_location_gist_idx" ON "events" USING gist ("location");--> statement-breakpoint
CREATE UNIQUE INDEX "move_group_invites_group_user_unique" ON "move_group_invites" USING btree ("move_group_id","invited_user_id");--> statement-breakpoint
CREATE INDEX "move_group_invites_invited_user_id_idx" ON "move_group_invites" USING btree ("invited_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "move_group_join_requests_pending_unique" ON "move_group_join_requests" USING btree ("move_group_id","user_id") WHERE "move_group_join_requests"."status" = 'PENDING';--> statement-breakpoint
CREATE INDEX "move_group_join_requests_user_id_idx" ON "move_group_join_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "move_group_join_requests_group_status_idx" ON "move_group_join_requests" USING btree ("move_group_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "move_group_members_active_unique" ON "move_group_members" USING btree ("move_group_id","user_id") WHERE "move_group_members"."left_at" IS NULL;--> statement-breakpoint
CREATE INDEX "move_group_members_user_id_idx" ON "move_group_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "move_group_members_group_id_idx" ON "move_group_members" USING btree ("move_group_id");--> statement-breakpoint
CREATE INDEX "move_groups_event_id_idx" ON "move_groups" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "move_groups_school_id_idx" ON "move_groups" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "move_groups_creator_id_idx" ON "move_groups" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "move_groups_event_status_idx" ON "move_groups" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "move_groups_meetup_location_gist_idx" ON "move_groups" USING gist ("meetup_location");--> statement-breakpoint
CREATE INDEX "blocks_blocked_id_idx" ON "blocks" USING btree ("blocked_id");--> statement-breakpoint
CREATE UNIQUE INDEX "friendships_pair_unique" ON "friendships" USING btree ("user_low_id","user_high_id");--> statement-breakpoint
CREATE INDEX "friendships_requester_id_idx" ON "friendships" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "friendships_addressee_id_idx" ON "friendships" USING btree ("addressee_id");--> statement-breakpoint
CREATE INDEX "friendships_status_idx" ON "friendships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_school_id_idx" ON "audit_logs" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");