import React from "react";
import { getSession, logout } from "@/app/auth-actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, ReceiptText, ArrowLeft, User as UserIcon } from "lucide-react";
import { PrismaClient } from "@prisma/client";
import ClientSidebarLink from "./ClientSidebarLink";

const prisma = new PrismaClient();

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const purchases = await prisma.purchase.findMany({
    where: { userId: session.id },
  });

  const totalSpent = purchases.reduce((acc, p) => acc + p.total, 0);

  const s = {
    bg: "#080a12",
    surface: "#0f1120",
    border: "rgba(255,255,255,0.06)",
    purple: "#7c3aed",
    purpleLight: "#a78bfa",
    purpleMuted: "rgba(124,58,237,0.12)",
    green: "#10b981",
    red: "#f87171",
    redMuted: "rgba(248,113,113,0.12)",
    muted: "#6b7280",
    text: "#e5e7eb",
  };

  return (
    <>
      <style>{`
        @media print {
          body { background: white !important; }
          aside, header, .no-print, .hide-on-print { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; background: white !important; }
          .receipt-card { box-shadow: none !important; page-break-inside: avoid; margin: 0 auto !important; }
          .print-modal-overlay { position: absolute !important; background: transparent !important; align-items: flex-start !important; padding: 0 !important; }
          .print-modal-content { width: 100% !important; margin: 0 !important; }
        }
        @media (max-width: 768px) {
          .customer-wrapper { flex-direction: column !important; }
          .customer-sidebar { width: 100% !important; height: auto !important; position: relative !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.06) !important; z-index: 1 !important; }
          .customer-main { margin-left: 0 !important; max-width: 100% !important; padding: 16px !important; }
          .admin-table-wrapper { overflow-x: auto !important; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      <div className="customer-wrapper" style={{ display: "flex", minHeight: "100vh", background: s.bg, color: s.text, fontFamily: "var(--font-jakarta, system-ui, sans-serif)" }}>
        {/* Sidebar */}
        <aside className="customer-sidebar" style={{ width: "260px", background: s.surface, borderRight: `1px solid ${s.border}`, display: "flex", flexDirection: "column", position: "fixed", height: "100vh", top: 0, left: 0, zIndex: 10 }}>
          <div style={{ padding: "24px 20px", borderBottom: `1px solid ${s.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/images/logo_white.png" alt="Logo" style={{ height: "24px" }} />
              <div>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Sonora Studio</p>
                <p style={{ margin: 0, fontSize: "11px", color: s.muted }}>Portal del Cliente</p>
              </div>
            </div>
          </div>

          <nav style={{ padding: "16px 12px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
            <p style={{ fontSize: "10px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", paddingLeft: "8px" }}>Mi Cuenta</p>

            <ClientSidebarLink href="/purchases" icon={<ReceiptText size={18} />} label="Mis Compras">
              <span style={{ marginLeft: "auto", fontSize: "11px", background: s.purple, color: "#fff", padding: "2px 7px", borderRadius: "10px", fontWeight: 700 }}>
                {purchases.length}
              </span>
            </ClientSidebarLink>

            <ClientSidebarLink href="/profile" icon={<UserIcon size={18} />} label="Mi Perfil" />
          </nav>

          {/* Stats */}
          {purchases.length > 0 && (
            <div style={{ padding: "0 12px 16px" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "16px", border: `1px solid ${s.border}` }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Total Gastado</p>
                <p style={{ margin: "0 0 12px", fontSize: "22px", fontWeight: 800, color: s.green }}>S/ {totalSpent.toFixed(2)}</p>
                <p style={{ margin: 0, fontSize: "12px", color: s.muted }}>{purchases.length} compra{purchases.length !== 1 ? "s" : ""} realizadas</p>
              </div>
            </div>
          )}

          <div style={{ padding: "16px 12px", borderTop: `1px solid ${s.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", marginBottom: "10px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: `linear-gradient(135deg, ${s.purple}, #2563eb)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px", flexShrink: 0 }}>
                {session.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session.name}</p>
                <p style={{ margin: 0, fontSize: "11px", color: s.muted }}>Cliente</p>
              </div>
            </div>

            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", color: s.muted, textDecoration: "none", fontSize: "13px", borderRadius: "8px", marginBottom: "6px" }}>
              <ArrowLeft size={15} /> Volver a la Tienda
            </Link>
            <form action={logout}>
              <button type="submit" style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", color: s.red, background: s.redMuted, border: "none", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: 600 }}>
                <LogOut size={15} /> Cerrar Sesión
              </button>
            </form>
          </div>
        </aside>

        {children}
      </div>
    </>
  );
}
