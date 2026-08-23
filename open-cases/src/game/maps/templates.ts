/**
 * OPEN CASES - Map Templates
 * 
 * Predefined map templates for different scenario types.
 * Each template defines bounds, zoom levels, and center points.
 */

export type GameMapTemplate = 'small_town' | 'city_district' | 'industrial_zone' | 'countryside';

export interface MapTemplate {
  /** Template ID (e.g., "seattle_downtown", "small_town", "industrial_zone", "suburban") */
  id: string;
  /** Display name */
  name: string;
  /** Description of when to use this template */
  description: string;
  /** Minimum zoom level for the map */
  minZoom: number;
  /** Maximum zoom level for the map */
  maxZoom: number;
  /** Map bounds as [[southWestLat, southWestLng], [northEastLat, northEastLng]] */
  bounds: [[number, number], [number, number]];
  /** Center point [lat, lng] for initial view */
  center: [number, number];
  /** Default zoom level */
  defaultZoom: number;
  /** Stylized map template type */
  stylizedType?: GameMapTemplate;
  /** Optional: Path to custom background image for stylized map (relative to scenario folder) */
  backgroundImage?: string;
  /** Optional: Custom coordinates for locations on stylized map (x, y in pixels from top-left) */
  locationCoordinates?: Record<string, { x: number; y: number }>;
}

export const mapTemplates: MapTemplate[] = [
  {
    id: 'seattle_downtown',
    name: 'Центр Сиэтла',
    description: 'Городская карта среднего размера с плотной застройкой. Подходит для городских детективов.',
    minZoom: 13,
    maxZoom: 16,
    bounds: [[47.589, -122.340], [47.623, -122.296]],
    center: [47.6088, -122.313],
    defaultZoom: 14.2,
    stylizedType: 'city_district',
  },
  {
    id: 'small_town',
    name: 'Маленький город',
    description: 'Компактная карта небольшого города. Подходит для камерных историй.',
    minZoom: 12,
    maxZoom: 15,
    bounds: [[45.500, -122.700], [45.550, -122.600]],
    center: [45.525, -122.650],
    defaultZoom: 13.5,
    stylizedType: 'small_town',
  },
  {
    id: 'industrial_zone',
    name: 'Промышленная зона',
    description: 'Карта промышленного района со складами и фабриками.',
    minZoom: 13,
    maxZoom: 17,
    bounds: [[47.570, -122.350], [47.600, -122.300]],
    center: [47.585, -122.325],
    defaultZoom: 14.5,
    stylizedType: 'industrial_zone',
  },
  {
    id: 'countryside',
    name: 'Загородная местность',
    description: 'Карта сельской местности с полями, лесами и разбросанными поселениями.',
    minZoom: 11,
    maxZoom: 15,
    bounds: [[45.400, -122.800], [45.600, -122.500]],
    center: [45.500, -122.650],
    defaultZoom: 12.5,
    stylizedType: 'countryside',
  },
  {
    id: 'case_001_seattle',
    name: 'Сиэтл (Дело case-001)',
    description: 'Кастомная карта Сиэтла для дела \"Тишина на Мэдисон\". Использует заранее отрисованную карту.',
    minZoom: 12,
    maxZoom: 16,
    bounds: [[47.590, -122.340], [47.625, -122.300]],
    center: [47.608, -122.320],
    defaultZoom: 13.5,
    stylizedType: 'city_district',
    backgroundImage: 'map-bg.png',
    locationCoordinates: {
      'bennett_home': { x: 280, y: 120 },
      'lincoln_school': { x: 420, y: 80 },
      'rainier_lab': { x: 260, y: 180 },
      'madison_market': { x: 380, y: 150 },
      'reed_garage': { x: 400, y: 200 },
      'city_news': { x: 150, y: 220 },
      'northline_storage': { x: 320, y: 320 },
      'cross_tower': { x: 25, y: 55 },
      'abandoned_warehouse': { x: 30, y: 85 },
    },
  },
];

export function getMapTemplate(templateId: string): MapTemplate | undefined {
  return mapTemplates.find(t => t.id === templateId);
}

export function getMapTemplateIds(): string[] {
  return mapTemplates.map(t => t.id);
}

export function getStylizedTemplate(templateId: string): GameMapTemplate {
  const template = getMapTemplate(templateId);
  return template?.stylizedType || 'small_town';
}

export function getMapBackgroundImage(templateId: string): string | undefined {
  const template = getMapTemplate(templateId);
  return template?.backgroundImage;
}

export function getLocationCoordinates(templateId: string, locationId: string): { x: number; y: number } | undefined {
  const template = getMapTemplate(templateId);
  return template?.locationCoordinates?.[locationId];
}
