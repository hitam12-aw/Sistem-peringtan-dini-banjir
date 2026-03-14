"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import dynamic from "next/dynamic";

const MapBanjir = dynamic(() => import("../component/MapBanjir"), { ssr: false });

const STATUS_OPTIONS = ["aman", "waspada", "bahaya"];
const STATUS = {
  aman:    { color: "#27ae60", bg: "#eafaf1", border: "#a9dfbf", label: "AMAN",   bgCard: "#27ae60" },
  waspada: { color: "#e67e22", bg: "#fef9e7", border: "#f9e79f", label: "SIAGA",  bgCard: "#e67e22" },
  bahaya:  { color: "#e74c3c", bg: "#fdedec", border: "#f1948a", label: "BAHAYA", bgCard: "#e74c3c" },
};

export default function AdminPage() {
  const router = useRouter();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");

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

  function logout() {
    localStorage.removeItem("admin_logged_in");
    localStorage.removeItem("admin_username");
    router.push("/admin/login");
  }

  const inputStyle = {
    width: "100%", background: "#f8f9fa",
    border: "1px solid #e9ecef", borderRadius: 10,
    padding: "10px 12px", fontSize: 13, color: "#333",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #2980b9, #3498db)",
        padding: "0 16px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>💧</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>SIBANJIR</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>Halo, {username}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => router.push("/")} style={{
            background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 8, padding: "6px 12px", color: "#fff",
            fontSize: 12, cursor: "pointer",
          }}>← Publik</button>
          <button onClick={logout} style={{
            background: "rgba(231,76,60,0.3)", border: "1px solid rgba(231,76,60,0.5)",
            borderRadius: 8, padding: "6px 12px", color: "#fff",
            fontSize: 12, cursor: "pointer",
          }}>Logout</button>
        </div>
      </div>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 40px" }}>

        {/* Peta */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 12 }}>🗺️ Peta Lokasi Rawan Banjir</div>
          {!loading && <MapBanjir locations={locations} />}
          {loading && (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 13 }}>
              Memuat peta...
            </div>
          )}
        </div>

        {/* Manajemen Data */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 16 }}>📋 Manajemen Data Lokasi</div>

          {loading ? (
            <div style={{ textAlign: "center", color: "#aaa", padding: 40 }}>Memuat data...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {locations.map(loc => {
                const s = STATUS[loc.status] || STATUS.aman;
                return (
                  <div key={loc.id} style={{
                    background: editing === loc.id ? s.bg : "#f8f9fa",
                    border: `1px solid ${editing === loc.id ? s.border : "#e9ecef"}`,
                    borderRadius: 12, padding: 14,
                  }}>
                    {editing === loc.id ? (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginBottom: 12 }}>
                          ✎ Edit: {loc.nama}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 10 }}>
                          <div>
                            <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 600 }}>Status</label>
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 600 }}>Level Air (cm)</label>
                            <input type="number" value={form.level_air} onChange={e => setForm({ ...form, level_air: e.target.value })} style={inputStyle} />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 600 }}>Curah Hujan (mm/jam)</label>
                            <input type="number" value={form.curah_hujan} onChange={e => setForm({ ...form, curah_hujan: e.target.value })} style={inputStyle} />
                          </div>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 600 }}>Keterangan</label>
                          <input type="text" value={form.keterangan || ""} onChange={e => setForm({ ...form, keterangan: e.target.value })} style={inputStyle} />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={saveEdit} disabled={saving} style={{
                            background: saving ? "#aaa" : "#27ae60", border: "none",
                            borderRadius: 8, padding: "8px 16px", color: "#fff",
                            fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                          }}>
                            {saving ? "Menyimpan..." : "✓ Simpan"}
                          </button>
                          <button onClick={() => setEditing(null)} style={{
                            background: "#f8f9fa", border: "1px solid #e9ecef",
                            borderRadius: 8, padding: "8px 16px", color: "#666",
                            fontSize: 12, cursor: "pointer",
                          }}>Batal</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 4 }}>{loc.nama}</div>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ background: s.bgCard, color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                              {s.label}
                            </span>
                            <span style={{ fontSize: 11, color: "#888" }}>💧 {loc.level_air} cm</span>
                            <span style={{ fontSize: 11, color: "#888" }}>🌧 {loc.curah_hujan} mm/jam</span>
                          </div>
                          {loc.keterangan && <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{loc.keterangan}</div>}
                        </div>
                        <button onClick={() => startEdit(loc)} style={{
                          background: "#fff", border: "1px solid #e9ecef",
                          borderRadius: 8, padding: "7px 14px", color: "#555",
                          fontSize: 12, cursor: "pointer",
                        }}>✎ Edit</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}