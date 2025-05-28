import { Map } from "react-map-gl/maplibre";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import DeckGL, { ScatterplotLayer, type MapViewState } from "deck.gl";
import {
  type House,
} from "@/api";


const mapStyle = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export function HousesMap({
  houses,
  children,
}: {
  houses: House[],
  children?: ReactNode,
}) {

const gradientStops = useMemo<{ t: number; color: [number, number, number] }[]>(() => [
    { t: 0.00, color: [255, 255, 255] }, // white
    { t: 0.15, color: [200, 255, 200] }, // mint green
    { t: 0.20, color: [120, 220, 120] }, // light green
    { t: 0.35, color: [0, 180, 0] },     // green
    { t: 0.5, color: [255, 255, 100] }, // yellow
    { t: 0.65, color: [255, 180, 0] },   // orange
    { t: 0.75, color: [255, 90, 0] },    // red
    { t: 0.88, color: [255, 0, 0] },     // dark red
    { t: 1.00, color: [140, 0, 0] },     // maroon
  ], []);

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
  }, [houses, gradientStops]);


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
    getRadius: () => {
      return 80;
    },
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

      return [...color, d.location.exact ? 255 : 90];
    },
    getLineColor: () => [0, 0, 0, 255],
    getLineWidth: () => 2,
    lineWidthUnits: 'meters',
    onClick: ({ object }) => {
      window.open(`https://divar.ir/v/${(object as House).token}`, '_blank');
    },
    opacity: 1,
    stroked: true,
    pickable: true,
    updateTriggers: {
      getRadius: [viewState.zoom, viewState.latitude, viewState.longitude],
      getLineWidth: [viewState.zoom, viewState.latitude, viewState.longitude],
      getLineColor: [viewState.zoom, viewState.latitude, viewState.longitude],
    },
  });

  return (
    <DeckGL
      viewState={viewState}
      controller={true}
      onViewStateChange={({ viewState: newViewState }) => {
        setViewState(newViewState as MapViewState)
      }}
      layers={[heatLayer]}
    >
      <Map
        mapStyle={mapStyle}
        attributionControl={false}
      />
      {children}
    </DeckGL>
  );
}
