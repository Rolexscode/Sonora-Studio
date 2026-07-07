"use server";

import { getSession, logout } from "@/app/auth-actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, LogOut, ReceiptText, ArrowLeft, ShoppingBag } from "lucide-react";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function PurchasesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const purchases = await prisma.purchase.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
  });

  const totalSpent = purchases.reduce((acc, p) => acc + p.total, 0);

  const s = {
    bg: "#080a12",
    surface: "#0f1120",
    card: "#141728",
    border: "rgba(255,255,255,0.06)",
    purple: "#7c3aed",
    purpleLight: "#a78bfa",
    purpleMuted: "rgba(124,58,237,0.12)",
    green: "#10b981",
    greenMuted: "rgba(16,185,129,0.12)",
    red: "#f87171",
    redMuted: "rgba(248,113,113,0.12)",
    muted: "#6b7280",
    text: "#e5e7eb",
  };

  return (
    <>
      <style>{`
        @media print {
          aside, header, .no-print { display: none !important; }
          main { margin: 0 !important; padding: 16px !important; }
          .receipt-card { box-shadow: none !important; page-break-inside: avoid; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: s.bg, color: s.text, fontFamily: "var(--font-jakarta, system-ui, sans-serif)" }}>

        {/* Sidebar */}
        <aside style={{ width: "260px", background: s.surface, borderRight: `1px solid ${s.border}`, display: "flex", flexDirection: "column", position: "fixed", height: "100vh", top: 0, left: 0, zIndex: 10 }}>
          <div style={{ padding: "24px 20px", borderBottom: `1px solid ${s.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/images/logo.png" alt="Logo" style={{ width: "32px", height: "32px", borderRadius: "8px" }} />
              <div>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Sonora Studio</p>
                <p style={{ margin: 0, fontSize: "11px", color: s.muted }}>Portal del Cliente</p>
              </div>
            </div>
          </div>

          <nav style={{ padding: "16px 12px", flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
            <p style={{ fontSize: "10px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", paddingLeft: "8px" }}>Mi Cuenta</p>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "10px", background: s.purpleMuted, color: s.purpleLight, border: `1px solid rgba(124,58,237,0.2)`, fontSize: "14px", fontWeight: 600 }}>
              <ReceiptText size={18} /> Mis Compras
              <span style={{ marginLeft: "auto", fontSize: "11px", background: s.purple, color: "#fff", padding: "2px 7px", borderRadius: "10px", fontWeight: 700 }}>
                {purchases.length}
              </span>
            </div>
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

        {/* Main */}
        <main style={{ flex: 1, marginLeft: "260px", padding: "36px 40px", maxWidth: "calc(100vw - 260px)" }}>
          <header style={{ marginBottom: "36px" }} className="no-print">
            <h1 style={{ margin: "0 0 4px", fontSize: "26px", fontWeight: 800, letterSpacing: "-0.02em" }}>Historial de Compras</h1>
            <p style={{ margin: 0, fontSize: "14px", color: s.muted }}>Revisa el detalle de tus pedidos y boletas electrónicas.</p>
          </header>

          {purchases.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", background: s.card, borderRadius: "20px", border: `1px dashed ${s.border}`, textAlign: "center" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: s.purpleMuted, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <ShoppingBag size={36} color={s.purpleLight} />
              </div>
              <h2 style={{ fontSize: "22px", margin: "0 0 8px", fontWeight: 700 }}>Aún no tienes compras</h2>
              <p style={{ color: s.muted, maxWidth: "380px", margin: "0 auto 28px", lineHeight: 1.6 }}>
                Explora nuestro catálogo premium y equípate con los mejores instrumentos y equipos de estudio.
              </p>
              <Link href="/" style={{ padding: "14px 28px", background: s.purple, color: "#fff", textDecoration: "none", borderRadius: "12px", fontWeight: 700, fontSize: "15px" }}>
                Ir al Catálogo
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "24px" }}>
              {purchases.map(p => {
                const items = (() => { try { return JSON.parse(p.items || "[]"); } catch { return []; } })();
                const date = new Date(p.createdAt);
                return (
                  <div
                    key={p.id}
                    className="receipt-card"
                    style={{ background: "#fff", color: "#111", borderRadius: "4px", position: "relative", overflow: "visible", boxShadow: "0 16px 40px rgba(0,0,0,0.5)", marginTop: "10px", marginBottom: "10px" }}
                  >
                    {/* Torn top edge */}
                    <div style={{ position: "absolute", top: "-10px", left: 0, right: 0, height: "12px", backgroundImage: "radial-gradient(circle at 50% 100%, #080a12 70%, transparent 70%)", backgroundSize: "20px 12px", backgroundRepeat: "repeat-x", backgroundPosition: "0 0" }} />

                    {/* Header */}
                    <div style={{ padding: "28px 24px 20px", borderBottom: "1.5px dashed #d1d5db", textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", background: "#111", borderRadius: "8px", marginBottom: "12px" }}>
                        <Package size={20} color="#fff" />
                      </div>
                      <h3 style={{ margin: "0 0 2px", fontSize: "18px", textTransform: "uppercase", letterSpacing: "3px", fontWeight: 900 }}>Sonora Studio</h3>
                      <p style={{ margin: "0 0 1px", fontSize: "11px", color: "#6b7280" }}>RUC: 20123456789</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>Av. La Música 123, Lima, Perú</p>

                      <div style={{ marginTop: "16px", padding: "10px 16px", background: "#f9fafb", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ textAlign: "left" }}>
                          <p style={{ margin: 0, fontSize: "10px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Boleta Electrónica</p>
                          <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#dc2626" }}>B001-{p.id.toString().padStart(6, "0")}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ margin: 0, fontSize: "10px", color: "#9ca3af" }}>{date.toLocaleDateString()}</p>
                          <p style={{ margin: 0, fontSize: "12px", fontWeight: 600 }}>{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div style={{ padding: "20px 24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "8px", marginBottom: "12px", borderBottom: "1px solid #e5e7eb", fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                        <span style={{ flex: 1 }}>Descripción</span>
                        <span style={{ width: "90px", textAlign: "right" }}>Importe</span>
                      </div>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", minHeight: "60px" }}>
                        {items.map((item: { quantity: number; name: string; price: number }, i: number) => (
                          <li key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "13px" }}>
                            <span style={{ flex: 1, paddingRight: "12px", lineHeight: 1.4 }}>
                              <span style={{ fontWeight: 700, color: "#374151" }}>{item.quantity}x </span>
                              {item.name}
                            </span>
                            <span style={{ width: "90px", textAlign: "right", fontWeight: 600, flexShrink: 0 }}>
                              S/ {(item.quantity * item.price).toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Totals */}
                    <div style={{ padding: "16px 24px 28px", borderTop: "1.5px dashed #d1d5db" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px", color: "#6b7280" }}>
                        <span>Op. Gravada</span>
                        <span>S/ {(p.total / 1.18).toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "16px", color: "#6b7280" }}>
                        <span>IGV (18%)</span>
                        <span>S/ {(p.total - p.total / 1.18).toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: 900, borderTop: "2px solid #111", paddingTop: "12px" }}>
                        <span>TOTAL</span>
                        <span>S/ {p.total.toFixed(2)}</span>
                      </div>

                      {p.paymentDetails && (
                        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px dashed #d1d5db" }}>
                          <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em" }}>Métodos de Pago</p>
                          {(() => {
                            try {
                              const methods = JSON.parse(p.paymentDetails);
                              return methods.map((m: any, idx: number) => (
                                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#374151", marginBottom: "4px" }}>
                                  <span>{m.method}</span>
                                  <span>S/ {m.amount.toFixed(2)}</span>
                                </div>
                              ));
                            } catch {
                              return null;
                            }
                          })()}
                        </div>
                      )}
                    </div>

                      <div style={{ padding: "0 24px 28px", textAlign: "center", marginTop: "20px" }}>
                        {/* Simple barcode visual */}
                        <div style={{ display: "flex", justifyContent: "center", gap: "2px", marginBottom: "8px" }}>
                          {Array.from({ length: 28 }).map((_, i) => (
                            <div key={i} style={{ width: i % 3 === 0 ? "3px" : "1.5px", height: "28px", background: "#111", opacity: i % 5 === 0 ? 0.4 : 1 }} />
                          ))}
                        </div>
                        <p style={{ margin: 0, fontSize: "10px", color: "#9ca3af", letterSpacing: "0.1em" }}>
                          B001{p.id.toString().padStart(6, "0")} · {date.getTime().toString().slice(-8)}
                        </p>
                        <p style={{ margin: "10px 0 0", fontSize: "11px", color: "#9ca3af", fontStyle: "italic" }}>¡Gracias por su compra!</p>
                      </div>

                    {/* Torn bottom edge */}
                    <div style={{ position: "absolute", bottom: "-10px", left: 0, right: 0, height: "12px", backgroundImage: "radial-gradient(circle at 50% 0%, #080a12 70%, transparent 70%)", backgroundSize: "20px 12px", backgroundRepeat: "repeat-x", backgroundPosition: "0 0" }} />
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
