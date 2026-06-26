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
  AttributionControl,
} from "react-leaflet";
import L from "leaflet";
import { RIDER_SVG, WAVER_SVG } from "./mapMarkers";

export type MapMarker = {
  lat: number;
  lng: number;
  type: "store" | "shipper" | "dropoff";
  label?: string;
};

function makeIcon(type: MapMarker["type"]) {
  // Shiper: xe có người lái (animation); điểm giao của khách: nhân vật vẫy tay
  // (animation). Không viền/đĩa nền — hình ngồi thẳng trên bản đồ.
  if (type === "shipper") {
    return L.divIcon({
      className: "",
      html: RIDER_SVG,
      iconSize: [32, 28],
      iconAnchor: [16, 25],
      popupAnchor: [0, -24],
    });
  }
  if (type === "dropoff") {
    return L.divIcon({
      className: "",
      html: WAVER_SVG,
      iconSize: [24, 30],
      iconAnchor: [12, 28],
      popupAnchor: [0, -28],
    });
  }
  // Cửa hàng: emoji không viền, thêm bóng đổ để vẫn nổi trên bản đồ.
  return L.divIcon({
    className: "",
    html: `<div style="font-size:20px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.45))">🏪</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 19],
    popupAnchor: [0, -18],
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

  // OSRM snap tuyến vào đường giao thông gần nhất nên điểm đầu/cuối tuyến lệch
  // khỏi toạ độ thật của quán & điểm giao. Nối thêm 2 đầu vào đúng marker để
  // đường vẽ chạm chính xác vị trí quán (đầu) và khách (cuối).
  const store = markers.find((m) => m.type === "store");
  const dropoff = markers.find((m) => m.type === "dropoff");
  const displayRoute = useMemo<[number, number][]>(() => {
    if (routeLatLng.length === 0) return [];
    const pts = [...routeLatLng];
    if (store) pts.unshift([store.lat, store.lng]);
    if (dropoff) pts.push([dropoff.lat, dropoff.lng]);
    return pts;
  }, [routeLatLng, store?.lat, store?.lng, dropoff?.lat, dropoff?.lng]);

  const defaultCenter: [number, number] =
    center || (markers[0] ? [markers[0].lat, markers[0].lng] : [21.028, 105.85]);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={zoom}
      style={{ height, width: "100%", borderRadius: "0.75rem", zIndex: 0 }}
      scrollWheelZoom={false}
      attributionControl={false}
    >
      {/* Ẩn nhãn "Leaflet" (prefix=false); giữ ghi công OSM theo giấy phép ODbL */}
      <AttributionControl position="bottomright" prefix={false} />
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {displayRoute.length > 1 && (
        <Polyline positions={displayRoute} pathOptions={{ color: "#c06a34", weight: 5, opacity: 0.7 }} />
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
