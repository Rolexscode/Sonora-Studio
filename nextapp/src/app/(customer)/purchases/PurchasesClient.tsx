"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Package, ShoppingBag, Search, X, Printer } from "lucide-react";
import { Purchase } from "@prisma/client";

interface PurchasesClientProps {
  purchases: Purchase[];
}

export default function PurchasesClient({ purchases }: PurchasesClientProps) {
  const [search, setSearch] = useState("");
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const s = {
    card: "#141728",
    border: "rgba(255,255,255,0.06)",
    purple: "#7c3aed",
    purpleLight: "#a78bfa",
    purpleMuted: "rgba(124,58,237,0.12)",
    muted: "#6b7280",
    text: "#e5e7eb",
  };

  const filteredPurchases = purchases.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    const orderIdStr = p.id.toString().padStart(4, "0");
    if (`#${orderIdStr}`.includes(q)) return true;
    
    try {
      const items = JSON.parse(p.items || "[]");
      return items.some((item: any) => item.name.toLowerCase().includes(q));
    } catch {
      return false;
    }
  });

  return (
    <main className="customer-main" style={{ flex: 1, marginLeft: "260px", padding: "36px 40px", maxWidth: "calc(100vw - 260px)" }}>
      <div className={selectedPurchase ? "hide-on-print" : ""}>
        <header style={{ marginBottom: "36px" }} className="no-print">
          <h1 style={{ margin: "0 0 4px", fontSize: "26px", fontWeight: 800, letterSpacing: "-0.02em" }}>Historial de Compras</h1>
          <p style={{ margin: 0, fontSize: "14px", color: s.muted }}>Revisa el detalle de tus pedidos y boletas electrónicas.</p>
        </header>

        <div className="no-print" style={{ marginBottom: "24px", position: "relative" }}>
          <Search size={18} color={s.muted} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Buscar por nombre de producto o número de orden (ej: #0001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "14px 16px 14px 44px", background: s.card, border: `1px solid ${s.border}`, borderRadius: "12px", color: "#fff", outline: "none", fontSize: "14px" }}
          />
        </div>

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
        ) : filteredPurchases.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: s.muted }}>No se encontraron compras que coincidan con tu búsqueda.</div>
        ) : (
          <div style={{ background: s.card, borderRadius: "12px", border: `1px solid ${s.border}`, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "rgba(0,0,0,0.2)", fontSize: "12px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>
                <tr>
                  <th style={{ padding: "16px 24px", fontWeight: 600 }}>Orden</th>
                  <th style={{ padding: "16px 24px", fontWeight: 600 }}>Fecha</th>
                  <th style={{ padding: "16px 24px", fontWeight: 600 }}>Artículos</th>
                  <th style={{ padding: "16px 24px", fontWeight: 600 }}>Total</th>
                  <th style={{ padding: "16px 24px", fontWeight: 600, textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((p) => {
                  const items = (() => { try { return JSON.parse(p.items || "[]"); } catch { return []; } })();
                  const date = new Date(p.createdAt);
                  const itemsDesc = items.map((i: any) => `${i.quantity}x ${i.name}`).join(", ");
                  
                  return (
                    <tr key={p.id} style={{ borderTop: `1px solid ${s.border}`, fontSize: "14px" }}>
                      <td style={{ padding: "16px 24px", fontWeight: 700, color: s.purpleLight }}>#{p.id.toString().padStart(4, "0")}</td>
                      <td style={{ padding: "16px 24px", color: s.muted }}>{date.toLocaleDateString()} <span style={{ fontSize: "12px" }}>{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></td>
                      <td style={{ padding: "16px 24px", maxWidth: "250px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={itemsDesc}>{itemsDesc}</td>
                      <td style={{ padding: "16px 24px", fontWeight: 700 }}>S/ {p.total.toFixed(2)}</td>
                      <td style={{ padding: "16px 24px", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedPurchase(p)}
                          style={{ padding: "8px 16px", background: "transparent", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                          onMouseOver={(e) => e.currentTarget.style.background = "rgba(96,165,250,0.1)"}
                          onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          Ver boleta
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Receipt */}
      {selectedPurchase && (
        <div className="print-modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setSelectedPurchase(null)}>
          <div className="print-modal-content" style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <div className="no-print" style={{ position: "absolute", top: "-12px", right: "-76px", display: "flex", gap: "12px" }}>
              <button onClick={() => window.print()} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: 0.8 }} title="Imprimir Boleta" onMouseOver={(e) => e.currentTarget.style.opacity = "1"} onMouseOut={(e) => e.currentTarget.style.opacity = "0.8"}>
                <Printer size={24} />
              </button>
              <button onClick={() => setSelectedPurchase(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", opacity: 0.8 }} onMouseOver={(e) => e.currentTarget.style.opacity = "1"} onMouseOut={(e) => e.currentTarget.style.opacity = "0.8"}>
                <X size={28} />
              </button>
            </div>
            <ReceiptCard purchase={selectedPurchase} />
          </div>
        </div>
      )}
    </main>
  );
}

function ReceiptCard({ purchase: p }: { purchase: Purchase }) {
  const items = (() => { try { return JSON.parse(p.items || "[]"); } catch { return []; } })();
  const date = new Date(p.createdAt);
  
  return (
    <div
      className="receipt-card"
      style={{ background: "#fff", color: "#111", borderRadius: "4px", position: "relative", overflow: "visible", boxShadow: "0 16px 40px rgba(0,0,0,0.5)", width: "100%", minWidth: "360px", maxWidth: "380px" }}
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
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", minHeight: "60px", maxHeight: "180px", overflowY: "auto" }}>
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

        <div style={{ padding: "0 24px 28px", textAlign: "center", marginTop: "10px" }}>
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
}
