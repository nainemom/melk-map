import { useState } from "react";
import {
  fetchHouses,
  type FetchHousesFilters,
  type House,
} from "@/client/api";
import { useAsync } from "react-use";
import { gradientStops, HousesMap } from "@/client/components/HousesMap";
import { VscInfo, VscSettingsGear } from "react-icons/vsc";
import { HousesFilters } from "@/client/components/HousesFilters";
import { LuMagnet, LuStepBack } from "react-icons/lu";


export function Root() {
  const [filters, setFilters] = useState<Omit<FetchHousesFilters, 'polygon'>>({
    size: [30, 120],
    elevator: true,
    parking: true,
  });

  const [highlightedPolygon, setHighlightedPolygon] = useState<FetchHousesFilters['polygon'] | undefined>();
  const [polygon, setPolygon] = useState<FetchHousesFilters['polygon'] | undefined>();

  const [progress, setProgress] = useState<number>(0);
  const [progressText, setProgressText] = useState('');
  const [houses, setHouses] = useState<House[]>([]);

  const crawlHouses = useAsync(async () => {
    if (crawlHouses.loading) return [];
    if (!polygon) return [];
    console.log('Start Crawl...');
    return fetchHouses({
      ...filters,
      polygon,
    }, (p, t, c) => {
      console.log(`${t}: ${p}`, c.length);
      setProgress(p);
      setProgressText(t);
      setHouses(c);
    }).then(() => {
      setProgress(0);
      setProgressText('');
    });
  }, [filters, polygon]);

  return (
    <div className="h-svh w-svw relative">
      <div className="flex items-center justify-end backdrop-blur-sm backdrop-contrast-75 z-10 absolute bottom-2 left-1/2 -translate-x-1/2 w-xl mx-auto max-w-[calc(100svw-16px)] rounded-lg p-2 gap-2">
        <button
          onClick={() => {
            setPolygon(polygon ? undefined : highlightedPolygon);
          }}
          disabled={crawlHouses.loading}
          className="shrink btn btn-md btn-block btn-square btn-primary"
        >
          { polygon && progress ? (
            <div className="flex items-center flex-col justify-between grow gap-px h-full p-2 py-1">
              <label htmlFor="progress-bar" className="text-xs block">{progressText ? `${progressText}...` : ''}</label>
              <progress id="progress-bar" value={progress * 100} max="100" className="progress progress-primary w-full h-2" />
            </div>
          ) : polygon ? (
            <>
              <LuStepBack className="size-5" /> Reset
            </>
          ) : (
            <>
              <LuMagnet className="size-5" /> Crawl Divar
            </>
          )}
        </button>
        <button
          onClick={()=>document.querySelector<HTMLDialogElement>('#filters-dialog')!.showModal()}
          disabled={!!polygon}
          className="shrink-0 btn btn-md btn-square btn-soft"
        >
          <VscSettingsGear className="size-5" />
        </button>
        <button
          onClick={()=>document.querySelector<HTMLDialogElement>('#about-dialog')!.showModal()}
          className="shrink-0 btn btn-md btn-soft btn-square"
        >
          <VscInfo className="size-5" />
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

      <dialog id="about-dialog" className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-xl">Melk Map</h3>
          <h4 className="text-base italic mb-2 opacity-80">Real Estate Price Visualizer for All Iranian Cities</h4>
          <p className="text-sm mb-4">
            Melk Map is an <a href="https://github.com/nainemom/melk-map" target="_blank" className="link link-success">open-source</a> web app that crawls apartment listings from Divar.ir and visualizes real estate prices across all cities in Iran. Whether you're searching in Tehran, Mashhad, Isfahan, or smaller towns, Melk Map gives you a clear, data-driven view of the housing market.
          </p>
          <h3 className="font-bold text-lg mb-2">Map Legends</h3>
          { gradientStops.map((gradientStop) => (
            <div key={gradientStop.t} className="flex items-center gap-2 mb-2 text-sm">
              <div className="rounded-full size-3" style={{ background: `rgba(${gradientStop.color.join(',')})`}}/>
              <p className="">{gradientStop.title}</p>
            </div>
          ))}
          <div className="modal-action">
            <form method="dialog" className="w-full">
              <button className="btn btn-block btn-soft">Close</button>
            </form>
          </div>
        </div>
      </dialog>

      <HousesMap
        houses={houses ?? []}
        polygon={polygon}
        locked={!!polygon}
        onHighlightChange={setHighlightedPolygon}
      />
    </div>
  );
}
