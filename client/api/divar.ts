import { toEnglishDigits } from "@/utils/format";
import { ofetch } from "ofetch";

const CITY = '1'; // Tehran city ID

const httpClient = ofetch.create({
  baseURL: 'https://api.divar.ir',
  retryDelay: 30000,
  retry: 5,
  retryStatusCodes: [429, 500],
  responseType: 'json',
  headers: {
    'Content-Type': 'application/json',
  },
})

export type House = {
  location: { lat: number, lng: number } | null,
  size: number | null,
  beds: number | null,
  totalPrice: number | null,
  unitPrice: number | null,
  elevator: boolean | null,
  storage: boolean | null,
  parking: boolean | null,
  balcony: boolean | null,
  yearBuilt: number | null,
}
export const getHouse = (id: string): Promise<House> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return httpClient(`/v8/posts-v2/web/${id}`).then((resp: any) => {
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

    return {
      location: typeof fields.location?.latitude === 'number' && typeof fields.location?.longitude === 'number' ? { lat: fields.location?.latitude, lng: fields.location.longitude } : null,
      size: typeof fields['متراژ'] === 'string' && fields['متراژ'].trim() !== '' ? +fields['متراژ'] : null,
      beds: typeof fields['اتاق'] === 'string' && fields['اتاق'].trim() !== '' ? +fields['اتاق'] : null,
      // floor: typeof fields['طبقه'] === 'string' && fields['طبقه'].trim() !== '' ? fields['طبقه'].split(' ').filter(x=>!!x).map(x => +x) as [number, number] | [number] : null,
      totalPrice: typeof fields['قیمت کل'] === 'string' && fields['قیمت کل'].trim() !== '' ? +fields['قیمت کل'] : null,
      unitPrice: typeof fields['قیمت هر متر'] === 'string' && fields['قیمت هر متر'].trim() !== '' ? +fields['قیمت هر متر'] : null,
      elevator: 'آسانسور ندارد' in fields || fields['آسانسور'] === false ? false : fields['آسانسور'] === true ? true : null,
      storage: 'انباری ندارد' in fields || fields['انباری'] === false ? false : fields['انباری'] === true ? true : null,
      parking: 'پارکینگ ندارد' in fields || fields['پارکینگ'] === false ? false : fields['پارکینگ'] === true ? true : null,
      balcony: 'بالکن ندارد' in fields || fields['بالکن'] === false ? false : fields['بالکن'] === true ? true : null,
      yearBuilt: typeof fields['ساخت'] === 'string' && fields['ساخت'] !== '' ? +fields['ساخت'] : null,
    };
  });
}


export type District = {
  title: string,
  value: string,
  hint: string,
  keywords: string[],
}

export const getDistricts = (): Promise<District[]> => {
  return httpClient(
    "/v8/postlist/w/filters",
    {
      method: 'POST',
      body: {
        city_ids: [CITY],
        source_view: "FILTER",
        data: {},
      },
    }
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .then((resp: any) => {
    let returnValue: District[] = [];
    for (const widget of (resp?.page?.widget_list ?? [])) {
      for (const subWidget of (widget?.data?.widget_list ?? [])) {
        for (const district of (subWidget?.data?.neighborhoods?.options ?? [])) {
          returnValue = [
            ...returnValue,
            {
              title: district.title as string,
              value: district.value as string,
              hint: district.hint as string,
              keywords: district.search_keywords.split('،').map((x: string) => x.trim())
            },
          ];
        }
      }
    }
    return returnValue;
  });
}

export type SearchHousesFilters = {
  district?: string[];
  elevator?: boolean;
  parking?: boolean;
  balcony?: boolean;
  size?: [number, number];
  price?: [number, number];
}

export const getHousesIds = (filters: SearchHousesFilters): Promise<string[]> => {
  return httpClient("/v8/postlist/w/search", {
    method: 'POST',
    body: {
      city_ids: [CITY],
      source_view: 'FILTER',
      disable_recommendation: false,
      search_data: {
        form_data: {
          data: {
            // bbox: {
            //   repeated_float: {
            //     value: [
            //       { value: 51.4265289 },
            //       { value: 35.7938423 },
            //       { value: 51.4346771 },
            //       { value: 35.8068733 },
            //     ],
            //   },
            // },
            deed_type: { repeated_string: { value: ['single_page'] } },
            category: { str: { value: "apartment-sell" } },
            ...(typeof filters.district !== 'undefined' && {
              districts: { repeated_string: { value: filters.district } },
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
          },
        },
      },
    },
  })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .then((resp: any) => {
      let returnValue: string[] = [];
      for (const widget of (resp?.list_widgets ?? [])) {
        if (widget?.widget_type !== 'POST_ROW' || !widget?.data?.middle_description_text?.includes('تومان') || !widget?.data?.token) continue;
        returnValue = [...returnValue, widget.data.token];
      }
      return returnValue;
    });
}


export const getHouses = async (filters: SearchHousesFilters, progressFn?: (value: number, lastValue: House[]) => void): Promise<House[]> => {
    let returnValue: House[] = [];
    let currentProgress = 0;
    const progress = (value: number) => {
      currentProgress = value;
      progressFn?.(currentProgress, returnValue);
    }
    progress(0);
    const districts = await getDistricts();
    
    let passedDistricts = 0;
    for (const district of districts) {
      progress(passedDistricts / districts.length);
      const districtHouseIds = await getHousesIds({
        ...filters,
        district: [district.value],
      });


      for (const houseId of districtHouseIds) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        returnValue = [...returnValue, await getHouse(houseId)];
        progress((passedDistricts + (districtHouseIds.indexOf(houseId) / districtHouseIds.length)) / districts.length);
      }

      passedDistricts += 1;
    }
    progress(1);
    return returnValue;
}