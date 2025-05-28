import { Button, Progress } from "@radix-ui/themes";
import { useEffect, useState } from "react";
import { VscRunAbove, VscStopCircle } from "react-icons/vsc";
import {
  getAllCityHouses,
  type GetAllHousesFilters,
  type House,
} from "@/api";
import { useAsync, useAsyncFn, useLocalStorage } from "react-use";
import { MapStyleSelect } from "@/components/MapStyleSelect";
import { ofetch } from "ofetch";
import { HousesMap } from "@/components/HousesMap";



export function Root() {
  const [filters] = useState<GetAllHousesFilters>(
    {
      cityId: '1',
      size: [30, 200],
    }
  );

  const [mapStyle, setMapStyle] = useLocalStorage<string>('map-style');

  const [progress, setProgress] = useState<number>(0);
  const [progressText, setProgressText] = useState('');

  useEffect(() => {
    console.log(progressText);
  }, [progressText]);

  const lastSavedHouses = useAsync(() => ofetch<House[]>(new URL('./tehran.json', window.location.origin + window.location.pathname).href));
  const [houses, setHouses] = useState<House[]>([]);
  useEffect(() => {
    setHouses(lastSavedHouses.value ?? []);
  }, [lastSavedHouses.value]);

  const [crawlHouses, startCrawl] = useAsyncFn(async () => {
    return getAllCityHouses(filters, (a, b, progressText, currentHouses) => {
      setProgress(a / b);
      setProgressText(progressText);
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
        <Progress size="2" max={1} value={progress} color="green" variant="classic" />
        <Button
          onClick={() => {
            startCrawl();
          }}
          color={crawlHouses.loading ? 'gray' : 'green'}
          size="2"
          variant="classic"
        >
          
          {crawlHouses.loading ? (
            <>
              <VscStopCircle />
              Stop
            </>
          ) : (
            <>
              <VscRunAbove />
              Start Crawl Divar
            </>
          )}
        </Button>
        |
        <MapStyleSelect value={mapStyle} onValueChange={setMapStyle} size="2" />
      </div>
    </div>
  );
}
