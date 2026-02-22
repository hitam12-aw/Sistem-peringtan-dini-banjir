"use client";

import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// ─── DATA DUMMY ───────────────────────────────────────────────────────────────
const locations = [
  { id: 1, name: "Sungai Ciliwung", lat: -6.2088, lng: 106.8456, level: 320, maxLevel: 350, status: "bahaya",  rain: 87 },
  { id: 2, name: "Sungai Cisadane", lat: -6.2500, lng: 106.7000, level: 210, maxLevel: 300, status: "waspada", rain: 54 },
  { id: 3, name: "Kali Angke",      lat: -6.1800, lng: 106.7200, level: 95,  maxLevel: 250, status: "aman",    rain: 22 },
  { id: 4, name: "Sungai Bekasi",   lat: -6.2349, lng: 107.0000, level: 180, maxLevel: 280, status: "waspada", rain: 61 },
  { id: 5, name: "Kali Sunter",     lat: -6.1900, lng: 106.8700, level: 290, maxLevel: 310, status: "bahaya",  rain: 92 },
];

const rainfallHistory = [
  { time: "00:00", Ciliwung: 45, Cisadane: 30, Angke: 10 },
  { time: "02:00", Ciliwung: 55, Cisadane: 35, Angke: 12 },
  { time: "04:00", Ciliwung: 70, Cisadane: 42, Angke: 18 },
  { time: "06:00", Ciliwung: 80, Cisadane: 50, Angke: 20 },
  { time: "08:00", Ciliwung: 87, Cisadane: 54, Angke: 22 },
  { time: "10:00", Ciliwung: 92, Cisadane: 60, Angke: 19 },
  { time: "12:00", Ciliwung: 78, Cisadane: 48, Angke: 15 },
];

const waterLevelHistory = [
  { time: "00:00", level: 200, batas: 350 },
  { time: "02:00", level: 230, batas: 350 },
  { time: "04:00", level: 265, batas: 350 },
  { time: "06:00", level: 290, batas: 350 },
  { time: "08:00", level: 310, batas: 350 },
  { time: "10:00", level: 320, batas: 350 },
  { time: "12:00", level: 318, batas: 350 },
];

const alertsData = [
  { id: 1, time: "12:45", loc: "Sungai Ciliwung", msg: "Ketinggian air mendekati batas kritis 350cm", level: "bahaya" },
  { id: 2, time: "11:30", loc: "Kali Sunter",     msg: "Curah hujan ekstrem 92mm/jam terdeteksi",    level: "bahaya" },
  { id: 3, time: "10:15", loc: "Sungai Bekasi",   msg: "Ketinggian air naik 30cm dalam 2 jam",       level: "waspada" },
  { id: 4, time: "09:00", loc: "Sungai Cisadane", msg: "Status meningkat ke level waspada",           level: "waspada" },
  { id: 5, time: "07:30", loc: "Kali Angke",      msg: "Pemantauan normal, tidak ada anomali",        level: "aman" },
];

const STATUS = {
  aman:    { color: "#00e5a0", bg: "rgba(0,229,160,0.08)",  border: "rgba(0,229,160,0.25)",  label: "AMAN",    icon: "●" },
  waspada: { color: "#ffb830", bg: "rgba(255,184,48,0.08)", border: "rgba(255,184,48,0.25)", label: "WASPADA", icon: "▲" },
  bahaya:  { color: "#ff3d5a", bg: "rgba(255,61,90,0.08)",  border: "rgba(255,61,90,0.25)",  label: "BAHAYA",  icon: "■" },
};

const NAV_ITEMS = [
  { key: "dashboard",  label: "Dashboard",  icon: "⬡" },
  { key: "peta",       label: "Peta",       icon: "◈" },
  { key: "grafik",     label: "Grafik",     icon: "◫" },
  { key: "peringatan", label: "Peringatan", icon: "◬" },
];

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({ status }) {
  const s = STATUS[status];
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      borderRadius: 3, padding: "2px 8px",
      fontSize: 10, fontWeight: 700, letterSpacing: 2,
      fontFamily: "monospace", whiteSpace: "nowrap",
    }}>
      {s.icon} {s.label}
    </span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 10, padding: 18,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontFamily: "monospace", fontSize: 10,
      letterSpacing: 3, color: "#555",
      textTransform: "uppercase", marginBottom: 14,
    }}>
      ▸ {children}
    </div>
  );
}

// ─── MAP VIEW (LEAFLET) ───────────────────────────────────────────────────────
function MapView({ selected, onSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

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

      const map = L.map(mapRef.current).setView([-6.2088, 106.8456], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      locations.forEach((loc) => {
        const s = STATUS[loc.status];
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
            <div style="font-weight:900;font-size:13px;margin-bottom:6px">${loc.name}</div>
            <div style="color:${s.color};font-weight:700;margin-bottom:8px">● ${s.label}</div>
            <div style="font-size:11px;color:#555;margin-bottom:2px">Ketinggian Air: <b>${loc.level} cm</b></div>
            <div style="font-size:11px;color:#555;margin-bottom:2px">Batas Kritis: <b>${loc.maxLevel} cm</b></div>
            <div style="font-size:11px;color:#555">Curah Hujan: <b>${loc.rain} mm/jam</b></div>
          </div>
        `);

        circle.on("click", () => onSelect(loc));
        markersRef.current.push(circle);
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
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ width: "100%", height: 400, borderRadius: 10, overflow: "hidden" }} />
    </>
  );
}

// ─── PAGE: DASHBOARD ─────────────────────────────────────────────────────────
function PageDashboard({ selected, setSelected, time }) {
  const danger  = locations.filter(l => l.status === "bahaya").length;
  const waspada = locations.filter(l => l.status === "waspada").length;
  const overall = danger > 0 ? "bahaya" : waspada > 0 ? "waspada" : "aman";
  const os = STATUS[overall];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Banner */}
      <div style={{
        background: os.bg, border: `1px solid ${os.border}`,
        borderRadius: 10, padding: "18px 20px",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#555", letterSpacing: 3, marginBottom: 6 }}>STATUS KESELURUHAN SISTEM</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: os.color, fontFamily: "monospace", letterSpacing: 3 }}>
            {os.icon} {os.label}
          </div>
          <div style={{ fontSize: 11, color: "#555", marginTop: 6, fontFamily: "monospace" }}>
            {danger} Bahaya · {waspada} Waspada · {locations.length - danger - waspada} Aman
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div suppressHydrationWarning style={{ fontFamily: "monospace", fontSize: 20, color: "#ccc" }}>
            {time.toLocaleTimeString("id-ID")}
          </div>
          <div suppressHydrationWarning style={{ fontFamily: "monospace", fontSize: 10, color: "#444", marginTop: 4 }}>
            {time.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
        {[
          { label: "Titik Pantau",    value: locations.length, unit: "lokasi", color: "#00e5a0", sub: "Semua aktif" },
          { label: "Level Tertinggi", value: 320,              unit: "cm",     color: "#ff3d5a", sub: "Ciliwung" },
          { label: "Curah Hujan Max", value: 92,               unit: "mm/jam", color: "#ff3d5a", sub: "Kali Sunter" },
          { label: "Zona Bahaya",     value: danger,           unit: "titik",  color: "#ff3d5a", sub: "Perlu evakuasi" },
        ].map((s, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>
              {s.value}
              <span style={{ fontSize: 12, color: "#666", marginLeft: 4 }}>{s.unit}</span>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#444", marginTop: 6 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Lokasi List */}
      <Card>
        <SectionTitle>Status Semua Lokasi</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {locations.map(loc => {
            const pct = Math.round((loc.level / loc.maxLevel) * 100);
            const s = STATUS[loc.status];
            const isSel = selected?.id === loc.id;
            return (
              <div key={loc.id} onClick={() => setSelected(loc)} style={{
                background: isSel ? s.bg : "rgba(255,255,255,0.02)",
                border: `1px solid ${isSel ? s.border : "rgba(255,255,255,0.05)"}`,
                borderRadius: 8, padding: "12px 14px", cursor: "pointer",
                transition: "all 0.2s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 13, color: "#ddd", fontWeight: 700 }}>{loc.name}</div>
                  <Badge status={loc.status} />
                </div>
                <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#666" }}>Ketinggian: <span style={{ color: s.color }}>{loc.level} cm</span></span>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#666" }}>Hujan: <span style={{ color: "#aaa" }}>{loc.rain} mm/jam</span></span>
                </div>
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, height: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: s.color, borderRadius: 4, transition: "width 0.5s" }} />
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: "#444", marginTop: 4 }}>{pct}% dari batas kritis</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Alert terbaru */}
      <Card>
        <SectionTitle>Peringatan Terbaru</SectionTitle>
        {alertsData.slice(0, 3).map(a => {
          const s = STATUS[a.level];
          return (
            <div key={a.id} style={{
              borderLeft: `3px solid ${s.color}`,
              background: s.bg, borderRadius: "0 6px 6px 0",
              padding: "10px 14px", marginBottom: 8,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: s.color, fontWeight: 700 }}>{a.loc}</div>
                <div style={{ fontFamily: "monospace", fontSize: 10, color: "#555" }}>{a.time} WIB</div>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#888", marginTop: 4 }}>{a.msg}</div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── PAGE: PETA ───────────────────────────────────────────────────────────────
function PagePeta({ selected, setSelected }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <SectionTitle>Peta Lokasi Rawan Banjir — Jabodetabek</SectionTitle>
        <MapView selected={selected} onSelect={setSelected} />
        <div style={{ display: "flex", gap: 14, marginTop: 12, flexWrap: "wrap" }}>
          {Object.entries(STATUS).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: v.color, opacity: 0.8 }} />
              <span style={{ fontFamily: "monospace", fontSize: 10, color: "#666" }}>{v.label}</span>
            </div>
          ))}
        </div>
      </Card>
      {selected ? (
        <Card style={{ borderLeft: `3px solid ${STATUS[selected.status].color}` }}>
          <SectionTitle>Detail Lokasi Terpilih</SectionTitle>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 900, color: "#ddd", marginBottom: 8 }}>{selected.name}</div>
              <Badge status={selected.status} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "Ketinggian Air", value: `${selected.level} cm` },
                { label: "Batas Kritis",   value: `${selected.maxLevel} cm` },
                { label: "Curah Hujan",    value: `${selected.rain} mm/jam` },
                { label: "Kapasitas",      value: `${Math.round((selected.level / selected.maxLevel) * 100)}%` },
              ].map((d, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "8px 12px" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: "#555", letterSpacing: 2 }}>{d.label}</div>
                  <div style={{ fontFamily: "monospace", fontSize: 16, color: STATUS[selected.status].color, fontWeight: 700, marginTop: 2 }}>{d.value}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <div style={{ textAlign: "center", fontFamily: "monospace", color: "#444", fontSize: 12, padding: 20 }}>
          Klik titik pada peta untuk melihat detail lokasi
        </div>
      )}
    </div>
  );
}

// ─── PAGE: GRAFIK ─────────────────────────────────────────────────────────────
const TOOLTIP_STYLE = {
  background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6, fontFamily: "monospace", fontSize: 11,
};

function PageGrafik() {
  const [tab, setTab] = useState("curah");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {[{ key: "curah", label: "Curah Hujan" }, { key: "ketinggian", label: "Ketinggian Air" }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: tab === t.key ? "rgba(0,229,160,0.12)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${tab === t.key ? "rgba(0,229,160,0.4)" : "rgba(255,255,255,0.07)"}`,
            color: tab === t.key ? "#00e5a0" : "#666",
            borderRadius: 6, padding: "8px 16px",
            fontFamily: "monospace", fontSize: 11, cursor: "pointer",
            letterSpacing: 1, transition: "all 0.2s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "curah" && (
        <Card>
          <SectionTitle>Curah Hujan per Lokasi (mm/jam)</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={rainfallHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                {[["Ciliwung","#ff3d5a"],["Cisadane","#ffb830"],["Angke","#00e5a0"]].map(([n,c]) => (
                  <linearGradient key={n} id={`g${n}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: "#555", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#555", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              {[["Ciliwung","#ff3d5a"],["Cisadane","#ffb830"],["Angke","#00e5a0"]].map(([n,c]) => (
                <Area key={n} type="monotone" dataKey={n} stroke={c} strokeWidth={2} fill={`url(#g${n})`} dot={false} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            {[["Ciliwung","#ff3d5a"],["Cisadane","#ffb830"],["Angke","#00e5a0"]].map(([n,c]) => (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 24, height: 2, background: c, borderRadius: 2 }} />
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "#666" }}>{n}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "ketinggian" && (
        <Card>
          <SectionTitle>Ketinggian Air Ciliwung (cm)</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={waterLevelHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="glevel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff3d5a" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ff3d5a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: "#555", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#555", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="level" stroke="#ff3d5a" strokeWidth={2} fill="url(#glevel)" dot={false} name="Ketinggian" />
              <Area type="monotone" dataKey="batas" stroke="rgba(255,184,48,0.5)" strokeWidth={1} strokeDasharray="5 5" fill="none" dot={false} name="Batas Kritis" />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 24, height: 2, background: "#ff3d5a", borderRadius: 2 }} />
              <span style={{ fontFamily: "monospace", fontSize: 10, color: "#666" }}>Ketinggian</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 24, height: 2, background: "#ffb830", borderRadius: 2, opacity: 0.6 }} />
              <span style={{ fontFamily: "monospace", fontSize: 10, color: "#666" }}>Batas Kritis</span>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <SectionTitle>Curah Hujan Saat Ini per Lokasi</SectionTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={locations.map(l => ({ name: l.name.replace("Sungai ","").replace("Kali ",""), rain: l.rain }))}
            margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" tick={{ fill: "#555", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#555", fontSize: 10, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="rain" name="Curah Hujan (mm/jam)" radius={[4,4,0,0]} fill="#00e5a0" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ─── PAGE: PERINGATAN ────────────────────────────────────────────────────────
function PagePeringatan() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12 }}>
        {[
          { label: "Total",   value: alertsData.length, color: "#aaa" },
          { label: "Bahaya",  value: alertsData.filter(a => a.level === "bahaya").length,  color: "#ff3d5a" },
          { label: "Waspada", value: alertsData.filter(a => a.level === "waspada").length, color: "#ffb830" },
          { label: "Aman",    value: alertsData.filter(a => a.level === "aman").length,    color: "#00e5a0" },
        ].map((s, i) => (
          <Card key={i} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "monospace", fontSize: 32, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#555", letterSpacing: 2, marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle>Riwayat Peringatan Hari Ini</SectionTitle>
        {alertsData.map(a => {
          const s = STATUS[a.level];
          return (
            <div key={a.id} style={{
              borderLeft: `3px solid ${s.color}`,
              background: s.bg, borderRadius: "0 8px 8px 0",
              padding: "14px 16px", marginBottom: 10,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <Badge status={a.level} />
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: "#ccc", fontWeight: 700 }}>{a.loc}</span>
                </div>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: "#555" }}>{a.time} WIB</span>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#888" }}>{a.msg}</div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [time, setTime] = useState(new Date());
  const menuRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function navigate(key) {
    setPage(key);
    setMenuOpen(false);
  }

  const danger  = locations.filter(l => l.status === "bahaya").length;
  const waspada = locations.filter(l => l.status === "waspada").length;
  const overall = danger > 0 ? "bahaya" : waspada > 0 ? "waspada" : "aman";

  return (
    <div style={{ minHeight: "100vh", background: "#080c12", color: "#ccc" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(8,12,18,0.96)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 58, gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: STATUS[overall].bg,
            border: `1px solid ${STATUS[overall].border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>💧</div>
          <div>
            <div style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 13, color: "#ddd", letterSpacing: 1 }}>SIBANJIR</div>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#444", letterSpacing: 2 }}>PERINGATAN DINI</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }} ref={menuRef}>
          <div style={{
            background: STATUS[overall].bg,
            border: `1px solid ${STATUS[overall].border}`,
            borderRadius: 20, padding: "4px 12px",
            fontFamily: "monospace", fontSize: 10,
            color: STATUS[overall].color, letterSpacing: 2,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 8 }}>●</span>
            {overall.toUpperCase()}
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              background: menuOpen ? "rgba(0,229,160,0.1)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${menuOpen ? "rgba(0,229,160,0.3)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8, width: 40, height: 40,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 5, cursor: "pointer", padding: 0,
              transition: "all 0.2s", flexShrink: 0,
            }}
            aria-label="Toggle menu"
          >
            <span style={{ display: "block", width: 18, height: 2, background: menuOpen ? "#00e5a0" : "#888", borderRadius: 2, transition: "all 0.25s", transform: menuOpen ? "translateY(7px) rotate(45deg)" : "none" }} />
            <span style={{ display: "block", width: 18, height: 2, background: menuOpen ? "transparent" : "#888", borderRadius: 2, transition: "all 0.25s", opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: "block", width: 18, height: 2, background: menuOpen ? "#00e5a0" : "#888", borderRadius: 2, transition: "all 0.25s", transform: menuOpen ? "translateY(-7px) rotate(-45deg)" : "none" }} />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div style={{
              position: "absolute", top: 58, right: 0, width: 230,
              background: "rgba(10,14,22,0.99)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.08)", borderTop: "none",
              borderRadius: "0 0 0 14px", padding: "10px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.7)", zIndex: 200,
            }}>
              {NAV_ITEMS.map(n => (
                <button key={n.key} onClick={() => navigate(n.key)} style={{
                  width: "100%", textAlign: "left",
                  background: page === n.key ? "rgba(0,229,160,0.08)" : "transparent",
                  border: "none",
                  borderLeft: `2px solid ${page === n.key ? "#00e5a0" : "transparent"}`,
                  color: page === n.key ? "#00e5a0" : "#777",
                  padding: "11px 14px", borderRadius: "0 6px 6px 0",
                  fontFamily: "monospace", fontSize: 12,
                  cursor: "pointer", letterSpacing: 1,
                  display: "flex", alignItems: "center", gap: 12,
                  transition: "all 0.15s", marginBottom: 3,
                }}>
                  <span style={{ fontSize: 18 }}>{n.icon}</span>
                  {n.label}
                </button>
              ))}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 10, padding: "10px 14px 2px" }}>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: "#333", letterSpacing: 2 }}>UPDATE TERAKHIR</div>
                <div suppressHydrationWarning style={{ fontFamily: "monospace", fontSize: 12, color: "#555", marginTop: 4 }}>
                  {time.toLocaleTimeString("id-ID")}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px 100px" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#444", letterSpacing: 3, marginBottom: 4 }}>
            {NAV_ITEMS.find(n => n.key === page)?.icon} {page.toUpperCase()}
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#ddd", fontFamily: "monospace" }}>
            {NAV_ITEMS.find(n => n.key === page)?.label}
          </h1>
        </div>

        {page === "dashboard"  && <PageDashboard selected={selected} setSelected={setSelected} time={time} />}
        {page === "peta"       && <PagePeta      selected={selected} setSelected={setSelected} />}
        {page === "grafik"     && <PageGrafik />}
        {page === "peringatan" && <PagePeringatan />}
      </main>

      {/* ── BOTTOM NAV ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(8,12,18,0.97)", backdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", justifyContent: "space-around",
        padding: "8px 0 env(safe-area-inset-bottom, 12px)", zIndex: 50,
      }}>
        {NAV_ITEMS.map(n => (
          <button key={n.key} onClick={() => navigate(n.key)} style={{
            background: "none", border: "none",
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3, cursor: "pointer",
            color: page === n.key ? "#00e5a0" : "#444",
            padding: "4px 16px", transition: "color 0.15s",
            borderTop: page === n.key ? "2px solid #00e5a0" : "2px solid transparent",
            marginTop: -1,
          }}>
            <span style={{ fontSize: 20, marginTop: 4 }}>{n.icon}</span>
            <span style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: 1 }}>{n.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; overflow-x: hidden; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>
    </div>
  );
}