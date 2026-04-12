"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

// ─── SVG ICONS ────────────────────────────────────────────────────────────────
const IconUser = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconEye = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IconWave = () => (
  <svg viewBox="0 0 1440 120" preserveAspectRatio="none" style={{ display:"block" }}>
    <path d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z" fill="rgba(255,255,255,0.06)" />
    <path d="M0,80 C360,20 720,100 1080,40 C1260,10 1380,70 1440,80 L1440,120 L0,120 Z" fill="rgba(255,255,255,0.04)" />
  </svg>
);

const IconDroplet = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="rgba(255,255,255,0.9)" stroke="none">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconShield = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; }

        .login-root {
          min-height: 100vh;
          background: #07326A;
          display: flex;
          position: relative;
          overflow: hidden;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        /* Decorative background orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .orb-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(10,97,201,0.45) 0%, transparent 70%);
          top: -180px; left: -180px;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(116,157,200,0.2) 0%, transparent 70%);
          bottom: -120px; right: -100px;
        }
        .orb-3 {
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%);
          top: 40%; left: 60%;
        }

        /* Grid texture */
        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .login-inner {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          position: relative;
          z-index: 2;
        }

        /* Brand section */
        .brand-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 36px;
        }
        .brand-icon {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, #0A61C9, #749DC8);
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 12px 40px rgba(10,97,201,0.5);
          position: relative;
        }
        .brand-icon::after {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 21px;
          background: linear-gradient(135deg, rgba(255,255,255,0.3), transparent);
          pointer-events: none;
        }
        .brand-name {
          font-size: 26px;
          font-weight: 800;
          color: #fff;
          letter-spacing: 2px;
          margin-bottom: 4px;
        }
        .brand-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        /* Card */
        .card {
          width: 100%;
          max-width: 400px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 32px 28px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        .card-title {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 4px;
        }
        .card-subtitle {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          margin-bottom: 28px;
          font-weight: 400;
        }

        /* Field */
        .field-wrap {
          margin-bottom: 16px;
        }
        .field-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.55);
          display: block;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .field-input-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          padding: 0 16px;
          transition: all 0.2s ease;
        }
        .field-input-wrap.focused {
          background: rgba(10,97,201,0.15);
          border-color: rgba(10,97,201,0.6);
          box-shadow: 0 0 0 3px rgba(10,97,201,0.15);
        }
        .field-icon {
          color: rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: color 0.2s;
        }
        .field-input-wrap.focused .field-icon { color: #749DC8; }
        .field-input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          padding: 14px 0;
          font-size: 14px;
          font-weight: 500;
          color: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.25); font-weight: 400; }
        .eye-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          padding: 4px;
          transition: color 0.2s;
          flex-shrink: 0;
        }
        .eye-btn:hover { color: rgba(255,255,255,0.7); }

        /* Error */
        .error-box {
          background: rgba(231,76,60,0.12);
          border: 1px solid rgba(231,76,60,0.3);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 12px;
          color: #f1948a;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Submit Button */
        .submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #0A61C9 0%, #1a7be8 100%);
          border: none;
          border-radius: 14px;
          padding: 16px;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Plus Jakarta Sans', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 8px;
          transition: all 0.25s ease;
          box-shadow: 0 8px 24px rgba(10,97,201,0.45);
          position: relative;
          overflow: hidden;
          letter-spacing: 0.3px;
        }
        .submit-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.5s ease;
        }
        .submit-btn:hover::before { left: 100%; }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(10,97,201,0.55);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled {
          background: rgba(255,255,255,0.1);
          box-shadow: none;
          cursor: not-allowed;
        }

        /* Spinner */
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Back link */
        .back-link {
          margin-top: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: rgba(255,255,255,0.3);
          font-size: 12px;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .back-link:hover { color: rgba(255,255,255,0.6); }

        /* Secure badge */
        .secure-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 20px;
          color: rgba(255,255,255,0.2);
          font-size: 11px;
          font-weight: 500;
        }

        /* Divider */
        .divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 20px 0;
        }
      `}</style>

      <div className="login-root">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-overlay" />

        <div className="login-inner">
          {/* Brand */}
          <div className="brand-wrap">
            <div className="brand-icon">
              <IconDroplet />
            </div>
            <div className="brand-name">SI-PERBA</div>
            <div className="brand-sub">Sistem Peringatan Dini Banjir — Indramayu</div>
          </div>

          {/* Card */}
          <div className="card">
            <div className="card-title">Masuk ke Dashboard</div>
            <div className="card-subtitle">Akses panel pengelolaan data banjir</div>

            {/* Username */}
            <div className="field-wrap">
              <label className="field-label">Username</label>
              <div className={`field-input-wrap ${focusedField === "username" ? "focused" : ""}`}>
                <span className="field-icon"><IconUser /></span>
                <input
                  className="field-input"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Masukkan username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="field-wrap">
              <label className="field-label">Password</label>
              <div className={`field-input-wrap ${focusedField === "password" ? "focused" : ""}`}>
                <span className="field-icon"><IconLock /></span>
                <input
                  className="field-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="Masukkan password"
                />
                <button className="eye-btn" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-box">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button className="submit-btn" onClick={handleLogin} disabled={loading}>
              {loading ? (
                <><div className="spinner" /> Memverifikasi...</>
              ) : (
                <>Masuk ke Dashboard <IconArrowRight /></>
              )}
            </button>

            <div className="divider" />

            <div className="secure-badge">
              <IconShield />
              Koneksi terenkripsi & aman
            </div>
          </div>

          <a href="/" className="back-link">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Kembali ke halaman publik
          </a>
        </div>
      </div>
    </>
  );
}
