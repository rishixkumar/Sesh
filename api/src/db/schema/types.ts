import { customType } from "drizzle-orm/pg-core";

/**
 * PostGIS geography point in WGS84 (SRID 4326).
 *
 * Uses SQL domain `geography_point` (= `geography(Point,4326)`), created in
 * migration `0000_enable_postgis`. drizzle-kit quotes customType dataType()
 * values; a bare `geography(Point,4326)` string becomes an invalid identifier.
 *
 * Application values are `[longitude, latitude]` tuples (GeoJSON order).
 */
export const geographyPoint = customType<{
  data: [longitude: number, latitude: number];
  driverData: string;
}>({
  dataType() {
    return "geography_point";
  },
  toDriver(value: [number, number]): string {
    const [longitude, latitude] = value;
    return `SRID=4326;POINT(${longitude} ${latitude})`;
  },
  fromDriver(value: string): [number, number] {
    // Driver may return WKT like `POINT(lon lat)` or EWKT with SRID prefix.
    const match = /POINT\s*\(\s*([^\s]+)\s+([^\s)]+)\s*\)/i.exec(value);
    if (!match) {
      throw new Error(`Unexpected geography driver value: ${value}`);
    }
    return [Number(match[1]), Number(match[2])];
  },
});
