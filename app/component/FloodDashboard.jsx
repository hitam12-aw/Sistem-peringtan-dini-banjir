"use client";

import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "../../lib/supabase";

// ─── DATA STATIS AWAL (sebagai fallback sebelum Supabase load) ──────────────────
const initialLocations = [
  { id: 1, name: "Kali Rambatan", lat: -6.3312, lng: 108.3198, level: 250, maxLevel: 280, status: "bahaya", rain: 85 },
  { id: 2, name: "Sungai Cimanuk", lat: -6.3271, lng: 108.3254, level: 180, maxLevel: 300, status: "waspada", rain: 60 },
  { id: 3, name: "Saluran Irigasi Utara", lat: -6.3210, lng: 108.3300, level: 90, maxLevel: 200, status: "aman", rain: 20 },
  { id: 4, name: "Saluran Irigasi Timur", lat: -6.3350, lng: 108.3350, level: 160, maxLevel: 250, status: "waspada", rain: 45 },
];

const initialPoskos = [
  { nama: "Posko SDN Rambatan Kulon", jarak: "0.5 km", alamat: "Desa Rambatan Kulon, Indramayu", lat: -6.3290, lng: 108.3240 },
  { nama: "Posko Balai Desa", jarak: "1.2 km", alamat: "Jl. Desa Rambatan Kulon No.1", lat: -6.3271, lng: 108.3254 },
  { nama: "Posko Masjid Al-Hidayah", jarak: "1.8 km", alamat: "Desa Rambatan Kulon, Indramayu", lat: -6.3310, lng: 108.3280 },
];

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const STATUS = {
  aman: {
    color: "#1A7A4A",
    bg: "#EEF8F3",
    border: "rgba(26,122,74,0.2)",
    label: "AMAN",
    bannerGrad: "linear-gradient(135deg,#0D4A2A 0%,#1A7A4A 60%,#24a863 100%)",
    chartColor: "#1A7A4A",
    barColor: "#1A7A4A",
  },
  waspada: {
    color: "#D4872A",
    bg: "#FEF8EF",
    border: "rgba(212,135,42,0.2)",
    label: "SIAGA",
    bannerGrad: "linear-gradient(135deg,#7A4A10 0%,#D4872A 60%,#e8993a 100%)",
    chartColor: "#D4872A",
    barColor: "#D4872A",
  },
  bahaya: {
    color: "#C0392B",
    bg: "#FDF0EF",
    border: "rgba(192,57,43,0.2)",
    label: "BAHAYA",
    bannerGrad: "linear-gradient(135deg,#07326A 0%,#0A61C9 60%,#2980d4 100%)",
    chartColor: "#C0392B",
    barColor: "#C0392B",
  },
};

// ─── HELPER: konversi level_num dari ESP32 ke key STATUS ──────────────────────
function levelNumToStatus(levelNum) {
  if (levelNum === 3) return "bahaya";
  if (levelNum === 2) return "waspada";
  if (levelNum === 1) return "waspada"; // SIAGA masuk waspada
  return "aman";
}

// ─── HELPER: terjemahkan WMO Weather Code ke Bahasa Indonesia ─────────────────
function translateWeatherCode(code) {
  if (code === 0) return { label: "Cerah", icon: "☀️" };
  if (code === 1 || code === 2) return { label: "Cerah Berawan", icon: "⛅" };
  if (code === 3) return { label: "Berawan", icon: "☁️" };
  if (code === 45 || code === 48) return { label: "Kabut", icon: "🌫️" };
  if (code === 51 || code === 53 || code === 55) return { label: "Gerimis", icon: "🌧️" };
  if (code === 61 || code === 63 || code === 65) return { label: "Hujan", icon: "🌧️" };
  if (code === 80 || code === 81 || code === 82) return { label: "Hujan Deras", icon: "🌧️" };
  if (code === 95 || code === 96 || code === 99) return { label: "Badai Petir", icon: "⛈️" };
  return { label: "Berawan", icon: "☁️" };
}

// ─── HELPER: format waktu dari created_at Supabase ───────────────────────────
function formatTime(isoString) {
  if (!isoString) return "--:--";
  const d = new Date(isoString);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const IconMap = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

const IconHome = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconPin = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

const IconBell = ({ size = 22 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconAlert = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconInfo = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconCheck = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconMessageSquare = ({ size = 22 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconActivity = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconLocation = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const IconGlobe = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconBack = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconHomeSmall = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconWifi = ({ ok }) => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke={ok ? "#1A7A4A" : "#C0392B"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const IconCloudRain = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M16 14v6" />
    <path d="M8 14v6" />
    <path d="M12 16v6" />
  </svg>
);

// ─── MAP COMPONENT ────────────────────────────────────────────────────────────
function PetaViewFull({ locations = [], poskos = [] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      if (!mapRef.current || mapRef.current._leaflet_id) return;
      const map = L.map(mapRef.current).setView([-6.3762, 108.2897], 13); // Center on Rambatan Kulon Lohbener
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      locations.forEach((loc) => {
        const s = STATUS[loc.status] || STATUS.aman;
        const circle = L.circleMarker([loc.lat, loc.lng], {
          radius: 14, fillColor: s.color, color: s.color,
          weight: 2, opacity: 0.9, fillOpacity: 0.4,
        }).addTo(map);
        circle.bindPopup(`
          <div style="font-family:'Segoe UI',sans-serif;min-width:160px;padding:4px">
            <b style="font-size:13px;color:#07326A">${loc.name}</b><br/>
            <span style="color:${s.color};font-weight:700;font-size:12px">${s.label}</span><br/>
            <span style="font-size:12px;color:#555">Tinggi Air: <b>${loc.level} cm</b></span>
          </div>
        `);
      });
      poskos.forEach((p) => {
        const marker = L.marker([p.lat, p.lng]).addTo(map);
        marker.bindPopup(`
          <div style="font-family:'Segoe UI',sans-serif;min-width:160px;padding:4px">
            <b style="font-size:13px;color:#07326A">${p.nama}</b><br/>
            <span style="font-size:12px;color:#555">${p.alamat}</span><br/>
            <span style="font-size:12px;color:#0A61C9;font-weight:700">${p.jarak}</span>
          </div>
        `);
      });
      mapInstanceRef.current = map;
    });
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, [locations, poskos]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ width: "100%", height: "100%", zIndex: 0 }} />
    </>
  );
}

// ─── LOADING SKELETON ─────────────────────────────────────────────────────────
function SkeletonLoader() {
  const shimmer = {
    background: "linear-gradient(90deg, #e8ecf1 25%, #f0f3f7 50%, #e8ecf1 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s ease-in-out infinite",
    borderRadius: 12,
  };
  return (
    <div className="grid-layout">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Banner skeleton */}
        <div style={{ ...shimmer, height: 200, borderRadius: 20 }} />
        {/* Chart card skeleton */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid rgba(7,50,106,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ ...shimmer, width: 28, height: 28 }} />
              <div style={{ ...shimmer, width: 140, height: 14 }} />
            </div>
            <div style={{ ...shimmer, width: 60, height: 22, borderRadius: 20 }} />
          </div>
          <div style={{ ...shimmer, width: "100%", height: 110 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
            <div style={{ ...shimmer, height: 50 }} />
            <div style={{ ...shimmer, height: 50 }} />
            <div style={{ ...shimmer, height: 50 }} />
          </div>
        </div>
        {/* Weather skeleton */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid rgba(7,50,106,0.05)" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <div style={{ ...shimmer, width: 28, height: 28 }} />
            <div style={{ ...shimmer, width: 180, height: 14 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div style={{ ...shimmer, height: 90 }} />
            <div style={{ ...shimmer, height: 90 }} />
            <div style={{ ...shimmer, height: 90 }} />
          </div>
        </div>
      </div>
      {/* Right column skeleton */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid rgba(7,50,106,0.05)" }}>
          <div style={{ ...shimmer, width: 100, height: 14, marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 10 }}>
            {[1, 2, 3, 4].map(i => <div key={i} style={{ ...shimmer, width: 80, height: 32, borderRadius: 20 }} />)}
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid rgba(7,50,106,0.05)" }}>
          <div style={{ ...shimmer, width: 120, height: 14, marginBottom: 14 }} />
          {[1, 2, 3, 4].map(i => <div key={i} style={{ ...shimmer, height: 48, marginBottom: 8 }} />)}
        </div>
        <div style={{ background: "#fff", borderRadius: 20, padding: 20, border: "1px solid rgba(7,50,106,0.05)" }}>
          <div style={{ ...shimmer, width: 200, height: 14, marginBottom: 14 }} />
          {[1, 2, 3, 4].map(i => <div key={i} style={{ ...shimmer, height: 42, marginBottom: 8 }} />)}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: HOME ───────────────────────────────────────────────────────────────
function PageHome({ time, selectedLoc, setSelectedLoc, setPage, sensorData, historyData, isOnline, weatherData, locations = [], poskos = [] }) {
  const danger = locations.filter(l => l.status === "bahaya").length;
  const waspada = locations.filter(l => l.status === "waspada").length;

  // Gunakan status dari sensor ESP32 jika ada, fallback ke data lokasi statis
  const sensorStatus = sensorData ? levelNumToStatus(sensorData.level_num) : null;
  const overall = sensorStatus || (danger > 0 ? "bahaya" : waspada > 0 ? "waspada" : "aman");
  const os = STATUS[overall];

  const loc = selectedLoc || locations[0];
  const ls = STATUS[loc.status];
  const pct = sensorData ? sensorData.persen : Math.round((loc.level / loc.maxLevel) * 100);

  // Tinggi air dari sensor (jarak kecil = air tinggi, tampilkan sebagai tinggi dari dasar)
  const tinggiAir = sensorData
    ? `${sensorData.jarak_cm} cm (jarak sensor)`
    : `${loc.level} cm`;

  return (
    <div className="grid-layout">
      {/* COLUMN LEFT: BANNER & DETAIL CHART */}
      <div className="grid-col-left" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* STATUS BANNER */}
        <div style={{
          background: os.bannerGrad,
          borderRadius: 20, padding: "22px 20px 18px",
          position: "relative", overflow: "hidden",
          boxShadow: `0 8px 32px ${os.color}33`,
        }}>
          <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -70, right: 30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

          {/* Indikator koneksi sensor */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <IconWifi ok={isOnline} />
            <span style={{ fontSize: 10, color: isOnline ? "rgba(255,255,255,0.8)" : "rgba(255,180,180,0.9)", fontWeight: 500 }}>
              {isOnline ? `Sensor aktif · Update ${formatTime(sensorData?.created_at)}` : "Menunggu data sensor..."}
            </span>
          </div>

          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 500, letterSpacing: "0.6px", textTransform: "uppercase", marginBottom: 8 }}>
            Status Terkini — Rambatan Kulon
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", animation: "pulse 2s infinite" }} />
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "0.5px" }}>{os.label}</div>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 18 }}>
            Jarak Sensor: <b style={{ color: "#fff" }}>{sensorData ? `${sensorData.jarak_cm} cm` : "--"}</b>
            &nbsp;·&nbsp;
            Float: <b style={{ color: "#fff" }}>{sensorData?.water_level || "--"}</b>
            &nbsp;·&nbsp;
            Update: <span suppressHydrationWarning>{time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Peta Evakuasi", icon: <IconMap />, page: "peta" },
              { label: "Info Posko", icon: <IconHomeSmall />, page: "posko" },
              { label: "Notifikasi", icon: <IconBell size={16} />, page: "notifikasi" },
            ].map(m => (
              <button key={m.page} onClick={() => setPage(m.page)} className="banner-btn">
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {m.icon}
                </div>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* TOMBOL DARURAT SOS */}
        <a
          href="https://wa.me/6285150003725?text=%20DARURAT%20BANJIR!%20Saya%20butuh%20bantuan%20evakuasi%20di%20wilayah%20Kandanghaur,%20Indramayu.%20Mohon%20segera%20kirim%20tim!"
          target="_blank"
          rel="noopener noreferrer"
          className="sos-button"
        >
          <div className="sos-button-inner">
            <div className="sos-icon">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "1.5px" }}>DARURAT SOS</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>Hubungi BPBD via WhatsApp</div>
            </div>
          </div>
          <div className="sos-pulse-ring" />
        </a>

        {/* DETAIL STATUS AIR - REALTIME DARI ESP32 */}
        <div className="premium-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F1F7F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A61C9" }}>
                <IconActivity />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#07326A" }}>
                Data Realtime ESP32
              </span>
            </div>
            <span style={{
              background: os.bg, color: os.color,
              border: `1px solid ${os.border}`,
              borderRadius: 20, padding: "3px 10px",
              fontSize: 10, fontWeight: 700, letterSpacing: "0.3px",
            }}>{os.label}</span>
          </div>

          {/* Grafik history dari Supabase */}
          {historyData && historyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={historyData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                <defs>
                  <linearGradient id="lvl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={os.chartColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={os.chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                <XAxis dataKey="time" tick={{ fill: "#bbb", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#bbb", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, fontSize: 11, border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", background: "#fff" }}
                  itemStyle={{ color: os.color }}
                />
                <Area type="monotone" dataKey="level" stroke={os.chartColor} strokeWidth={2} fill="url(#lvl)" dot={false} name="Jarak Sensor (cm)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: 110,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: "1.5px dashed rgba(7, 50, 106, 0.1)",
              borderRadius: 12,
              color: "#8a8a9a",
              gap: 6,
              background: "rgba(7, 50, 106, 0.01)",
              marginBottom: 4
            }}>
              <span style={{ fontSize: 20 }}>📡</span>
              <span style={{ fontSize: 11, fontWeight: 600 }}>Menunggu data sensor untuk memuat grafik...</span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
            {[
              { label: "Jarak Sensor", value: sensorData ? `${sensorData.jarak_cm} cm` : "--", color: "#07326A" },
              { label: "Status", value: os.label, color: os.color },
              { label: "Float Sensor", value: sensorData?.water_level === "AIR TERDETEKSI" ? "Naik" : "Normal", color: "#07326A" },
            ].map((s, i) => (
              <div key={i} style={{ background: "#f8f9fc", borderRadius: 10, padding: "10px 10px" }}>
                <div style={{ fontSize: 10, color: "#9a9aaa", marginBottom: 3, fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa", marginBottom: 5 }}>
              <span>Level Air</span>
              <span>{pct}% dari batas kritis</span>
            </div>
            <div style={{ background: "#eef0f5", borderRadius: 99, height: 6, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: os.barColor, borderRadius: 99, transition: "width 0.5s" }} />
            </div>
          </div>
        </div>

        {/* WIDGET CUACA */}
        <div className="premium-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284C7" }}>
              <IconCloudRain />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#07326A" }}>Prakiraan Cuaca Indramayu</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {(weatherData || []).map((w, idx) => (
              <div key={idx} style={{ background: "#f8f9fc", borderRadius: 12, padding: "10px 8px", textAlign: "center", border: "1px solid rgba(7, 50, 106, 0.02)" }}>
                <div style={{ fontSize: 10, color: "#9a9aaa", fontWeight: 600, marginBottom: 4 }}>{w.day}</div>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{w.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#07326A" }}>{w.temp}</div>
                <div style={{ fontSize: 9, color: "#555", marginTop: 2, fontWeight: 500 }}>{w.weather}</div>
                <div style={{ fontSize: 8, color: "#0284C7", marginTop: 2, fontWeight: 600 }}>☔ {w.pop}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COLUMN RIGHT: LOCATION SELECTOR & ALL STATUS */}
      <div className="grid-col-right" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* PILIH LOKASI */}
        <div className="premium-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F1F7F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A61C9" }}>
              <IconLocation />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#07326A" }}>Pilih Lokasi</span>
          </div>
          <div className="scroll-pills">
            {locations.map((l) => {
              const s = STATUS[l.status];
              const isActive = selectedLoc?.id === l.id;
              return (
                <button key={l.id} onClick={() => setSelectedLoc(l)} style={{
                  background: isActive ? s.color : "#F1F7F9",
                  color: isActive ? "#fff" : "#555",
                  border: isActive ? `1.5px solid ${s.color}` : "1.5px solid transparent",
                  borderRadius: 20, padding: "6px 14px",
                  fontSize: 12, fontWeight: isActive ? 700 : 500,
                  cursor: "pointer", whiteSpace: "nowrap",
                  flexShrink: 0, transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                }}>
                  {l.name.replace("Sungai ", "").replace("Kali ", "").replace("Saluran ", "")}
                </button>
              );
            })}
          </div>
        </div>

        {/* SEMUA LOKASI */}
        <div className="premium-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F1F7F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A61C9" }}>
              <IconGlobe />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#07326A" }}>Semua Lokasi</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {locations.map(l => {
              const s = STATUS[l.status];
              return (
                <div key={l.id} onClick={() => setSelectedLoc(l)} className="location-item" style={{
                  border: `1.5px solid ${selectedLoc?.id === l.id ? s.border : "transparent"}`,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#07326A" }}>{l.name}</div>
                    <div style={{ fontSize: 11, color: "#9a9aaa", marginTop: 2 }}>Tinggi: {l.level} cm · Hujan: {l.rain} mm/jam</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PARAMETER AMBANG BATAS */}
        <div className="premium-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", color: "#D97706" }}>
              <IconInfo size={16} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#07326A" }}>Rujukan Batas Ketinggian Air</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { level: "AMAN", range: "< 100 cm", desc: "Arus normal, tidak ada genangan", color: "#1A7A4A", bg: "#EEF8F3" },
              { level: "SIAGA", range: "100 - 200 cm", desc: "Air naik, pemantauan ketat oleh posko", color: "#D4872A", bg: "#FEF8EF" },
              { level: "WASPADA", range: "200 - 300 cm", desc: "Genangan meluas, persiapan evakuasi mandiri", color: "#D4872A", bg: "#FEF8EF" },
              { level: "BAHAYA", range: "> 300 cm", desc: "Banjir meluap, evakuasi aktif", color: "#C0392B", bg: "#FDF0EF" },
            ].map((p, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: p.bg, borderRadius: 12, padding: "8px 12px", border: `1px solid ${p.color}20` }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: p.color, marginRight: 6 }}>● {p.level}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#07326A" }}>{p.range}</span>
                  <div style={{ fontSize: 9, color: "#666", marginTop: 2 }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: PETA ───────────────────────────────────────────────────────────────
function PagePeta({ locations = [], poskos = [] }) {
  return (
    <div className="grid-layout-peta">
      <div className="grid-col-left premium-card" style={{ overflow: "hidden", padding: 0 }}>
        <div style={{ padding: "16px 16px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F1F7F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A61C9" }}>
              <IconMap />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#07326A" }}>Peta Evakuasi</span>
          </div>
          <div style={{ fontSize: 11, color: "#9a9aaa", marginLeft: 36 }}>Desa Rambatan Kulon, Kec. Lohbener, Indramayu</div>
        </div>
        <div className="map-container">
          <PetaViewFull locations={locations} poskos={poskos} />
        </div>
        <div style={{ padding: "12px 16px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          {Object.entries(STATUS).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: v.color }} />
              <span style={{ fontSize: 11, color: "#666" }}>{v.label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#07326A" }}>
            <IconLocation />
            <span style={{ fontSize: 11, color: "#666" }}>Posko</span>
          </div>
        </div>

        {/* MITIGASI & KONTAK DARURAT */}
        <div style={{ padding: "16px", borderTop: "1px solid #f0f0f5", background: "#fcfdfe" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#07326A", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            Kontak Darurat Kebencanaan Indramayu
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: "#FDF2F2", borderRadius: 10, padding: "8px 10px", border: "1px solid #EF444415" }}>
              <div style={{ fontSize: 9, color: "#9a9aaa", fontWeight: 600 }}>BPBD Indramayu</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#C0392B" }}>0851-5000-3725</div>
            </div>
            <div style={{ background: "#f8f9fc", borderRadius: 10, padding: "8px 10px" }}>
              <div style={{ fontSize: 9, color: "#9a9aaa", fontWeight: 600 }}>Polsek Kandanghaur</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#07326A" }}>(0234) 507110</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-col-right premium-card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F1F7F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A61C9" }}>
            <IconPin />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#07326A" }}>Titik Pemantauan</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {locations.map((l, i) => {
            const s = STATUS[l.status];
            return (
              <div key={l.id} className="location-item" style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "11px 14px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                    <IconLocation />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#07326A" }}>{l.name}</div>
                    <div style={{ fontSize: 11, color: "#9a9aaa" }}>{l.level} cm · {l.rain} mm/jam</div>
                  </div>
                </div>
                <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* PROSEDUR EVAKUASI */}
        <div style={{ borderTop: "1px solid #f0f0f5", marginTop: 16, paddingTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#07326A", marginBottom: 8 }}>
            Prosedur Evakuasi Mandiri
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Amankan dokumen berharga di tempat tinggi/kedap air.",
              "Matikan aliran listrik dan gas di dalam rumah.",
              "Segera menuju Posko Evakuasi terdekat mengikuti rute hijau.",
              "Dengarkan sirine otomatis dari pos pemantauan ESP32.",
            ].map((step, sIdx) => (
              <div key={sIdx} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ width: 15, height: 15, borderRadius: "50%", background: "#0ea5e920", color: "#0ea5e9", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>{sIdx + 1}</div>
                <div style={{ fontSize: 11, color: "#555", lineHeight: "15px" }}>{step}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: POSKO ──────────────────────────────────────────────────────────────
function PagePosko({ poskos = [] }) {
  return (
    <div className="grid-layout-peta">
      {/* COLUMN LEFT: DAFTAR POSKO */}
      <div className="grid-col-left premium-card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F1F7F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A61C9" }}>
            <IconHomeSmall />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#07326A" }}>Info Posko Pengungsian</span>
        </div>
        <div style={{ fontSize: 11, color: "#9a9aaa", marginBottom: 14, marginLeft: 36 }}>Desa Rambatan Kulon, Indramayu</div>

        <div className="posko-list" style={{ display: "flex", flexDirection: "column" }}>
          {poskos.map((p, i) => (
            <div key={i} className="posko-item" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 0",
              borderBottom: i < poskos.length - 1 ? "1px solid #f0f0f5" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F1F7F9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#0A61C9" }}>
                  <IconHomeSmall />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#07326A" }}>{p.nama}</div>
                  <div style={{ fontSize: 11, color: "#9a9aaa", marginTop: 2 }}>{p.alamat}</div>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                <div style={{ fontSize: 12, color: "#0A61C9", fontWeight: 700, marginBottom: 6 }}>{p.jarak}</div>
                <button
                  onClick={() => window.open(`https://www.google.com/maps?q=${p.lat},${p.lng}`, "_blank")}
                  style={{
                    background: "#07326A", color: "#fff", border: "none",
                    borderRadius: 8, padding: "6px 12px",
                    fontSize: 11, cursor: "pointer", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 5,
                    transition: "all 0.2s ease",
                  }}
                >
                  <IconMap />
                  Lihat Peta
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COLUMN RIGHT: KAPASITAS & LOGISTIK */}
      <div className="grid-col-right premium-card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284C7" }}>
            <IconGlobe />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#07326A" }}>Kapasitas & Logistik Posko</span>
        </div>

        {/* Posko 1 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: "#07326A", marginBottom: 6 }}>
            <span>Masjid Al-Furqon</span>
            <span style={{ color: "#0ea5e9" }}>45 / 150 Jiwa</span>
          </div>
          <div style={{ background: "#eef0f5", borderRadius: 99, height: 6, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ width: "30%", height: "100%", background: "#0ea5e9", borderRadius: 99 }} />
          </div>
          <div style={{ fontSize: 9, color: "#888" }}>Logistik: Makanan Bantuan (Baik) · Medis (Siap)</div>
        </div>

        {/* Posko 2 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: "#07326A", marginBottom: 6 }}>
            <span>Kantor Kuwu Desa Rambatan Kulon</span>
            <span style={{ color: "#D4872A" }}>115 / 150 Jiwa</span>
          </div>
          <div style={{ background: "#eef0f5", borderRadius: 99, height: 6, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ width: "76%", height: "100%", background: "#D4872A", borderRadius: 99 }} />
          </div>
          <div style={{ fontSize: 9, color: "#888" }}>Logistik: Selimut & Tenda (Terbatas) · Air Bersih (Siap)</div>
        </div>

        {/* Posko 3 */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: "#07326A", marginBottom: 6 }}>
            <span>SDN 1 Rambatan Kulon</span>
            <span style={{ color: "#1A7A4A" }}>20 / 200 Jiwa</span>
          </div>
          <div style={{ background: "#eef0f5", borderRadius: 99, height: 6, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ width: "10%", height: "100%", background: "#1A7A4A", borderRadius: 99 }} />
          </div>
          <div style={{ fontSize: 9, color: "#888" }}>Logistik: Dapur Umum (Siap) · Sanitasi (Sangat Baik)</div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: LAPORAN WARGA ──────────────────────────────────────────────────────
function PageLaporan({ reports, onSubmitReport }) {
  const [nama, setNama] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [fotoBase64, setFotoBase64] = useState("");
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1.2 * 1024 * 1024) {
        alert("Ukuran foto terlalu besar! Harap pilih foto di bawah 1.2 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nama || !lokasi || !keterangan) {
      alert("Harap isi semua kolom laporan!");
      return;
    }
    onSubmitReport({
      nama,
      lokasi,
      keterangan,
      foto: fotoBase64,
      urgency: "waspada",
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
    });
    setNama("");
    setLokasi("");
    setKeterangan("");
    setFotoBase64("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  };

  const urgencyConfig = {
    aman: { label: "Informasi / Rendah", color: "#1A7A4A", bg: "#EEF8F3" },
    waspada: { label: "Pending / Baru", color: "#D4872A", bg: "#FEF8EF" },
    bahaya: { label: "Darurat / Tinggi", color: "#C0392B", bg: "#FDF0EF" },
  };

  return (
    <div className="grid-layout-peta">
      {/* COLUMN LEFT: FORM LAPORAN */}
      <div className="premium-card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284C7" }}>
            <IconMessageSquare size={16} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#07326A" }}>Formulir Laporan Warga Mandiri</span>
        </div>
        <p style={{ fontSize: 11, color: "#666", marginBottom: 16, lineHeight: "16px" }}>
          Laporkan kondisi genangan air, tanggul rembes, jalan terputus, atau kebutuhan darurat di sekitar tempat tinggal Anda dengan lampiran foto bukti visual terkini.
        </p>

        {success && (
          <div style={{ background: "#EEF8F3", color: "#1A7A4A", border: "1px solid rgba(26,122,74,0.2)", borderRadius: 12, padding: "12px 14px", fontSize: 12, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            ✅ Laporan Anda sukses terkirim dan masuk antrean monitoring! Terima kasih atas kepedulian Anda.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#07326A", marginBottom: 4 }}>Nama Pelapor</label>
            <input
              type="text"
              placeholder="Contoh: Budi Santoso"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(7, 50, 106, 0.1)", fontSize: 12, outline: "none", transition: "border-color 0.2s" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#07326A", marginBottom: 4 }}>Lokasi Kejadian (RT/RW/Desa)</label>
            <input
              type="text"
              placeholder="Contoh: RT 04 / RW 02, Rambatan Kulon"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(7, 50, 106, 0.1)", fontSize: 12, outline: "none" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#07326A", marginBottom: 4 }}>Keterangan Laporan</label>
            <textarea
              rows={3}
              placeholder="Jelaskan kondisi lapangan secara mendetail..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid rgba(7, 50, 106, 0.1)", fontSize: 12, resize: "none", outline: "none" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#07326A", marginBottom: 4 }}>Lampirkan Foto Kejadian</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ fontSize: 11, color: "#555" }}
              />
              {fotoBase64 && (
                <div style={{ position: "relative", width: "100%", height: 130, borderRadius: 10, overflow: "hidden", border: "1.5px solid rgba(7, 50, 106, 0.1)" }}>
                  <img src={fotoBase64} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => setFotoBase64("")}
                    style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            style={{
              background: "linear-gradient(135deg, #07326A 0%, #0A61C9 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(10, 97, 201, 0.2)",
              transition: "transform 0.15s, opacity 0.15s"
            }}
          >
            Kirim Laporan Warga
          </button>
        </form>
      </div>

      {/* COLUMN RIGHT: DAFTAR LAPORAN WARGA */}
      <div className="premium-card">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", color: "#D97706" }}>
            <IconAlert size={16} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#07326A" }}>Laporan Aktif Warga (Realtime)</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
          {reports.map((rep, idx) => {
            const conf = urgencyConfig[rep.urgency] || urgencyConfig.waspada;
            return (
              <div key={idx} style={{ background: "#f8f9fc", borderLeft: `4px solid ${conf.color}`, borderRadius: 10, padding: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.01)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#07326A" }}>{rep.nama}</span>
                    <span style={{ fontSize: 9, color: "#888", marginLeft: 8 }}>{rep.time}</span>
                  </div>
                  <span style={{ background: conf.bg, color: conf.color, fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 12 }}>
                    {conf.label.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#555", marginBottom: 4 }}>📍 {rep.lokasi}</div>
                <div style={{ fontSize: 11, color: "#666", lineHeight: "15px", marginBottom: rep.foto ? 8 : 0 }}>"{rep.keterangan}"</div>
                {rep.foto && (
                  <div style={{ maxWidth: "100%", borderRadius: 8, overflow: "hidden", border: "1px solid rgba(7, 50, 106, 0.08)" }}>
                    <img src={rep.foto} alt="Foto Kejadian" style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: NOTIFIKASI - REALTIME DARI SUPABASE ───────────────────────────────
function PageNotifikasi({ alerts }) {
  const iconMap = {
    bahaya: <IconAlert size={16} />,
    waspada: <IconInfo size={16} />,
    aman: <IconCheck size={16} />,
  };

  return (
    <div className="premium-card" style={{ width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F1F7F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#0A61C9" }}>
          <IconBell size={16} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#07326A" }}>Notifikasi Peringatan</span>
      </div>

      {alerts.length === 0 && (
        <div style={{ textAlign: "center", color: "#9a9aaa", fontSize: 13, padding: "36px 0" }}>
          Belum ada notifikasi dari sensor. Semua sistem dalam kondisi aman.
        </div>
      )}

      <div className="alerts-list">
        {alerts.map((a, idx) => {
          const s = STATUS[a.level];
          return (
            <div key={idx} className="alert-item" style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 12, padding: "12px 14px",
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: s.color, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {iconMap[a.level]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 2 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>Status {s.label}</div>
                  <div style={{ fontSize: 10, color: "#aaa", flexShrink: 0 }}>{a.time} WIB</div>
                </div>
                <div style={{ fontSize: 12, color: "#555", marginBottom: 2, fontWeight: 600 }}>{a.loc}</div>
                <div style={{ fontSize: 11, color: "#777" }}>{a.msg}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [locations, setLocations] = useState(initialLocations);
  const [poskos, setPoskos] = useState(initialPoskos);
  const [selectedLoc, setSelectedLoc] = useState(initialLocations[0]);
  const [time, setTime] = useState(new Date());

  // ── State loading awal ──
  const [initialLoading, setInitialLoading] = useState(true);

  // ── State data sensor realtime ──
  const [sensorData, setSensorData] = useState(null);   // data terbaru dari ESP32
  const [historyData, setHistoryData] = useState([]);     // untuk grafik
  const [alerts, setAlerts] = useState([]);     // untuk halaman notifikasi
  const [isOnline, setIsOnline] = useState(false);
  const [weatherData, setWeatherData] = useState([
    { day: "Hari Ini", temp: "28°C", weather: "Hujan Sedang", icon: "🌧️", pop: "80%" },
    { day: "Besok", temp: "27°C", weather: "Hujan Lebat", icon: "⛈️", pop: "95%" },
    { day: "Lusa", temp: "29°C", weather: "Berawan", icon: "⛅", pop: "20%" },
  ]);

  const fetchWeather = async () => {
    try {
      const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-6.3762&longitude=108.2897&daily=weathercode,temperature_2m_max,precipitation_probability_max&timezone=Asia/Jakarta");
      const data = await res.json();
      if (data && data.daily) {
        const labels = ["Hari Ini", "Besok", "Lusa"];
        const formatted = labels.map((label, idx) => {
          const code = data.daily.weathercode[idx];
          const tempVal = Math.round(data.daily.temperature_2m_max[idx]);
          const popVal = data.daily.precipitation_probability_max[idx];
          const w = translateWeatherCode(code);
          return {
            day: label,
            temp: `${tempVal}°C`,
            weather: w.label,
            icon: w.icon,
            pop: `${popVal}%`,
          };
        });
        setWeatherData(formatted);
      }
    } catch {
      // fallback
    }
  };

  const fetchDbLocations = async () => {
    try {
      const { data, error } = await supabase
        .from("lokasi_banjir")
        .select("*")
        .order("id");
      if (error) throw error;
      if (data && data.length > 0) {
        const mapped = data.map(d => ({
          id: d.id,
          name: d.nama,
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lng),
          level: parseInt(d.level_air),
          maxLevel: 300, // default maxLevel
          status: d.status || "aman",
          rain: parseInt(d.curah_hujan || 0)
        }));
        setLocations(mapped);

        // Pertahankan selectedLoc yang sudah terupdate dari DB
        setSelectedLoc(prev => {
          const matched = mapped.find(m => m.id === prev.id);
          return matched || mapped[0];
        });
      }
    } catch {
      // fallback tetap memakai initialLocations
    }
  };

  const fetchDbPoskos = async () => {
    try {
      const { data, error } = await supabase
        .from("posko")
        .select("*")
        .order("id");
      if (error) throw error;
      if (data && data.length > 0) {
        const mapped = data.map(d => ({
          id: d.id,
          nama: d.nama,
          alamat: d.alamat,
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lng),
          jarak: d.jarak || "0.5 km",
        }));
        setPoskos(mapped);
      }
    } catch {
      // fallback tetap memakai initialPoskos
    }
  };

  // ── State Laporan Warga Mandiri ──
  const [wargaReports, setWargaReports] = useState([
    { nama: "H. Sukur", lokasi: "RT 03 / RW 01, Rambatan Kulon", urgency: "bahaya", keterangan: "Tanggul sungai di belakang masjid merembes cukup deras. Warga mulai bersiap-siap pasir penahan.", time: "22:15 WIB" },
    { nama: "Yusuf", lokasi: "Jalan Utama Desa (Dekat Balai Desa)", urgency: "waspada", keterangan: "Air got sudah mulai meluap ke jalan aspal sekitar 10 cm, kendaraan roda dua masih bisa lewat.", time: "21:40 WIB" },
    { nama: "Ibu RT Maryam", lokasi: "RT 05 / RW 02", urgency: "aman", keterangan: "Hujan gerimis lebat sudah reda. Saluran irigasi lancar tidak ada sumbatan sampah.", time: "20:30 WIB" },
  ]);

  const fetchWargaReports = async () => {
    try {
      const { data } = await supabase
        .from("laporan_warga")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        const formatted = data.map(d => {
          const parts = d.deskripsi ? d.deskripsi.split(" ||FOTO|| ") : [""];
          const text = parts[0];
          const foto = parts[1] || "";

          // Map database status to dashboard color key
          let urg = "waspada"; // pending
          if (d.status === "selesai") urg = "aman";
          if (d.status === "diproses") urg = "aman"; // blue/processing

          return {
            id: d.id,
            nama: d.nama_pelapor,
            lokasi: d.lokasi,
            urgency: urg,
            keterangan: text,
            foto: foto,
            time: formatTime(d.created_at) + " WIB",
          };
        });
        setWargaReports(formatted);
      }
    } catch {
      // Keep initial static fallback if database errors out
    }
  };

  const handleAddReport = async (newReport) => {
    try {
      const { error } = await supabase
        .from("laporan_warga")
        .insert({
          nama_pelapor: newReport.nama,
          lokasi: newReport.lokasi,
          deskripsi: newReport.keterangan + (newReport.foto ? " ||FOTO|| " + newReport.foto : ""),
          status: "pending",
        });

      if (!error) {
        fetchWargaReports();
      } else {
        throw error;
      }
    } catch {
      // fallback local if DB fails
      setWargaReports([newReport, ...wargaReports]);
    }
  };

  // ── Clock ──
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Ambil data terbaru dari Supabase ──
  const fetchLatest = async () => {
    try {
      const { data, error } = await supabase
        .from("sensor_data")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setSensorData(data);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  };

  // ── Ambil history 12 data terakhir untuk grafik ──
  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("sensor_data")
        .select("jarak_cm, created_at")
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;

      // Balik urutan agar grafik dari kiri ke kanan
      const formatted = data.reverse().map(d => ({
        time: formatTime(d.created_at),
        level: parseFloat(d.jarak_cm),
      }));
      setHistoryData(formatted);
    } catch {
      // Biarkan historyData tetap kosong
    }
  };

  // ── Buat notifikasi dari history ──
  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("sensor_data")
        .select("*")
        .neq("status", "AMAN")
        .neq("status", "ERROR")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const formatted = data.map(d => {
        const lvl = levelNumToStatus(d.level_num);
        const msgMap = {
          BAHAYA: "Ketinggian air mendekati batas kritis! Waspada banjir!",
          WASPADA: `Jarak sensor ${d.jarak_cm} cm – air mulai naik`,
          SIAGA: `Air terdeteksi, pantau terus kondisi`,
        };
        return {
          level: lvl,
          time: formatTime(d.created_at),
          loc: "Sensor ESP32 – Rambatan Kulon",
          msg: msgMap[d.status] || `Status: ${d.status}`,
        };
      });
      setAlerts(formatted);
    } catch {
      // Biarkan alerts tetap kosong
    }
  };

  // ── Polling setiap 10 detik + realtime subscription ──
  useEffect(() => {
    fetchLatest();
    fetchHistory();
    fetchAlerts();
    fetchWargaReports();
    fetchWeather();
    fetchDbLocations();
    fetchDbPoskos();

    // Selesaikan loading awal setelah 1.2 detik
    const loadingTimer = setTimeout(() => setInitialLoading(false), 1200);

    // Polling fallback setiap 10 detik
    const interval = setInterval(() => {
      fetchLatest();
      fetchHistory();
      fetchAlerts();
      fetchWargaReports();
      fetchDbLocations();
      fetchDbPoskos();
    }, 10000);

    // Supabase Realtime: langsung update saat ESP32 kirim data baru
    const channel = supabase
      .channel("sensor_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sensor_data" },
        (payload) => {
          setSensorData(payload.new);
          setIsOnline(true);
          fetchHistory();
          fetchAlerts();
        }
      )
      .subscribe();

    // Realtime Laporan Warga: update feed warga secara realtime
    const channelLaporan = supabase
      .channel("laporan_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "laporan_warga" },
        () => {
          fetchWargaReports();
        }
      )
      .subscribe();

    // Realtime Lokasi Banjir: langsung update ketika admin mengedit koordinat/status
    const channelLokasi = supabase
      .channel("lokasi_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lokasi_banjir" },
        () => {
          fetchDbLocations();
        }
      )
      .subscribe();

    // Realtime Posko: langsung update ketika admin menambah/mengubah posko
    const channelPosko = supabase
      .channel("posko_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posko" },
        () => {
          fetchDbPoskos();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      clearTimeout(loadingTimer);
      supabase.removeChannel(channel);
      supabase.removeChannel(channelLaporan);
      supabase.removeChannel(channelLokasi);
      supabase.removeChannel(channelPosko);
    };
  }, []);

  // ── Hitung status overall ──
  const sensorStatus = sensorData ? levelNumToStatus(sensorData.level_num) : null;
  const danger = locations.filter(l => l.status === "bahaya").length;
  const waspada = locations.filter(l => l.status === "waspada").length;
  const overall = sensorStatus || (danger > 0 ? "bahaya" : waspada > 0 ? "waspada" : "aman");
  const os = STATUS[overall];

  const pageTitle = {
    home: "SI-PERBA",
    peta: "Peta Evakuasi",
    posko: "Info Posko",
    notifikasi: "Notifikasi",
    laporan: "Laporan Warga",
  };

  const navItems = [
    { key: "home", label: "Beranda", icon: <IconHome /> },
    { key: "peta", label: "Peta", icon: <IconPin /> },
    { key: "posko", label: "Posko", icon: <IconHome /> },
    { key: "notifikasi", label: "Notif", icon: <IconBell /> },
    { key: "laporan", label: "Laporan", icon: <IconMessageSquare /> },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F1F7F9", fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* HEADER */}
      <div style={{
        background: "#07326A",
        position: "sticky", top: 0, zIndex: 100,
        padding: "0 16px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
          {page !== "home" && (
            <button onClick={() => setPage("home")} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.8)", padding: "4px 4px 4px 0",
              display: "flex", alignItems: "center",
            }}>
              <IconBack />
            </button>
          )}
          {page === "home" && (<img src="/si-perba.png" alt="Logo SIPERBA" style={{ width: 60 }} />)}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", letterSpacing: "0.3px" }}>
              {pageTitle[page] || "SI-PERBA"}
            </div>
            {page === "home" && (
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Rambatan Kulon, Indramayu</div>
            )}
          </div>

          {/* DESKTOP NAVIGATION */}
          <div className="desktop-nav">
            {navItems.map(n => (
              <button key={n.key} onClick={() => setPage(n.key)} style={{
                background: page === n.key ? "rgba(255,255,255,0.12)" : "none",
                border: "none",
                display: "flex", alignItems: "center", gap: 6,
                cursor: "pointer",
                color: page === n.key ? "#fff" : "rgba(255,255,255,0.6)",
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: page === n.key ? 700 : 500,
                transition: "all 0.15s",
              }}>
                {n.icon}
                <span>{n.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 20, padding: "4px 10px",
            fontSize: 11, fontWeight: 600, color: "#fff",
          }}>
            {os.label}
          </div>
          <button onClick={() => setPage("notifikasi")} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.7)", padding: 6,
            display: "flex", alignItems: "center", borderRadius: 8,
          }}>
            <IconBell size={20} />
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <main className="main-content">
        {initialLoading && page === "home" ? (
          <SkeletonLoader />
        ) : (
          <>
            {page === "home" && <PageHome time={time} selectedLoc={selectedLoc} setSelectedLoc={setSelectedLoc} setPage={setPage} sensorData={sensorData} historyData={historyData} isOnline={isOnline} weatherData={weatherData} locations={locations} poskos={poskos} />}
            {page === "peta" && <PagePeta locations={locations} poskos={poskos} />}
            {page === "posko" && <PagePosko poskos={poskos} />}
            {page === "notifikasi" && <PageNotifikasi alerts={alerts} />}
            {page === "laporan" && <PageLaporan reports={wargaReports} onSubmitReport={handleAddReport} />}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{
        background: "#07326A",
        color: "rgba(255, 255, 255, 0.6)",
        padding: "24px 16px",
        textAlign: "center",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        marginTop: 40,
        fontSize: 11,
      }}>
        <div style={{ fontWeight: 700, color: "#fff", marginBottom: 6, letterSpacing: "0.5px" }}>SI-PERBA · SISTEM PERINGATAN DINI BANJIR</div>
        <div style={{ marginBottom: 12 }}>Desa Rambatan Kulon, Kecamatan Kandanghaur, Kabupaten Indramayu</div>
        <div style={{ fontSize: 10 }}>© {new Date().getFullYear()} Hak Cipta Dilindungi. Dikembangkan untuk Keamanan & Kesiapsiagaan Bencana Masyarakat.</div>
      </footer>

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        {navItems.map(n => (
          <button key={n.key} onClick={() => setPage(n.key)} style={{
            background: "none", border: "none",
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3,
            cursor: "pointer",
            color: page === n.key ? "#fff" : "rgba(255,255,255,0.38)",
            padding: "4px 16px",
            transition: "color 0.15s",
          }}>
            {n.icon}
            <span style={{ fontSize: 10, fontWeight: page === n.key ? 700 : 500 }}>{n.label}</span>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#749DC8", visibility: page === n.key ? "visible" : "hidden" }} />
          </button>
        ))}
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F1F7F9; }
        button:active { opacity: 0.8; }
        ::-webkit-scrollbar { display: none; }
        .leaflet-container { width: 100% !important; height: 100% !important; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* SOS Button Styles */
        .sos-button {
          display: block;
          position: relative;
          text-decoration: none;
          border-radius: 16px;
          overflow: visible;
        }
        .sos-button-inner {
          background: linear-gradient(135deg, #C0392B 0%, #E74C3C 50%, #C0392B 100%);
          border-radius: 16px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          position: relative;
          z-index: 2;
          box-shadow: 0 6px 24px rgba(192, 57, 43, 0.35);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .sos-button:hover .sos-button-inner {
          transform: scale(1.02);
          box-shadow: 0 8px 32px rgba(192, 57, 43, 0.5);
        }
        .sos-button:active .sos-button-inner {
          transform: scale(0.98);
        }
        .sos-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          animation: sosPulseIcon 1.5s ease-in-out infinite;
        }
        @keyframes sosPulseIcon {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .sos-pulse-ring {
          position: absolute;
          top: -4px; left: -4px; right: -4px; bottom: -4px;
          border: 2px solid rgba(192, 57, 43, 0.4);
          border-radius: 20px;
          animation: sosPulseRing 2s ease-out infinite;
          z-index: 1;
        }
        @keyframes sosPulseRing {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.05); }
        }

        /* Premium Aesthetic CSS Rules */
        .premium-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 20px;
          border: 1px solid rgba(7, 50, 106, 0.05);
          box-shadow: 0 4px 20px rgba(7, 50, 106, 0.015);
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .premium-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(7, 50, 106, 0.06);
          border-color: rgba(7, 50, 106, 0.12);
        }

        .scroll-pills {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: thin;
          scrollbar-color: rgba(7, 50, 106, 0.1) transparent;
        }
        .scroll-pills::-webkit-scrollbar {
          height: 4px;
          display: block;
        }
        .scroll-pills::-webkit-scrollbar-track {
          background: transparent;
        }
        .scroll-pills::-webkit-scrollbar-thumb {
          background: rgba(7, 50, 106, 0.15);
          border-radius: 10px;
        }
        .scroll-pills::-webkit-scrollbar-thumb:hover {
          background: rgba(7, 50, 106, 0.3);
        }

        .banner-btn {
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 14px;
          padding: 12px 8px;
          color: #fff;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .banner-btn:hover {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.35);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(255, 255, 255, 0.1);
        }
        .banner-btn:active {
          transform: translateY(0);
          opacity: 0.9;
        }

        .location-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f8f9fc;
          border-radius: 12px;
          padding: 11px 14px;
          cursor: pointer;
          border: 1.5px solid transparent;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .location-item:hover {
          background: #ffffff;
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(7, 50, 106, 0.04);
        }

        /* Responsive Layout CSS */
        .desktop-nav {
          display: none;
        }
        .desktop-nav button {
          position: relative;
          overflow: hidden;
        }
        .desktop-nav button::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: #fff;
          transition: all 0.2s ease;
          transform: translateX(-50%);
        }
        .desktop-nav button:hover::after {
          width: 60%;
        }

        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #07326A;
          display: flex;
          justify-content: space-around;
          padding: 8px 0 env(safe-area-inset-bottom, 10px);
          z-index: 100;
        }
        @media (max-width: 767px) {
          footer {
            padding-bottom: 90px !important;
          }
        }
        .main-content {
          flex: 1;
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          padding: 16px 16px 90px;
          transition: max-width 0.3s, padding 0.3s;
        }
        .grid-layout {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .grid-layout-peta {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .map-container {
          width: 100%;
          height: 300px;
          z-index: 0;
          position: relative;
          transition: height 0.3s;
        }
        .posko-list {
          display: flex;
          flex-direction: column;
        }
        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .alert-item {
          margin-bottom: 8px;
        }

        @media (min-width: 768px) {
          .desktop-nav {
            display: flex;
            gap: 12px;
            margin-left: 32px;
          }
          .bottom-nav {
            display: none !important;
          }
          .main-content {
            max-width: 1200px;
            padding: 24px 24px 40px;
          }
          .grid-layout {
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 24px;
            align-items: start;
          }
          .grid-layout-peta {
            display: grid;
            grid-template-columns: 1.5fr 1fr;
            gap: 24px;
            align-items: start;
          }
          .map-container {
            height: 500px !important;
          }
          .posko-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 16px;
          }
          .posko-item {
            border: 1px solid rgba(7, 50, 106, 0.05) !important;
            border-radius: 14px !important;
            padding: 16px !important;
            background: #ffffff !important;
            border-bottom: 1px solid rgba(7, 50, 106, 0.05) !important;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 12px rgba(7, 50, 106, 0.01);
          }
          .posko-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(7, 50, 106, 0.05);
            border-color: rgba(7, 50, 106, 0.1) !important;
          }
          .alerts-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
            gap: 12px;
          }
          .alert-item {
            margin-bottom: 0 !important;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .alert-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
          }
        }
      `}</style>
    </div>
  );
}
