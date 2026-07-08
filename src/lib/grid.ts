// Global fixed-grid plot system.
//
// The world is divided into a grid of cells of CELL_SIZE degrees. Each cell is a
// plot, identified by integer indices (gridX, gridY) so cells are globally unique
// and never overlap. Only *sold* plots are stored in the DB; every other cell is
// computed on the fly, so we never enumerate the billions of possible cells.

export const CELL_SIZE = 0.001; // ~111m x ~111m near the equator — one "plot"
export const BASE_PRICE = 5; // USD — starting price for a fresh plot

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
  const x0 = lngToGridX(b.west);
  const x1 = lngToGridX(b.east);
  const y0 = latToGridY(b.south);
  const y1 = latToGridY(b.north);
  const cells: { gridX: number; gridY: number }[] = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      cells.push({ gridX: x, gridY: y });
      if (cells.length >= cap) return cells;
    }
  }
  return cells;
}
