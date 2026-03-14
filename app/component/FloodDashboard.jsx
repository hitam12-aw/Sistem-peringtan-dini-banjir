"use client";

import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ─── DATA DUMMY ───────────────────────────────────────────────────────────────
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

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STATUS = {
  aman:    { color: "#27ae60", bg: "#eafaf1", border: "#a9dfbf", label: "AMAN",   icon: "✓", bgCard: "#27ae60" },
  waspada: { color: "#e67e22", bg: "#fef9e7", border: "#f9e79f", label: "SIAGA",  icon: "!", bgCard: "#e67e22" },
  bahaya:  { color: "#e74c3c", bg: "#fdedec", border: "#f1948a", label: "BAHAYA", icon: "⚠", bgCard: "#e74c3c" },
};

// ─── MAP COMPONENT ────────────────────────────────────────────────────────────
function PetaView() {
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
      if (mapRef.current._leaflet_id) return;
      const map = L.map(mapRef.current).setView([-6.3271, 108.3254], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      locations.forEach((loc) => {
        const s = STATUS[loc.status];
        const circle = L.circleMarker([loc.lat, loc.lng], {
          radius: 14, fillColor: s.bgCard, color: s.bgCard,
          weight: 2, opacity: 0.9, fillOpacity: 0.5,
        }).addTo(map);
        circle.bindPopup(`
          <div style="font-family:sans-serif;min-width:160px;padding:4px">
            <b style="font-size:13px">${loc.name}</b><br/>
            <span style="color:${s.bgCard};font-weight:700">${s.label}</span><br/>
            <span style="font-size:12px;color:#555">Tinggi Air: <b>${loc.level} cm</b></span>
          </div>
        `);
      });

      poskos.forEach((p) => {
        const marker = L.marker([p.lat, p.lng]).addTo(map);
        marker.bindPopup(`
          <div style="font-family:sans-serif;min-width:160px;padding:4px">
            <b style="font-size:13px">🏥 ${p.nama}</b><br/>
            <span style="font-size:12px;color:#555">${p.alamat}</span><br/>
            <span style="font-size:12px;color:#3498db;font-weight:700">${p.jarak}</span>
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
      {/* margin negatif biar peta full width di dalam card */}
      <div style={{ margin: "0 -16px" }}>
        <div ref={mapRef} style={{ width: "100%", height: 300, zIndex: 0 }} />
      </div>
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Status Banner */}
      <div style={{
        background: os.bgCard, borderRadius: 20,
        padding: "20px 20px 16px", color: "#fff",
        boxShadow: `0 4px 20px ${os.bgCard}55`,
      }}>
        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>Status Banjir — Rambatan Kulon</div>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>
          {os.icon} {os.label}
        </div>
        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 12 }}>
          Tinggi Air: <b>{loc.level} cm</b> &nbsp;·&nbsp; Update: <span suppressHydrationWarning>{time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { label: "Peta Evakuasi", icon: "🗺️", page: "peta" },
            { label: "Info Posko",    icon: "🏥", page: "posko" },
            { label: "Notifikasi",    icon: "🔔", page: "notifikasi" },
          ].map((m) => (
            <button key={m.page} onClick={() => setPage(m.page)} style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 12, padding: "10px 6px",
              color: "#fff", cursor: "pointer",
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 600,
            }}>
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pilih Lokasi */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 10 }}>📍 Pilih Lokasi</div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {locations.map(l => {
            const s = STATUS[l.status];
            const isActive = selectedLoc?.id === l.id;
            return (
              <button key={l.id} onClick={() => setSelectedLoc(l)} style={{
                background: isActive ? s.bgCard : "#f5f6fa",
                color: isActive ? "#fff" : "#555",
                border: "none", borderRadius: 20,
                padding: "6px 14px", fontSize: 12,
                fontWeight: isActive ? 700 : 400,
                cursor: "pointer", whiteSpace: "nowrap",
                flexShrink: 0, transition: "all 0.2s",
              }}>
                {l.name.replace("Sungai ", "").replace("Kali ", "").replace("Saluran ", "")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail Status Air */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>📊 Detail Status Air</div>
          <span style={{
            background: ls.bg, color: ls.color,
            border: `1px solid ${ls.border}`,
            borderRadius: 20, padding: "2px 10px",
            fontSize: 11, fontWeight: 700,
          }}>{ls.label}</span>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={waterLevelHistory} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
            <defs>
              <linearGradient id="lvl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ls.bgCard} stopOpacity={0.3} />
                <stop offset="95%" stopColor={ls.bgCard} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" tick={{ fill: "#aaa", fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#aaa", fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} />
            <Area type="monotone" dataKey="level" stroke={ls.bgCard} strokeWidth={2} fill="url(#lvl)" dot={false} name="Tinggi Air (cm)" />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
          {[
            { label: "Tinggi Air",  value: `${loc.level} cm` },
            { label: "Status",      value: ls.label },
            { label: "Curah Hujan", value: `${loc.rain} mm/j` },
          ].map((s, i) => (
            <div key={i} style={{ background: "#f8f9fa", borderRadius: 10, padding: "8px 10px" }}>
              <div style={{ fontSize: 10, color: "#aaa", marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa", marginBottom: 4 }}>
            <span>Kapasitas</span>
            <span>{pct}% dari batas kritis</span>
          </div>
          <div style={{ background: "#f0f0f0", borderRadius: 8, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: ls.bgCard, borderRadius: 8, transition: "width 0.5s" }} />
          </div>
        </div>
      </div>

      {/* Semua Lokasi */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 12 }}>🌊 Semua Lokasi</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {locations.map(l => {
            const s = STATUS[l.status];
            return (
              <div key={l.id} onClick={() => setSelectedLoc(l)} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#f8f9fa", borderRadius: 12, padding: "10px 14px", cursor: "pointer",
                border: `1px solid ${selectedLoc?.id === l.id ? s.border : "transparent"}`,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Tinggi: {l.level} cm · Hujan: {l.rain} mm/jam</div>
                </div>
                <span style={{ background: s.bgCard, color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                  {s.label}
                </span>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Card peta full width tanpa padding samping */}
      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ padding: "16px 16px 12px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 2 }}>🗺️ Peta Evakuasi</div>
          <div style={{ fontSize: 11, color: "#aaa" }}>Desa Rambatan Kulon, Kec. Kandanghaur, Indramayu</div>
        </div>
        {/* Peta langsung tanpa padding */}
        <div style={{ width: "100%", height: 300, zIndex: 0, position: "relative" }}>
          <PetaViewFull />
        </div>
        {/* Legend */}
        <div style={{ padding: "12px 16px", display: "flex", gap: 16, flexWrap: "wrap" }}>
          {Object.entries(STATUS).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: v.bgCard }} />
              <span style={{ fontSize: 11, color: "#666" }}>{v.label}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>📍</span>
            <span style={{ fontSize: 11, color: "#666" }}>Posko</span>
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 12 }}>📌 Titik Pemantauan</div>
        {locations.map((l, i) => {
          const s = STATUS[l.status];
          return (
            <div key={l.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: i < locations.length - 1 ? "1px solid #f0f0f0" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 16 }}>📍</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{l.level} cm · {l.rain} mm/jam</div>
                </div>
              </div>
              <span style={{ background: s.bgCard, color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Versi PetaView untuk PagePeta (tanpa margin negatif, langsung full)
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
      if (mapRef.current._leaflet_id) return;
      const map = L.map(mapRef.current).setView([-6.3271, 108.3254], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      locations.forEach((loc) => {
        const s = STATUS[loc.status];
        const circle = L.circleMarker([loc.lat, loc.lng], {
          radius: 14, fillColor: s.bgCard, color: s.bgCard,
          weight: 2, opacity: 0.9, fillOpacity: 0.5,
        }).addTo(map);
        circle.bindPopup(`
          <div style="font-family:sans-serif;min-width:160px;padding:4px">
            <b style="font-size:13px">${loc.name}</b><br/>
            <span style="color:${s.bgCard};font-weight:700">${s.label}</span><br/>
            <span style="font-size:12px;color:#555">Tinggi Air: <b>${loc.level} cm</b></span>
          </div>
        `);
      });
      poskos.forEach((p) => {
        const marker = L.marker([p.lat, p.lng]).addTo(map);
        marker.bindPopup(`
          <div style="font-family:sans-serif;min-width:160px;padding:4px">
            <b style="font-size:13px">🏥 ${p.nama}</b><br/>
            <span style="font-size:12px;color:#555">${p.alamat}</span><br/>
            <span style="font-size:12px;color:#3498db;font-weight:700">${p.jarak}</span>
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

// ─── PAGE: POSKO ─────────────────────────────────────────────────────────────
function PagePosko() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 4 }}>🏥 Info Posko Pengungsian</div>
        <div style={{ fontSize: 11, color: "#aaa", marginBottom: 12 }}>Desa Rambatan Kulon, Indramayu</div>
        {poskos.map((p, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 0", borderBottom: i < poskos.length - 1 ? "1px solid #f0f0f0" : "none",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e8f4fd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                🏥
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{p.nama}</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{p.alamat}</div>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 12, color: "#3498db", fontWeight: 700, marginBottom: 4 }}>{p.jarak}</div>
              <button
                onClick={() => window.open(`https://www.google.com/maps?q=${p.lat},${p.lng}`, "_blank")}
                style={{
                  background: "#3498db", color: "#fff", border: "none",
                  borderRadius: 8, padding: "5px 12px", fontSize: 11,
                  cursor: "pointer", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                🗺️ Lihat Peta
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PAGE: NOTIFIKASI ─────────────────────────────────────────────────────────
function PageNotifikasi() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 12 }}>🔔 Notifikasi Peringatan</div>
        {alertsData.map(a => {
          const s = STATUS[a.level];
          return (
            <div key={a.id} style={{
              background: s.bg, border: `1px solid ${s.border}`,
              borderRadius: 12, padding: "12px 14px", marginBottom: 8,
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: s.bgCard, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0,
              }}>
                {a.level === "bahaya" ? "⚠" : a.level === "waspada" ? "!" : "✓"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>Status {s.label}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{a.time} WIB</div>
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
  const [selectedLoc, setSelectedLoc] = useState(locations[0]);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const danger  = locations.filter(l => l.status === "bahaya").length;
  const waspada = locations.filter(l => l.status === "waspada").length;
  const overall = danger > 0 ? "bahaya" : waspada > 0 ? "waspada" : "aman";

  const pageTitle = {
    home:       "Status Banjir",
    peta:       "Peta Evakuasi",
    posko:      "Info Posko",
    notifikasi: "Notifikasi",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{
        background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        position: "sticky", top: 0, zIndex: 100,
        padding: "0 16px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {page !== "home" && (
            <button onClick={() => setPage("home")} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 18, color: "#3498db", padding: "4px 6px",
            }}>←</button>
          )}
          {page === "home" && <span style={{ fontSize: 20 }}>💧</span>}
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#333" }}>
              {pageTitle[page] || "Status Banjir"}
            </div>
            {page === "home" && (
              <div style={{ fontSize: 10, color: "#aaa" }}>Rambatan Kulon, Indramayu</div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            background: STATUS[overall].bg,
            border: `1px solid ${STATUS[overall].border}`,
            borderRadius: 20, padding: "3px 10px",
            fontSize: 11, fontWeight: 700,
            color: STATUS[overall].color,
          }}>
            {STATUS[overall].label}
          </div>
          <button onClick={() => setPage("notifikasi")} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>🔔</button>
          <button
            onClick={() => window.location.href = "/admin/login"}
            style={{
              background: "#f0f4f8", border: "1px solid #e0e0e0",
              borderRadius: 8, padding: "5px 10px",
              fontSize: 11, color: "#888", cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Login
          </button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 80px" }}>
        {page === "home"       && <PageHome time={time} selectedLoc={selectedLoc} setSelectedLoc={setSelectedLoc} setPage={setPage} />}
        {page === "peta"       && <PagePeta />}
        {page === "posko"      && <PagePosko />}
        {page === "notifikasi" && <PageNotifikasi />}
      </main>

      {/* ── BOTTOM NAV ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", boxShadow: "0 -2px 10px rgba(0,0,0,0.08)",
        display: "flex", justifyContent: "space-around",
        padding: "8px 0 env(safe-area-inset-bottom, 8px)",
        zIndex: 100,
      }}>
        {[
          { key: "home",       label: "Beranda",    icon: "🏠" },
          { key: "peta",       label: "Peta",       icon: "📍" },
          { key: "posko",      label: "Posko",      icon: "🏥" },
          { key: "notifikasi", label: "Notifikasi", icon: "🔔" },
        ].map(n => (
          <button key={n.key} onClick={() => setPage(n.key)} style={{
            background: "none", border: "none",
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 2, cursor: "pointer",
            color: page === n.key ? "#3498db" : "#aaa",
            padding: "4px 12px", transition: "color 0.15s",
          }}>
            <span style={{ fontSize: 22 }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontWeight: page === n.key ? 700 : 400 }}>{n.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f4f8; }
        button:active { opacity: 0.8; }
        ::-webkit-scrollbar { display: none; }
        .leaflet-container { width: 100% !important; height: 100% !important; }
      `}</style>
    </div>
  );
}