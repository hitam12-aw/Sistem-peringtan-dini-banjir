"use client";

import { useEffect, useRef } from "react";

const STATUS = {
  aman:    { color: "#00e5a0", label: "AMAN" },
  waspada: { color: "#ffb830", label: "WASPADA" },
  bahaya:  { color: "#ff3d5a", label: "BAHAYA" },
};

export default function MapBanjir({ locations }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapInstanceRef.current) return;

    // Import leaflet dynamic
    import("leaflet").then((L) => {
      // Fix icon leaflet di Next.js
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapRef.current._leaflet_id) return;
const map = L.map(mapRef.current).setView([-6.3271, 108.3254], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      locations.forEach((loc) => {
        const s = STATUS[loc.status] || STATUS.aman;

        // Custom circle marker
        const circle = L.circleMarker([loc.lat, loc.lng], {
          radius: 14,
          fillColor: s.color,
          color: s.color,
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.35,
        }).addTo(map);

        circle.bindPopup(`
          <div style="font-family:monospace;min-width:180px">
            <div style="font-weight:900;font-size:13px;margin-bottom:6px">${loc.nama}</div>
            <div style="color:${s.color};font-weight:700;margin-bottom:8px">● ${s.label}</div>
            <div style="font-size:11px;color:#555;margin-bottom:2px">Ketinggian Air: <b>${loc.level_air} cm</b></div>
            <div style="font-size:11px;color:#555;margin-bottom:2px">Batas Kritis: <b>${loc.max_level} cm</b></div>
            <div style="font-size:11px;color:#555;margin-bottom:6px">Curah Hujan: <b>${loc.curah_hujan} mm/jam</b></div>
            <div style="font-size:11px;color:#888">${loc.keterangan || "-"}</div>
          </div>
        `);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={mapRef}
   style={{ width: "100%", height: 400, borderRadius: 10, overflow: "hidden", zIndex: 0 }}     
      />
    </>
  );
}