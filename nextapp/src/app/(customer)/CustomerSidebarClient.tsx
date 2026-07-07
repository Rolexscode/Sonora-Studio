"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LogOut, ReceiptText, ArrowLeft, User as UserIcon, Menu, X } from "lucide-react";
import ClientSidebarLink from "./ClientSidebarLink";

export default function CustomerSidebarClient({ 
  purchasesCount, 
  totalSpent, 
  sessionName,
  logoutAction 
}: { 
  purchasesCount: number; 
  totalSpent: number; 
  sessionName: string;
  logoutAction: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const s = {
    surface: "#0f1120", border: "rgba(255,255,255,0.06)",
    purple: "#7c3aed", purpleLight: "#a78bfa", purpleMuted: "rgba(124,58,237,0.12)",
    green: "#10b981", red: "#f87171", redMuted: "rgba(248,113,113,0.12)",
    muted: "#6b7280", text: "#e5e7eb",
  };

  return (
    <>
      {/* Mobile Topbar */}
      <div className="customer-topbar no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: s.surface, borderBottom: `1px solid ${s.border}`, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/logo_white.png" alt="Logo" style={{ height: "24px" }} />
          <span style={{ fontSize: "15px", fontWeight: 700 }}>Sonora Studio</span>
        </div>
        <button onClick={() => setIsOpen(true)} style={{ background: "none", border: `1px solid ${s.border}`, color: s.text, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", borderRadius: "8px" }}>
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="no-print" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 90, backdropFilter: "blur(2px)" }} onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`customer-sidebar ${isOpen ? "open" : ""} no-print`} style={{ width: "260px", background: s.surface, borderRight: `1px solid ${s.border}`, display: "flex", flexDirection: "column", position: "fixed", height: "100vh", top: 0, left: 0, zIndex: 100, transition: "transform 0.3s ease" }}>
        <div style={{ padding: "24px 20px", borderBottom: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/assets/images/logo_white.png" alt="Logo" style={{ height: "24px" }} />
            <div>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Sonora Studio</p>
              <p style={{ margin: 0, fontSize: "11px", color: s.muted }}>Portal del Cliente</p>
            </div>
          </div>
          <button className="customer-sidebar-close" onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: s.muted, cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <nav style={{ padding: "16px 12px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "10px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", paddingLeft: "8px" }}>Mi Cuenta</p>
          <div onClick={() => setIsOpen(false)}>
            <ClientSidebarLink href="/purchases" icon={<ReceiptText size={18} />} label="Mis Compras">
              <span style={{ marginLeft: "auto", fontSize: "11px", background: s.purple, color: "#fff", padding: "2px 7px", borderRadius: "10px", fontWeight: 700 }}>
                {purchasesCount}
              </span>
            </ClientSidebarLink>
          </div>
          <div onClick={() => setIsOpen(false)}>
            <ClientSidebarLink href="/profile" icon={<UserIcon size={18} />} label="Mi Perfil" />
          </div>
        </nav>

        {purchasesCount > 0 && (
          <div style={{ padding: "0 12px 16px" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "16px", border: `1px solid ${s.border}` }}>
              <p style={{ margin: "0 0 4px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Total Gastado</p>
              <p style={{ margin: "0 0 12px", fontSize: "22px", fontWeight: 800, color: s.green }}>S/ {totalSpent.toFixed(2)}</p>
              <p style={{ margin: 0, fontSize: "12px", color: s.muted }}>{purchasesCount} compra{purchasesCount !== 1 ? "s" : ""} realizadas</p>
            </div>
          </div>
        )}

        <div style={{ padding: "16px 12px", borderTop: `1px solid ${s.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", marginBottom: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: `linear-gradient(135deg, ${s.purple}, #2563eb)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px", flexShrink: 0 }}>
              {sessionName.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sessionName}</p>
              <p style={{ margin: 0, fontSize: "11px", color: s.muted }}>Cliente</p>
            </div>
          </div>

          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", color: s.muted, textDecoration: "none", fontSize: "13px", borderRadius: "8px", marginBottom: "6px" }}>
            <ArrowLeft size={15} /> Volver a la Tienda
          </Link>
          <form action={logoutAction}>
            <button type="submit" style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", color: s.red, background: s.redMuted, border: "none", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: 600 }}>
              <LogOut size={15} /> Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
