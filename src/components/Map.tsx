"use client";

import dynamic from "next/dynamic";

// Leaflet cần window -> tắt SSR
const Map = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl bg-boba-100 text-boba-600">
      Đang tải bản đồ…
    </div>
  ),
});

export default Map;
