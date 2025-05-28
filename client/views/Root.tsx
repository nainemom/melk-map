import { useEffect, useState } from "react";
import {
  getAllCityHouses,
  type GetAllHousesFilters,
  type House,
} from "@/api";
import { useAsync, useAsyncFn } from "react-use";
import { ofetch } from "ofetch";
import { HousesMap } from "@/components/HousesMap";
import { VscPlay, VscSettingsGear } from "react-icons/vsc";
import { HousesFilters } from "@/components/HousesFilters";


export function Root() {
  const [filters, setFilters] = useState<GetAllHousesFilters>(
    {
      cityId: '1',
      exact: false,
      size: [30, 120],
    }
  );

  const [progress, setProgress] = useState<number>(0);
  const [progressText, setProgressText] = useState('');

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
    }).then(() => {
      setProgress(0);
      setProgressText('');
    });
  }, [filters]);

  return (
    <div className="h-svh w-svw relative">
      <div className="flex items-center justify-between backdrop-blur-sm bg-black z-10 absolute top-0 left-0 w-full p-2 gap-2">
        <div className="flex items-center flex-col justify-between grow gap-1 h-full">
          <label htmlFor="progress-bar" className="text-xs h-4">{progressText ? `${progressText}...` : ''}</label>
          <progress id="progress-bar" value={progress} max="1" className="progress w-full h-2" />
        </div>
        <button
          onClick={()=>document.querySelector<HTMLDialogElement>('#filters-dialog')!.showModal()}
          disabled={crawlHouses.loading}
          className="shrink-0 btn btn-sm btn-soft"
        >
          <VscSettingsGear className="size-4" /> Settings
        </button>
        <button
          onClick={() => {
            startCrawl();
          }}
          disabled={crawlHouses.loading}
          className="shrink-0 btn btn-sm btn-primary"
        >
          <VscPlay className="size-4" /> Run
        </button>
      </div>

      <dialog id="filters-dialog" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Filters</h3>
          <div className="modal-action">
            <form method="dialog" className="w-full">
              <HousesFilters value={filters} onChange={setFilters} />
              <div className="divider" />
              <button className="btn btn-block btn-soft">Close</button>
            </form>
          </div>
        </div>
      </dialog>

      <HousesMap
        houses={houses ?? []}
      />
    </div>
  );
}
