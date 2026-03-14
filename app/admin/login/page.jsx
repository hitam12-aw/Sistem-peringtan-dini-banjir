"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("admin")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();
    if (error || !data) {
      setError("Username atau password salah!");
      setLoading(false);
      return;
    }
    localStorage.setItem("admin_logged_in", "true");
    localStorage.setItem("admin_username", data.username);
    router.push("/admin");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #2980b9 0%, #3498db 50%, #5dade2 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px", fontSize: 36,
            border: "2px solid rgba(255,255,255,0.4)",
          }}>💧</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>SIBANJIR</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>Sistem Peringatan Dini Banjir</div>
        </div>

        {/* Card */}
        <div style={{
          background: "#fff", borderRadius: 20,
          padding: "28px 24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#333", marginBottom: 20 }}>Login </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 600 }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Masukkan username"
              style={{
                width: "100%", background: "#f8f9fa",
                border: "1px solid #e9ecef",
                borderRadius: 10, padding: "12px 14px",
                fontSize: 14, color: "#333", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6, fontWeight: 600 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Masukkan password"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{
                width: "100%", background: "#f8f9fa",
                border: "1px solid #e9ecef",
                borderRadius: 10, padding: "12px 14px",
                fontSize: 14, color: "#333", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <div style={{
              background: "#fdedec", border: "1px solid #f1948a",
              borderRadius: 10, padding: "10px 14px",
              fontSize: 12, color: "#e74c3c", marginBottom: 16,
            }}>
              ⚠ {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#aaa" : "linear-gradient(135deg, #2980b9, #3498db)",
              border: "none", borderRadius: 12,
              padding: "14px", color: "#fff",
              fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 15px rgba(52,152,219,0.4)",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Memverifikasi..." : "Masuk →"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <a href="/" style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, textDecoration: "none" }}>
            ← Kembali ke halaman publik
          </a>
        </div>
      </div>
    </div>
  );
}