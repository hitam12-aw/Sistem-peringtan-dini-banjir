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

const LAPORAN_STATUS = {
  pending:   { label: "Pending",   color: "#e67e22", bg: "#fef9e7" },
  diproses:  { label: "Diproses",  color: "#3498db", bg: "#e8f4fd" },
  selesai:   { label: "Selesai",   color: "#27ae60", bg: "#eafaf1" },
};

const inputStyle = {
  width: "100%", background: "#f8f9fa",
  border: "1px solid #e9ecef", borderRadius: 10,
  padding: "10px 12px", fontSize: 13, color: "#333",
  outline: "none", boxSizing: "border-box",
};

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
    <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 }}>
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
                    <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginBottom: 12 }}>✎ Edit: {loc.nama}</div>
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
                      }}>{saving ? "Menyimpan..." : "✓ Simpan"}</button>
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
                        <span style={{ background: s.bgCard, color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{s.label}</span>
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
    <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>🏥 Manajemen Posko</div>
        {!isFormOpen && (
          <button onClick={() => { setAdding(true); setForm({ status: "aktif" }); }} style={{
            background: "#3498db", border: "none", borderRadius: 8,
            padding: "7px 14px", color: "#fff", fontSize: 12,
            fontWeight: 600, cursor: "pointer",
          }}>+ Tambah Posko</button>
        )}
      </div>

      {isFormOpen && (
        <div style={{ background: "#f8f9fa", borderRadius: 12, padding: 14, marginBottom: 12, border: "1px solid #e9ecef" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 12 }}>
            {adding ? "➕ Tambah Posko Baru" : `✎ Edit: ${form.nama}`}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 600 }}>Nama Posko</label>
              <input type="text" value={form.nama || ""} onChange={e => setForm({ ...form, nama: e.target.value })} style={inputStyle} placeholder="Nama posko" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 600 }}>Jarak</label>
              <input type="text" value={form.jarak || ""} onChange={e => setForm({ ...form, jarak: e.target.value })} style={inputStyle} placeholder="1.2 km" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 600 }}>Kapasitas (orang)</label>
              <input type="number" value={form.kapasitas || ""} onChange={e => setForm({ ...form, kapasitas: e.target.value })} style={inputStyle} placeholder="100" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 600 }}>Status</label>
              <select value={form.status || "aktif"} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
                <option value="aktif">Aktif</option>
                <option value="penuh">Penuh</option>
                <option value="tutup">Tutup</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 600 }}>Latitude</label>
              <input type="number" step="0.0001" value={form.lat || ""} onChange={e => setForm({ ...form, lat: e.target.value })} style={inputStyle} placeholder="-6.3271" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 600 }}>Longitude</label>
              <input type="number" step="0.0001" value={form.lng || ""} onChange={e => setForm({ ...form, lng: e.target.value })} style={inputStyle} placeholder="108.3254" />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: "#666", display: "block", marginBottom: 4, fontWeight: 600 }}>Alamat</label>
            <input type="text" value={form.alamat || ""} onChange={e => setForm({ ...form, alamat: e.target.value })} style={inputStyle} placeholder="Alamat lengkap posko" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={savePosko} disabled={saving} style={{
              background: saving ? "#aaa" : "#27ae60", border: "none",
              borderRadius: 8, padding: "8px 16px", color: "#fff",
              fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
            }}>{saving ? "Menyimpan..." : "✓ Simpan"}</button>
            <button onClick={() => { setEditing(null); setAdding(false); setForm({}); }} style={{
              background: "#f8f9fa", border: "1px solid #e9ecef",
              borderRadius: 8, padding: "8px 16px", color: "#666",
              fontSize: 12, cursor: "pointer",
            }}>Batal</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 20 }}>Memuat data...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {poskos.map(p => {
            const statusColor = p.status === "aktif" ? "#27ae60" : p.status === "penuh" ? "#e67e22" : "#e74c3c";
            return (
              <div key={p.id} style={{ background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>{p.nama}</div>
                      <span style={{ background: statusColor, color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>
                        {p.status?.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 2 }}>{p.alamat}</div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span style={{ fontSize: 11, color: "#888" }}>📍 {p.jarak}</span>
                      <span style={{ fontSize: 11, color: "#888" }}>👥 {p.kapasitas} orang</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { setEditing(p.id); setAdding(false); setForm({ ...p }); }} style={{
                      background: "#fff", border: "1px solid #e9ecef",
                      borderRadius: 8, padding: "6px 12px", color: "#555",
                      fontSize: 11, cursor: "pointer",
                    }}>✎ Edit</button>
                    <button onClick={() => deletePosko(p.id)} style={{
                      background: "#fdedec", border: "1px solid #f1948a",
                      borderRadius: 8, padding: "6px 12px", color: "#e74c3c",
                      fontSize: 11, cursor: "pointer",
                    }}>🗑</button>
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
    <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 16 }}>⚙️ Pengaturan Batas Level Air</div>
      {loading ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 20 }}>Memuat data...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pengaturan.map(p => (
            <div key={p.id} style={{
              background: editing === p.id ? "#f0f9f4" : "#f8f9fa",
              border: `1px solid ${editing === p.id ? "#a9dfbf" : "#e9ecef"}`,
              borderRadius: 12, padding: 14,
            }}>
              {editing === p.id ? (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#27ae60", marginBottom: 12 }}>
                    ✎ Edit: {p.lokasi_banjir?.nama}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#27ae60", display: "block", marginBottom: 4, fontWeight: 600 }}>Batas Aman (cm)</label>
                      <input type="number" value={form.batas_aman} onChange={e => setForm({ ...form, batas_aman: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#e67e22", display: "block", marginBottom: 4, fontWeight: 600 }}>Batas Waspada (cm)</label>
                      <input type="number" value={form.batas_waspada} onChange={e => setForm({ ...form, batas_waspada: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#e74c3c", display: "block", marginBottom: 4, fontWeight: 600 }}>Batas Bahaya (cm)</label>
                      <input type="number" value={form.batas_bahaya} onChange={e => setForm({ ...form, batas_bahaya: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={savePengaturan} disabled={saving} style={{
                      background: saving ? "#aaa" : "#27ae60", border: "none",
                      borderRadius: 8, padding: "8px 16px", color: "#fff",
                      fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                    }}>{saving ? "Menyimpan..." : "✓ Simpan"}</button>
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
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 8 }}>{p.lokasi_banjir?.nama}</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ background: "#eafaf1", color: "#27ae60", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                        Aman: &lt;{p.batas_aman} cm
                      </span>
                      <span style={{ background: "#fef9e7", color: "#e67e22", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                        Waspada: &lt;{p.batas_waspada} cm
                      </span>
                      <span style={{ background: "#fdedec", color: "#e74c3c", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                        Bahaya: &gt;{p.batas_bahaya} cm
                      </span>
                    </div>
                  </div>
                  <button onClick={() => { setEditing(p.id); setForm({ ...p }); }} style={{
                    background: "#fff", border: "1px solid #e9ecef",
                    borderRadius: 8, padding: "7px 14px", color: "#555",
                    fontSize: 12, cursor: "pointer",
                  }}>✎ Edit</button>
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
    <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>📝 Laporan Warga</div>
        <div style={{ display: "flex", gap: 6 }}>
          {["semua", "pending", "diproses", "selesai"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? "#3498db" : "#f8f9fa",
              border: `1px solid ${filter === f ? "#3498db" : "#e9ecef"}`,
              borderRadius: 20, padding: "4px 10px",
              color: filter === f ? "#fff" : "#666",
              fontSize: 11, cursor: "pointer", fontWeight: filter === f ? 700 : 400,
              textTransform: "capitalize",
            }}>{f}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 20 }}>Memuat data...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: "#aaa", padding: 20, fontSize: 13 }}>Tidak ada laporan</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(l => {
            const ls = LAPORAN_STATUS[l.status] || LAPORAN_STATUS.pending;
            return (
              <div key={l.id} style={{ background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#333" }}>{l.nama_pelapor}</div>
                      <span style={{ background: ls.bg, color: ls.color, borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>
                        {ls.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#3498db", fontWeight: 600, marginBottom: 4 }}>📍 {l.lokasi}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>{l.deskripsi}</div>
                    <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>
                      {new Date(l.created_at).toLocaleString("id-ID")}
                    </div>
                  </div>
                  <button onClick={() => deleteLaporan(l.id)} style={{
                    background: "#fdedec", border: "1px solid #f1948a",
                    borderRadius: 8, padding: "5px 10px", color: "#e74c3c",
                    fontSize: 11, cursor: "pointer",
                  }}>🗑</button>
                </div>
                {/* Update status */}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  {["pending", "diproses", "selesai"].map(s => (
                    <button key={s} onClick={() => updateStatus(l.id, s)} style={{
                      background: l.status === s ? LAPORAN_STATUS[s].bg : "#fff",
                      border: `1px solid ${l.status === s ? LAPORAN_STATUS[s].color : "#e9ecef"}`,
                      borderRadius: 20, padding: "3px 10px",
                      color: l.status === s ? LAPORAN_STATUS[s].color : "#aaa",
                      fontSize: 10, cursor: "pointer", fontWeight: l.status === s ? 700 : 400,
                      textTransform: "capitalize",
                    }}>{s}</button>
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
    { key: "lokasi",     label: "Lokasi",     icon: "📋" },
    { key: "posko",      label: "Posko",      icon: "🏥" },
    { key: "pengaturan", label: "Pengaturan", icon: "⚙️" },
    { key: "laporan",    label: "Laporan",    icon: "📝" },
  ];

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
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>SIBANJIR Admin</div>
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
        <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ padding: "14px 16px 10px", fontSize: 13, fontWeight: 700, color: "#333" }}>🗺️ Peta Lokasi Rawan Banjir</div>
          {!loading && <MapBanjir locations={locations} />}
          {loading && (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 13 }}>
              Memuat peta...
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              background: activeTab === t.key ? "#3498db" : "#fff",
              border: `1px solid ${activeTab === t.key ? "#3498db" : "#e9ecef"}`,
              borderRadius: 20, padding: "8px 16px",
              color: activeTab === t.key ? "#fff" : "#666",
              fontSize: 12, fontWeight: activeTab === t.key ? 700 : 400,
              cursor: "pointer", whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: 6,
              flexShrink: 0,
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "lokasi"     && <SectionLokasi locations={locations} loading={loading} fetchLocations={fetchLocations} />}
        {activeTab === "posko"      && <SectionPosko />}
        {activeTab === "pengaturan" && <SectionPengaturan locations={locations} />}
        {activeTab === "laporan"    && <SectionLaporan />}
      </main>
    </div>
  );
}