import { Button, Progress } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { VscRunAbove } from "react-icons/vsc";
import {
  getHouses,
  type House,
  type SearchHousesFilters,
} from "@/api";
import { useAsync, useAsyncFn, useLocalStorage } from "react-use";
import { MapStyleSelect } from "@/components/MapStyleSelect";
import { ofetch } from "ofetch";
import { HousesMap } from "@/components/HousesMap";



export function Root() {
  const [filters] = useState<Omit<SearchHousesFilters, "district">>(
    {
      size: [30, 200],
    }
  );

  const [mapStyle, setMapStyle] = useLocalStorage<string>('map-style');

  const [progress, setProgress] = useState<number>(0);

  const lastSavedHouses = useAsync(() => ofetch<House[]>(new URL('./tehran.json', window.location.origin + window.location.pathname).href));
  const [houses, setHouses] = useState<House[]>([]);
  useEffect(() => {
    setHouses(lastSavedHouses.value ?? []);
  }, [lastSavedHouses.value]);

  const [crawlHouses, startCrawl] = useAsyncFn(() => {
    return getHouses(filters, (p, currentHouses) => {
      setProgress(p);
      console.log(p);
      setHouses(currentHouses);
    });
  }, [filters]);


  return (
    <div className="w-svw h-svh relative">
      <HousesMap
        houses={houses ?? []}
        mapStyle={mapStyle!}
      />
      <div className="absolute top-0 left-0 w-full p-2 flex items-center justify-center gap-2 backdrop-contrast-50 backdrop-blur-sm">
        <Progress size="2" max={1} value={progress} color="green" />
        <Button
          onClick={() => {
            startCrawl();
          }}
          color="green"
          size="2"
          variant="classic"
          loading={crawlHouses.loading}
        >
          <VscRunAbove />
          Start Crawl Divar
        </Button>
        |
        <MapStyleSelect value={mapStyle} onValueChange={setMapStyle} size="2" />
      </div>
    </div>
  );
}
