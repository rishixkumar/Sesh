-- Enable PostGIS for geography columns and GIST spatial indexes (MS3 §2.5).
CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint
-- Domain wrapper so drizzle-kit can emit a quotable type name. Kit wraps
-- customType dataType() values in double quotes, which breaks
-- geography(Point,4326) typmod syntax; the domain keeps SRID 4326 Point.
CREATE DOMAIN geography_point AS geography(Point,4326);
