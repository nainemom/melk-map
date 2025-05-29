/* eslint-disable @typescript-eslint/no-explicit-any */
import { toEnglishDigits } from "@/shared/utils/format";
import { generateGridOverPolygon, type BoundingBox } from "@/shared/utils/geo";
import { ofetch } from "ofetch";

const divarApi = <T = any>(pathname: string, body?: unknown) => ofetch<T>(pathname, {
  baseURL: '/divar',
  retryDelay: 30000,
  retry: 5,
  retryStatusCodes: [429, 500],
  responseType: 'json',
  headers: {
    'Content-Type': 'application/json',
  },
  cache: 'force-cache',
  query: {
    payload: btoa(JSON.stringify({
      body,
      method: typeof body === 'undefined' ? 'GET' : 'POST',
    })),
  }
});

export type ProgressFn<T> = (value: number, title: string, lastData: T) => void;

export type House = {
  token: string,
  location: {
    lat: number,
    lng: number,
  },
  size: number,
  price: number, // per meter
};

export type FetchHousesFilters = {
  elevator?: boolean;
  parking?: boolean;
  balcony?: boolean;
  size?: [number, number];
  price?: [number, number];
  advertizer?: 'person' | 'business'
  polygon: GeoJSON.Polygon | GeoJSON.MultiPolygon,
}

export const fetchHouses = async (filters: FetchHousesFilters, progressFn?: ProgressFn<House[]>): Promise<House[]> => {
  let returnValue: House[] = [];

  const fetchArea = async (bbox: BoundingBox) => {
    const viewport = await divarApi('/v8/mapview/viewport', {
      search_data: {
        form_data: {
          data: {
            map_free_roaming: { boolean: { value: true } },
            category: { str: { value: "apartment-sell" } },
            ...(typeof filters.advertizer !== 'undefined' && {
              'business-type': { str: { value: filters.advertizer === 'business' ? 'real-estate-business' : 'personal' } },
            }),
            ...(typeof filters.elevator !== 'undefined' && {
              elevator: { boolean: { value: filters.elevator } },
            }),
            ...(typeof filters.parking !== 'undefined' && {
              parking: { boolean: { value: filters.parking } },
            }),
            ...(typeof filters.balcony !== 'undefined' && {
              balcony: { boolean: { value: filters.balcony } },
            }),
            ...(typeof filters.size !== 'undefined' && {
              size: {number_range: { minimum: filters.size[0], maximum: filters.size[1] }},
            }),
            ...(typeof filters.price !== 'undefined' && {
              price: {number_range: { minimum: filters.price[0], maximum: filters.price[1] }},
            }),
          }
        }
      },
      camera_info: {
        bbox: {
          min_latitude: bbox.minLat,
          min_longitude: bbox.minLng,
          max_latitude: bbox.maxLat,
          max_longitude: bbox.maxLng,
        },
        zoom: 99,
      }
    });

    const hasClusters = ((viewport?.clusters ?? []).length ?? 0) > 1;
    

    if (hasClusters) {
      throw new Error('Large grid size!');
    }
  
    for (const post of (viewport?.posts ?? [])) {
      const lat = post?.map_pin_feature?.lat;
      const lng = post?.map_pin_feature?.lon;
      if (typeof lat !== 'number' || typeof lng !== 'number') continue;
  
      const size = +toEnglishDigits((post?.map_pin_feature?.properties?.properties?.chips ?? []).find((x: any) => x?.title?.includes('متر'))?.title ?? '').replace(/[^\d\s]/g, '');
      if (Number.isNaN(size)) continue;
  
  
      const price = +toEnglishDigits(post?.map_pin_feature?.properties?.properties?.subtitle2 ?? '').replace(/[^\d\s]/g, '');
      if (Number.isNaN(price)) continue;
  
      const token = post?.map_pin_feature?.properties?.properties?.token;
      if (typeof token !== 'string') continue;
      if (returnValue.some(x => x.token === token)) continue;

      returnValue = [
        ...returnValue,
        {
          token,
          price,
          size,
          location: {
            lat,
            lng,
          },
        }
      ]
    }
  }

  const bboxes = generateGridOverPolygon(filters.polygon, 0.8);

  progressFn?.(0, 'Start fetching...', returnValue);

  let currentBboxNum = 1;
  for (const bbpx of bboxes) {
    progressFn?.(currentBboxNum / bboxes.length, `Fetching ${currentBboxNum}/${bboxes.length} bounding boxes...`, returnValue);
    await fetchArea(bbpx);
    currentBboxNum += 1;
  }

  return returnValue;
}