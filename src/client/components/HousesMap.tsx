import { Map } from "react-map-gl/maplibre";
import DeckGL, { ScatterplotLayer, type MapViewState, GeoJsonLayer } from "deck.gl";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  type FetchHousesFilters,
  type House,
} from "@/client/api";
import { useAsync } from "react-use";
import { ofetch } from "ofetch";
import { isPolygonFeature } from "@/shared/utils/geo";

const mapStyle = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
// 'https://raw.githubusercontent.com/go2garret/maps/main/src/assets/json/openStreetMap.json';


// eslint-disable-next-line react-refresh/only-export-components
export const gradientStops: { t: number; color: [number, number, number], title: string }[] = [
  { t: 0.00, color: [255, 255, 255], title: '0–15% (very cheap)' }, // white
  { t: 0.15, color: [200, 255, 200], title: '15–20%' }, // mint green
  { t: 0.20, color: [120, 220, 120], title: '20–35%' }, // light green
  { t: 0.35, color: [0, 180, 0], title: '	35–50%' },     // green
  { t: 0.5, color: [255, 255, 100], title: '50–65%' }, // yellow
  { t: 0.65, color: [255, 180, 0], title: '65–75%' },   // orange
  { t: 0.75, color: [255, 90, 0], title: '75–88%' },    // red
  { t: 0.88, color: [255, 0, 0], title: '88–100% (very expensive)' },     // dark red
  { t: 1.00, color: [220, 0, 0], title: 'Top 1–2% (extremely high-end)' },     // maroon
];

export function HousesMap({
  houses,
  children,
  polygon,
  onChangePolygon,
}: {
  houses: House[],
  children?: ReactNode,
  polygon?: FetchHousesFilters['polygon'],
  onChangePolygon?: (selectedPolygon: FetchHousesFilters['polygon'] | undefined) => void,
}) {

  const geoData = useAsync(() => {
    return ofetch<GeoJSON.FeatureCollection>("/geoBoundaries-IRN-ADM4_simplified.geojson", {
      responseType: 'json',
    });
  });


  const { min, max, data, latitude, longitude } = useMemo(() => {
    const data = houses.filter(x => typeof x.price === 'number' && x.location !== null && typeof x.location.lat === 'number' && typeof x.location.lng === 'number') ?? [];
    const sortedPrices = data.map(x => x.price!).sort((a, b) => a - b);
    return {
      data,
      min: sortedPrices[Math.floor((sortedPrices.length - 1) * gradientStops[1].t)],
      max: sortedPrices[Math.floor((sortedPrices.length - 1) * gradientStops[gradientStops.length - 2].t)],
      longitude: data.length ? data.reduce((p, c)=>p + c.location!.lng, 0) / data.length : undefined,
      latitude: data.length ? data.reduce((p, c)=>p + c.location!.lat, 0) / data.length : undefined,
    };
  }, [houses]);


  const [viewState, setViewState] = useState<MapViewState>({
    latitude: 35.7219,
    longitude: 51.3347,
    zoom: 13,
  });

  useEffect(() => {
    if (typeof latitude === 'undefined' || typeof longitude === 'undefined' || isNaN(latitude) || isNaN(longitude)) return;
    setViewState(p => ({ ...p, latitude, longitude }))
  }, [latitude, longitude]);

    
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
        }
      }

      return color;
    },
    // getLineColor: () => [0, 0, 0, 255],
    getLineWidth: () => 2,
    // lineWidthUnits: 'meters',
    onClick: ({ object }) => {
      window.open(`https://divar.ir/v/${(object as House).token}`, '_blank');
    },
    opacity: 0.1,
    stroked: true,
    pickable: true,
  });

  const [hoveredFeature, setHoveredFeature] = useState<GeoJSON.Feature<FetchHousesFilters['polygon']> | undefined>(undefined);

  const geoLayer = new GeoJsonLayer({
    id: "iran-admin2",
    data: geoData.value,
    pickable: !polygon,
    stroked: !polygon,
    filled: !polygon,
    lineWidthScale: 0,
    lineWidthMinPixels: 0,
    getFillColor: [255, 200, 100, 0], // RGBA
    getLineColor: [80, 80, 0],
    getLineWidth: 0,
    onHover: ({ object }) => {
      if (!!polygon || !isPolygonFeature(object)) return;
      setHoveredFeature(object);
    },
    updateTriggers: {
      pickable: polygon,
      stroked: polygon,
      filled: polygon,
    },
  });

  const hoverLayer = new GeoJsonLayer({
    id: "highlighted-feature",
    data: !polygon ? hoveredFeature : undefined,
    stroked: false,
    filled: !polygon,
    getFillColor: [255, 255, 255, 50],
    pickable: true,
    onClick: (x) => {
      if (isPolygonFeature(x.object)) {
        onChangePolygon?.(x.object.geometry);
      }
    },
    updateTriggers: {
      data: polygon,
      pickable: polygon,
    },
  });

  const pickedLayer = new GeoJsonLayer({
    id: "selected-feature",
    data: polygon ? {
      type: "Feature",
      geometry: polygon,
      properties: {},
    } : undefined,
    stroked: true,
    filled: true,
    getFillColor: [96, 93, 255, 150],
    getLineColor: [96, 93, 255],
    getLineWidth: 20,
    lineCapRounded: true,
    lineJointRounded: true,
    lineBillboard: true,
    pickable: true,
    onClick: () => {
      onChangePolygon?.(undefined);
    },
    updateTriggers: {
      data: polygon,
    },
  });

  return (
    <DeckGL
      viewState={viewState}
      controller={true}
      onViewStateChange={({ viewState: newViewState }) => {
        setViewState(newViewState as MapViewState)
      }}
      layers={[heatLayer, geoLayer, pickedLayer, hoverLayer]}
    >
      <Map
        mapStyle={mapStyle}
        attributionControl={false}
      />
      {children}
    </DeckGL>
  );
}
