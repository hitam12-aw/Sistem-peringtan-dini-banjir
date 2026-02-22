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

    // Simpan session sederhana
    localStorage.setItem("admin_logged_in", "true");
    localStorage.setItem("admin_username", data.username);
    router.push("/admin");
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#080c12",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12, padding: "40px 36px",
        width: "100%", maxWidth: 380,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💧</div>
          <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 900, color: "#ddd", letterSpacing: 2 }}>SIBANJIR</div>
          <div style={{ fontFamily: "monospace", fontSize: 10, color: "#444", letterSpacing: 3, marginTop: 4 }}>ADMIN PANEL</div>
        </div>

        {/* Form */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: "monospace", fontSize: 10, color: "#555", letterSpacing: 2, display: "block", marginBottom: 6 }}>USERNAME</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="admin"
            style={{
              width: "100%", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6, padding: "10px 14px",
              color: "#ddd", fontFamily: "monospace", fontSize: 13,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontFamily: "monospace", fontSize: 10, color: "#555", letterSpacing: 2, display: "block", marginBottom: 6 }}>PASSWORD</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{
              width: "100%", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6, padding: "10px 14px",
              color: "#ddd", fontFamily: "monospace", fontSize: 13,
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <div style={{
            background: "rgba(255,61,90,0.1)", border: "1px solid rgba(255,61,90,0.3)",
            borderRadius: 6, padding: "10px 14px",
            fontFamily: "monospace", fontSize: 11, color: "#ff3d5a",
            marginBottom: 16,
          }}>
            ■ {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", background: loading ? "rgba(0,229,160,0.1)" : "rgba(0,229,160,0.15)",
            border: "1px solid rgba(0,229,160,0.4)",
            borderRadius: 6, padding: "12px",
            color: "#00e5a0", fontFamily: "monospace",
            fontSize: 12, fontWeight: 700, letterSpacing: 2,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {loading ? "MEMVERIFIKASI..." : "LOGIN →"}
        </button>
      </div>
    </div>
  );
}