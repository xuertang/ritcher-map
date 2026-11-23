import { apiGet, apiSend } from './client';
import type {
  MapResponse,
  CategoryResponse,
  HeatmapPointsResponse,
  RegionResponse,
} from '../types';

/**
 * A marker as the catalog stores it — unlike the tile-service viewport
 * response, this carries the description, so it powers search and the
 * marker-detail panel. camelCase wire (catalog /api/v1/*).
 */
export interface CatalogMarker {
  id: number;
  mapId: number;
  categoryId: number;
  x: number;
  y: number;
  title: string | null;
  description: string | null;
  /** Popularity: total player clicks. Optional until every catalog is on V8. */
  clickCount?: number;
}

// Catalog GETs are public at the gateway (writes stay behind auth), so none
// of these need a token.

export function getMapMeta(mapId: number): Promise<MapResponse> {
  return apiGet<MapResponse>(`/api/v1/maps/${mapId}`);
}

export function listMaps(): Promise<MapResponse[]> {
  return apiGet<MapResponse[]>('/api/v1/maps');
}

/**
 * Categories for a game (shared across all its maps). On error returns []
 * (panel empty, map still renders).
 */
export async function getCategories(
  gameSlug: string,
): Promise<CategoryResponse[]> {
  try {
    return await apiGet<CategoryResponse[]>(
      `/api/v1/games/${gameSlug}/categories`,
    );
  } catch {
    return [];
  }
}

/** Every marker on the map, descriptions included. Unpaginated by design. */
export function getMarkers(mapId: number): Promise<CatalogMarker[]> {
  return apiGet<CatalogMarker[]>(`/api/v1/maps/${mapId}/markers`);
}

/** Regions for a map. On error returns [] (panel empty, map still renders). */
export async function getRegions(mapId: number): Promise<RegionResponse[]> {
  try {
    return await apiGet<RegionResponse[]>(`/api/v1/maps/${mapId}/regions`);
  } catch {
    return [];
  }
}

/**
 * Popularity: count a player click on a marker (+1 server-side, public route).
 * Fire-and-forget — a lost click must never break the map, so errors are
 * swallowed here and callers don't await it.
 */
export function registerMarkerClick(markerId: number): void {
  apiSend<void>('POST', `/api/v1/markers/${markerId}/click`).catch(() => {});
}

/** Ids per points request — under the catalog's per-request cap (200). */
const HEATMAP_POINTS_CHUNK = 100;

/**
 * Points of the given heatmap categories, loaded when they're switched on (the
 * page only ships names + counts). Chunked under the server's per-request id
 * cap; ids the map doesn't own are simply absent from the result.
 */
export async function getHeatmapPoints(
  mapId: number,
  categoryIds: number[],
): Promise<HeatmapPointsResponse[]> {
  const chunks: number[][] = [];
  for (let i = 0; i < categoryIds.length; i += HEATMAP_POINTS_CHUNK) {
    chunks.push(categoryIds.slice(i, i + HEATMAP_POINTS_CHUNK));
  }
  const parts = await Promise.all(
    chunks.map((ids) =>
      apiGet<HeatmapPointsResponse[]>(
        `/api/v1/maps/${mapId}/heatmaps/points?ids=${ids.join(',')}`,
      ),
    ),
  );
  return parts.flat();
}
