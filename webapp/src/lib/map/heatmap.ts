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

/**
 * Heatmap points as a MapLibre FeatureCollection (coords projected to lng/lat).
 * Points sharing a position collapse into ONE feature whose `w` is how many
 * there were — the layer weighs by `w`, so density is unchanged while a big
 * heatmap (tens of thousands of points on a coarse grid) stays light to index.
 */
export function heatmapPointsToGeoJSON(
  points: [number, number][],
  maxZoom: number,
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const weights = new Map<string, { x: number; y: number; w: number }>();
  for (const [x, y] of points) {
    const key = `${x},${y}`;
    const cell = weights.get(key);
    if (cell) cell.w += 1;
    else weights.set(key, { x, y, w: 1 });
  }
  const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
  for (const { x, y, w } of weights.values()) {
    const { lng, lat } = pixelToLngLat(x, y, maxZoom);
    features.push({
      type: 'Feature',
      properties: { w },
      geometry: { type: 'Point', coordinates: [lng, lat] },
    });
  }
  return { type: 'FeatureCollection', features };
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
      // Each feature counts for as many points as it stands for (see above).
      'heatmap-weight': ['get', 'w'],
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
