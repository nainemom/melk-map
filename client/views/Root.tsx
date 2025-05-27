import { Button, Progress } from "@radix-ui/themes";
import { Map } from "react-map-gl/maplibre";
import { useState } from "react";
import { VscRunAbove } from "react-icons/vsc";
import DeckGL, { ScatterplotLayer, type MapViewState } from "deck.gl";
import {
  getHouses,
  type House,
  type SearchHousesFilters,
} from "@/api";
import { useAsync, useAsyncFn, useLocalStorage } from "react-use";
import { MapStyleSelect } from "@/components/MapStyleSelect";
import { interpolateColor } from "@/utils/colors";
import { ofetch } from "ofetch";



export function Root() {
  const [filters] = useState<Omit<SearchHousesFilters, "district">>(
    {
      size: [30, 200],
    }
  );

  const [mapStyle, setMapStyle] = useLocalStorage('map-style', 'https://raw.githubusercontent.com/go2garret/maps/main/src/assets/json/openStreetMap.json');

  const [progress, setProgress] = useState<number>(0);

  const lastSavedHouses = useAsync(() => ofetch<House[]>('./tehran.json'));
  const [houses, startSearch] = useAsyncFn(() => {
    return getHouses(filters, (p) => {
      setProgress(p);
      console.log(p);
    });
  }, [filters]);

  const [viewState, setViewState] = useState<MapViewState>({
    latitude: 35.695,
    longitude: 51.395,
    zoom: 13,
    bearing: 0,
    pitch: 0,
  });

  const data = (houses.value ?? lastSavedHouses.value)?.filter(x=>typeof x.unitPrice === 'number') ?? [];
  const sortedPrices = data.map(x => x.unitPrice!).sort((a, b) => a - b);
  const min = sortedPrices[Math.floor((sortedPrices.length - 1) * 0.15)];
  const max = sortedPrices[Math.floor((sortedPrices.length - 1) * 0.88)];
    
  const heatLayer = new ScatterplotLayer({
    id: "price-layer",
    data: data,
    getPosition: (d: House) => [d.location?.lng ?? 0, d.location?.lat ?? 0],
    getRadius: () => {
      return 50;
    },
    radiusUnits: "meters",
    getFillColor: (d: House) => {
      const price = d.unitPrice ?? 0;
      const t = (Math.max(min, Math.min(price, max)) - min) / (max - min);
      return interpolateColor(t);
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
        <div className="absolute top-0 left-0 w-full p-2 flex items-center justify-center gap-2 backdrop-contrast-50 backdrop-blur-sm">
          <Progress size="2" max={1} value={progress} color="green" />
          <Button
            onClick={() => {
              startSearch();
            }}
            color="green"
            size="2"
            variant="classic"
            loading={houses.loading}
          >
            <VscRunAbove />
            Start Crawl Divar
          </Button>
          |
          <MapStyleSelect value={mapStyle} onValueChange={setMapStyle} size="2" />
        </div>
      </DeckGL>
    </div>
  );
}
