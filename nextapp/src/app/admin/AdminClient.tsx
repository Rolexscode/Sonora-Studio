"use client";

import { addProduct, updateProduct, deleteProduct, updateUserRole, addCategory, updateCategory, deleteCategory, createPromotion, updatePromotion, deletePromotion } from "@/app/actions";
import { logout } from "@/app/auth-actions";
import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  LogOut, Package, PlusCircle, ShoppingBag, Trash2,
  LayoutDashboard, Edit2, X, Upload, CheckCircle,
  AlertCircle, Plus, Minus, TrendingUp, Users, Eye,
  Download, FileText, Menu, ChevronLeft, Mail, Percent, BarChart2
} from "lucide-react";
import { uploadProductImage } from "@/lib/supabase";

interface Product {
  id: number; name: string; categoryId: number | null; category: { id: number; name: string } | null; price: number;
  rating: number; inStock: boolean; stock: number; isNew: boolean; desc: string; specs: string; image: string;
}
interface Purchase {
  id: number; userId: number; total: number; createdAt: Date; items: string;
  user?: { name: string; email: string };
}
interface UserWithStats {
  id: number; name: string; email: string; role: string;
  purchases: { total: number }[];
}
interface Promotion {
  id: number; title: string; discount: number; startDate: Date; endDate: Date; isActive: boolean; targetType: string; targetId: number | null;
}

type Tab = "dashboard" | "products" | "categories" | "promotions" | "sales" | "customers" | "admins" | "reports";

const s = {
  bg: "#080a12", surface: "#0f1120", card: "#141728",
  border: "rgba(255,255,255,0.06)", purple: "#7c3aed",
  purpleLight: "#a78bfa", purpleMuted: "rgba(124,58,237,0.12)",
  green: "#10b981", greenMuted: "rgba(16,185,129,0.12)",
  red: "#f87171", redMuted: "rgba(248,113,113,0.12)",
  amber: "#fbbf24", sky: "#38bdf8", skyMuted: "rgba(56,189,248,0.12)",
  muted: "#6b7280", text: "#e5e7eb",
} as const;

// ─── CSV Export ─────────────────────────────────────────────
function exportCSV(purchases: Purchase[]) {
  const rows = [
    ["ID", "Fecha", "Hora", "Productos", "Total (S/)"],
    ...purchases.map(p => {
      const items = (() => { try { return JSON.parse(p.items || "[]"); } catch { return []; } })();
      const d = new Date(p.createdAt);
      return [
        `#${p.id.toString().padStart(4, "0")}`,
        d.toLocaleDateString("es-PE"),
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        items.map((i: { quantity: number; name: string }) => `${i.quantity}x ${i.name}`).join("; "),
        p.total.toFixed(2),
      ];
    }),
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte-ventas-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Print / PDF ────────────────────────────────────────────
function triggerPrint() { window.print(); }

// ─── Bar Chart (SVG) ────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const H = 120; const W = 420;
  const barW = Math.floor(W / data.length) - 10;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4c1d95" stopOpacity={0.6} />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(t => (
        <line key={t} x1={0} y1={H - 20 - (H - 20) * t} x2={W} y2={H - 20 - (H - 20) * t}
          stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      ))}
      {data.map((d, i) => {
        const bh = Math.max((d.value / max) * (H - 28), d.value > 0 ? 4 : 0);
        const x = i * (W / data.length) + 5;
        const y = H - 20 - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx={3} fill="url(#bg)" />
            <text x={x + barW / 2} y={H - 5} textAnchor="middle" fill="#4b5563" fontSize={9}>{d.label}</text>
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 3} textAnchor="middle" fill="#a78bfa" fontSize={9} fontWeight="bold">
                {d.value.toFixed(0)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Donut Chart (SVG) ──────────────────────────────────────
const DONUT_COLORS = ["#7c3aed", "#10b981", "#38bdf8", "#f59e0b", "#f87171"];
function DonutChart({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 50; const cx = 65; const cy = 60; const stroke = 18;
  let offset = 0;
  const circ = 2 * Math.PI * R;
  const segments = data.map((d, i) => {
    const pct = d.value / total;
    const seg = { ...d, pct, offset, color: DONUT_COLORS[i % DONUT_COLORS.length] };
    offset += pct;
    return seg;
  });
  return (
    <svg viewBox="0 0 260 120" style={{ width: "100%", height: "auto", display: "block" }}>
      {segments.map((seg, i) => (
        <circle key={i} cx={cx} cy={cy} r={R}
          fill="none" stroke={seg.color} strokeWidth={stroke}
          strokeDasharray={`${seg.pct * circ} ${circ}`}
          strokeDashoffset={-seg.offset * circ}
          transform={`rotate(-90 ${cx} ${cy})`}
          opacity={0.85}
        />
      ))}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="#e5e7eb" fontSize={14} fontWeight="bold">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#6b7280" fontSize={8}>productos</text>
      {/* Legend */}
      {segments.map((seg, i) => (
        <g key={i} transform={`translate(140, ${10 + i * 20})`}>
          <rect width={10} height={10} rx={2} fill={seg.color} />
          <text x={14} y={9} fill="#9ca3af" fontSize={8}>{seg.label} ({seg.value})</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Mini Sparkline ─────────────────────────────────────────
function Sparkline({ data, color = "#7c3aed" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const W = 80; const H = 32;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - (v / max) * H}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "80px", height: "32px" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Toggle ─────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      style={{ background: value ? s.purple : "rgba(255,255,255,0.08)", border: "none", borderRadius: "20px", width: "44px", height: "24px", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: "3px", left: value ? "23px" : "3px", width: "18px", height: "18px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", display: "block" }} />
    </button>
  );
}

// ─── Form Input ─────────────────────────────────────────────
function InputField({ label, name, type = "text", required = false, value, onChange, placeholder, min, max, step, fullWidth = false }:
  { label: string; name: string; type?: string; required?: boolean; value: string; onChange: (v: string) => void; placeholder?: string; min?: string; max?: string; step?: string; fullWidth?: boolean }) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined, display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label} {required && <span style={{ color: s.purple }}>*</span>}
      </label>
      <input name={name} type={type} required={required} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} min={min} max={max} step={step}
        style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", outline: "none", transition: "border 0.2s", width: "100%", boxSizing: "border-box" }}
        onFocus={e => (e.target.style.borderColor = s.purple)}
        onBlur={e => (e.target.style.borderColor = s.border)}
      />
    </div>
  );
}

// ─── Image Uploader ─────────────────────────────────────────
function ImageUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Solo se permiten imágenes."); return; }
    setError(""); setUploading(true);
    try {
      const url = await uploadProductImage(file);
      onChange(url);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al subir imagen";
      setError(msg.includes("Invalid API key") ? "Configura NEXT_PUBLIC_SUPABASE_ANON_KEY en tu .env" : msg);
    } finally { setUploading(false); }
  }, [onChange]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Imagen del Producto</label>
      <div style={{ display: "grid", gridTemplateColumns: value ? "1fr 180px" : "1fr", gap: "16px" }}>
        <div onClick={() => inputRef.current?.click()} onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)} onDrop={onDrop}
          style={{ border: `2px dashed ${dragging ? s.purple : s.border}`, borderRadius: "12px", padding: "28px", textAlign: "center", cursor: "pointer", background: dragging ? s.purpleMuted : "rgba(0,0,0,0.15)", transition: "all 0.2s" }}>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          {uploading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: s.muted }}>
              <div style={{ width: "28px", height: "28px", border: `3px solid ${s.border}`, borderTopColor: s.purple, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: "13px" }}>Subiendo...</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: s.muted }}>
              <Upload size={24} style={{ color: s.purple }} />
              <span style={{ fontSize: "13px", color: s.text }}>Arrastra o haz clic</span>
              <span style={{ fontSize: "11px" }}>PNG, JPG, WebP</span>
            </div>
          )}
        </div>
        {value && (
          <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", border: `1px solid ${s.border}`, aspectRatio: "4/3" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button type="button" onClick={() => onChange("")}
              style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
              <X size={12} />
            </button>
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: s.muted }}>O pega una URL:</span>
        <input type="url" placeholder="https://..." value={value} onChange={e => onChange(e.target.value)}
          style={{ flex: 1, padding: "6px 10px", fontSize: "12px", background: "rgba(0,0,0,0.2)", border: `1px solid ${s.border}`, borderRadius: "6px", color: s.text, outline: "none" }} />
      </div>
      {error && <div style={{ display: "flex", alignItems: "center", gap: "6px", color: s.red, fontSize: "12px", padding: "8px 12px", background: s.redMuted, borderRadius: "8px" }}><AlertCircle size={14} /> {error}</div>}
    </div>
  );
}

// ─── Specs Editor ───────────────────────────────────────────
interface SpecsEntry { key: string; value: string }
function SpecsEditor({ value, onChange }: { value: SpecsEntry[]; onChange: (v: SpecsEntry[]) => void }) {
  return (
    <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Especificaciones</label>
        <button type="button" onClick={() => onChange([...value, { key: "", value: "" }])}
          style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: s.purpleLight, background: "none", border: "none", cursor: "pointer" }}>
          <Plus size={14} /> Agregar
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {value.map((spec, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "8px", alignItems: "center" }}>
            <input placeholder="Ej: Cuerdas" value={spec.key} onChange={e => onChange(value.map((sv, j) => j === i ? { ...sv, key: e.target.value } : sv))}
              style={{ padding: "8px 12px", background: "rgba(0,0,0,0.2)", border: `1px solid ${s.border}`, borderRadius: "8px", color: s.text, fontSize: "13px", outline: "none" }} />
            <input placeholder="Ej: 6" value={spec.value} onChange={e => onChange(value.map((sv, j) => j === i ? { ...sv, value: e.target.value } : sv))}
              style={{ padding: "8px 12px", background: "rgba(0,0,0,0.2)", border: `1px solid ${s.border}`, borderRadius: "8px", color: s.text, fontSize: "13px", outline: "none" }} />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}
              style={{ background: s.redMuted, border: "none", color: s.red, borderRadius: "8px", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Minus size={14} />
            </button>
          </div>
        ))}
        {value.length === 0 && (
          <div style={{ padding: "16px", textAlign: "center", fontSize: "13px", color: s.muted, border: `1px dashed ${s.border}`, borderRadius: "8px" }}>
            Sin especificaciones.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Form helpers ────────────────────────────────────────────
function emptyForm() {
  return { name: "", categoryId: "", price: "", rating: "4.5", stock: "0", desc: "", image: "", inStock: true, isNew: true, specs: [] as SpecsEntry[] };
}
function productToForm(p: Product) {
  let specs: SpecsEntry[] = [];
  try { const obj = JSON.parse(p.specs); specs = Object.entries(obj).map(([key, value]) => ({ key, value: String(value) })); } catch { /* empty */ }
  return { name: p.name, categoryId: String(p.categoryId), price: String(p.price), rating: String(p.rating), stock: String(p.stock || 0), desc: p.desc, image: p.image, inStock: p.inStock, isNew: p.isNew, specs };
}
function formToFormData(form: ReturnType<typeof emptyForm>) {
  const fd = new FormData();
  fd.set("name", form.name); fd.set("categoryId", form.categoryId); fd.set("price", form.price);
  fd.set("rating", form.rating); fd.set("stock", form.stock); fd.set("desc", form.desc); fd.set("image", form.image);
  fd.set("inStock", String(form.inStock)); fd.set("isNew", String(form.isNew));
  const specsObj: Record<string, string> = {};
  form.specs.forEach(({ key, value }) => { if (key) specsObj[key] = value; });
  fd.set("specs", JSON.stringify(specsObj));
  return fd;
}

// ─── Product Form ────────────────────────────────────────────
function ProductForm({ initialData, categories, onSubmit, submitLabel, loading }:
  { initialData: ReturnType<typeof emptyForm>; categories: {id: number, name: string}[]; onSubmit: (f: ReturnType<typeof emptyForm>) => Promise<void>; submitLabel: string; loading: boolean }) {
  const [form, setForm] = useState(initialData);
  const set = (key: keyof typeof form) => (v: unknown) => setForm(f => ({ ...f, [key]: v }));

  useEffect(() => {
    if ((!form.categoryId || form.categoryId === "null") && categories.length > 0) {
      setForm(f => ({...f, categoryId: String(categories[0].id)}));
    }
  }, [categories, form.categoryId]);

  return (
    <form onSubmit={async e => { e.preventDefault(); await onSubmit(form); }} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
      <InputField label="Nombre del Producto" name="name" required fullWidth value={form.name} onChange={set("name")} placeholder="Ej: Gibson Les Paul" />
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Categoría <span style={{ color: s.purple }}>*</span></label>
        <select name="categoryId" value={form.categoryId} onChange={e => set("categoryId")(e.target.value)} required
          style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", outline: "none" }}>
          {categories.map(c => <option key={c.id} value={c.id} style={{ background: s.surface }}>{c.name.charAt(0).toUpperCase() + c.name.slice(1)}</option>)}
        </select>
      </div>
      <InputField label="Precio (S/)" name="price" type="number" step="0.01" min="0" required value={form.price} onChange={set("price")} placeholder="0.00" />
      <InputField label="Calificación" name="rating" type="number" step="0.1" min="1" max="5" required value={form.rating} onChange={set("rating")} placeholder="4.5" />
      <InputField label="Cantidad (Stock)" name="stock" type="number" min="0" required value={form.stock} onChange={set("stock")} placeholder="0" />
      <div style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: "24px" }}>
        {[{ key: "inStock" as const, label: "En Stock", desc: "Disponible para compra" }, { key: "isNew" as const, label: "Producto Nuevo", desc: 'Badge "NUEVO"' }].map(({ key, label, desc }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Toggle value={form[key] as boolean} onChange={set(key)} />
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{label}</p>
              <p style={{ margin: 0, fontSize: "12px", color: s.muted }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Descripción <span style={{ color: s.purple }}>*</span></label>
        <textarea name="desc" rows={4} required value={form.desc} onChange={e => set("desc")(e.target.value)} placeholder="Describe el producto..."
          style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", outline: "none", resize: "vertical", fontFamily: "inherit" }}
          onFocus={e => (e.target.style.borderColor = s.purple)} onBlur={e => (e.target.style.borderColor = s.border)} />
      </div>
      <ImageUploader value={form.image} onChange={set("image")} />
      <SpecsEditor value={form.specs} onChange={set("specs")} />
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
        <button type="submit" disabled={loading}
          style={{ padding: "12px 32px", background: loading ? "rgba(124,58,237,0.5)" : s.purple, color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          {loading ? <><div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Guardando...</> : submitLabel}
        </button>
      </div>
    </form>
  );
}

// ─── Stat Card ───────────────────────────────────────────────
function StatCard({ label, value, icon, color, muted, sparkData, trend }:
  { label: string; value: string; icon: React.ReactNode; color: string; muted: string; sparkData?: number[]; trend?: string }) {
  return (
    <div style={{ background: s.card, padding: "20px 24px", borderRadius: "16px", border: `1px solid ${s.border}`, display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: "12px", color: s.muted, fontWeight: 500 }}>{label}</p>
          <p style={{ margin: 0, fontSize: "26px", fontWeight: 800, letterSpacing: "-0.03em" }}>{value}</p>
        </div>
        <div style={{ padding: "10px", background: muted, color, borderRadius: "12px" }}>{icon}</div>
      </div>
      {(sparkData || trend) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {trend && <span style={{ fontSize: "11px", color: s.muted }}>{trend}</span>}
          {sparkData && <Sparkline data={sparkData} color={color} />}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function AdminClient({
  session,
  products = [],
  purchases = [],
  users = [],
  categories = [],
  promotions = [],
}: {
  session: { id: number; name: string; email: string; role: string };
  products?: Product[];
  purchases?: Purchase[];
  users?: UserWithStats[];
  categories?: { id: number; name: string }[];
  promotions?: Promotion[];
}) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editCategory, setEditCategory] = useState<{ id: number, name: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategoryQuery, setSearchCategoryQuery] = useState("");
  const [searchSalesQuery, setSearchSalesQuery] = useState("");
  const [searchCustomersQuery, setSearchCustomersQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [editPromotion, setEditPromotion] = useState<Promotion | null>(null);
  const [promoTargetType, setPromoTargetType] = useState("ALL");
  const [promoProductSearch, setPromoProductSearch] = useState("");
  const [receiptSale, setReceiptSale] = useState<Purchase | null>(null);

  // Report state
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportCategoryId, setReportCategoryId] = useState("");
  const [reportProductId, setReportProductId] = useState("");
  const [reportMonth, setReportMonth] = useState("");

  const displayProducts = products
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.category?.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
    .slice()
    .reverse();

  const displayPurchases = purchases.filter(sale => {
    const q = searchSalesQuery.toLowerCase();
    const idMatch = sale.id.toString().includes(q);
    const userMatch = sale.user && (sale.user.name.toLowerCase().includes(q) || sale.user.email.toLowerCase().includes(q));
    const itemsMatch = sale.items.toLowerCase().includes(q);
    return idMatch || userMatch || itemsMatch;
  });

  const displayUsers = users.filter(u => {
    const q = searchCustomersQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toString().includes(q);
  });

  const displayCustomers = displayUsers.filter(u => u.role === "CUSTOMER");
  const displayAdmins = displayUsers.filter(u => u.role === "ADMIN");

  const totalRevenue = purchases.reduce((acc, sale) => acc + sale.total, 0);

  // Chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d;
  });
  const dailyRevenue = last7Days.map(day => ({
    label: day.toLocaleDateString("es", { weekday: "short" }),
    value: purchases.filter(p => new Date(p.createdAt).toDateString() === day.toDateString()).reduce((sum, p) => sum + p.total, 0),
  }));

  const categoriesMap = new Map<string, number>();
  products.forEach(p => {
    const cat = p.category?.name?.toLowerCase() || "sin categoría";
    categoriesMap.set(cat, (categoriesMap.get(cat) || 0) + 1);
  });
  const categoryData = Array.from(categoriesMap.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const sparkRevenue = dailyRevenue.map(d => d.value);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };

  const handleAdd = async (form: ReturnType<typeof emptyForm>) => {
    setLoading(true);
    try { await addProduct(formToFormData(form)); showToast("¡Producto creado exitosamente!"); setShowAddModal(false); }
    catch { showToast("Error al crear el producto.", false); }
    finally { setLoading(false); }
  };
  const handleUpdate = async (form: ReturnType<typeof emptyForm>) => {
    if (!editProduct) return;
    setLoading(true);
    try { await updateProduct(editProduct.id, formToFormData(form)); setEditProduct(null); showToast("Producto actualizado."); }
    catch { showToast("Error al actualizar.", false); }
    finally { setLoading(false); }
  };

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = new FormData(e.currentTarget).get("name") as string;
    if (!name) return;
    setLoading(true);
    try { await addCategory(name); showToast("Categoría agregada."); setShowCategoryModal(false); }
    catch { showToast("Error al crear categoría.", false); }
    finally { setLoading(false); }
  };
  const handleAddPromotion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      title: fd.get("title") as string,
      discount: parseFloat(fd.get("discount") as string),
      startDate: new Date(fd.get("startDate") as string),
      endDate: new Date(fd.get("endDate") as string),
      isActive: fd.get("isActive") === "on",
      targetType: fd.get("targetType") as string,
      targetId: fd.get("targetId") ? parseInt(fd.get("targetId") as string) : undefined,
    };
    if (!data.title || isNaN(data.discount)) return;
    setLoading(true);
    try { await createPromotion(data); showToast("Promoción agregada."); setShowPromotionModal(false); }
    catch { showToast("Error al agregar promoción.", false); }
    finally { setLoading(false); }
  };
  const handleUpdatePromotion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editPromotion) return;
    const fd = new FormData(e.currentTarget);
    const data = {
      title: fd.get("title") as string,
      discount: parseFloat(fd.get("discount") as string),
      startDate: new Date(fd.get("startDate") as string),
      endDate: new Date(fd.get("endDate") as string),
      isActive: fd.get("isActive") === "on",
      targetType: fd.get("targetType") as string,
      targetId: fd.get("targetId") ? parseInt(fd.get("targetId") as string) : undefined,
    };
    setLoading(true);
    try { await updatePromotion(editPromotion.id, data); showToast("Promoción actualizada."); setEditPromotion(null); setShowPromotionModal(false); }
    catch { showToast("Error al actualizar promoción.", false); }
    finally { setLoading(false); }
  };
  const handleUpdateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editCategory) return;
    const name = new FormData(e.currentTarget).get("name") as string;
    if (!name) return;
    setLoading(true);
    try { await updateCategory(editCategory.id, name); setEditCategory(null); showToast("Categoría actualizada."); }
    catch { showToast("Error al actualizar.", false); }
    finally { setLoading(false); }
  };
  const handleDeleteCategory = async (id: number) => {
    if (!confirm("¿Eliminar esta categoría? Se eliminarán los productos asociados.")) return;
    setLoading(true);
    try { await deleteCategory(id); showToast("Categoría eliminada."); }
    catch { showToast("Error al eliminar.", false); }
    finally { setLoading(false); }
  };

  const handleRoleChange = async (userId: number, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "CUSTOMER" : "ADMIN";
    if (!confirm(`¿Estás seguro de cambiar el rol a ${newRole}?`)) return;
    setLoading(true);
    try { 
      await updateUserRole(userId, newRole); 
      showToast(`Rol actualizado a ${newRole}.`); 
    }
    catch { showToast("Error al cambiar el rol.", false); }
    finally { setLoading(false); }
  };
  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este producto?")) return;
    await deleteProduct(id); showToast("Producto eliminado.");
  };

  // Report calculation logic
  const reportFilteredPurchases = purchases.filter(p => {
    let match = true;
    const d = new Date(p.createdAt);
    if (reportStartDate) {
      const sDate = new Date(reportStartDate + "T00:00:00");
      if (d < sDate) match = false;
    }
    if (reportEndDate) {
      const eDate = new Date(reportEndDate + "T23:59:59");
      if (d > eDate) match = false;
    }
    if (reportMonth) {
      const mStr = d.toISOString().slice(0, 7);
      if (mStr !== reportMonth) match = false;
    }
    if (reportCategoryId || reportProductId) {
      try {
        const items = JSON.parse(p.items || "[]");
        let hasItem = false;
        for (const item of items) {
          const prod = products.find(prod => prod.id === item.productId);
          if (reportProductId && String(item.productId) === reportProductId) hasItem = true;
          if (reportCategoryId && prod && String(prod.categoryId) === reportCategoryId) hasItem = true;
        }
        if (!hasItem) match = false;
      } catch { match = false; }
    }
    return match;
  });

  const reportTotalRevenue = reportFilteredPurchases.reduce((acc, p) => acc + p.total, 0);
  const reportTotalItemsSold = reportFilteredPurchases.reduce((acc, p) => {
    try {
      const items = JSON.parse(p.items || "[]");
      return acc + items.reduce((sum: number, i: any) => sum + i.quantity, 0);
    } catch { return acc; }
  }, 0);

  const navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "promotions", label: "Promociones", icon: <Percent size={18} />, badge: promotions.length },
    { id: "categories", label: "Categorías", icon: <Package size={18} />, badge: categories.length },
    { id: "products", label: "Productos", icon: <Package size={18} />, badge: products.length },
    { id: "sales", label: "Ventas", icon: <ShoppingBag size={18} />, badge: purchases.length },
    { id: "reports", label: "Reportes", icon: <BarChart2 size={18} /> },
    { id: "customers", label: "Clientes", icon: <Users size={18} />, badge: users.filter(u => u.role === "CUSTOMER").length },
    { id: "admins", label: "Administradores", icon: <CheckCircle size={18} />, badge: users.filter(u => u.role === "ADMIN").length },
  ];

  const Sidebar = () => (
    <aside className={`admin-sidebar${sidebarOpen ? " open" : ""}`} style={{
      width: "240px", background: s.surface, borderRight: `1px solid ${s.border}`,
      display: "flex", flexDirection: "column", position: "fixed", height: "100vh", top: 0, left: 0, zIndex: 200,
      transition: "transform 0.25s ease",
    }}>
      <div style={{ padding: "20px 16px", borderBottom: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/logo_white.png" alt="Logo" style={{ height: "24px" }} />
          <div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Sonora Admin</p>
            <p style={{ margin: 0, fontSize: "10px", color: s.muted }}>Panel de Control</p>
          </div>
        </div>
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)}
          style={{ background: "none", border: "none", color: s.muted, cursor: "pointer", display: "none", padding: "4px" }}>
          <ChevronLeft size={18} />
        </button>
      </div>

      <nav style={{ padding: "12px 10px", flex: 1, display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto" }}>
        <p style={{ fontSize: "10px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", paddingLeft: "8px" }}>Menú</p>
        {navItems.map(item => (
          <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", cursor: "pointer",
              background: tab === item.id ? s.purpleMuted : "transparent",
              color: tab === item.id ? s.purpleLight : s.muted,
              border: `1px solid ${tab === item.id ? "rgba(124,58,237,0.2)" : "transparent"}`,
              textAlign: "left", fontSize: "13px", fontWeight: tab === item.id ? 600 : 400, transition: "all 0.15s", width: "100%",
            }}>
            {item.icon}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge !== undefined && (
              <span style={{ fontSize: "10px", background: tab === item.id ? s.purple : "rgba(255,255,255,0.08)", color: tab === item.id ? "#fff" : s.muted, padding: "2px 6px", borderRadius: "10px", fontWeight: 700 }}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div style={{ padding: "12px 10px", borderTop: `1px solid ${s.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", marginBottom: "8px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `linear-gradient(135deg, ${s.purple}, #c026d3)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "13px", flexShrink: 0 }}>
            {session.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session.name}</p>
            <p style={{ margin: 0, fontSize: "10px", color: s.purple, fontWeight: 600 }}>Administrador</p>
          </div>
        </div>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", color: s.muted, textDecoration: "none", fontSize: "13px", borderRadius: "8px", marginBottom: "4px" }}>
          <Eye size={14} /> Ver Tienda
        </Link>
        <form action={logout}>
          <button type="submit" style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", color: s.red, background: s.redMuted, border: "none", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: 600 }}>
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </form>
      </div>
    </aside>
  );

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

        .admin-sidebar { transform: translateX(0); }
        .admin-main { margin-left: 240px; }
        .hamburger-btn { display: none !important; }
        .sidebar-close { display: none !important; }
        .sidebar-overlay { display: none; }
        .stats-grid { grid-template-columns: repeat(4, 1fr); }
        .charts-grid { grid-template-columns: 1fr 1fr; }
        .product-form-grid { grid-template-columns: 1fr 1fr; }

        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .charts-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .admin-sidebar { transform: translateX(-100%) !important; }
          .admin-sidebar.open { transform: translateX(0) !important; }
          .admin-main { margin-left: 0 !important; }
          .hamburger-btn { display: flex !important; }
          .sidebar-close { display: flex !important; }
          .sidebar-overlay { display: block; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .product-form-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .admin-main { padding: 20px 16px !important; }
        }

        @media print {
          .admin-sidebar, .no-print, header { display: none !important; }
          .admin-main { margin: 0 !important; padding: 0 !important; min-height: auto !important; background: white !important; }
          body { background: white !important; color: black !important; }
          .print-area { display: block !important; padding: 20px !important; }
          .print-only { display: block !important; }
          .print-card { background: white !important; border: 1px solid #ccc !important; box-shadow: none !important; margin-bottom: 10px; }
          .print-card p { color: black !important; }
          .print-table-wrapper { border: none !important; background: white !important; border-radius: 0 !important; }
          .print-table th { background: #f0f0f0 !important; color: black !important; border-bottom: 2px solid #ccc !important; }
          .print-table td { color: black !important; border-bottom: 1px solid #eee !important; }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: s.bg, color: s.text, fontFamily: "var(--font-jakarta, system-ui, sans-serif)" }}>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 190, animation: "fadeIn 0.2s ease" }} />
        )}

        {/* Sidebar Component directly (it now handles its own 'open' class) */}
        <Sidebar />

        <main className="admin-main" style={{ flex: 1, padding: "28px 32px", minHeight: "100vh" }}>
          {/* Toast */}
          {toast && (
            <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 9999, background: toast.ok ? s.greenMuted : s.redMuted, border: `1px solid ${toast.ok ? s.green : s.red}`, color: toast.ok ? s.green : s.red, padding: "12px 18px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "slideIn 0.25s ease" }} className="no-print">
              {toast.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {toast.msg}
            </div>
          )}

          {/* Header */}
          <header style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }} className="no-print">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}
              style={{ background: s.card, border: `1px solid ${s.border}`, borderRadius: "10px", width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: s.text, flexShrink: 0 }}>
              <Menu size={20} />
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}>
                {navItems.find(n => n.id === tab)?.label}
              </h1>
              <p style={{ margin: 0, fontSize: "13px", color: s.muted }}>
                {tab === "dashboard" && "Resumen de tu tienda"}
                {tab === "products" && `${products.length} productos registrados`}
                {tab === "sales" && `${purchases.length} ventas realizadas`}
                {tab === "customers" && `${users.filter(u => u.role === "CUSTOMER").length} clientes registrados`}
                {tab === "admins" && `${users.filter(u => u.role === "ADMIN").length} administradores`}
              </p>
            </div>
          </header>

          {/* ── DASHBOARD ── */}
          {tab === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="stats-grid" style={{ display: "grid", gap: "16px" }}>
                <StatCard label="Ingresos Totales" value={`S/ ${totalRevenue.toFixed(2)}`} icon={<TrendingUp size={18} />} color={s.green} muted={s.greenMuted} sparkData={sparkRevenue} trend="Últimos 7 días" />
                <StatCard label="Ventas" value={String(purchases.length)} icon={<ShoppingBag size={18} />} color={s.purpleLight} muted={s.purpleMuted} trend="Total acumulado" />
                <StatCard label="Productos" value={String(products.length)} icon={<Package size={18} />} color={s.sky} muted={s.skyMuted} trend={`${products.filter(p => p.inStock && p.stock > 0).length} en stock`} />
                <StatCard label="Clientes" value={String(users.filter(u => u.role === "CUSTOMER").length)} icon={<Users size={18} />} color={s.amber} muted="rgba(251,191,36,0.12)" trend="Registrados" />
              </div>

              <div className="charts-grid" style={{ display: "grid", gap: "20px" }}>
                {/* Revenue bar chart */}
                <div style={{ background: s.card, borderRadius: "16px", border: `1px solid ${s.border}`, padding: "20px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 700 }}>Ingresos por Día</p>
                      <p style={{ margin: 0, fontSize: "12px", color: s.muted }}>Últimos 7 días (S/)</p>
                    </div>
                  </div>
                  <BarChart data={dailyRevenue} />
                </div>

                {/* Category donut */}
                <div style={{ background: s.card, borderRadius: "16px", border: `1px solid ${s.border}`, padding: "20px 24px" }}>
                  <div style={{ marginBottom: "16px" }}>
                    <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 700 }}>Productos por Categoría</p>
                    <p style={{ margin: 0, fontSize: "12px", color: s.muted }}>Distribución del catálogo</p>
                  </div>
                  {categoryData.length > 0 ? <DonutChart data={categoryData} /> : (
                    <div style={{ textAlign: "center", color: s.muted, padding: "32px" }}>Sin datos de categorías.</div>
                  )}
                </div>
              </div>

              {/* Recent sales */}
              {purchases.length > 0 && (
                <div style={{ background: s.card, borderRadius: "16px", border: `1px solid ${s.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: `1px solid ${s.border}` }}>
                    <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>Ventas Recientes</h2>
                  </div>
                  {purchases.slice(0, 5).map((sale, i) => {
                    const items = (() => { try { return JSON.parse(sale.items || "[]"); } catch { return []; } })();
                    const date = new Date(sale.createdAt);
                    return (
                      <div key={sale.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: i < 4 ? `1px solid ${s.border}` : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: s.purpleMuted, display: "flex", alignItems: "center", justifyContent: "center", color: s.purpleLight, fontWeight: 700, fontSize: "11px", flexShrink: 0 }}>
                            #{sale.id}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>{items.length} producto{items.length !== 1 ? "s" : ""}</p>
                            <p style={{ margin: 0, fontSize: "11px", color: s.muted }}>{date.toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: s.green }}>S/ {sale.total.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── ADD PRODUCT WAS REMOVED FROM HERE ── */}

          {/* ── CATEGORIES TABLE ── */}
          {tab === "categories" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="no-print">
                <input 
                  type="text" 
                  placeholder="Buscar categorías..." 
                  value={searchCategoryQuery}
                  onChange={e => setSearchCategoryQuery(e.target.value)}
                  style={{ padding: "10px 14px", background: s.card, border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", outline: "none", width: "300px", maxWidth: "100%" }}
                />
                <button onClick={() => setShowCategoryModal(true)} style={{ padding: "10px 18px", background: s.purple, color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <Plus size={16} /> Nueva Categoría
                </button>
              </div>
              <div style={{ background: s.card, borderRadius: "20px", border: `1px solid ${s.border}`, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "400px" }}>
                  <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${s.border}` }}>
                    <tr>
                      <th style={{ padding: "12px 18px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>ID</th>
                      <th style={{ padding: "12px 18px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Nombre</th>
                      <th style={{ padding: "12px 18px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.filter(c => c.name.toLowerCase().includes(searchCategoryQuery.toLowerCase())).map(c => (
                      <tr key={c.id} style={{ borderBottom: `1px solid ${s.border}`, transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "12px 18px", fontSize: "13px", color: s.muted }}>#{c.id}</td>
                        <td style={{ padding: "12px 18px", fontSize: "14px", fontWeight: 600 }}>{c.name}</td>
                        <td style={{ padding: "12px 18px", textAlign: "right" }}>
                          <button onClick={() => setEditCategory(c)} style={{ background: "none", border: "none", color: s.sky, cursor: "pointer", marginRight: "12px" }}>
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteCategory(c.id)} style={{ background: "none", border: "none", color: s.red, cursor: "pointer" }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {categories.length === 0 && (
                      <tr><td colSpan={3} style={{ padding: "40px", textAlign: "center", color: s.muted }}>No hay categorías registradas.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PROMOTIONS TABLE ── */}
          {tab === "promotions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="no-print">
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Promociones</h2>
                <button onClick={() => { setPromoTargetType("ALL"); setShowPromotionModal(true); }} style={{ padding: "10px 18px", background: s.purple, color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <Plus size={16} /> Nueva Promo
                </button>
              </div>
              <div style={{ background: s.card, borderRadius: "20px", border: `1px solid ${s.border}`, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "800px" }}>
                  <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${s.border}` }}>
                    <tr>
                      <th style={{ padding: "12px 18px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Estado</th>
                      <th style={{ padding: "12px 18px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Título</th>
                      <th style={{ padding: "12px 18px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Descuento</th>
                      <th style={{ padding: "12px 18px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Fechas</th>
                      <th style={{ padding: "12px 18px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Aplica a</th>
                      <th style={{ padding: "12px 18px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, textAlign: "right" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promotions.map(p => {
                      const now = new Date();
                      const start = new Date(p.startDate);
                      const end = new Date(p.endDate);
                      const active = p.isActive && now >= start && now <= end;
                      
                      let appliesTo = "Toda la tienda";
                      if (p.targetType === "CATEGORY") appliesTo = `Categoría: ${categories.find(c => c.id === p.targetId)?.name || p.targetId}`;
                      if (p.targetType === "PRODUCT") appliesTo = `Producto: ${products.find(prod => prod.id === p.targetId)?.name || p.targetId}`;

                      return (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${s.border}`, transition: "background 0.15s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td style={{ padding: "12px 18px" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 8px", borderRadius: "20px", background: active ? s.greenMuted : s.redMuted, color: active ? s.green : s.red, fontSize: "11px", fontWeight: 700 }}>
                              {active ? "Activo" : "Inactivo"}
                            </div>
                          </td>
                          <td style={{ padding: "12px 18px", fontSize: "14px", fontWeight: 600 }}>{p.title}</td>
                          <td style={{ padding: "12px 18px", fontSize: "14px", fontWeight: 700, color: s.purpleLight }}>{p.discount}%</td>
                          <td style={{ padding: "12px 18px", fontSize: "12px", color: s.muted }}>
                            {start.toLocaleDateString()} - {end.toLocaleDateString()}
                          </td>
                          <td style={{ padding: "12px 18px", fontSize: "13px" }}>{appliesTo}</td>
                          <td style={{ padding: "12px 18px", textAlign: "right" }}>
                            <button onClick={() => { setPromoTargetType(p.targetType); setEditPromotion(p); }} style={{ background: "none", border: "none", color: s.sky, cursor: "pointer", marginRight: "12px" }}>
                              <Edit2 size={16} />
                            </button>
                            <button onClick={async () => {
                              if (confirm("¿Eliminar promoción?")) {
                                await deletePromotion(p.id); showToast("Promoción eliminada.");
                              }
                            }} style={{ background: "none", border: "none", color: s.red, cursor: "pointer" }}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {promotions.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: s.muted }}>No hay promociones registradas.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PRODUCTS TABLE ── */}
          {tab === "products" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="no-print">
                <input 
                  type="text" 
                  placeholder="Buscar productos..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ padding: "10px 14px", background: s.card, border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", outline: "none", width: "300px", maxWidth: "100%" }}
                />
                <button onClick={() => setShowAddModal(true)} style={{ padding: "10px 18px", background: s.purple, color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <Package size={16} /> Nuevo
                </button>
              </div>
            <div style={{ background: s.card, borderRadius: "20px", border: `1px solid ${s.border}`, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "600px" }}>
                  <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${s.border}` }}>
                    <tr>
                      {["Producto", "Categoría", "Precio", "Stock", "Estado", "Acciones"].map((h, i) => (
                        <th key={h} style={{ padding: "12px 18px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, textAlign: i === 5 ? "right" : "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayProducts.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: s.muted }}>
                        <Package size={28} style={{ opacity: 0.3, display: "block", margin: "0 auto 12px" }} />
                        No se encontraron productos.
                        <button onClick={() => setShowAddModal(true)} style={{ display: "block", margin: "10px auto 0", padding: "6px 14px", background: s.purpleMuted, color: s.purpleLight, border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Crear producto</button>
                      </td></tr>
                    ) : displayProducts.map(p => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${s.border}`, transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ padding: "12px 18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "8px", overflow: "hidden", background: "rgba(0,0,0,0.3)", flexShrink: 0 }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>{p.name}</p>
                              <p style={{ margin: 0, fontSize: "11px", color: s.muted }}>★ {p.rating}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 18px" }}>
                          <span style={{ fontSize: "11px", padding: "3px 8px", background: s.purpleMuted, color: s.purpleLight, borderRadius: "6px", fontWeight: 600, textTransform: "capitalize" }}>{p.category?.name || "Sin Categoría"}</span>
                        </td>
                        <td style={{ padding: "12px 18px", fontSize: "14px", fontWeight: 700 }}>S/ {p.price.toFixed(2)}</td>
                        <td style={{ padding: "12px 18px", fontSize: "13px" }}>{p.stock} un.</td>
                        <td style={{ padding: "12px 18px" }}>
                          <span style={{ fontSize: "11px", padding: "3px 8px", background: (p.inStock && p.stock > 0) ? s.greenMuted : s.redMuted, color: (p.inStock && p.stock > 0) ? s.green : s.red, borderRadius: "6px", fontWeight: 600 }}>
                            {(p.inStock && p.stock > 0) ? "En Stock" : "Agotado"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 18px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button onClick={() => setEditProduct(p)} style={{ background: s.skyMuted, border: "none", color: s.sky, padding: "7px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
                              <Edit2 size={13} /> Editar
                            </button>
                            <button onClick={() => handleDelete(p.id)} style={{ background: s.redMuted, border: "none", color: s.red, padding: "7px", borderRadius: "8px", cursor: "pointer" }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          )}

          {/* ── SALES ── */}
          {tab === "sales" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Search & Export buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "space-between", alignItems: "center" }} className="no-print">
                <input 
                  type="text" 
                  placeholder="Buscar por orden, cliente o producto..." 
                  value={searchSalesQuery}
                  onChange={e => setSearchSalesQuery(e.target.value)}
                  style={{ padding: "10px 14px", background: s.card, border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", outline: "none", width: "300px", maxWidth: "100%" }}
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => exportCSV(purchases)}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: s.greenMuted, color: s.green, border: `1px solid rgba(16,185,129,0.2)`, borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                    <Download size={15} /> Exportar Excel / CSV
                  </button>
                  <button onClick={triggerPrint}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: s.redMuted, color: s.red, border: `1px solid rgba(248,113,113,0.2)`, borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                    <FileText size={15} /> Exportar PDF
                  </button>
                </div>
              </div>

              <div style={{ background: s.card, borderRadius: "20px", border: `1px solid ${s.border}`, overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "540px" }}>
                    <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${s.border}` }}>
                      <tr>
                        {["Orden / Cliente", "Fecha", "Artículos", "Total", "Acciones"].map((h, i) => (
                          <th key={h} style={{ padding: "12px 18px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, textAlign: i === 3 ? "right" : i === 4 ? "center" : "left" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayPurchases.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: s.muted }}>No se encontraron ventas.</td></tr>
                      ) : displayPurchases.map((sale, i) => {
                        const items = (() => { try { return JSON.parse(sale.items || "[]"); } catch { return []; } })();
                        const date = new Date(sale.createdAt);
                        return (
                          <tr key={sale.id} style={{ borderBottom: i < displayPurchases.length - 1 ? `1px solid ${s.border}` : "none", transition: "background 0.15s" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <td style={{ padding: "14px 18px" }}>
                              <span style={{ fontSize: "13px", fontWeight: 700, color: s.purpleLight }}>#{sale.id.toString().padStart(4, "0")}</span>
                              {sale.user && (
                                <div style={{ marginTop: "4px", fontSize: "11px", color: s.text }}>
                                  <strong>{sale.user.name}</strong><br/>
                                  <span style={{ color: s.muted }}>{sale.user.email}</span>
                                </div>
                              )}
                            </td>
                            <td style={{ padding: "14px 18px", fontSize: "12px", color: s.muted }}>
                              {date.toLocaleDateString()}<br />
                              <span style={{ fontSize: "11px" }}>{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </td>
                            <td style={{ padding: "14px 18px", maxWidth: "280px" }}>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                {items.slice(0, 3).map((item: { name: string }, j: number) => (
                                  <span key={j} style={{ fontSize: "11px", padding: "2px 7px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }}>{item.name}</span>
                                ))}
                                {items.length > 3 && <span style={{ fontSize: "11px", color: s.muted }}>+{items.length - 3} más</span>}
                              </div>
                            </td>
                            <td style={{ padding: "14px 18px", textAlign: "right", fontSize: "15px", fontWeight: 800, color: s.green }}>S/ {sale.total.toFixed(2)}</td>
                            <td style={{ padding: "14px 18px", textAlign: "center" }}>
                              <button onClick={() => setReceiptSale(sale)} style={{ background: s.skyMuted, color: s.sky, border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                                Ver boleta
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary row */}
              {purchases.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "24px", padding: "12px 20px", background: s.card, borderRadius: "12px", border: `1px solid ${s.border}` }}>
                  <span style={{ fontSize: "13px", color: s.muted }}>{purchases.length} ventas</span>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: s.green }}>Total: S/ {totalRevenue.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* ── CUSTOMERS & ADMINS ── */}
          {(tab === "customers" || tab === "admins") && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="no-print">
                <input 
                  type="text" 
                  placeholder="Buscar usuario por nombre, email o ID..." 
                  value={searchCustomersQuery}
                  onChange={e => setSearchCustomersQuery(e.target.value)}
                  style={{ padding: "10px 14px", background: s.card, border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", outline: "none", width: "300px", maxWidth: "100%" }}
                />
              </div>

            <div style={{ background: s.card, borderRadius: "20px", border: `1px solid ${s.border}`, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "540px" }}>
                  <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${s.border}` }}>
                    <tr>
                      {["Usuario", "Email", "Compras", "Total Gastado", "Rol", "Acciones"].map((h, i) => (
                        <th key={h} style={{ padding: "12px 18px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, textAlign: i === 3 ? "right" : i > 3 ? "center" : "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(tab === "customers" ? displayCustomers : displayAdmins).length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: s.muted }}>
                        <Users size={28} style={{ opacity: 0.3, display: "block", margin: "0 auto 12px" }} />
                        No se encontraron {tab === "customers" ? "clientes" : "administradores"}.
                      </td></tr>
                    ) : (tab === "customers" ? displayCustomers : displayAdmins).map((u, i) => {
                      const userTotal = u.purchases.reduce((sum, p) => sum + p.total, 0);
                      return (
                        <tr key={u.id} style={{ borderBottom: i < (tab === "customers" ? displayCustomers : displayAdmins).length - 1 ? `1px solid ${s.border}` : "none", transition: "background 0.15s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <td style={{ padding: "12px 18px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: `linear-gradient(135deg, ${s.purple}, #2563eb)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "13px", flexShrink: 0 }}>
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600 }}>{u.name}</p>
                                <p style={{ margin: 0, fontSize: "11px", color: s.muted }}>ID #{u.id}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 18px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: s.muted }}>
                              <Mail size={13} /> {u.email}
                            </div>
                          </td>
                          <td style={{ padding: "12px 18px" }}>
                            <span style={{ fontSize: "12px", padding: "3px 8px", background: u.purchases.length > 0 ? s.purpleMuted : "rgba(255,255,255,0.04)", color: u.purchases.length > 0 ? s.purpleLight : s.muted, borderRadius: "6px", fontWeight: 600 }}>
                              {u.purchases.length} compra{u.purchases.length !== 1 ? "s" : ""}
                            </span>
                          </td>
                          <td style={{ padding: "12px 18px", textAlign: "right", fontSize: "14px", fontWeight: 700, color: userTotal > 0 ? s.green : s.muted }}>
                            {userTotal > 0 ? `S/ ${userTotal.toFixed(2)}` : "—"}
                          </td>
                          <td style={{ padding: "12px 18px", textAlign: "center" }}>
                            <span style={{ fontSize: "11px", padding: "3px 8px", background: u.role === "ADMIN" ? s.skyMuted : "rgba(255,255,255,0.04)", color: u.role === "ADMIN" ? s.sky : s.muted, borderRadius: "6px", fontWeight: 600 }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: "12px 18px", textAlign: "center" }}>
                            {u.id !== session.id ? (
                              <button onClick={() => handleRoleChange(u.id, u.role)} disabled={loading} style={{ background: u.role === "ADMIN" ? s.redMuted : s.greenMuted, color: u.role === "ADMIN" ? s.red : s.green, border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                                {u.role === "ADMIN" ? "Quitar Admin" : "Hacer Admin"}
                              </button>
                            ) : (
                              <span style={{ fontSize: "11px", color: s.muted }}>Tú</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {(tab === "customers" ? displayCustomers : displayAdmins).length > 0 && (
                <div style={{ padding: "12px 20px", borderTop: `1px solid ${s.border}`, display: "flex", justifyContent: "flex-end", gap: "24px" }}>
                  <span style={{ fontSize: "13px", color: s.muted }}>{(tab === "customers" ? displayCustomers : displayAdmins).length} {tab === "customers" ? "clientes" : "administradores"}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: s.green }}>
                    Total: S/ {(tab === "customers" ? displayCustomers : displayAdmins).reduce((sum, u) => sum + u.purchases.reduce((s2, p) => s2 + p.total, 0), 0).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            </div>
          )}

          {/* ── REPORTS ── */}
          {tab === "reports" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: "16px", background: s.card, borderRadius: "16px", padding: "20px", border: `1px solid ${s.border}` }}>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Filtros de Reporte</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", color: s.muted, fontWeight: 600, textTransform: "uppercase" }}>Desde</label>
                    <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} style={{ padding: "8px 12px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "8px", fontSize: "13px", outline: "none", colorScheme: "dark" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", color: s.muted, fontWeight: 600, textTransform: "uppercase" }}>Hasta</label>
                    <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} style={{ padding: "8px 12px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "8px", fontSize: "13px", outline: "none", colorScheme: "dark" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", color: s.muted, fontWeight: 600, textTransform: "uppercase" }}>Mes Específico</label>
                    <input type="month" value={reportMonth} onChange={e => { setReportMonth(e.target.value); setReportStartDate(""); setReportEndDate(""); }} style={{ padding: "8px 12px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "8px", fontSize: "13px", outline: "none", colorScheme: "dark" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", color: s.muted, fontWeight: 600, textTransform: "uppercase" }}>Categoría</label>
                    <select value={reportCategoryId} onChange={e => setReportCategoryId(e.target.value)} style={{ padding: "8px 12px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "8px", fontSize: "13px", outline: "none" }}>
                      <option value="" style={{ background: s.surface, color: s.text }}>Todas las categorías</option>
                      {categories.map(c => <option key={c.id} value={c.id} style={{ background: s.surface, color: s.text }}>{c.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", color: s.muted, fontWeight: 600, textTransform: "uppercase" }}>Producto</label>
                    <select value={reportProductId} onChange={e => setReportProductId(e.target.value)} style={{ padding: "8px 12px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "8px", fontSize: "13px", outline: "none" }}>
                      <option value="" style={{ background: s.surface, color: s.text }}>Todos los productos</option>
                      {products.map(p => <option key={p.id} value={p.id} style={{ background: s.surface, color: s.text }}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button onClick={() => { setReportStartDate(""); setReportEndDate(""); setReportMonth(""); setReportCategoryId(""); setReportProductId(""); }} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: s.text, padding: "8px 16px", borderRadius: "8px", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>Limpiar</button>
                  <button onClick={() => window.print()} style={{ background: s.purple, color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}><FileText size={16} /> Imprimir Reporte</button>
                </div>
              </div>

              {/* Printable Area */}
              <div className="print-area">
                <div className="print-only" style={{ display: "none", marginBottom: "20px", borderBottom: "2px solid #000", paddingBottom: "10px" }}>
                  <h1 style={{ margin: 0, fontSize: "24px" }}>Reporte de Ventas - Sonora Studio</h1>
                  <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Generado el {new Date().toLocaleDateString()}</p>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                  <div style={{ background: s.card, borderRadius: "12px", padding: "20px", border: `1px solid ${s.border}` }} className="print-card">
                    <p style={{ margin: "0 0 8px", fontSize: "13px", color: s.muted, fontWeight: 600 }}>Total Ingresos Filtrados</p>
                    <p style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: s.green }}>S/ {reportTotalRevenue.toFixed(2)}</p>
                  </div>
                  <div style={{ background: s.card, borderRadius: "12px", padding: "20px", border: `1px solid ${s.border}` }} className="print-card">
                    <p style={{ margin: "0 0 8px", fontSize: "13px", color: s.muted, fontWeight: 600 }}>Órdenes Filtradas</p>
                    <p style={{ margin: 0, fontSize: "24px", fontWeight: 800 }}>{reportFilteredPurchases.length}</p>
                  </div>
                  <div style={{ background: s.card, borderRadius: "12px", padding: "20px", border: `1px solid ${s.border}` }} className="print-card">
                    <p style={{ margin: "0 0 8px", fontSize: "13px", color: s.muted, fontWeight: 600 }}>Artículos Vendidos</p>
                    <p style={{ margin: 0, fontSize: "24px", fontWeight: 800 }}>{reportTotalItemsSold}</p>
                  </div>
                </div>

                <div style={{ background: s.card, borderRadius: "20px", border: `1px solid ${s.border}`, overflow: "hidden" }} className="print-table-wrapper">
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }} className="print-table">
                      <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${s.border}` }}>
                        <tr>
                          <th style={{ padding: "12px 18px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>ID Venta</th>
                          <th style={{ padding: "12px 18px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Fecha</th>
                          <th style={{ padding: "12px 18px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Cliente</th>
                          <th style={{ padding: "12px 18px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Detalle de Productos</th>
                          <th style={{ padding: "12px 18px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, textAlign: "right" }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportFilteredPurchases.length === 0 ? (
                          <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: s.muted }}>No hay datos para el filtro seleccionado.</td></tr>
                        ) : reportFilteredPurchases.map((p, i) => {
                          const items = (() => { try { return JSON.parse(p.items || "[]"); } catch { return []; } })();
                          return (
                            <tr key={p.id} style={{ borderBottom: i < reportFilteredPurchases.length - 1 ? `1px solid ${s.border}` : "none" }}>
                              <td style={{ padding: "12px 18px", fontSize: "13px", fontWeight: 600 }}>#{p.id}</td>
                              <td style={{ padding: "12px 18px", fontSize: "13px" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                              <td style={{ padding: "12px 18px", fontSize: "13px" }}>{p.user?.name || "Desconocido"}</td>
                              <td style={{ padding: "12px 18px", fontSize: "12px", color: s.muted }}>
                                {items.map((it: any, idx: number) => (
                                  <div key={idx}>{it.quantity}x {it.name}</div>
                                ))}
                              </td>
                              <td style={{ padding: "12px 18px", fontSize: "13px", fontWeight: 700, color: s.green, textAlign: "right" }}>S/ {p.total.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
        {/* ── PROMOTION MODAL ── */}
        {(showPromotionModal || editPromotion) && (
          <div onClick={e => { if (e.target === e.currentTarget) { setShowPromotionModal(false); setEditPromotion(null); } }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", animation: "fadeIn 0.2s ease" }}>
            <div style={{ background: s.surface, border: `1px solid ${s.border}`, borderRadius: "24px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>{editPromotion ? "Editar Promoción" : "Nueva Promoción"}</h2>
                <button onClick={() => { setShowPromotionModal(false); setEditPromotion(null); }} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: s.text }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ padding: "24px", overflowY: "auto" }}>
                <form onSubmit={editPromotion ? handleUpdatePromotion : handleAddPromotion} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Título de la Promoción <span style={{ color: s.purple }}>*</span></label>
                    <input name="title" required defaultValue={editPromotion?.title || ""} placeholder="Ej: Cyber Deals 30%"
                      style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", outline: "none" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Descuento (%) <span style={{ color: s.purple }}>*</span></label>
                    <input name="discount" type="number" min="0" max="100" step="0.1" required defaultValue={editPromotion?.discount || ""} placeholder="Ej: 30"
                      style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", outline: "none" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha de Inicio <span style={{ color: s.purple }}>*</span></label>
                      <input name="startDate" type="datetime-local" required defaultValue={editPromotion ? new Date(editPromotion.startDate).toISOString().slice(0, 16) : ""}
                        style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", outline: "none", colorScheme: "dark" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha de Fin <span style={{ color: s.purple }}>*</span></label>
                      <input name="endDate" type="datetime-local" required defaultValue={editPromotion ? new Date(editPromotion.endDate).toISOString().slice(0, 16) : ""}
                        style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", outline: "none", colorScheme: "dark" }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tipo de Aplicación <span style={{ color: s.purple }}>*</span></label>
                    <select name="targetType" required value={promoTargetType}
                      onChange={e => setPromoTargetType(e.target.value)}
                      style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", outline: "none", colorScheme: "dark" }}>
                      <option value="ALL" style={{ background: s.surface, color: s.text }}>Toda la tienda</option>
                      <option value="CATEGORY" style={{ background: s.surface, color: s.text }}>Categoría Específica</option>
                      <option value="PRODUCT" style={{ background: s.surface, color: s.text }}>Producto Específico</option>
                    </select>
                  </div>
                  
                  {promoTargetType === "CATEGORY" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Seleccionar Categoría <span style={{ color: s.purple }}>*</span></label>
                      <select name="targetId" required defaultValue={editPromotion?.targetId || ""}
                        style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", outline: "none", colorScheme: "dark" }}>
                        <option value="" disabled style={{ background: s.surface, color: s.text }}>Elige una categoría...</option>
                        {categories.map(c => <option key={c.id} value={c.id} style={{ background: s.surface, color: s.text }}>{c.name}</option>)}
                      </select>
                    </div>
                  )}

                  {promoTargetType === "PRODUCT" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Seleccionar Producto <span style={{ color: s.purple }}>*</span></label>
                      <input type="text" placeholder="Buscar producto..." value={promoProductSearch} onChange={e => setPromoProductSearch(e.target.value)}
                        style={{ padding: "8px 14px", background: "rgba(0,0,0,0.15)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "8px", fontSize: "13px", outline: "none", marginBottom: "4px" }} />
                      <select name="targetId" required defaultValue={editPromotion?.targetId || ""}
                        style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", outline: "none", colorScheme: "dark" }}>
                        <option value="" disabled style={{ background: s.surface, color: s.text }}>Elige un producto...</option>
                        {products.filter(p => p.name.toLowerCase().includes(promoProductSearch.toLowerCase())).map(p => (
                          <option key={p.id} value={p.id} style={{ background: s.surface, color: s.text }}>{p.name} (S/ {p.price})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", marginTop: "8px" }}>
                    <input type="checkbox" name="isActive" defaultChecked={editPromotion ? editPromotion.isActive : true} style={{ width: "16px", height: "16px", accentColor: s.purple }} />
                    <span style={{ fontSize: "14px" }}>Promoción Activa</span>
                  </label>
                  <button type="submit" disabled={loading}
                    style={{ padding: "12px", background: loading ? "rgba(124,58,237,0.5)" : s.purple, color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer", marginTop: "8px" }}>
                    {loading ? "Guardando..." : "Guardar Promoción"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── EDIT MODAL ── */}
        {editProduct && (
          <div onClick={e => { if (e.target === e.currentTarget) setEditProduct(null); }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", animation: "fadeIn 0.2s ease" }}>
            <div style={{ background: s.surface, border: `1px solid ${s.border}`, borderRadius: "24px", width: "100%", maxWidth: "820px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>Editar Producto</h2>
                  <p style={{ margin: 0, fontSize: "12px", color: s.muted }}>{editProduct.name}</p>
                </div>
                <button onClick={() => setEditProduct(null)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: s.text }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                <ProductForm key={editProduct.id} initialData={productToForm(editProduct)} categories={categories} onSubmit={handleUpdate} submitLabel="Guardar Cambios" loading={loading} />
              </div>
            </div>
          </div>
        )}

        {/* ── ADD MODAL ── */}
        {showAddModal && (
          <div onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false); }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", animation: "fadeIn 0.2s ease" }}>
            <div style={{ background: s.surface, border: `1px solid ${s.border}`, borderRadius: "24px", width: "100%", maxWidth: "820px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>Nuevo Producto</h2>
                  <p style={{ margin: 0, fontSize: "12px", color: s.muted }}>Completa todos los campos para tu inventario</p>
                </div>
                <button onClick={() => setShowAddModal(false)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: s.text }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                <ProductForm key="add" initialData={emptyForm()} categories={categories} onSubmit={handleAdd} submitLabel="Crear Producto" loading={loading} />
              </div>
            </div>
          </div>
        )}
        {/* ── CATEGORY MODAL ── */}
        {(showCategoryModal || editCategory) && (
          <div onClick={e => { if (e.target === e.currentTarget) { setShowCategoryModal(false); setEditCategory(null); } }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", animation: "fadeIn 0.2s ease" }}>
            <div style={{ background: s.surface, border: `1px solid ${s.border}`, borderRadius: "24px", width: "100%", maxWidth: "400px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "20px 24px", borderBottom: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>{editCategory ? "Editar Categoría" : "Nueva Categoría"}</h2>
                <button onClick={() => { setShowCategoryModal(false); setEditCategory(null); }} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: s.text }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ padding: "24px" }}>
                <form onSubmit={editCategory ? handleUpdateCategory : handleAddCategory} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre <span style={{ color: s.purple }}>*</span></label>
                    <input name="name" required defaultValue={editCategory?.name || ""} placeholder="Ej: Guitarras Acústicas"
                      style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", outline: "none" }} />
                  </div>
                  <button type="submit" disabled={loading}
                    style={{ padding: "12px", background: loading ? "rgba(124,58,237,0.5)" : s.purple, color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer", marginTop: "8px" }}>
                    {loading ? "Guardando..." : "Guardar Categoría"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── RECEIPT MODAL ── */}
        {receiptSale && (
          <div onClick={e => { if (e.target === e.currentTarget) setReceiptSale(null); }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", animation: "fadeIn 0.2s ease" }}>
            <div style={{ background: "#fff", color: "#000", borderRadius: "12px", width: "100%", maxWidth: "400px", padding: "32px", position: "relative", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
              <button onClick={() => setReceiptSale(null)} style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(0,0,0,0.05)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#000" }} className="no-print">
                <X size={16} />
              </button>
              
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>Sonora Studio</h2>
                <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>Boleta de Venta Electrónica</p>
                <p style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: 700 }}>N° {receiptSale.id.toString().padStart(6, "0")}</p>
              </div>

              <div style={{ borderTop: "1px dashed #ccc", borderBottom: "1px dashed #ccc", padding: "12px 0", marginBottom: "20px", fontSize: "12px" }}>
                <p style={{ margin: "0 0 4px" }}><strong>Fecha:</strong> {new Date(receiptSale.createdAt).toLocaleString("es-PE")}</p>
                {receiptSale.user && (
                  <>
                    <p style={{ margin: "0 0 4px" }}><strong>Cliente:</strong> {receiptSale.user.name}</p>
                    <p style={{ margin: 0 }}><strong>Email:</strong> {receiptSale.user.email}</p>
                  </>
                )}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #eee" }}>
                      <th style={{ textAlign: "left", paddingBottom: "8px" }}>Cant.</th>
                      <th style={{ textAlign: "left", paddingBottom: "8px" }}>Descripción</th>
                      <th style={{ textAlign: "right", paddingBottom: "8px" }}>Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const items = JSON.parse(receiptSale.items || "[]");
                      return items.map((item: any, i: number) => (
                        <tr key={i}>
                          <td style={{ padding: "8px 0", verticalAlign: "top" }}>{item.quantity}</td>
                          <td style={{ padding: "8px 10px", verticalAlign: "top" }}>{item.name}</td>
                          <td style={{ padding: "8px 0", textAlign: "right", verticalAlign: "top" }}>S/ {(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              <div style={{ borderTop: "2px solid #000", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "16px", fontWeight: 800 }}>
                <span>TOTAL A PAGAR</span>
                <span>S/ {receiptSale.total.toFixed(2)}</span>
              </div>

              {(receiptSale as any).paymentDetails && (
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px dashed #ccc" }}>
                  <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 700, color: "#666", textTransform: "uppercase" }}>Métodos de Pago</p>
                  {(() => {
                    try {
                      const methods = JSON.parse((receiptSale as any).paymentDetails);
                      return methods.map((m: any, idx: number) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#333", marginBottom: "4px" }}>
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

              <div style={{ marginTop: "32px", textAlign: "center", fontSize: "11px", color: "#666" }}>
                <p style={{ margin: "0 0 4px" }}>¡Gracias por su compra en Sonora Studio!</p>
                <p style={{ margin: 0 }}>Conserve esta boleta para cualquier reclamo.</p>
              </div>

              <div style={{ marginTop: "24px", textAlign: "center" }} className="no-print">
                <button onClick={() => window.print()} style={{ background: "#000", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>
                  Imprimir Boleta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
