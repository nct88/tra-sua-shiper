"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

export type MapMarker = {
  lat: number;
  lng: number;
  type: "store" | "shipper" | "dropoff";
  label?: string;
};

const ICONS: Record<string, string> = {
  store: "🏪",
  shipper: "🛵",
  dropoff: "📍",
};

function makeIcon(type: MapMarker["type"]) {
  const pulse = type === "shipper" ? "shipper-dot" : "";
  return L.divIcon({
    className: "",
    html: `<div class="${pulse}" style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:9999px;background:white;border:2px solid #c06a34;box-shadow:0 2px 6px rgba(0,0,0,.3);font-size:20px">${ICONS[type]}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
}

// Tự động khớp khung nhìn theo các điểm
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    map.fitBounds(points as any, { padding: [50, 50], maxZoom: 16 });
  }, [map, JSON.stringify(points)]);
  return null;
}

// Theo dõi vị trí shiper (giữ trong khung nhìn khi đang giao)
function FollowShipper({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.panTo(pos, { animate: true });
  }, [map, pos?.[0], pos?.[1]]);
  return null;
}

function ClickPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapView({
  markers = [],
  route = [],
  trail = [],
  center,
  zoom = 14,
  height = "100%",
  pickMode = false,
  onPick,
  follow = false,
}: {
  markers?: MapMarker[];
  route?: [number, number][]; // [lng, lat] theo GeoJSON
  trail?: { lat: number; lng: number }[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  pickMode?: boolean;
  onPick?: (lat: number, lng: number) => void;
  follow?: boolean;
}) {
  // route đang là [lng,lat] -> Leaflet cần [lat,lng]
  const routeLatLng = useMemo(
    () => route.map((c) => [c[1], c[0]] as [number, number]),
    [route]
  );
  const trailLatLng = useMemo(
    () => trail.map((t) => [t.lat, t.lng] as [number, number]),
    [trail]
  );

  const shipper = markers.find((m) => m.type === "shipper");
  const fitPoints: [number, number][] = markers.map((m) => [m.lat, m.lng]);

  const defaultCenter: [number, number] =
    center || (markers[0] ? [markers[0].lat, markers[0].lng] : [21.028, 105.85]);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={zoom}
      style={{ height, width: "100%", borderRadius: "0.75rem", zIndex: 0 }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {routeLatLng.length > 1 && (
        <Polyline positions={routeLatLng} pathOptions={{ color: "#c06a34", weight: 5, opacity: 0.7 }} />
      )}
      {trailLatLng.length > 1 && (
        <Polyline
          positions={trailLatLng}
          pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.9, dashArray: "6 6" }}
        />
      )}

      {markers.map((m, i) => (
        <Marker key={i} position={[m.lat, m.lng]} icon={makeIcon(m.type)}>
          {m.label && <Popup>{m.label}</Popup>}
        </Marker>
      ))}

      {!pickMode && !follow && <FitBounds points={fitPoints} />}
      {follow && shipper && <FollowShipper pos={[shipper.lat, shipper.lng]} />}
      {pickMode && onPick && <ClickPicker onPick={onPick} />}
    </MapContainer>
  );
}
