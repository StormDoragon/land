"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Rectangle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import {
  CELL_SIZE,
  cellFromIndices,
  cellsInBounds,
  latToGridY,
  lngToGridX,
  type CellBounds,
} from "@/lib/grid";

export interface SoldPlot {
  id: string;
  gridX: number;
  gridY: number;
  centerLat: number;
  centerLng: number;
  color: string;
  name: string | null;
  ownerName: string;
  forSalePrice: number | null;
}

export interface SelectedCell {
  gridX: number;
  gridY: number;
}

/** A location the map should fly to. `nonce` forces a re-fly to the same spot. */
export interface FlyTarget {
  lat: number;
  lng: number;
  zoom?: number;
  nonce: number;
}

function rectFor(gridX: number, gridY: number): LatLngBoundsExpression {
  const c = cellFromIndices(gridX, gridY);
  return [
    [c.bounds.south, c.bounds.west],
    [c.bounds.north, c.bounds.east],
  ];
}

const GRID_ZOOM = 15;

function MapEvents({
  onSelect,
  onBoundsChange,
}: {
  onSelect: (cell: SelectedCell) => void;
  onBoundsChange: (bounds: CellBounds, zoom: number) => void;
}) {
  const map = useMapEvents({
    click(e) {
      onSelect({
        gridX: lngToGridX(e.latlng.lng),
        gridY: latToGridY(e.latlng.lat),
      });
    },
    moveend() {
      const b = map.getBounds();
      onBoundsChange(
        {
          south: b.getSouth(),
          west: b.getWest(),
          north: b.getNorth(),
          east: b.getEast(),
        },
        map.getZoom(),
      );
    },
  });
  return null;
}

/** Flies the map to a search result whenever a new target arrives. */
function FlyController({ target }: { target: FlyTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], target.zoom ?? 16, { duration: 1.2 });
  }, [map, target]);
  return null;
}

/** Faint grid overlay, only drawn when zoomed in enough to pick individual plots. */
function GridOverlay({ bounds, zoom }: { bounds: CellBounds | null; zoom: number }) {
  const cells = useMemo(() => {
    if (!bounds || zoom < GRID_ZOOM) return [];
    return cellsInBounds(bounds, 1500);
  }, [bounds, zoom]);

  if (cells.length === 0) return null;
  return (
    <>
      {cells.map((c) => (
        <Rectangle
          key={`g-${c.gridX}-${c.gridY}`}
          bounds={rectFor(c.gridX, c.gridY)}
          pathOptions={{
            color: "#3a4b7a",
            weight: 0.5,
            opacity: 0.25,
            fill: false,
            interactive: false,
          }}
        />
      ))}
    </>
  );
}

export default function WorldMap({
  plots,
  selected,
  currentBounds,
  currentZoom,
  flyTo,
  onSelect,
  onBoundsChange,
}: {
  plots: SoldPlot[];
  selected: SelectedCell | null;
  currentBounds: CellBounds | null;
  currentZoom: number;
  flyTo: FlyTarget | null;
  onSelect: (cell: SelectedCell) => void;
  onBoundsChange: (bounds: CellBounds, zoom: number) => void;
}) {
  return (
    <MapContainer
      center={[30, 10]}
      zoom={3}
      minZoom={2}
      maxZoom={19}
      worldCopyJump
      className="h-full w-full"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />

      <FlyController target={flyTo} />

      <GridOverlay bounds={currentBounds} zoom={currentZoom} />

      {plots.map((p) => (
        <Rectangle
          key={p.id}
          bounds={rectFor(p.gridX, p.gridY)}
          eventHandlers={{
            click: (e) => {
              e.originalEvent.stopPropagation();
              onSelect({ gridX: p.gridX, gridY: p.gridY });
            },
          }}
          pathOptions={{
            color: p.forSalePrice != null ? "#f5c451" : p.color,
            weight: p.forSalePrice != null ? 2 : 1,
            fillColor: p.color,
            fillOpacity: 0.55,
          }}
        />
      ))}

      {selected && (
        <Rectangle
          bounds={rectFor(selected.gridX, selected.gridY)}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            dashArray: "4 3",
            fillColor: "#6ea8ff",
            fillOpacity: 0.25,
          }}
        />
      )}

      <MapEvents onSelect={onSelect} onBoundsChange={onBoundsChange} />
    </MapContainer>
  );
}

export { CELL_SIZE };
