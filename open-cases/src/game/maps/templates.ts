/**
 * OPEN CASES - Map Templates
 * 
 * Predefined map templates for different scenario types.
 * Each template defines bounds, zoom levels, and center points.
 */

import type { MapTemplate } from './schema';

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
  },
  {
    id: 'suburban',
    name: 'Пригород',
    description: 'Карта пригородного района с частными домами и торговыми центрами.',
    minZoom: 12,
    maxZoom: 16,
    bounds: [[47.650, -122.400], [47.700, -122.320]],
    center: [47.675, -122.360],
    defaultZoom: 13.8,
  },
];

export function getMapTemplate(templateId: string): MapTemplate | undefined {
  return mapTemplates.find(t => t.id === templateId);
}

export function getMapTemplateIds(): string[] {
  return mapTemplates.map(t => t.id);
}
