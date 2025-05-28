import { toEnglishDigits } from "@/shared/utils/format";
import { randomBetween } from "@/shared/utils/number";
import { ofetch } from "ofetch";

const httpClient = ofetch.create({
  baseURL: '/divar',
  retryDelay: 30000,
  retry: 5,
  retryStatusCodes: [429, 500],
  responseType: 'json',
  headers: {
    'Content-Type': 'application/json',
  },
  cache: 'force-cache',
})

export type ProgressFunction<T> = (value: number, max: number, title: string, lastValue: T) => void;

export type City = {
  name: string,
  id: string,
}

export const getCities = async (): Promise<City[]> => {
  // https://api.divar.ir/v8/search-bookmark/web/get-search-bar-empty-state
  const response = await ofetch('./divar_cities.json' , {
    baseURL: window.location.origin + window.location.pathname,
    responseType: 'json',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return response.map((row: any) => ({
    id: row.city_id,
    name: row.city_slug.split('-').map((x: string) => `${x[0].toUpperCase()}${x.slice(1)}`).join(' '),
  }) satisfies City);
}

export type House = {
  token: string,
  location: {
    lat: number,
    lng: number,
    exact: boolean,
  },
  size: number,
  price: number, // per meter
};

export const getHouse = (token: string): Promise<House> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return httpClient(`/v8/posts-v2/web/${token}`).then((resp: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fields: Record<string, any> = {};

    for (const section of (resp?.sections ?? [])) {
      for (const widget of (section?.widgets ?? [])) {
        const widgetType = widget?.widget_type;
        if (widgetType === 'GROUP_INFO_ROW' || widgetType === 'GROUP_FEATURE_ROW' || widgetType === 'UNEXPANDABLE_ROW') {
          for (const item of (widget?.data?.items ?? [widget?.data])) {
            if (item?.title) {
              fields = {
                ...fields,
                [item.title]: item.available ?? toEnglishDigits(item.value).replace(/[^\d\s]/g, ''),
              };
            }
          }
        }
        if (widgetType === 'MAP_ROW' && (widget?.data?.location?.fuzzy_data?.point || widget?.data?.location?.exact_data?.point)) {
            fields = {
              ...fields,
              location: widget.data.location.exact_data?.point ?? widget.data.location.fuzzy_data?.point,
            };
        }
      }
    }
    if (typeof fields.location?.latitude !== 'number' || typeof fields.location?.longitude !== 'number' || typeof fields['متراژ'] !== 'string' || fields['متراژ'] === '' || typeof fields['قیمت هر متر'] !== 'string' || fields['قیمت هر متر'].trim() === '') throw new Error('cannot parse');
    return {
      token,
      location: { lat: fields.location?.latitude, lng: fields.location.longitude, exact: true },
      size: +fields['متراژ'],
      price: +fields['قیمت هر متر'],
    };
  });
}


export type District = {
  title: string,
  value: string,
  hint: string,
  keywords: string[],
  cityId: string,
  boundingBox: {
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
  },
}

export const getDistricts = async (cityId: string, progressFn?: ProgressFunction<District[]>): Promise<District[]> => {
  let returnValue: District[] = [];
  const progress = (value: number, max: number, title: string) => {
    progressFn?.(value, max, title, returnValue);
  }

  progress(0, 1, 'Fetching Districts');

  const districtsWithoutBbox: Omit<District, 'boundingBox'>[] = await httpClient(
    "/v8/postlist/w/filters",
    {
      query: {
        payload: btoa(JSON.stringify({
          method: 'POST',
          body: {
            city_ids: [cityId],
            source_view: "FILTER",
            data: {},
          },
        }))
      }
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ).then((resp: any) => {
    let ret: Omit<District, 'boundingBox'>[] = [];
    for (const widget of (resp?.page?.widget_list ?? [])) {
      if (widget?.widget_type !== 'I_NEIGHBORHOOD_ROW') continue;
      for (const district of (widget?.data?.neighborhoods?.options ?? [])) {
        ret = [
          ...ret,
          {
            title: district.title as string,
            value: district.value as string,
            hint: district.hint as string,
            keywords: district.search_keywords.split('،').map((x: string) => x.trim()),
            cityId,
          },
        ];
      }
    }
    return ret;
  });

  let fetchedDistricts = 0;
  for (const districtWithoutBbox of districtsWithoutBbox) {
    progress(fetchedDistricts + 1, districtsWithoutBbox.length + 1, 'Fetching Districts Approximate Bounding Box');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchResult = await httpClient<any>("/v8/postlist/w/search", {
      query: {
        payload: btoa(JSON.stringify({
          method: 'POST',
          body: {
            city_ids: [cityId],
            source_view: "FILTER",
            search_data: {
              form_data: {
                data: {
                  category: { str: { value: "apartment-sell" } },
                  districts: { repeated_string: { value: [districtWithoutBbox.value] } },
                }
              }
            },
          },
        }))
      }
    });
    const bbox = searchResult?.map_data?.state?.camera_info?.bbox;
    if (!bbox || typeof bbox !== 'object' || typeof bbox.min_latitude !== 'number'|| typeof bbox.max_latitude !== 'number'|| typeof bbox.min_longitude !== 'number'|| typeof bbox.max_longitude !== 'number') throw new Error('unexpected error');
    returnValue = [
      ...returnValue,
      {
        boundingBox: {
          minLat: bbox.min_latitude!,
          maxLat: bbox.max_latitude!,
          minLng: bbox.min_longitude!,
          maxLng: bbox.max_longitude!,
        },
        ...districtWithoutBbox,
      }
    ];
    fetchedDistricts+=1;
  }

  return returnValue;
  
}

export type GetDistrictHousesFilters = {
  district: District;
  elevator?: boolean;
  parking?: boolean;
  balcony?: boolean;
  size?: [number, number];
  price?: [number, number];
}

export const getDistrictHouses = async (filters: GetDistrictHousesFilters): Promise<House[]> => {
  let returnValue: House[] = [];

  const apiFilters = {
    category: { str: { value: "apartment-sell" } },
    districts: { repeated_string: { value: filters.district.value } },
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
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchResult = await httpClient<any>("/v8/postlist/w/search", {
    query: {
      payload: btoa(JSON.stringify({
        method: 'POST',
        body: {
          source_view: 'FILTER',
          city_ids: [filters.district.cityId],
          disable_recommendation: true,
          search_data: {
            form_data: {
              data: apiFilters,
            },
          },
        },
      })),
    }
  });
  const widgets = (searchResult?.list_widgets ?? []);
  
  for (const widget of widgets) {
    if (widget?.widget_type !== 'POST_ROW') continue;
    const token = widget?.data?.token;
    const title = widget?.data?.title; // "اپارتمان 105 متری موقعیت برای خانه اولی ها"
    const description = widget?.data?.middle_description_text; // "۴۹۰,۰۰۰,۰۰۰ تومان"

    if (!token || typeof token !== 'string' || !title || typeof title !== 'string' || !title.includes('متر') || !description || typeof description !== 'string' || !description.includes('تومان')) continue;

    const size = +toEnglishDigits(title).replace(/.*?(\d+(?:[.,]\d+)?)\s*متر.*/s, "$1");
    if (isNaN(size)) continue;

    const totalPrice = +toEnglishDigits(description).replace(/[^\d\s]/g, '');
    if (isNaN(totalPrice)) continue;

    returnValue = [...returnValue, {
      token,
      size,
      price: totalPrice / size,
      location: {
        lat: randomBetween(filters.district.boundingBox.minLat, filters.district.boundingBox.maxLat),
        lng: randomBetween(filters.district.boundingBox.minLng, filters.district.boundingBox.maxLng),
        exact: false,
      },
    }];
  }
  return returnValue;
}

export type GetAllHousesFilters = Omit<GetDistrictHousesFilters, 'district'> & {
  cityId: string,
  exact: boolean;
};

export const getAllCityHouses = async (filters: GetAllHousesFilters, progressFn?: ProgressFunction<House[]>): Promise<House[]> => {
  let returnValue: House[] = [];
  const progress = (value: number, max: number, title: string) => {
    progressFn?.(value, max, title, returnValue);
  }
  progress(0, 1, '');

  const totalSteps = filters.exact ? 3 : 2;

  // Step 1: prepare
  const districts = await getDistricts(filters.cityId, (a, b, t) => {
    progress((a / b), totalSteps, t);
  });

  // Step 2: fetch
  let passedDistricts = 0;
  for (const district of districts) {
    progress((passedDistricts / districts.length) + 1, totalSteps, 'Fetching Districts Houses');
    const districtHouses = await getDistrictHouses({
      ...filters,
      district,
    });
    returnValue = [...returnValue, ...districtHouses];

    passedDistricts+=1;
  }

  if (filters.exact) {
    // Step 3: verify
    let passedHouses = 0;
    const approximateHouses = [...returnValue];
    for (const approximateHouse of approximateHouses) {
      progress((passedHouses / approximateHouses.length) + 2, totalSteps, 'Verifying Houses Data');
      try {
        const validatedHouse = await getHouse(approximateHouse.token);
        returnValue = [
          ...returnValue.filter(x => x !== approximateHouse),
          validatedHouse,
        ];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_e) {
        continue;
      }
      passedHouses += 1;
      await new Promise((r) => setTimeout(r, 1100));
    }
  }
  return returnValue;
}