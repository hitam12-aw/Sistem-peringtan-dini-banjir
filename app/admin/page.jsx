"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import dynamic from "next/dynamic";

const MapBanjir = dynamic(() => import("../component/MapBanjir"), { ssr: false });

const STATUS_OPTIONS = ["aman", "waspada", "bahaya"];
const STATUS = {
  aman:    { color: "#1A7A4A", bg: "#EEF8F3",  border: "rgba(26,122,74,0.25)",   label: "AMAN",   pill: "#1A7A4A" },
  waspada: { color: "#C07A1A", bg: "#FEF8EF",  border: "rgba(192,122,26,0.25)",  label: "SIAGA",  pill: "#D4872A" },
  bahaya:  { color: "#B0281A", bg: "#FDF0EF",  border: "rgba(176,40,26,0.25)",   label: "BAHAYA", pill: "#C0392B" },
};

const LAPORAN_STATUS = {
  pending:   { label: "Pending",   color: "#C07A1A", bg: "#FEF8EF" },
  diproses:  { label: "Diproses",  color: "#0A61C9", bg: "#EEF4FD" },
  selesai:   { label: "Selesai",   color: "#1A7A4A", bg: "#EEF8F3" },
};

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 13,
  color: "#E8F0F8",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  transition: "border-color 0.2s",
};

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const IconMap = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);
const IconList = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);
const IconHome = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconSettings = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconFileText = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
);
const IconEdit = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const IconPlus = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconCheck = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconX = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconDroplet = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="rgba(255,255,255,0.9)" stroke="none">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);
const IconLogOut = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IconGlobe = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const IconActivity = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: #07326A; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

  .admin-root {
    min-height: 100vh;
    background: #07326A;
    font-family: 'Plus Jakarta Sans', sans-serif;
    position: relative;
  }
  .grid-overlay {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
    z-index: 0;
  }
  .admin-header {
    position: sticky; top: 0; z-index: 200;
    background: rgba(7,50,106,0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    padding: 0 20px;
    height: 60px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .header-brand {
    display: flex; align-items: center; gap: 12px;
  }
  .header-logo {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #0A61C9, #749DC8);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 12px rgba(10,97,201,0.4);
    flex-shrink: 0;
  }
  .header-title { font-size: 15px; font-weight: 700; color: #fff; }
  .header-sub { font-size: 10px; color: rgba(255,255,255,0.4); font-weight: 400; }
  .header-actions { display: flex; align-items: center; gap: 8px; }
  .hdr-btn {
    display: flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    padding: 7px 12px;
    color: rgba(255,255,255,0.7);
    font-size: 12px; font-weight: 600;
    cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all 0.2s;
  }
  .hdr-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .hdr-btn.danger { border-color: rgba(192,57,43,0.3); }
  .hdr-btn.danger:hover { background: rgba(192,57,43,0.15); color: #f1948a; }

  /* Greeting bar */
  .greeting-bar {
    padding: 20px 20px 0;
    position: relative; z-index: 1;
  }
  .greeting-text { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 2px; }
  .greeting-sub { font-size: 12px; color: rgba(255,255,255,0.4); }

  /* Stats row */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    padding: 16px 20px;
    position: relative; z-index: 1;
  }
  @media (max-width: 600px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
  .stat-card {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 14px;
    transition: all 0.2s;
  }
  .stat-card:hover { background: rgba(255,255,255,0.08); }
  .stat-label { font-size: 10px; color: rgba(255,255,255,0.4); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .stat-value { font-size: 24px; font-weight: 800; color: #fff; line-height: 1; }
  .stat-desc { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 4px; }

  /* Main content */
  .admin-main {
    max-width: 760px;
    margin: 0 auto;
    padding: 0 20px 40px;
    position: relative; z-index: 1;
  }

  /* Map card */
  .map-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    overflow: hidden;
    margin-bottom: 16px;
  }
  .map-card-header {
    padding: 16px 18px 12px;
    display: flex; align-items: center; gap: 10px;
  }
  .section-icon {
    width: 30px; height: 30px;
    background: rgba(10,97,201,0.2);
    border: 1px solid rgba(10,97,201,0.3);
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    color: #749DC8;
    flex-shrink: 0;
  }
  .section-title { font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.9); }
  .section-sub { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 1px; }

  /* Tabs */
  .tab-bar {
    display: flex; gap: 6px;
    margin-bottom: 16px;
    overflow-x: auto;
    padding-bottom: 2px;
  }
  .tab-bar::-webkit-scrollbar { display: none; }
  .tab-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 9px 16px;
    border-radius: 12px;
    font-size: 12px; font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all 0.2s;
    border: 1px solid transparent;
  }
  .tab-btn.inactive {
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.45);
    border-color: rgba(255,255,255,0.06);
  }
  .tab-btn.inactive:hover {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.7);
  }
  .tab-btn.active {
    background: linear-gradient(135deg, #0A61C9, #1a7be8);
    color: #fff;
    box-shadow: 0 4px 16px rgba(10,97,201,0.4);
  }

  /* Content card */
  .content-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 18px;
    margin-bottom: 0;
    backdrop-filter: blur(4px);
  }
  .content-card-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px; gap: 12px; flex-wrap: wrap;
  }

  /* Item card */
  .item-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    padding: 14px;
    transition: all 0.2s;
  }
  .item-card:hover { background: rgba(255,255,255,0.06); }
  .item-card.editing {
    background: rgba(10,97,201,0.08);
    border-color: rgba(10,97,201,0.3);
  }

  /* Form grid */
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
    margin-bottom: 12px;
  }
  .form-label {
    font-size: 10px; font-weight: 600;
    color: rgba(255,255,255,0.4);
    display: block; margin-bottom: 6px;
    letter-spacing: 0.4px; text-transform: uppercase;
  }

  /* Buttons */
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 12px; font-weight: 600;
    cursor: pointer;
    border: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .btn-primary { background: linear-gradient(135deg, #0A61C9, #1a7be8); color: #fff; box-shadow: 0 4px 12px rgba(10,97,201,0.3); }
  .btn-primary:hover { box-shadow: 0 6px 18px rgba(10,97,201,0.45); transform: translateY(-1px); }
  .btn-primary:disabled { background: rgba(255,255,255,0.1); box-shadow: none; cursor: not-allowed; transform: none; }
  .btn-success { background: rgba(26,122,74,0.2); color: #4ade80; border: 1px solid rgba(26,122,74,0.3); }
  .btn-success:hover { background: rgba(26,122,74,0.3); }
  .btn-success:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-ghost { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.08); }
  .btn-ghost:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.7); }
  .btn-danger { background: rgba(192,57,43,0.12); color: #f1948a; border: 1px solid rgba(192,57,43,0.25); }
  .btn-danger:hover { background: rgba(192,57,43,0.2); }

  /* Status pills */
  .pill {
    display: inline-flex; align-items: center;
    padding: 3px 10px;
    border-radius: 99px;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.3px;
  }
  .pill-aman { background: rgba(26,122,74,0.15); color: #4ade80; border: 1px solid rgba(26,122,74,0.3); }
  .pill-waspada { background: rgba(212,135,42,0.15); color: #fbbf24; border: 1px solid rgba(212,135,42,0.3); }
  .pill-bahaya { background: rgba(192,57,43,0.15); color: #f87171; border: 1px solid rgba(192,57,43,0.3); }
  .pill-aktif { background: rgba(26,122,74,0.15); color: #4ade80; border: 1px solid rgba(26,122,74,0.3); }
  .pill-penuh { background: rgba(212,135,42,0.15); color: #fbbf24; border: 1px solid rgba(212,135,42,0.3); }
  .pill-tutup { background: rgba(192,57,43,0.15); color: #f87171; border: 1px solid rgba(192,57,43,0.3); }
  .pill-pending { background: rgba(212,135,42,0.12); color: #fbbf24; border: 1px solid rgba(212,135,42,0.2); }
  .pill-diproses { background: rgba(10,97,201,0.12); color: #60a5fa; border: 1px solid rgba(10,97,201,0.25); }
  .pill-selesai { background: rgba(26,122,74,0.12); color: #4ade80; border: 1px solid rgba(26,122,74,0.25); }

  /* Error box */
  .empty-state {
    text-align: center;
    padding: 32px;
    color: rgba(255,255,255,0.25);
    font-size: 13px;
  }

  /* Divider */
  .list-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 0 -14px; }

  /* Select / input dark */
  select option { background: #07326A; color: #fff; }

  /* Loader */
  .loader-wrap { display: flex; align-items: center; justify-content: center; padding: 36px; }
  .loader { width: 24px; height: 24px; border: 2px solid rgba(255,255,255,0.1); border-top-color: #0A61C9; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Filter pills row */
  .filter-row { display: flex; gap: 6px; flex-wrap: wrap; }
  .filter-pill {
    padding: 5px 12px; border-radius: 99px;
    font-size: 11px; font-weight: 600;
    cursor: pointer; border: none;
    font-family: 'Plus Jakarta Sans', sans-serif;
    transition: all 0.15s;
  }
  .filter-pill.on { background: #0A61C9; color: #fff; box-shadow: 0 2px 8px rgba(10,97,201,0.35); }
  .filter-pill.off { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.08); }
  .filter-pill.off:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.65); }

  /* Range indicator */
  .range-badge {
    display: inline-flex; align-items: center;
    padding: 4px 10px; border-radius: 8px;
    font-size: 11px; font-weight: 600;
  }
`;

// ─── SECTION: LOKASI ──────────────────────────────────────────────────────────
function SectionLokasi({ locations, loading, fetchLocations }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  function startEdit(loc) { setEditing(loc.id); setForm({ ...loc }); }

  async function saveEdit() {
    setSaving(true);
    await supabase.from("lokasi_banjir").update({
      status: form.status,
      level_air: parseInt(form.level_air),
      curah_hujan: parseInt(form.curah_hujan),
      keterangan: form.keterangan,
    }).eq("id", form.id);
    setSaving(false);
    setEditing(null);
    fetchLocations();
  }

  return (
    <div className="content-card">
      <div className="content-card-header">
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div className="section-icon"><IconList /></div>
          <div>
            <div className="section-title">Manajemen Data Lokasi</div>
            <div className="section-sub">Update status & level air tiap titik pemantauan</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loader-wrap"><div className="loader" /></div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {locations.map((loc, i) => {
            const s = STATUS[loc.status] || STATUS.aman;
            const isEditing = editing === loc.id;
            return (
              <div key={loc.id} className={`item-card ${isEditing ? "editing" : ""}`}>
                {isEditing ? (
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.6)", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
                      <IconEdit size={13} /> Edit — {loc.nama}
                    </div>
                    <div className="form-grid">
                      <div>
                        <label className="form-label">Status</label>
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Level Air (cm)</label>
                        <input type="number" value={form.level_air} onChange={e => setForm({ ...form, level_air: e.target.value })} style={inputStyle} />
                      </div>
                      <div>
                        <label className="form-label">Curah Hujan (mm/jam)</label>
                        <input type="number" value={form.curah_hujan} onChange={e => setForm({ ...form, curah_hujan: e.target.value })} style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ marginBottom:14 }}>
                      <label className="form-label">Keterangan</label>
                      <input type="text" value={form.keterangan || ""} onChange={e => setForm({ ...form, keterangan: e.target.value })} style={inputStyle} placeholder="Tambahkan keterangan..." />
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button className="btn btn-success" onClick={saveEdit} disabled={saving}>
                        <IconCheck />{saving ? "Menyimpan..." : "Simpan"}
                      </button>
                      <button className="btn btn-ghost" onClick={() => setEditing(null)}>
                        <IconX />Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.9)", marginBottom:6 }}>{loc.nama}</div>
                      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                        <span className={`pill pill-${loc.status}`}>{s.label}</span>
                        <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign:"middle", marginRight:3 }}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                          {loc.level_air} cm
                        </span>
                        <span style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign:"middle", marginRight:3 }}><line x1="8" y1="19" x2="8" y2="21"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="16" y1="19" x2="16" y2="21"/><line x1="16" y1="13" x2="16" y2="15"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="12" y1="15" x2="12" y2="17"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>
                          {loc.curah_hujan} mm/jam
                        </span>
                      </div>
                      {loc.keterangan && <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginTop:5 }}>{loc.keterangan}</div>}
                    </div>
                    <button className="btn btn-ghost" onClick={() => startEdit(loc)} style={{ flexShrink:0 }}>
                      <IconEdit />Edit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── SECTION: POSKO ───────────────────────────────────────────────────────────
function SectionPosko() {
  const [poskos, setPoskos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPosko(); }, []);

  async function fetchPosko() {
    setLoading(true);
    const { data } = await supabase.from("posko").select("*").order("id");
    setPoskos(data || []);
    setLoading(false);
  }

  async function savePosko() {
    setSaving(true);
    if (adding) {
      await supabase.from("posko").insert({
        nama: form.nama, alamat: form.alamat,
        lat: parseFloat(form.lat), lng: parseFloat(form.lng),
        jarak: form.jarak, kapasitas: parseInt(form.kapasitas || 0),
        status: form.status || "aktif",
      });
    } else {
      await supabase.from("posko").update({
        nama: form.nama, alamat: form.alamat,
        lat: parseFloat(form.lat), lng: parseFloat(form.lng),
        jarak: form.jarak, kapasitas: parseInt(form.kapasitas || 0),
        status: form.status,
      }).eq("id", form.id);
    }
    setSaving(false);
    setEditing(null);
    setAdding(false);
    setForm({});
    fetchPosko();
  }

  async function deletePosko(id) {
    if (!confirm("Hapus posko ini?")) return;
    await supabase.from("posko").delete().eq("id", id);
    fetchPosko();
  }

  const isFormOpen = editing !== null || adding;

  return (
    <div className="content-card">
      <div className="content-card-header">
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div className="section-icon"><IconHome /></div>
          <div>
            <div className="section-title">Manajemen Posko</div>
            <div className="section-sub">Kelola titik posko pengungsian</div>
          </div>
        </div>
        {!isFormOpen && (
          <button className="btn btn-primary" onClick={() => { setAdding(true); setForm({ status: "aktif" }); }}>
            <IconPlus size={13} />Tambah Posko
          </button>
        )}
      </div>

      {isFormOpen && (
        <div style={{ background:"rgba(10,97,201,0.08)", border:"1px solid rgba(10,97,201,0.2)", borderRadius:14, padding:16, marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.6)", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
            {adding ? <><IconPlus size={13} /> Tambah Posko Baru</> : <><IconEdit size={13} /> Edit: {form.nama}</>}
          </div>
          <div className="form-grid">
            <div>
              <label className="form-label">Nama Posko</label>
              <input type="text" value={form.nama || ""} onChange={e => setForm({ ...form, nama: e.target.value })} style={inputStyle} placeholder="Nama posko" />
            </div>
            <div>
              <label className="form-label">Jarak</label>
              <input type="text" value={form.jarak || ""} onChange={e => setForm({ ...form, jarak: e.target.value })} style={inputStyle} placeholder="1.2 km" />
            </div>
            <div>
              <label className="form-label">Kapasitas (orang)</label>
              <input type="number" value={form.kapasitas || ""} onChange={e => setForm({ ...form, kapasitas: e.target.value })} style={inputStyle} placeholder="100" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select value={form.status || "aktif"} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                <option value="aktif">Aktif</option>
                <option value="penuh">Penuh</option>
                <option value="tutup">Tutup</option>
              </select>
            </div>
            <div>
              <label className="form-label">Latitude</label>
              <input type="number" step="0.0001" value={form.lat || ""} onChange={e => setForm({ ...form, lat: e.target.value })} style={inputStyle} placeholder="-6.3271" />
            </div>
            <div>
              <label className="form-label">Longitude</label>
              <input type="number" step="0.0001" value={form.lng || ""} onChange={e => setForm({ ...form, lng: e.target.value })} style={inputStyle} placeholder="108.3254" />
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label className="form-label">Alamat</label>
            <input type="text" value={form.alamat || ""} onChange={e => setForm({ ...form, alamat: e.target.value })} style={inputStyle} placeholder="Alamat lengkap posko" />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-success" onClick={savePosko} disabled={saving}>
              <IconCheck />{saving ? "Menyimpan..." : "Simpan"}
            </button>
            <button className="btn btn-ghost" onClick={() => { setEditing(null); setAdding(false); setForm({}); }}>
              <IconX />Batal
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loader-wrap"><div className="loader" /></div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {poskos.map(p => {
            const pillClass = p.status === "aktif" ? "pill-aktif" : p.status === "penuh" ? "pill-penuh" : "pill-tutup";
            return (
              <div key={p.id} className="item-card">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, flexWrap:"wrap" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.9)" }}>{p.nama}</div>
                      <span className={`pill ${pillClass}`}>{p.status?.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:4 }}>{p.alamat}</div>
                    <div style={{ display:"flex", gap:14 }}>
                      <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign:"middle", marginRight:3 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        {p.jarak}
                      </span>
                      <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign:"middle", marginRight:3 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        {p.kapasitas} orang
                      </span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button className="btn btn-ghost" onClick={() => { setEditing(p.id); setAdding(false); setForm({ ...p }); }}>
                      <IconEdit />
                    </button>
                    <button className="btn btn-danger" onClick={() => deletePosko(p.id)}>
                      <IconTrash />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── SECTION: PENGATURAN ──────────────────────────────────────────────────────
function SectionPengaturan({ locations }) {
  const [pengaturan, setPengaturan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPengaturan(); }, []);

  async function fetchPengaturan() {
    setLoading(true);
    const { data } = await supabase.from("pengaturan").select("*, lokasi_banjir(nama)").order("id");
    setPengaturan(data || []);
    setLoading(false);
  }

  async function savePengaturan() {
    setSaving(true);
    await supabase.from("pengaturan").update({
      batas_aman: parseInt(form.batas_aman),
      batas_waspada: parseInt(form.batas_waspada),
      batas_bahaya: parseInt(form.batas_bahaya),
    }).eq("id", form.id);
    setSaving(false);
    setEditing(null);
    fetchPengaturan();
  }

  return (
    <div className="content-card">
      <div className="content-card-header">
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div className="section-icon"><IconSettings /></div>
          <div>
            <div className="section-title">Pengaturan Batas Level Air</div>
            <div className="section-sub">Konfigurasi ambang batas tiap lokasi</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loader-wrap"><div className="loader" /></div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {pengaturan.map(p => (
            <div key={p.id} className={`item-card ${editing === p.id ? "editing" : ""}`}>
              {editing === p.id ? (
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.6)", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
                    <IconEdit size={13} /> Edit — {p.lokasi_banjir?.nama}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 }}>
                    <div>
                      <label className="form-label" style={{ color:"rgba(74,222,128,0.6)" }}>Batas Aman (cm)</label>
                      <input type="number" value={form.batas_aman} onChange={e => setForm({ ...form, batas_aman: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label className="form-label" style={{ color:"rgba(251,191,36,0.6)" }}>Batas Waspada (cm)</label>
                      <input type="number" value={form.batas_waspada} onChange={e => setForm({ ...form, batas_waspada: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label className="form-label" style={{ color:"rgba(248,113,113,0.6)" }}>Batas Bahaya (cm)</label>
                      <input type="number" value={form.batas_bahaya} onChange={e => setForm({ ...form, batas_bahaya: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="btn btn-success" onClick={savePengaturan} disabled={saving}>
                      <IconCheck />{saving ? "Menyimpan..." : "Simpan"}
                    </button>
                    <button className="btn btn-ghost" onClick={() => setEditing(null)}>
                      <IconX />Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.9)", marginBottom:10 }}>{p.lokasi_banjir?.nama}</div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      <span className="range-badge" style={{ background:"rgba(26,122,74,0.12)", color:"#4ade80", border:"1px solid rgba(26,122,74,0.2)" }}>
                        Aman &lt;{p.batas_aman} cm
                      </span>
                      <span className="range-badge" style={{ background:"rgba(212,135,42,0.12)", color:"#fbbf24", border:"1px solid rgba(212,135,42,0.2)" }}>
                        Waspada &lt;{p.batas_waspada} cm
                      </span>
                      <span className="range-badge" style={{ background:"rgba(192,57,43,0.12)", color:"#f87171", border:"1px solid rgba(192,57,43,0.2)" }}>
                        Bahaya &gt;{p.batas_bahaya} cm
                      </span>
                    </div>
                  </div>
                  <button className="btn btn-ghost" onClick={() => { setEditing(p.id); setForm({ ...p }); }} style={{ flexShrink:0 }}>
                    <IconEdit />Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SECTION: LAPORAN WARGA ───────────────────────────────────────────────────
function SectionLaporan() {
  const [laporan, setLaporan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("semua");

  useEffect(() => { fetchLaporan(); }, []);

  async function fetchLaporan() {
    setLoading(true);
    const { data } = await supabase.from("laporan_warga").select("*").order("created_at", { ascending: false });
    setLaporan(data || []);
    setLoading(false);
  }

  async function updateStatus(id, status) {
    await supabase.from("laporan_warga").update({ status }).eq("id", id);
    fetchLaporan();
  }

  async function deleteLaporan(id) {
    if (!confirm("Hapus laporan ini?")) return;
    await supabase.from("laporan_warga").delete().eq("id", id);
    fetchLaporan();
  }

  const filtered = filter === "semua" ? laporan : laporan.filter(l => l.status === filter);

  return (
    <div className="content-card">
      <div className="content-card-header">
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div className="section-icon"><IconFileText /></div>
          <div>
            <div className="section-title">Laporan Warga</div>
            <div className="section-sub">{laporan.length} laporan masuk</div>
          </div>
        </div>
        <div className="filter-row">
          {["semua", "pending", "diproses", "selesai"].map(f => (
            <button key={f} className={`filter-pill ${filter === f ? "on" : "off"}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loader-wrap"><div className="loader" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Tidak ada laporan</div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {filtered.map(l => {
            const ls = LAPORAN_STATUS[l.status] || LAPORAN_STATUS.pending;
            return (
              <div key={l.id} className="item-card">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.9)" }}>{l.nama_pelapor}</div>
                      <span className={`pill pill-${l.status}`}>{ls.label}</span>
                    </div>
                    <div style={{ fontSize:11, color:"#60a5fa", fontWeight:600, marginBottom:5, display:"flex", alignItems:"center", gap:4 }}>
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {l.lokasi}
                    </div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.55)", lineHeight:1.5 }}>{l.deskripsi}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginTop:6 }}>
                      {new Date(l.created_at).toLocaleString("id-ID")}
                    </div>
                  </div>
                  <button className="btn btn-danger" onClick={() => deleteLaporan(l.id)} style={{ flexShrink:0, padding:"7px 10px" }}>
                    <IconTrash />
                  </button>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", paddingTop:10, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                  {["pending", "diproses", "selesai"].map(s => (
                    <button key={s} className={`filter-pill ${l.status === s ? "on" : "off"}`} onClick={() => updateStatus(l.id, s)}>
                      {LAPORAN_STATUS[s].label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ADMIN PAGE ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [activeTab, setActiveTab] = useState("lokasi");

  useEffect(() => {
    const loggedIn = localStorage.getItem("admin_logged_in");
    if (!loggedIn) { router.push("/admin/login"); return; }
    setUsername(localStorage.getItem("admin_username") || "admin");
    fetchLocations();
  }, []);

  async function fetchLocations() {
    setLoading(true);
    const { data } = await supabase.from("lokasi_banjir").select("*").order("id");
    setLocations(data || []);
    setLoading(false);
  }

  function logout() {
    localStorage.removeItem("admin_logged_in");
    localStorage.removeItem("admin_username");
    router.push("/admin/login");
  }

  const TABS = [
    { key: "lokasi",     label: "Lokasi",     icon: <IconList size={14} /> },
    { key: "posko",      label: "Posko",      icon: <IconHome size={14} /> },
    { key: "pengaturan", label: "Pengaturan", icon: <IconSettings size={14} /> },
    { key: "laporan",    label: "Laporan",    icon: <IconFileText size={14} /> },
  ];

  const danger  = locations.filter(l => l.status === "bahaya").length;
  const waspada = locations.filter(l => l.status === "waspada").length;
  const aman    = locations.filter(l => l.status === "aman").length;

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="admin-root">
        <div className="grid-overlay" />

        {/* Header */}
        <div className="admin-header">
          <div className="header-brand">
            <div className="header-logo"><IconDroplet /></div>
            <div>
              <div className="header-title">SI-PERBA Admin</div>
              <div className="header-sub">Halo, {username}</div>
            </div>
          </div>
          <div className="header-actions">
            <button className="hdr-btn" onClick={() => router.push("/")}>
              <IconGlobe size={13} />Publik
            </button>
            <button className="hdr-btn danger" onClick={logout}>
              <IconLogOut size={13} />Logout
            </button>
          </div>
        </div>

        {/* Greeting */}
        <div className="greeting-bar">
          <div className="greeting-text">Dashboard Pemantauan</div>
          <div className="greeting-sub">Rambatan Kulon, Kec. Kandanghaur — Indramayu</div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total Lokasi</div>
            <div className="stat-value">{locations.length}</div>
            <div className="stat-desc">Titik pantau aktif</div>
          </div>
          <div className="stat-card" style={{ borderColor:"rgba(248,113,113,0.2)", background:"rgba(192,57,43,0.08)" }}>
            <div className="stat-label" style={{ color:"rgba(248,113,113,0.6)" }}>Bahaya</div>
            <div className="stat-value" style={{ color:"#f87171" }}>{danger}</div>
            <div className="stat-desc">Perlu tindakan</div>
          </div>
          <div className="stat-card" style={{ borderColor:"rgba(251,191,36,0.2)", background:"rgba(212,135,42,0.08)" }}>
            <div className="stat-label" style={{ color:"rgba(251,191,36,0.6)" }}>Siaga</div>
            <div className="stat-value" style={{ color:"#fbbf24" }}>{waspada}</div>
            <div className="stat-desc">Perlu dipantau</div>
          </div>
          <div className="stat-card" style={{ borderColor:"rgba(74,222,128,0.2)", background:"rgba(26,122,74,0.08)" }}>
            <div className="stat-label" style={{ color:"rgba(74,222,128,0.6)" }}>Aman</div>
            <div className="stat-value" style={{ color:"#4ade80" }}>{aman}</div>
            <div className="stat-desc">Normal</div>
          </div>
        </div>

        <div className="admin-main">
          {/* Map */}
          <div className="map-card">
            <div className="map-card-header">
              <div className="section-icon"><IconMap /></div>
              <div>
                <div className="section-title">Peta Lokasi Rawan Banjir</div>
                <div className="section-sub">Desa Rambatan Kulon, Indramayu</div>
              </div>
            </div>
            <div style={{ width:"100%", height:220, position:"relative" }}>
              {!loading && <MapBanjir locations={locations} />}
              {loading && (
                <div style={{ height:220, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div className="loader" />
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="tab-bar">
            {TABS.map(t => (
              <button key={t.key} className={`tab-btn ${activeTab === t.key ? "active" : "inactive"}`} onClick={() => setActiveTab(t.key)}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === "lokasi"     && <SectionLokasi locations={locations} loading={loading} fetchLocations={fetchLocations} />}
          {activeTab === "posko"      && <SectionPosko />}
          {activeTab === "pengaturan" && <SectionPengaturan locations={locations} />}
          {activeTab === "laporan"    && <SectionLaporan />}
        </div>
      </div>
    </>
  );
}
