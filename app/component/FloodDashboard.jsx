"use client";

import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ─── DATA ─────────────────────────────────────────────────────────────────────
const locations = [
  { id: 1, name: "Kali Rambatan",         lat: -6.3312, lng: 108.3198, level: 250, maxLevel: 280, status: "bahaya",  rain: 85 },
  { id: 2, name: "Sungai Cimanuk",        lat: -6.3271, lng: 108.3254, level: 180, maxLevel: 300, status: "waspada", rain: 60 },
  { id: 3, name: "Saluran Irigasi Utara", lat: -6.3210, lng: 108.3300, level: 90,  maxLevel: 200, status: "aman",    rain: 20 },
  { id: 4, name: "Saluran Irigasi Timur", lat: -6.3350, lng: 108.3350, level: 160, maxLevel: 250, status: "waspada", rain: 45 },
];

const waterLevelHistory = [
  { time: "00:00", level: 120 },
  { time: "02:00", level: 145 },
  { time: "04:00", level: 175 },
  { time: "06:00", level: 200 },
  { time: "08:00", level: 230 },
  { time: "10:00", level: 250 },
  { time: "12:00", level: 245 },
];

const alertsData = [
  { id: 1, time: "12:45", loc: "Kali Rambatan",         msg: "Ketinggian air mendekati batas kritis 280cm", level: "bahaya" },
  { id: 2, time: "11:30", loc: "Sungai Cimanuk",        msg: "Curah hujan meningkat 85mm/jam terdeteksi",   level: "waspada" },
  { id: 3, time: "10:15", loc: "Saluran Irigasi Timur", msg: "Ketinggian air naik 20cm dalam 2 jam",        level: "waspada" },
  { id: 4, time: "09:00", loc: "Saluran Irigasi Utara", msg: "Pemantauan normal, tidak ada anomali",        level: "aman" },
];

const poskos = [
  { nama: "Posko SDN Rambatan Kulon", jarak: "0.5 km", alamat: "Desa Rambatan Kulon, Indramayu", lat: -6.3290, lng: 108.3240 },
  { nama: "Posko Balai Desa",         jarak: "1.2 km", alamat: "Jl. Desa Rambatan Kulon No.1",   lat: -6.3271, lng: 108.3254 },
  { nama: "Posko Masjid Al-Hidayah",  jarak: "1.8 km", alamat: "Desa Rambatan Kulon, Indramayu", lat: -6.3310, lng: 108.3280 },
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

const IconLayers = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
  </svg>
);

const IconHomeSmall = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

// ─── MAP COMPONENT ────────────────────────────────────────────────────────────
function PetaViewFull() {
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
      const map = L.map(mapRef.current).setView([-6.3271, 108.3254], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      locations.forEach((loc) => {
        const s = STATUS[loc.status];
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
  }, []);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ width: "100%", height: "100%", zIndex: 0 }} />
    </>
  );
}

// ─── PAGE: HOME ───────────────────────────────────────────────────────────────
function PageHome({ time, selectedLoc, setSelectedLoc, setPage }) {
  const danger  = locations.filter(l => l.status === "bahaya").length;
  const waspada = locations.filter(l => l.status === "waspada").length;
  const overall = danger > 0 ? "bahaya" : waspada > 0 ? "waspada" : "aman";
  const os = STATUS[overall];
  const loc = selectedLoc || locations[0];
  const ls = STATUS[loc.status];
  const pct = Math.round((loc.level / loc.maxLevel) * 100);

  const alertIconMap = {
    bahaya:  <IconAlert size={16} />,
    waspada: <IconInfo size={16} />,
    aman:    <IconCheck size={16} />,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* STATUS BANNER */}
      <div style={{
        background: os.bannerGrad,
        borderRadius: 20, padding: "22px 20px 18px",
        position: "relative", overflow: "hidden",
        boxShadow: `0 8px 32px ${os.color}33`,
      }}>
        <div style={{ position:"absolute", top:-50, right:-50, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,0.05)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-70, right:30, width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />

        <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", fontWeight:500, letterSpacing:"0.6px", textTransform:"uppercase", marginBottom:8 }}>
          Status Terkini — Rambatan Kulon
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
          <div style={{ width:10, height:10, borderRadius:"50%", background:"#fff", animation:"pulse 2s infinite" }} />
          <div style={{ fontSize:28, fontWeight:800, color:"#fff", letterSpacing:"0.5px" }}>{os.label}</div>
        </div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", marginBottom:18 }}>
          Tinggi Air: <b style={{ color:"#fff" }}>{loc.level} cm</b>
          &nbsp;·&nbsp;
          Update: <span suppressHydrationWarning>{time.toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit" })}</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
          {[
            { label:"Peta Evakuasi", icon:<IconMap />, page:"peta" },
            { label:"Info Posko",    icon:<IconHomeSmall />, page:"posko" },
            { label:"Notifikasi",    icon:<IconBell size={16} />, page:"notifikasi" },
          ].map(m => (
            <button key={m.page} onClick={() => setPage(m.page)} style={{
              background:"rgba(255,255,255,0.12)",
              border:"1px solid rgba(255,255,255,0.18)",
              borderRadius:14, padding:"12px 8px",
              color:"#fff", cursor:"pointer",
              display:"flex", flexDirection:"column",
              alignItems:"center", gap:6,
              fontSize:11, fontWeight:600, letterSpacing:"0.2px",
            }}>
              <div style={{ width:32, height:32, borderRadius:10, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {m.icon}
              </div>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* PILIH LOKASI */}
      <div style={{ background:"#fff", borderRadius:16, padding:16, border:"1px solid rgba(0,0,0,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"#F1F7F9", display:"flex", alignItems:"center", justifyContent:"center", color:"#0A61C9" }}>
            <IconLocation />
          </div>
          <span style={{ fontSize:13, fontWeight:700, color:"#07326A" }}>Pilih Lokasi</span>
        </div>
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
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
                flexShrink: 0, transition: "all 0.2s",
              }}>
                {l.name.replace("Sungai ","").replace("Kali ","").replace("Saluran ","")}
              </button>
            );
          })}
        </div>
      </div>

      {/* DETAIL STATUS AIR */}
      <div style={{ background:"#fff", borderRadius:16, padding:16, border:"1px solid rgba(0,0,0,0.05)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"#F1F7F9", display:"flex", alignItems:"center", justifyContent:"center", color:"#0A61C9" }}>
              <IconActivity />
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:"#07326A" }}>Detail Status Air</span>
          </div>
          <span style={{
            background: ls.bg, color: ls.color,
            border: `1px solid ${ls.border}`,
            borderRadius: 20, padding: "3px 10px",
            fontSize: 10, fontWeight: 700, letterSpacing:"0.3px",
          }}>{ls.label}</span>
        </div>

        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={waterLevelHistory} margin={{ top:5, right:5, left:-30, bottom:0 }}>
            <defs>
              <linearGradient id="lvl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={ls.chartColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={ls.chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
            <XAxis dataKey="time" tick={{ fill:"#bbb", fontSize:9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:"#bbb", fontSize:9 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius:10, fontSize:11, border:"none", boxShadow:"0 4px 16px rgba(0,0,0,0.1)", background:"#fff" }}
              itemStyle={{ color: ls.color }}
            />
            <Area type="monotone" dataKey="level" stroke={ls.chartColor} strokeWidth={2} fill="url(#lvl)" dot={false} name="Tinggi Air (cm)" />
          </AreaChart>
        </ResponsiveContainer>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:12 }}>
          {[
            { label:"Tinggi Air",  value:`${loc.level} cm`,  color:"#07326A" },
            { label:"Status",      value:ls.label,            color:ls.color  },
            { label:"Curah Hujan", value:`${loc.rain} mm/j`,  color:"#07326A" },
          ].map((s, i) => (
            <div key={i} style={{ background:"#f8f9fc", borderRadius:10, padding:"10px 10px" }}>
              <div style={{ fontSize:10, color:"#9a9aaa", marginBottom:3, fontWeight:500 }}>{s.label}</div>
              <div style={{ fontSize:14, fontWeight:700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:14 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#aaa", marginBottom:5 }}>
            <span>Kapasitas</span>
            <span>{pct}% dari batas kritis</span>
          </div>
          <div style={{ background:"#eef0f5", borderRadius:99, height:6, overflow:"hidden" }}>
            <div style={{ width:`${pct}%`, height:"100%", background:ls.barColor, borderRadius:99, transition:"width 0.5s" }} />
          </div>
        </div>
      </div>

      {/* SEMUA LOKASI */}
      <div style={{ background:"#fff", borderRadius:16, padding:16, border:"1px solid rgba(0,0,0,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"#F1F7F9", display:"flex", alignItems:"center", justifyContent:"center", color:"#0A61C9" }}>
            <IconGlobe />
          </div>
          <span style={{ fontSize:13, fontWeight:700, color:"#07326A" }}>Semua Lokasi</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {locations.map(l => {
            const s = STATUS[l.status];
            return (
              <div key={l.id} onClick={() => setSelectedLoc(l)} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                background:"#f8f9fc", borderRadius:12, padding:"11px 14px", cursor:"pointer",
                border:`1.5px solid ${selectedLoc?.id === l.id ? s.border : "transparent"}`,
                transition:"border-color 0.15s",
              }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#07326A" }}>{l.name}</div>
                  <div style={{ fontSize:11, color:"#9a9aaa", marginTop:2 }}>Tinggi: {l.level} cm · Hujan: {l.rain} mm/jam</div>
                </div>
                <span style={{
                  background: s.bg, color: s.color,
                  border: `1px solid ${s.border}`,
                  borderRadius: 20, padding: "3px 10px",
                  fontSize: 10, fontWeight: 700,
                }}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE: PETA ───────────────────────────────────────────────────────────────
function PagePeta() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ background:"#fff", borderRadius:16, overflow:"hidden", border:"1px solid rgba(0,0,0,0.05)" }}>
        <div style={{ padding:"16px 16px 12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:"#F1F7F9", display:"flex", alignItems:"center", justifyContent:"center", color:"#0A61C9" }}>
              <IconMap />
            </div>
            <span style={{ fontSize:13, fontWeight:700, color:"#07326A" }}>Peta Evakuasi</span>
          </div>
          <div style={{ fontSize:11, color:"#9a9aaa", marginLeft:36 }}>Desa Rambatan Kulon, Kec. Kandanghaur, Indramayu</div>
        </div>
        <div style={{ width:"100%", height:300, zIndex:0, position:"relative" }}>
          <PetaViewFull />
        </div>
        <div style={{ padding:"12px 16px", display:"flex", gap:16, flexWrap:"wrap" }}>
          {Object.entries(STATUS).map(([k, v]) => (
            <div key={k} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:v.color }} />
              <span style={{ fontSize:11, color:"#666" }}>{v.label}</span>
            </div>
          ))}
          <div style={{ display:"flex", alignItems:"center", gap:6, color:"#07326A" }}>
            <IconLocation />
            <span style={{ fontSize:11, color:"#666" }}>Posko</span>
          </div>
        </div>
      </div>

      <div style={{ background:"#fff", borderRadius:16, padding:16, border:"1px solid rgba(0,0,0,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"#F1F7F9", display:"flex", alignItems:"center", justifyContent:"center", color:"#0A61C9" }}>
            <IconPin />
          </div>
          <span style={{ fontSize:13, fontWeight:700, color:"#07326A" }}>Titik Pemantauan</span>
        </div>
        {locations.map((l, i) => {
          const s = STATUS[l.status];
          return (
            <div key={l.id} style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"11px 0",
              borderBottom: i < locations.length - 1 ? "1px solid #f0f0f5" : "none",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", color:s.color }}>
                  <IconLocation />
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#07326A" }}>{l.name}</div>
                  <div style={{ fontSize:11, color:"#9a9aaa" }}>{l.level} cm · {l.rain} mm/jam</div>
                </div>
              </div>
              <span style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}`, borderRadius:20, padding:"3px 10px", fontSize:10, fontWeight:700 }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PAGE: POSKO ──────────────────────────────────────────────────────────────
function PagePosko() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:16, border:"1px solid rgba(0,0,0,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"#F1F7F9", display:"flex", alignItems:"center", justifyContent:"center", color:"#0A61C9" }}>
            <IconHomeSmall />
          </div>
          <span style={{ fontSize:13, fontWeight:700, color:"#07326A" }}>Info Posko Pengungsian</span>
        </div>
        <div style={{ fontSize:11, color:"#9a9aaa", marginBottom:14, marginLeft:36 }}>Desa Rambatan Kulon, Indramayu</div>

        {poskos.map((p, i) => (
          <div key={i} style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"14px 0",
            borderBottom: i < poskos.length - 1 ? "1px solid #f0f0f5" : "none",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
              <div style={{ width:40, height:40, borderRadius:12, background:"#F1F7F9", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"#0A61C9" }}>
                <IconHomeSmall />
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:"#07326A" }}>{p.nama}</div>
                <div style={{ fontSize:11, color:"#9a9aaa", marginTop:2 }}>{p.alamat}</div>
              </div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0, marginLeft:12 }}>
              <div style={{ fontSize:12, color:"#0A61C9", fontWeight:700, marginBottom:6 }}>{p.jarak}</div>
              <button
                onClick={() => window.open(`https://www.google.com/maps?q=${p.lat},${p.lng}`, "_blank")}
                style={{
                  background:"#07326A", color:"#fff", border:"none",
                  borderRadius:8, padding:"6px 12px",
                  fontSize:11, cursor:"pointer", fontWeight:600,
                  display:"flex", alignItems:"center", gap:5,
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
  );
}

// ─── PAGE: NOTIFIKASI ────────────────────────────────────────────────────────
function PageNotifikasi() {
  const iconMap = {
    bahaya:  <IconAlert size={16} />,
    waspada: <IconInfo size={16} />,
    aman:    <IconCheck size={16} />,
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:16, border:"1px solid rgba(0,0,0,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"#F1F7F9", display:"flex", alignItems:"center", justifyContent:"center", color:"#0A61C9" }}>
            <IconBell size={16} />
          </div>
          <span style={{ fontSize:13, fontWeight:700, color:"#07326A" }}>Notifikasi Peringatan</span>
        </div>
        {alertsData.map(a => {
          const s = STATUS[a.level];
          return (
            <div key={a.id} style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 12, padding: "12px 14px", marginBottom: 8,
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <div style={{
                width:36, height:36, borderRadius:10, flexShrink:0,
                background: s.color, color:"#fff",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                {iconMap[a.level]}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:2 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:s.color }}>Status {s.label}</div>
                  <div style={{ fontSize:10, color:"#aaa", flexShrink:0 }}>{a.time} WIB</div>
                </div>
                <div style={{ fontSize:12, color:"#555", marginBottom:2, fontWeight:600 }}>{a.loc}</div>
                <div style={{ fontSize:11, color:"#777" }}>{a.msg}</div>
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
  const [selectedLoc, setSelectedLoc] = useState(locations[0]);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const danger  = locations.filter(l => l.status === "bahaya").length;
  const waspada = locations.filter(l => l.status === "waspada").length;
  const overall = danger > 0 ? "bahaya" : waspada > 0 ? "waspada" : "aman";
  const os = STATUS[overall];

  const pageTitle = {
    home:       "SI-PERBA",
    peta:       "Peta Evakuasi",
    posko:      "Info Posko",
    notifikasi: "Notifikasi",
  };

  const navItems = [
    { key:"home",       label:"Beranda",    icon:<IconHome /> },
    { key:"peta",       label:"Peta",       icon:<IconPin /> },
    { key:"posko",      label:"Posko",      icon:<IconHome /> },
    { key:"notifikasi", label:"Notifikasi", icon:<IconBell /> },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#F1F7F9", fontFamily:"'Segoe UI', system-ui, sans-serif" }}>

      {/* HEADER */}
      <div style={{
        background:"#07326A",
        position:"sticky", top:0, zIndex:100,
        padding:"0 16px", height:60,
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:1 }}>
          {page !== "home" && (
            <button onClick={() => setPage("home")} style={{
              background:"none", border:"none", cursor:"pointer",
              color:"rgba(255,255,255,0.8)", padding:"4px 4px 4px 0",
              display:"flex", alignItems:"center",
            }}>
              <IconBack />
            </button>
          )}
          {page === "home" && (<img src="/si-perba.png" alt="Logo SIPERBA" style={{ width: 60 }}/>)}
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"#fff", letterSpacing:"0.3px" }}>
              {pageTitle[page] || "SI-PERBA"}
            </div>
            {page === "home" && (
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>Rambatan Kulon, Indramayu</div>
            )}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{
            background:"rgba(255,255,255,0.12)",
            border:"1px solid rgba(255,255,255,0.2)",
            borderRadius:20, padding:"4px 10px",
            fontSize:11, fontWeight:600, color:"#fff",
          }}>
            {os.label}
          </div>
          <button onClick={() => setPage("notifikasi")} style={{
            background:"none", border:"none", cursor:"pointer",
            color:"rgba(255,255,255,0.7)", padding:6,
            display:"flex", alignItems:"center", borderRadius:8,
          }}>
            <IconBell size={20} />
          </button>
          <button
            onClick={() => window.location.href = "/admin/login"}
            style={{
              background:"rgba(255,255,255,0.1)",
              border:"1px solid rgba(255,255,255,0.2)",
              borderRadius:8, padding:"5px 12px",
              fontSize:11, color:"rgba(255,255,255,0.8)",
              cursor:"pointer", fontWeight:600,
            }}
          >
            Login
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <main style={{ maxWidth:480, margin:"0 auto", padding:"16px 16px 90px" }}>
        {page === "home"       && <PageHome time={time} selectedLoc={selectedLoc} setSelectedLoc={setSelectedLoc} setPage={setPage} />}
        {page === "peta"       && <PagePeta />}
        {page === "posko"      && <PagePosko />}
        {page === "notifikasi" && <PageNotifikasi />}
      </main>

      {/* BOTTOM NAV */}
      <div style={{
        position:"fixed", bottom:0, left:0, right:0,
        background:"#07326A",
        display:"flex", justifyContent:"space-around",
        padding:"8px 0 env(safe-area-inset-bottom, 10px)",
        zIndex:100,
      }}>
        {navItems.map(n => (
          <button key={n.key} onClick={() => setPage(n.key)} style={{
            background:"none", border:"none",
            display:"flex", flexDirection:"column",
            alignItems:"center", gap:3,
            cursor:"pointer",
            color: page === n.key ? "#fff" : "rgba(255,255,255,0.38)",
            padding:"4px 16px",
            transition:"color 0.15s",
          }}>
            {n.icon}
            <span style={{ fontSize:10, fontWeight: page === n.key ? 700 : 500 }}>{n.label}</span>
            <div style={{ width:4, height:4, borderRadius:"50%", background:"#749DC8", visibility: page === n.key ? "visible" : "hidden" }} />
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
      `}</style>
    </div>
  );
}
