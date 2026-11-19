import { customType } from "drizzle-orm/pg-core";

/**
 * PostGIS geography point in WGS84 (SRID 4326).
 * Stored as `geography(Point,4326)` for earth-distance proximity queries.
 *
 * Application values are `[longitude, latitude]` tuples (GeoJSON order).
 * Migrations agent must enable the `postgis` extension before applying tables
 * that use this column type, then create GIST spatial indexes.
 */
export const geographyPoint = customType<{
  data: [longitude: number, latitude: number];
  driverData: string;
}>({
  dataType() {
    return "geography(Point,4326)";
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
