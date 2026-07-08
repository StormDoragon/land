// Global fixed-grid plot system.
//
// The world is divided into a grid of cells of CELL_SIZE degrees. Each cell is a
// plot, identified by integer indices (gridX, gridY) so cells are globally unique
// and never overlap. Only *sold* plots are stored in the DB; every other cell is
// computed on the fly, so we never enumerate the billions of possible cells.

export const CELL_SIZE = 0.001; // ~111m x ~111m near the equator — one "plot"
export const MIN_LAT = -90;
export const MAX_LAT = 90;
export const MIN_LNG = -180;
export const MAX_LNG = 180;

// Ownership tiers. A fresh plot starts at BASIC ($5); higher tiers unlock richer
// visibility. `color` drives how the plot renders on the map.
export type PlotTier = "BASIC" | "CITY" | "PREMIUM" | "FOUNDER" | "HOMEPAGE";

export interface TierInfo {
  id: PlotTier;
  label: string;
  price: number;
  color: string;
  blurb: string;
  perks: string[];
}

export const TIERS: Record<PlotTier, TierInfo> = {
  BASIC: {
    id: "BASIC",
    label: "Basic Plot",
    price: 5,
    color: "#67e8f9",
    blurb: "Your name on the public world map.",
    perks: ["Public name + country listing", "Shareable owner page", "Resell anytime"],
  },
  CITY: {
    id: "CITY",
    label: "City Plot",
    price: 15,
    color: "#34d399",
    blurb: "City placement with an owner card.",
    perks: ["City placement", "Owner card + social link", "Public message"],
  },
  PREMIUM: {
    id: "PREMIUM",
    label: "Premium Plot",
    price: 49,
    color: "#a78bfa",
    blurb: "Stand out with a logo and featured color.",
    perks: ["Logo / photo display", "Featured owner", "Premium map color"],
  },
  FOUNDER: {
    id: "FOUNDER",
    label: "Founder Plot",
    price: 99,
    color: "#f5c451",
    blurb: "Early-founder badge and priority visibility.",
    perks: ["Founder badge", "Priority visibility", "All Premium perks"],
  },
  HOMEPAGE: {
    id: "HOMEPAGE",
    label: "Homepage Asset",
    price: 199,
    color: "#f472b6",
    blurb: "Top-tier homepage & marketplace priority.",
    perks: ["Homepage visibility", "Marketplace priority", "All Founder perks"],
  },
};

export const TIER_ORDER: PlotTier[] = ["BASIC", "CITY", "PREMIUM", "FOUNDER", "HOMEPAGE"];

/** Lowest tier / default price for a fresh plot. */
export const BASE_PRICE = TIERS.BASIC.price;

export function isPlotTier(v: unknown): v is PlotTier {
  return typeof v === "string" && v in TIERS;
}

export function priceForTier(tier: PlotTier): number {
  return TIERS[tier].price;
}

export function tierColor(tier: PlotTier): string {
  return TIERS[tier].color;
}

/** Rank of a tier in the upgrade ladder (higher = more premium). */
export function tierRank(tier: PlotTier): number {
  return TIER_ORDER.indexOf(tier);
}

export interface CellBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface Cell {
  gridX: number;
  gridY: number;
  centerLat: number;
  centerLng: number;
  bounds: CellBounds;
}

/** Convert a lng into its grid column index. */
export function lngToGridX(lng: number): number {
  return Math.floor(lng / CELL_SIZE);
}

/** Convert a lat into its grid row index. */
export function latToGridY(lat: number): number {
  return Math.floor(lat / CELL_SIZE);
}

/** Snap an arbitrary (lat, lng) click to the cell that contains it. */
export function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= MIN_LAT &&
    lat <= MAX_LAT &&
    lng >= MIN_LNG &&
    lng <= MAX_LNG
  );
}

export function isValidGridCell(gridX: number, gridY: number): boolean {
  if (!Number.isInteger(gridX) || !Number.isInteger(gridY)) return false;
  const cell = cellFromIndices(gridX, gridY);
  return isValidLatLng(cell.centerLat, cell.centerLng);
}

export function cellFromLatLng(lat: number, lng: number): Cell {
  return cellFromIndices(lngToGridX(lng), latToGridY(lat));
}

/** Build a fully-derived Cell from its integer indices. */
export function cellFromIndices(gridX: number, gridY: number): Cell {
  const west = gridX * CELL_SIZE;
  const south = gridY * CELL_SIZE;
  const east = west + CELL_SIZE;
  const north = south + CELL_SIZE;
  return {
    gridX,
    gridY,
    centerLng: west + CELL_SIZE / 2,
    centerLat: south + CELL_SIZE / 2,
    bounds: { south, west, north, east },
  };
}

/** Leaflet-style polygon corners [ [lat,lng], ... ] for a cell. */
export function cellPolygon(gridX: number, gridY: number): [number, number][] {
  const { bounds } = cellFromIndices(gridX, gridY);
  return [
    [bounds.south, bounds.west],
    [bounds.south, bounds.east],
    [bounds.north, bounds.east],
    [bounds.north, bounds.west],
  ];
}

export function plotKey(gridX: number, gridY: number): string {
  return `${gridX}_${gridY}`;
}

/** Human-readable coordinate string for a cell center. */
export function formatCoords(lat: number, lng: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${ns}, ${Math.abs(lng).toFixed(4)}°${ew}`;
}

/** All grid indices whose cells intersect a bounding box, capped for safety. */
export function cellsInBounds(
  b: CellBounds,
  cap = 5000,
): { gridX: number; gridY: number }[] {
  const west = Math.max(MIN_LNG, Math.min(MAX_LNG, b.west));
  const east = Math.max(MIN_LNG, Math.min(MAX_LNG, b.east));
  const south = Math.max(MIN_LAT, Math.min(MAX_LAT, b.south));
  const north = Math.max(MIN_LAT, Math.min(MAX_LAT, b.north));
  const x0 = lngToGridX(Math.min(west, east));
  const x1 = lngToGridX(Math.max(west, east));
  const y0 = latToGridY(Math.min(south, north));
  const y1 = latToGridY(Math.max(south, north));
  const cells: { gridX: number; gridY: number }[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      cells.push({ gridX: x, gridY: y });
      if (cells.length >= cap) return cells;
    }
  }
  return cells;
}
