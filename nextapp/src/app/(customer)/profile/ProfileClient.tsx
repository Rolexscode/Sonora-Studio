"use client";

import React, { useState } from "react";
import { User, MapPin, Phone, FileText, Save, Check, Loader2 } from "lucide-react";
import { updateUserProfile } from "@/app/actions";

export default function ProfileClient({ user }: { user: any }) {
  const [formData, setFormData] = useState({
    phone: user.phone || "",
    address: user.address || "",
    city: user.city || "",
    document: user.document || "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const s = {
    card: "#141728",
    border: "rgba(255,255,255,0.06)",
    purple: "#7c3aed",
    purpleHover: "#6d28d9",
    green: "#10b981",
    muted: "#6b7280",
    text: "#e5e7eb",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    
    try {
      await updateUserProfile(user.id, formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert("Hubo un error al guardar los datos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="customer-main" style={{ flex: 1, marginLeft: "260px", padding: "36px 40px", maxWidth: "calc(100vw - 260px)" }}>
      <header style={{ marginBottom: "36px" }}>
        <h1 style={{ margin: "0 0 4px", fontSize: "26px", fontWeight: 800, letterSpacing: "-0.02em" }}>Mi Perfil</h1>
        <p style={{ margin: 0, fontSize: "14px", color: s.muted }}>Actualiza tus datos personales y dirección de envío.</p>
      </header>

      <form onSubmit={handleSubmit} style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: "16px", padding: "32px", maxWidth: "600px" }}>
        
        {/* Contacto */}
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <User size={18} color={s.purple} /> Datos de Contacto
          </h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: s.muted, marginBottom: "8px" }}>Correo Electrónico</label>
              <input type="text" value={user.email} disabled style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: `1px solid ${s.border}`, borderRadius: "8px", color: s.muted, cursor: "not-allowed" }} />
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: s.muted, marginBottom: "8px" }}>Teléfono</label>
              <div style={{ position: "relative" }}>
                <Phone size={16} color={s.muted} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+51 987 654 321" style={{ width: "100%", padding: "12px 16px 12px 40px", background: "rgba(255,255,255,0.05)", border: `1px solid ${s.border}`, borderRadius: "8px", color: "#fff", outline: "none" }} />
              </div>
            </div>
            
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: s.muted, marginBottom: "8px" }}>Documento de Identidad (DNI/RUC)</label>
              <div style={{ position: "relative" }}>
                <FileText size={16} color={s.muted} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
                <input type="text" name="document" value={formData.document} onChange={handleChange} placeholder="Ej: 72123456" style={{ width: "100%", padding: "12px 16px 12px 40px", background: "rgba(255,255,255,0.05)", border: `1px solid ${s.border}`, borderRadius: "8px", color: "#fff", outline: "none" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Envío */}
        <div style={{ marginBottom: "32px", borderTop: `1px solid ${s.border}`, paddingTop: "32px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <MapPin size={18} color={s.purple} /> Dirección de Envío
          </h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: s.muted, marginBottom: "8px" }}>Dirección Completa</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Av. Principal 123, Dpto 4" style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${s.border}`, borderRadius: "8px", color: "#fff", outline: "none" }} />
            </div>
            
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: s.muted, marginBottom: "8px" }}>Ciudad / Distrito</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Lima, Miraflores" style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${s.border}`, borderRadius: "8px", color: "#fff", outline: "none" }} />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" disabled={saving} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: success ? s.green : s.purple, color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
            {saving ? <Loader2 size={18} className="spin" /> : success ? <Check size={18} /> : <Save size={18} />}
            {saving ? "Guardando..." : success ? "Guardado" : "Guardar Cambios"}
          </button>
        </div>
      </form>
      
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
