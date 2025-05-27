import { Badge, Button, DropdownMenu, Progress, Select,  } from "@radix-ui/themes";
import { Map } from "react-map-gl/maplibre";
import { useEffect, useState } from "react";
import { VscRunAbove } from "react-icons/vsc";
import DeckGL, { ScatterplotLayer, type MapViewState } from "deck.gl";
import {
  getDistricts,
  getHouse,
  searchHouses,
  type House,
  type SearchHousesFilters,
} from "@/api";
import { useAsyncFn, useLocalStorage } from "react-use";



type RGB = [number, number, number];

const gradientStops: { t: number; color: RGB }[] = [
  { t: 0.00, color: [255, 255, 255] }, // white
  { t: 0.10, color: [200, 255, 200] }, // mint green
  { t: 0.20, color: [120, 220, 120] }, // light green
  { t: 0.35, color: [0, 180, 0] },     // green
  { t: 0.50, color: [255, 255, 100] }, // yellow
  { t: 0.65, color: [255, 180, 0] },   // orange
  { t: 0.80, color: [255, 60, 0] },    // red
  { t: 0.90, color: [200, 0, 0] },     // dark red
  { t: 1.00, color: [190, 0, 0] },     // maroon
];

function interpolateColor(t: number): RGB {
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
}


export function Root() {
  const [filters, setFilters] = useState<Omit<SearchHousesFilters, "district">>(
    {
      size: [30, 120],
    }
  );

  const [mapStyle, setMapStyle] = useLocalStorage('map-style', 'https://raw.githubusercontent.com/go2garret/maps/main/src/assets/json/openStreetMap.json');

  const [progress, setProgress] = useState<[number, number]>([0, 1]);

  const [lastSavedHouses, setLastSavedHouses] = useLocalStorage<House[]>('saved-houses', []);

  const [houses, startSearch] = useAsyncFn(async () => {
    let returnValue: House[] = [];
    setProgress([0, 1]);

    const districts = await getDistricts();
    setProgress([1, 1 + districts.length]);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    for (const district of districts) {
      const districtHouseIds = await searchHouses({
        ...filters,
        district: [district.value],
      });
      setProgress((p) => [p[0], p[1] + districtHouseIds.length]);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      for (const houseId of districtHouseIds) {
        returnValue = [...returnValue, await getHouse(houseId)];
        setLastSavedHouses(returnValue);
        setProgress((p) => [p[0] + 1, p[1]]);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setProgress((p) => [p[0] + 1, p[1]]);
    }
    return returnValue;
  }, [filters]);

  const [viewState, setViewState] = useState<MapViewState>({
    latitude: 35.695,
    longitude: 51.395,
    zoom: 13,
    bearing: 0,
    pitch: 0,
  });

  const data = lastSavedHouses?.filter(x=>typeof x.unitPrice === 'number') ?? [];
  const sortedPrices = data.map(x => x.unitPrice!).sort((a, b) => a - b);
  const min = sortedPrices[Math.floor((sortedPrices.length - 1) * 0.08)];
  const max = sortedPrices[Math.floor((sortedPrices.length - 1) * 0.95)];
    
  const heatLayer = new ScatterplotLayer({
    id: "price-layer",
    data: data,
    getPosition: (d: House) => [d.location?.lng ?? 0, d.location?.lat ?? 0],
    getRadius: () => {
      // const baseZoom = 13;
      // const baseRadius = 150;
      // const scale = Math.pow(5.2, viewState.zoom - baseZoom);
      // return baseRadius / scale;
      return 50;
    },
    radiusUnits: "meters",
    // radiusScale: 1,
    getFillColor: (d: House) => {
      const price = d.unitPrice ?? 0;

      const t = (Math.max(min, Math.min(price, max)) - min) / (max - min);


      return interpolateColor(t);
    },
    opacity: 0.9,
    stroked: false,
    getLineColor: ()=>[0,0,0,255],
    getLineWidth: () => 5,
    pickable: false,
    updateTriggers: {
      getRadius: [viewState.zoom],
    },
  });

  return (
    <div className="w-svw h-svh">
      <DeckGL
        viewState={viewState}
        controller={true}
        onViewStateChange={({ viewState }) =>
          setViewState(viewState as MapViewState)
        }
        layers={[heatLayer]}
      >
        <Map
          mapStyle={mapStyle}
          attributionControl={false}
        />
        <div className="absolute bottom-0 left-0 w-full p-3 flex items-center justify-center gap-2">
          <Progress max={progress[1]} value={progress[0]} color="blue" />
          <Button
            onClick={() => {
              startSearch();
            }}
            color="blue"
            size="3"
            variant="classic"
          >
            <VscRunAbove />
            Start
          </Button>
          |
          <Select.Root value={mapStyle} onValueChange={setMapStyle} size="3">
            <Select.Trigger />
            <Select.Content>
              <Select.Group>
                <Select.Label>OpenStreetMap Basemap</Select.Label>
                <Select.Item value="https://raw.githubusercontent.com/go2garret/maps/main/src/assets/json/openStreetMap.json">OpenStreetMap</Select.Item>
              </Select.Group>
              <Select.Separator />
              <Select.Group>
                <Select.Label>ArcGIS Hybrid Basemap</Select.Label>
                <Select.Item value="https://raw.githubusercontent.com/go2garret/maps/main/src/assets/json/arcgis_hybrid.json">ArcGIS Hybrid</Select.Item>
              </Select.Group>
              <Select.Separator />
              <Select.Group>
                <Select.Label>CartoCDN Basemaps</Select.Label>
                <Select.Item value="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json">Dark Matter</Select.Item>
                <Select.Item value="https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json">Dark Matter No Labels</Select.Item>
                <Select.Item value="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json">Positron</Select.Item>
                <Select.Item value="https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json">Positron No Labels</Select.Item>
                <Select.Item value="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json">Voyager</Select.Item>
                <Select.Item value="https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json">Voyager No Labels</Select.Item>
              </Select.Group>
              <Select.Separator />
              <Select.Group>
                <Select.Label>ICGC Basemaps</Select.Label>
                <Select.Item value="https://geoserveis.icgc.cat/contextmaps/icgc.json">ICGC Main</Select.Item>
                <Select.Item value="https://geoserveis.icgc.cat/contextmaps/icgc_mapa_base_fosc.json">ICGC Dark Base Map</Select.Item>
                <Select.Item value="https://geoserveis.icgc.cat/contextmaps/icgc_ombra_hipsometria_corbes.json">ICGC Shadow Hypsometry Contours</Select.Item>
                <Select.Item value="https://geoserveis.icgc.cat/contextmaps/icgc_ombra_fosca.json">ICGC Dark Shadow</Select.Item>
                <Select.Item value="https://geoserveis.icgc.cat/contextmaps/icgc_orto_estandard.json">ICGC Standard Orthophoto</Select.Item>
                <Select.Item value="https://geoserveis.icgc.cat/contextmaps/icgc_orto_estandard_gris.json">ICGC Standard Orthophoto Gray</Select.Item>
                <Select.Item value="https://geoserveis.icgc.cat/contextmaps/icgc_orto_hibrida.json">ICGC Hybrid Orthophoto</Select.Item>
                <Select.Item value="https://geoserveis.icgc.cat/contextmaps/icgc_geologic_riscos.json">ICGC Geological Risks</Select.Item>
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>
      </DeckGL>
    </div>
  );
}
