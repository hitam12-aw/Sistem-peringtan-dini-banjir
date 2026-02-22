"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import dynamic from "next/dynamic";

const MapBanjir = dynamic(() => import("../component/MapBanjir"), { ssr: false });

const STATUS_OPTIONS = ["aman", "waspada", "bahaya"];
const STATUS = {
  aman:    { color: "#00e5a0", bg: "rgba(0,229,160,0.08)",  border: "rgba(0,229,160,0.25)",  label: "AMAN",    icon: "●" },
  waspada: { color: "#ffb830", bg: "rgba(255,184,48,0.08)", border: "rgba(255,184,48,0.25)", label: "WASPADA", icon: "▲" },
  bahaya:  { color: "#ff3d5a", bg: "rgba(255,61,90,0.08)",  border: "rgba(255,61,90,0.25)",  label: "BAHAYA",  icon: "■" },
};

function Badge({ status }) {
  const s = STATUS[status];
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      borderRadius: 3, padding: "2px 8px",
      fontSize: 10, fontWeight: 700, letterSpacing: 2,
      fontFamily: "monospace",
    }}>
      {s.icon} {s.label}
    </span>
  );
}

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

  function startEdit(loc) {
    setEditing(loc.id);
    setForm({ ...loc });
  }

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
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 6, padding: "8px 10px",
    color: "#ddd", fontFamily: "monospace", fontSize: 12,
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080c12", color: "#ccc" }}>
      {/* Navbar */}
      <nav style={{
        background: "rgba(8,12,18,0.96)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 20px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>💧</span>
          <div>
            <div style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 13, color: "#ddd" }}>SIBANJIR</div>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#444", letterSpacing: 2 }}>ADMIN PANEL</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#555" }}>👤 {username}</span>
          <button onClick={() => router.push("/")} style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 6, padding: "6px 12px", color: "#777",
            fontFamily: "monospace", fontSize: 11, cursor: "pointer",
          }}>← Publik</button>
          <button onClick={logout} style={{
            background: "rgba(255,61,90,0.1)", border: "1px solid rgba(255,61,90,0.3)",
            borderRadius: 6, padding: "6px 12px", color: "#ff3d5a",
            fontFamily: "monospace", fontSize: 11, cursor: "pointer",
          }}>Logout</button>
        </div>
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 60px" }}>
        {/* Map */}
        <div style={{
          background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10, padding: 18, marginBottom: 20,
        }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#555", letterSpacing: 3, marginBottom: 14 }}>▸ PETA LOKASI RAWAN BANJIR</div>
          {!loading && <MapBanjir locations={locations} />}
        </div>

        {/* Tabel */}
        <div style={{
          background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 10, padding: 18,
        }}>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#555", letterSpacing: 3, marginBottom: 14 }}>▸ MANAJEMEN DATA LOKASI</div>

          {loading ? (
            <div style={{ textAlign: "center", fontFamily: "monospace", color: "#444", padding: 40 }}>Memuat data...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {locations.map(loc => (
                <div key={loc.id} style={{
                  background: editing === loc.id ? "rgba(0,229,160,0.04)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${editing === loc.id ? "rgba(0,229,160,0.2)" : "rgba(255,255,255,0.05)"}`,
                  borderRadius: 8, padding: 16,
                }}>
                  {editing === loc.id ? (
                    // Mode Edit
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 13, color: "#00e5a0", fontWeight: 700, marginBottom: 14 }}>
                        ✎ Edit: {loc.nama}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 12 }}>
                        <div>
                          <label style={{ fontFamily: "monospace", fontSize: 9, color: "#555", letterSpacing: 2, display: "block", marginBottom: 4 }}>STATUS</label>
                          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ ...inputStyle }}>
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontFamily: "monospace", fontSize: 9, color: "#555", letterSpacing: 2, display: "block", marginBottom: 4 }}>LEVEL AIR (cm)</label>
                          <input type="number" value={form.level_air} onChange={e => setForm({ ...form, level_air: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                          <label style={{ fontFamily: "monospace", fontSize: 9, color: "#555", letterSpacing: 2, display: "block", marginBottom: 4 }}>CURAH HUJAN (mm/jam)</label>
                          <input type="number" value={form.curah_hujan} onChange={e => setForm({ ...form, curah_hujan: e.target.value })} style={inputStyle} />
                        </div>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontFamily: "monospace", fontSize: 9, color: "#555", letterSpacing: 2, display: "block", marginBottom: 4 }}>KETERANGAN</label>
                        <input type="text" value={form.keterangan || ""} onChange={e => setForm({ ...form, keterangan: e.target.value })} style={inputStyle} />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={saveEdit} disabled={saving} style={{
                          background: "rgba(0,229,160,0.15)", border: "1px solid rgba(0,229,160,0.4)",
                          borderRadius: 6, padding: "8px 16px", color: "#00e5a0",
                          fontFamily: "monospace", fontSize: 11, cursor: "pointer", fontWeight: 700,
                        }}>
                          {saving ? "MENYIMPAN..." : "✓ SIMPAN"}
                        </button>
                        <button onClick={() => setEditing(null)} style={{
                          background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 6, padding: "8px 16px", color: "#666",
                          fontFamily: "monospace", fontSize: 11, cursor: "pointer",
                        }}>
                          BATAL
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Mode View
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ fontFamily: "monospace", fontSize: 13, color: "#ddd", fontWeight: 700, marginBottom: 6 }}>{loc.nama}</div>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <Badge status={loc.status} />
                          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#666" }}>💧 {loc.level_air} cm</span>
                          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#666" }}>🌧 {loc.curah_hujan} mm/jam</span>
                        </div>
                        {loc.keterangan && <div style={{ fontFamily: "monospace", fontSize: 11, color: "#555", marginTop: 6 }}>{loc.keterangan}</div>}
                      </div>
                      <button onClick={() => startEdit(loc)} style={{
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 6, padding: "8px 16px", color: "#888",
                        fontFamily: "monospace", fontSize: 11, cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}>
                        ✎ Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}