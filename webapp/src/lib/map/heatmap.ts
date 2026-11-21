// Heatmap overlay: the union of the active heatmap categories' points rendered
// as a MapLibre density layer beneath the markers. Pixel-space points are
// projected to lng/lat (same CRS as markers) for the geojson source.

import type { LayerSpecification } from 'maplibre-gl';
import { pixelToLngLat } from './crs';

export const HEATMAP_SOURCE_ID = 'rm-heatmap';
export const HEATMAP_LAYER_ID = 'rm-heatmap-layer';

/** Blob radius (px) at the map's native max zoom. */
const RADIUS_AT_MAX_ZOOM = 128;
/** Radius floor so far-out zooms keep visible heat spots. */
const RADIUS_MIN = 6;

/** Heatmap points as a MapLibre FeatureCollection (coords projected to lng/lat). */
export function heatmapPointsToGeoJSON(
  points: [number, number][],
  maxZoom: number,
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: points.map(([x, y]) => {
      const { lng, lat } = pixelToLngLat(x, y, maxZoom);
      return {
        type: 'Feature' as const,
        properties: {},
        geometry: { type: 'Point' as const, coordinates: [lng, lat] },
      };
    }),
  };
}

/**
 * Density layer over the heatmap source. The radius doubles per zoom level
 * (exponential base-2 interpolation between the stops), so a heat blob covers a
 * roughly constant area of the game map instead of a constant screen area —
 * zooming in expands spawn zones the way MapGenie's heatmaps do. The far-out
 * stop is floored at RADIUS_MIN so spots stay visible fully zoomed out.
 */
export function buildHeatmapLayer(
  minZoom: number,
  maxZoom: number,
): LayerSpecification {
  const span = Math.max(0, maxZoom - minZoom);
  const radiusAtMin = Math.max(RADIUS_MIN, RADIUS_AT_MAX_ZOOM / 2 ** span);
  return {
    id: HEATMAP_LAYER_ID,
    type: 'heatmap',
    source: HEATMAP_SOURCE_ID,
    paint: {
      'heatmap-weight': 1,
      'heatmap-intensity': 1,
      'heatmap-radius':
        span === 0
          ? RADIUS_AT_MAX_ZOOM
          : [
              'interpolate',
              ['exponential', 2],
              ['zoom'],
              minZoom,
              radiusAtMin,
              maxZoom,
              RADIUS_AT_MAX_ZOOM,
            ],
      // Classic transparent -> blue -> cyan -> lime -> yellow -> red ramp.
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(0, 0, 255, 0)',
        0.1,
        '#4169e1',
        0.3,
        '#00ffff',
        0.5,
        '#00ff00',
        0.7,
        '#ffff00',
        1,
        '#ff0000',
      ],
      'heatmap-opacity': 0.75,
    },
  };
}
