import { describe, it, expect } from 'vitest';
import { buildHeatmapLayer, heatmapPointsToGeoJSON } from './heatmap';
import { lngLatToPixel } from './crs';

const MAX_ZOOM = 8;

describe('heatmapPointsToGeoJSON', () => {
  it('projects pixel points to lng/lat round-trippably', () => {
    const fc = heatmapPointsToGeoJSON(
      [
        [100, 120],
        [2048, 4096],
      ],
      MAX_ZOOM,
    );
    expect(fc.features).toHaveLength(2);
    const [lng, lat] = fc.features[0].geometry.coordinates;
    const back = lngLatToPixel(lng, lat, MAX_ZOOM);
    expect(back.x).toBeCloseTo(100, 6);
    expect(back.y).toBeCloseTo(120, 6);
  });

  it('collapses repeated points into one weighted feature', () => {
    const fc = heatmapPointsToGeoJSON(
      [
        [100, 120],
        [2048, 4096],
        [100, 120],
        [100, 120],
      ],
      MAX_ZOOM,
    );
    expect(fc.features.map((f) => f.properties?.w)).toEqual([3, 1]);
  });

  it('returns an empty collection for no points', () => {
    expect(heatmapPointsToGeoJSON([], MAX_ZOOM).features).toHaveLength(0);
  });
});

describe('buildHeatmapLayer', () => {
  it('doubles the radius per zoom level between the stops', () => {
    const layer = buildHeatmapLayer(0, 4);
    const radius = (layer.paint as Record<string, unknown>)['heatmap-radius'];
    // [interpolate, [exponential, 2], [zoom], minZoom, rMin, maxZoom, rMax]
    expect(radius).toEqual([
      'interpolate',
      ['exponential', 2],
      ['zoom'],
      0,
      8, // 128 / 2^4
      4,
      128,
    ]);
  });

  it('floors the far-out radius so spots stay visible', () => {
    const layer = buildHeatmapLayer(0, 8);
    const radius = (layer.paint as Record<string, unknown>)[
      'heatmap-radius'
    ] as unknown[];
    expect(radius[4]).toBe(6); // not 128 / 2^8 = 0.5
  });

  it('weighs each feature by the points it stands for', () => {
    const layer = buildHeatmapLayer(0, 4);
    expect((layer.paint as Record<string, unknown>)['heatmap-weight']).toEqual([
      'get',
      'w',
    ]);
  });

  it('uses a constant radius when the map has a single zoom level', () => {
    const layer = buildHeatmapLayer(3, 3);
    expect((layer.paint as Record<string, unknown>)['heatmap-radius']).toBe(128);
  });
});
