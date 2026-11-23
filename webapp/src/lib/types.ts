// Wire types. Field names are EXACT per the gateway contract:
//   - tile-service (markers) + progress + accounts: snake_case
//   - catalog (/api/v1/...): camelCase

/**
 * Pixel-space bounding box: [minX, minY, maxX, maxY]; requires max > min.
 * Retained for the pixel/geo CRS helpers (`viewportToPixelBbox`); the webapp
 * now loads all markers up front and clusters them client-side rather than
 * fetching per-viewport.
 */
export type Bbox = [minX: number, minY: number, maxX: number, maxY: number];

// ----------------------------------------------------------------------------
// catalog: /api/v1/maps, /api/v1/maps/{id}, /api/v1/games/{gameSlug}/categories
//   (camelCase)
// ----------------------------------------------------------------------------

export type MapStatus = 'DRAFT' | 'UPLOADED' | 'TILING' | 'READY' | 'FAILED';

export interface MapResponse {
  id: number;
  gameSlug: string;
  mapSlug: string;
  name: string;
  prefix: string;
  status: MapStatus;
  width: number | null;
  height: number | null;
  maxZoom: number | null;
  /** Lowest zoom the viewer exposes; defaults to 0. */
  minZoom: number;
  /** Display order within the game (ascending; ties broken by name). */
  sortOrder: number;
  tileSize: number;
  format: string;
  createdAt: string;
  updatedAt: string;
  /**
   * Total marker clicks on this map (powers the Popular sort). Optional until
   * every catalog deploy sends it; write-path echoes report 0.
   */
  popularity?: number;
}

/** Per-game branding (catalog /api/v1/games). All branding fields nullable. */
export interface GameResponse {
  id: number;
  slug: string;
  title: string;
  primaryColor: string | null;
  accentColor: string | null;
  fontFamily: string | null;
  fontUrl: string | null;
  logoUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryResponse {
  id: number;
  /** Categories are game-scoped — shared across every map of the game. */
  gameSlug: string;
  parentId: number | null;
  slug: string;
  name: string;
  icon: string | null;
  sortOrder: number;
  /**
   * Trackable (the default) categories render on the map by default and their
   * markers count toward discovery progress. A non-trackable category is an
   * informational overlay: hidden by default and excluded from progress.
   */
  trackable: boolean;
}

/** A named polygonal area of a map (catalog /api/v1/maps/{id}/regions). */
export interface RegionResponse {
  id: number;
  mapId: number;
  name: string;
  sortOrder: number;
  /** Exterior ring as [x, y] pixel-space pairs (auto-closed). */
  polygon: [number, number][];
  /** [minX, minY, maxX, maxY] in pixel space — used to fit the camera. */
  bbox: Bbox;
}

/** One toggleable heatmap within a group (e.g. a Pal's spawn points). */
export interface HeatmapCategoryResponse {
  id: number;
  groupId: number;
  name: string;
  sortOrder: number;
  /**
   * How many points the heatmap holds. Present when the list was fetched with
   * `points=false` (the viewer's default), where `points` comes back empty.
   */
  pointCount?: number;
  /**
   * [x, y] pixel-space pairs, rendered as a density layer when toggled on; a
   * repeated pair weighs once per repeat. Empty in the `points=false` listing —
   * the viewer then loads them per category (see `getHeatmapPoints`).
   */
  points: [number, number][];
}

/** One heatmap category's points (catalog /maps/{id}/heatmaps/points). */
export interface HeatmapPointsResponse {
  id: number;
  points: [number, number][];
}

/** A sidebar section of heatmaps (catalog /api/v1/maps/{id}/heatmaps). */
export interface HeatmapGroupResponse {
  id: number;
  mapId: number;
  name: string;
  /** Sidebar accent as #RRGGBB; null when unset. */
  color: string | null;
  sortOrder: number;
  categories: HeatmapCategoryResponse[];
}

// ----------------------------------------------------------------------------
// progress: gateway-local, STRING ids on the wire (converted in src/api/progress.ts)
// ----------------------------------------------------------------------------

export interface ProgressGetResponse {
  map_id: string;
  found: string[];
  count: number;
}

export interface ProgressUpdateRequest {
  marker_id: string;
  found: boolean;
}

// ----------------------------------------------------------------------------
// accounts: /auth/*, /account/me  (snake_case)
// ----------------------------------------------------------------------------

export interface AccountUser {
  id: string;
  email: string;
  /** CMS operator (users.admin). Gates catalog writes at the gateway. */
  admin: boolean;
}

export interface AuthResponse {
  token: string;
  user: AccountUser;
}

export interface MeResponse {
  id: string;
  email: string;
  admin: boolean;
}

// ----------------------------------------------------------------------------
// websocket: server -> client only
// ----------------------------------------------------------------------------

export interface ProgressSyncMessage {
  type: 'progress';
  map_id: string;
  marker_id: string;
  found: boolean;
}
