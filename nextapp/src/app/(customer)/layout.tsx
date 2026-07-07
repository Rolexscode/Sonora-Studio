import React from "react";
import { getSession, logout } from "@/app/auth-actions";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import CustomerSidebarClient from "./CustomerSidebarClient";

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
        
        .customer-sidebar { transform: translateX(0); }
        .customer-topbar { display: none !important; }
        .customer-sidebar-close { display: none !important; }
        
        @media (max-width: 768px) {
          .customer-wrapper { flex-direction: column !important; }
          .customer-sidebar { transform: translateX(-100%) !important; }
          .customer-sidebar.open { transform: translateX(0) !important; }
          .customer-main { margin-left: 0 !important; max-width: 100% !important; padding: 16px !important; }
          .customer-topbar { display: flex !important; }
          .customer-sidebar-close { display: block !important; }
          .admin-table-wrapper { overflow-x: auto !important; }
        }
        
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      <div className="customer-wrapper" style={{ display: "flex", minHeight: "100vh", background: s.bg, color: s.text, fontFamily: "var(--font-jakarta, system-ui, sans-serif)" }}>
        <CustomerSidebarClient 
          purchasesCount={purchases.length} 
          totalSpent={totalSpent} 
          sessionName={session.name} 
          logoutAction={async () => {
            "use server";
            await logout();
          }} 
        />

        {children}
      </div>
    </>
  );
}
