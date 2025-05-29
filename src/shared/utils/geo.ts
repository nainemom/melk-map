import { bbox, polygon, squareGrid, booleanIntersects } from "@turf/turf";

export type BoundingBox = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export function generateGridOverPolygon(data: GeoJSON.Polygon | GeoJSON.MultiPolygon, cellSideInKm = 1): BoundingBox[] {
  // Convert to Turf.js polygon
  const turfPolygon = polygon(
    data.type === "Polygon" ? data.coordinates : data.coordinates[0]
  );

  // Get bounding box of the polygon
  const [minLng, minLat, maxLng, maxLat] = bbox(turfPolygon);

  // Generate square grid over bounding box
  const grid = squareGrid([minLng, minLat, maxLng, maxLat], cellSideInKm, {
    units: "kilometers",
  });

  const output: BoundingBox[] = [];

  for (const feature of grid.features) {
    // Keep only squares that intersect the polygon
    if (booleanIntersects(feature, turfPolygon)) {
      const [[lng1, lat1], , [lng2, lat2]] = feature.geometry.coordinates[0];

      output.push({
        minLat: Math.min(lat1, lat2),
        maxLat: Math.max(lat1, lat2),
        minLng: Math.min(lng1, lng2),
        maxLng: Math.max(lng1, lng2),
      });
    }
  }

  return output;
}

export function isPolygonFeature(
  feature: GeoJSON.Feature | null | undefined
): feature is GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> {
  return (
    !!feature &&
    (feature.geometry.type === "Polygon" ||
      feature.geometry.type === "MultiPolygon")
  );
}