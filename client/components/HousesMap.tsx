import { Map } from "react-map-gl/maplibre";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import DeckGL, { ScatterplotLayer, type MapViewState } from "deck.gl";
import {
  type House,
} from "@/api";


export function HousesMap({
  houses,
  mapStyle,
  children,
}: {
  houses: House[],
  mapStyle: string,
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
    const data = houses.filter(x => typeof x.unitPrice === 'number' && x.location !== null && typeof x.location.lat === 'number' && typeof x.location.lng === 'number') ?? [];
    const sortedPrices = data.map(x => x.unitPrice!).sort((a, b) => a - b);
    const center: NonNullable<House['location']> = {
      lat: data.reduce((p, c)=>p + c.location!.lat, 0) / data.length,
      lng: data.reduce((p, c)=>p + c.location!.lng, 0) / data.length,
    };
    return {
      data,
      min: sortedPrices[Math.floor((sortedPrices.length - 1) * gradientStops[1].t)],
      max: sortedPrices[Math.floor((sortedPrices.length - 1) * gradientStops[gradientStops.length - 2].t)],
      latitude: isNaN(center.lat) ? 0 : center.lat,
      longitude: isNaN(center.lng) ? 0 : center.lng,
    };
  }, [houses, gradientStops]);


  const [viewState, setViewState] = useState<MapViewState>({
    latitude: 0,
    longitude: 0,
    zoom: 13,
  });

  useEffect(() => {
    setViewState(p => ({ ...p, latitude, longitude }))
  }, [latitude, longitude]);

    
  const heatLayer = new ScatterplotLayer({
    id: "house-layer",
    data,
    getPosition: (d: House) => [d.location?.lng ?? 0, d.location?.lat ?? 0],
    getRadius: () => {
      return 50;
    },
    radiusUnits: "meters",
    getFillColor: (d: House) => {
      const price = d.unitPrice ?? 0;
      const t = (Math.max(min, Math.min(price, max)) - min) / (max - min);
      for (let i = 0; i < gradientStops.length - 1; i++) {
        const curr = gradientStops[i];
        const next = gradientStops[i + 1];

        if (t >= curr.t && t <= next.t) {
          const localT = (t - curr.t) / (next.t - curr.t);
          const r = Math.round(curr.color[0] + (next.color[0] - curr.color[0]) * localT);
          const g = Math.round(curr.color[1] + (next.color[1] - curr.color[1]) * localT);
          const b = Math.round(curr.color[2] + (next.color[2] - curr.color[2]) * localT);
          return [r, g, b];
        }
      }

      return gradientStops[gradientStops.length - 1].color;
    },
    onClick: ({ object }) => {
      alert(JSON.stringify(object, null, 4))
    },
    opacity: 0.9,
    stroked: false,
    pickable: true,
    updateTriggers: {
      getRadius: [viewState.zoom],
    },
  });

  return (
    <DeckGL
      viewState={viewState}
      controller={true}
      onViewStateChange={({ viewState: newViewState }) => {
        if (data.length) {
          setViewState(newViewState as MapViewState)
        }
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
