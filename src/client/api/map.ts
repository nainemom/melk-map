export type MapStyle = {
  name: string,
  value: string,
};

export const getMapStyles = (): Promise<MapStyle[]> => Promise.resolve([
  {
    name: 'OpenStreetMap',
    value: 'https://raw.githubusercontent.com/go2garret/maps/main/src/assets/json/openStreetMap.json',
  },
  {
    name: 'ArcGIS Hybrid',
    value: 'https://raw.githubusercontent.com/go2garret/maps/main/src/assets/json/arcgis_hybrid.json',
  },
  {
    name: 'CartoCDN Dark Matter',
    value: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
  {
    name: 'CartoCDN Dark Matter No Labels',
    value: 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json',
  },
  {
    name: 'CartoCDN Positron',
    value: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  },
  {
    name: 'CartoCDN Positron No Labels',
    value: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
  },
  {
    name: 'CartoCDN Voyager',
    value: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  },
  {
    name: 'CartoCDN Voyager No Labels',
    value: 'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json',
  },
  {
    name: 'ICGC Main',
    value: 'https://geoserveis.icgc.cat/contextmaps/icgc.json',
  },
  {
    name: 'ICGC Dark Base Map',
    value: 'https://geoserveis.icgc.cat/contextmaps/icgc_mapa_base_fosc.json',
  },
  {
    name: 'ICGC Shadow Hypsometry Contours',
    value: 'https://geoserveis.icgc.cat/contextmaps/icgc_ombra_hipsometria_corbes.json',
  },
  {
    name: 'ICGC Dark Shadow',
    value: 'https://geoserveis.icgc.cat/contextmaps/icgc_ombra_fosca.json',
  },
  {
    name: 'ICGC Standard Orthophoto',
    value: 'https://geoserveis.icgc.cat/contextmaps/icgc_orto_estandard.json',
  },
  {
    name: 'ICGC Standard Orthophoto Gray',
    value: 'https://geoserveis.icgc.cat/contextmaps/icgc_orto_estandard_gris.json',
  },
  {
    name: 'ICGC Hybrid Orthophoto',
    value: 'https://geoserveis.icgc.cat/contextmaps/icgc_orto_hibrida.json',
  },
  {
    name: 'ICGC Geological Risks',
    value: 'https://geoserveis.icgc.cat/contextmaps/icgc_geologic_riscos.json',
  },
]);