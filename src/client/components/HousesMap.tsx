import { Map } from "react-map-gl/maplibre";
import DeckGL, { ScatterplotLayer, type MapViewState, GeoJsonLayer } from "deck.gl";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { type FetchHousesFilters, type House } from "@/client/api";
import { useAsync } from "react-use";
import { ofetch } from "ofetch";
import type { Feature, Geometry, MultiPolygon, Polygon } from "geojson";
import { LuMapPinCheckInside, LuMapPinXInside } from "react-icons/lu";
import { booleanPointInPolygon, point } from "@turf/turf";
import maplibregl from "maplibre-gl";

const mapStyle = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// eslint-disable-next-line react-refresh/only-export-components
export const gradientStops: { t: number; color: [number, number, number]; title: string }[] = [
  { t: 0.0, color: [255, 255, 255], title: "0–15% (very cheap)" },
  { t: 0.15, color: [200, 255, 200], title: "15–20%" },
  { t: 0.2, color: [120, 220, 120], title: "20–35%" },
  { t: 0.35, color: [0, 180, 0], title: "35–50%" },
  { t: 0.5, color: [255, 255, 100], title: "50–65%" },
  { t: 0.65, color: [255, 180, 0], title: "65–75%" },
  { t: 0.75, color: [255, 90, 0], title: "75–88%" },
  { t: 0.88, color: [255, 0, 0], title: "88–100% (very expensive)" },
  { t: 1.0, color: [110, 0, 0], title: "Top 1–2% (extremely high-end)" },
];

export function HousesMap({
  houses,
  children,
  polygon,
  onHighlightChange,
  locked = false,
}: {
  houses: House[];
  children?: ReactNode;
  polygon?: FetchHousesFilters["polygon"];
  onHighlightChange?: (geometry: FetchHousesFilters["polygon"] | undefined) => void;
  locked?: boolean;
}) {
  const geoData = useAsync(() =>
    ofetch<GeoJSON.FeatureCollection>("/geoBoundaries-IRN-ADM4_simplified.geojson", {
      responseType: "json",
    })
  );

  const { min, max, data, latitude, longitude } = useMemo(() => {
    const data = houses.filter(
      (x) =>
        typeof x.price === "number" &&
        x.location !== null &&
        typeof x.location.lat === "number" &&
        typeof x.location.lng === "number"
    );
    const sortedPrices = data.map((x) => x.price!).sort((a, b) => a - b);
    return {
      data,
      min: sortedPrices[Math.floor((sortedPrices.length - 1) * gradientStops[1].t)],
      max: sortedPrices[Math.floor((sortedPrices.length - 1) * gradientStops[gradientStops.length - 2].t)],
      longitude: data.length ? data.reduce((p, c) => p + c.location!.lng, 0) / data.length : undefined,
      latitude: data.length ? data.reduce((p, c) => p + c.location!.lat, 0) / data.length : undefined,
    };
  }, [houses]);

  const [viewState, setViewState] = useState<MapViewState>({
    latitude: 35.7129,
    longitude: 51.3847,
    zoom: 10,
  });

  useEffect(() => {
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      setViewState((p) => ({ ...p, latitude, longitude }));
    }
  }, [latitude, longitude]);

  const [highlightedPolygon, setHighlightedPolygon] = useState<Feature<Geometry> | undefined>();
  const highlightTimout = useRef<ReturnType<typeof setTimeout>>(setTimeout(() => null));
  useEffect(() => {
    highlightTimout.current = setTimeout(() => {
      if (locked || polygon || !geoData.value) return;
      const centerPoint = point([viewState.longitude, viewState.latitude]);
      const match = geoData.value.features.find((feature) => {
        const geometry = feature.geometry as Geometry;
        if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") return false;
        return booleanPointInPolygon(centerPoint, feature as Feature<Polygon | MultiPolygon>);
      });
      
      setHighlightedPolygon(match ?? undefined);
      onHighlightChange?.(match ? match.geometry as never : undefined);
    }, 100);

    return () => {
      clearTimeout(highlightTimout.current);
    }
  }, [geoData.value, locked, onHighlightChange, polygon, viewState] as never);


  const heatLayer = new ScatterplotLayer({
    id: "house-layer",
    data,
    getPosition: (d: House) => [d.location?.lng ?? 0, d.location?.lat ?? 0],
    getRadius: () => 200,
    radiusUnits: "meters",
    getFillColor: (d: House) => {
      const price = d.price ?? 0;
      const t = (Math.max(min, Math.min(price, max)) - min) / (max - min);
      let color: [number, number, number] = gradientStops[gradientStops.length - 1].color;
      for (let i = 0; i < gradientStops.length - 1; i++) {
        const curr = gradientStops[i];
        const next = gradientStops[i + 1];
        if (t >= curr.t && t <= next.t) {
          const localT = (t - curr.t) / (next.t - curr.t);
          const r = Math.round(curr.color[0] + (next.color[0] - curr.color[0]) * localT);
          const g = Math.round(curr.color[1] + (next.color[1] - curr.color[1]) * localT);
          const b = Math.round(curr.color[2] + (next.color[2] - curr.color[2]) * localT);
          color = [r, g, b];
          break;
        }
      }
      return color;
    },
    onClick: ({ object }) => {
      window.open(`https://divar.ir/v/${(object as House).token}`, "_blank");
    },
    opacity: 0.05,
    stroked: false,
    pickable: false,
  });

  const geoLayer = new GeoJsonLayer({
    id: "iran-admin2",
    data: geoData.value,
    pickable: !polygon && !locked,
    stroked: !polygon && !locked,
    filled: !polygon && !locked,
    getFillColor: [255, 200, 100, 0],
    getLineColor: [80, 80, 0],
    getLineWidth: 0,
  });

  const hoverLayer = new GeoJsonLayer({
    id: "highlighted-feature",
    data: !polygon && !locked ? highlightedPolygon : undefined,
    stroked: false,
    filled: true,
    getFillColor: [96, 93, 255, 90],
  });


  return (
    <DeckGL
      viewState={viewState}
      controller={true}
      onViewStateChange={({ viewState: newViewState }) => {
        setViewState(newViewState as MapViewState);
      }}
      layers={[heatLayer, geoLayer, hoverLayer]}
    >
      <Map 
        mapStyle={mapStyle} 
        attributionControl={false}
        mapLib={maplibregl}
        localIdeographFontFamily="'Vazirmatn', 'Tahoma', 'Arial', sans-serif"
        RTLTextPlugin="https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js"
        onLoad={() => {
          // Enable RTL text plugin
          if (!maplibregl.getRTLTextPluginStatus()) {
            maplibregl.setRTLTextPlugin(
              'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js',
              true,
              
            );
          }
        }}
      />
      {!locked && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-10"
        >

          { highlightedPolygon ? <LuMapPinCheckInside className="size-10 fill-primary" /> : <LuMapPinXInside className="size-10 fill-primary" /> }
          
        </div>
      )}
      {children}
    </DeckGL>
  );
}
