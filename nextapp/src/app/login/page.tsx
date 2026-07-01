"use client";

import { useState } from "react";
import { login } from "@/app/auth-actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setError("Error al conectar con Google. Verifica la configuración de Supabase.");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await login(formData);
    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else {
      router.push(res?.role === "ADMIN" ? "/admin" : "/");
      router.refresh();
    }
  };

  const s = {
    bg: "#080a12", card: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.08)",
    purple: "#7c3aed", muted: "#6b7280", text: "#e5e7eb", inputBg: "rgba(0,0,0,0.4)",
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .google-btn:hover { background: rgba(255,255,255,0.08) !important; }
        .admin-btn:hover { background: #6d28d9 !important; }
        .input-field:focus { border-color: #7c3aed !important; outline: none; }
      `}</style>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: s.bg, color: s.text, fontFamily: "var(--font-jakarta, system-ui, sans-serif)", padding: "20px" }}>
        
        {/* Background blur orbs */}
        <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "20%", left: "30%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", bottom: "20%", right: "20%", width: "300px", height: "300px", background: "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)", borderRadius: "50%" }} />
        </div>

        <div style={{ width: "100%", maxWidth: "420px", animation: "fadeIn 0.4s ease", position: "relative" }}>
          {/* Logo + header */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/logo.png" alt="Sonora Studio" style={{ width: "52px", height: "52px", borderRadius: "14px", marginBottom: "16px", objectFit: "cover" }} />
            <h1 style={{ fontSize: "26px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Sonora Studio</h1>
            <p style={{ color: s.muted, fontSize: "14px", margin: 0 }}>Accede a tu cuenta para continuar</p>
          </div>

          <div style={{ background: s.card, padding: "32px", borderRadius: "24px", border: `1px solid ${s.border}`, backdropFilter: "blur(12px)", boxShadow: "0 25px 50px rgba(0,0,0,0.4)" }}>
            
            {error && (
              <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", padding: "12px 16px", borderRadius: "10px", marginBottom: "20px", fontSize: "13px", textAlign: "center" }}>
                {error}
              </div>
            )}

            {/* Google Login */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="google-btn"
              style={{
                width: "100%", padding: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
                background: "rgba(255,255,255,0.05)", border: `1px solid ${s.border}`, borderRadius: "12px",
                color: s.text, cursor: googleLoading ? "not-allowed" : "pointer", fontSize: "15px", fontWeight: 600,
                transition: "background 0.2s", marginBottom: "20px",
              }}>
              {googleLoading ? (
                <div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {googleLoading ? "Conectando..." : "Continuar con Google"}
            </button>

            {/* Separator */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ flex: 1, height: "1px", background: s.border }} />
              <span style={{ fontSize: "12px", color: s.muted, whiteSpace: "nowrap" }}>o acceso de administrador</span>
              <div style={{ flex: 1, height: "1px", background: s.border }} />
            </div>

            {/* Admin email/password form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: s.muted, fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
                <input name="email" type="email" required className="input-field"
                  style={{ width: "100%", padding: "11px 14px", background: s.inputBg, border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", boxSizing: "border-box", transition: "border 0.2s" }}
                  placeholder="Admin@sonora.com" />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", color: s.muted, fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Contraseña</label>
                <input name="password" type="password" required className="input-field"
                  style={{ width: "100%", padding: "11px 14px", background: s.inputBg, border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", boxSizing: "border-box", transition: "border 0.2s" }}
                  placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading} className="admin-btn"
                style={{ padding: "13px", background: s.purple, color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", marginTop: "4px", transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {loading ? <><div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Entrando...</> : "Entrar como Admin"}
              </button>
            </form>
          </div>

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <Link href="/" style={{ color: s.muted, textDecoration: "none", fontSize: "13px" }}>
              ← Volver a la Tienda
            </Link>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
