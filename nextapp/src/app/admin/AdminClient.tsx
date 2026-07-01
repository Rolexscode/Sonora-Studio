"use client";

import { addProduct, updateProduct, deleteProduct } from "@/app/actions";
import { logout } from "@/app/auth-actions";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  LogOut, Package, PlusCircle, ShoppingBag, Trash2,
  LayoutDashboard, Edit2, X, Upload, CheckCircle,
  AlertCircle, Plus, Minus, TrendingUp, Users, Eye,
  ToggleLeft, ToggleRight, ArrowLeft,
} from "lucide-react";
import { uploadProductImage } from "@/lib/supabase";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  rating: number;
  inStock: boolean;
  isNew: boolean;
  desc: string;
  specs: string;
  image: string;
}

interface Purchase {
  id: number;
  userId: number;
  total: number;
  createdAt: Date;
  items: string;
}

type Tab = "dashboard" | "products" | "add" | "sales";

const CATEGORIES = ["guitarras", "bajos", "teclados", "baterias", "estudio"];

const s = {
  // colors
  bg: "#080a12",
  surface: "#0f1120",
  card: "#141728",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(124,58,237,0.4)",
  purple: "#7c3aed",
  purpleLight: "#a78bfa",
  purpleMuted: "rgba(124,58,237,0.12)",
  green: "#10b981",
  greenMuted: "rgba(16,185,129,0.12)",
  red: "#f87171",
  redMuted: "rgba(248,113,113,0.12)",
  amber: "#fbbf24",
  sky: "#38bdf8",
  skyMuted: "rgba(56,189,248,0.12)",
  muted: "#6b7280",
  text: "#e5e7eb",
} as const;

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        background: value ? s.purple : "rgba(255,255,255,0.08)",
        border: "none",
        borderRadius: "20px",
        width: "44px",
        height: "24px",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3px",
          left: value ? "23px" : "3px",
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          display: "block",
        }}
      />
    </button>
  );
}

function InputField({
  label, name, type = "text", required = false, value, onChange,
  placeholder, min, max, step, fullWidth = false,
}: {
  label: string; name: string; type?: string; required?: boolean;
  value: string; onChange: (v: string) => void;
  placeholder?: string; min?: string; max?: string; step?: string;
  fullWidth?: boolean;
}) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined, display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label} {required && <span style={{ color: s.purple }}>*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        style={{
          padding: "10px 14px",
          background: "rgba(0,0,0,0.25)",
          border: `1px solid ${s.border}`,
          color: s.text,
          borderRadius: "10px",
          fontSize: "14px",
          outline: "none",
          transition: "border 0.2s",
          width: "100%",
          boxSizing: "border-box",
        }}
        onFocus={e => (e.target.style.borderColor = s.purple)}
        onBlur={e => (e.target.style.borderColor = s.border)}
      />
    </div>
  );
}

function ImageUploader({
  value, onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Solo se permiten imágenes.");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      onChange(url);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al subir imagen";
      setError(msg.includes("Invalid API key") || msg.includes("SUPABASE")
        ? "Configura NEXT_PUBLIC_SUPABASE_ANON_KEY en tu .env"
        : msg);
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Imagen del Producto
      </label>

      <div style={{ display: "grid", gridTemplateColumns: value ? "1fr 200px" : "1fr", gap: "16px", alignItems: "start" }}>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            border: `2px dashed ${dragging ? s.purple : s.border}`,
            borderRadius: "12px",
            padding: "32px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? s.purpleMuted : "rgba(0,0,0,0.15)",
            transition: "all 0.2s",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {uploading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: s.muted }}>
              <div style={{ width: "32px", height: "32px", border: `3px solid ${s.border}`, borderTopColor: s.purple, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: "13px" }}>Subiendo imagen...</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: s.muted }}>
              <Upload size={28} style={{ color: s.purple }} />
              <span style={{ fontSize: "14px", color: s.text }}>Arrastra una imagen aquí</span>
              <span style={{ fontSize: "12px" }}>o haz clic para seleccionar</span>
              <span style={{ fontSize: "11px", marginTop: "4px" }}>PNG, JPG, WebP — máx. 5 MB</span>
            </div>
          )}
        </div>

        {value && (
          <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: `1px solid ${s.border}`, aspectRatio: "4/3" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              type="button"
              onClick={() => onChange("")}
              style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Manual URL fallback */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: s.muted }}>O pega una URL:</span>
        <input
          type="url"
          placeholder="https://..."
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1, padding: "6px 10px", fontSize: "12px",
            background: "rgba(0,0,0,0.2)", border: `1px solid ${s.border}`,
            borderRadius: "6px", color: s.text, outline: "none",
          }}
        />
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: s.red, fontSize: "12px", padding: "8px 12px", background: s.redMuted, borderRadius: "8px" }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}
    </div>
  );
}

interface SpecsEntry { key: string; value: string }

function SpecsEditor({ value, onChange }: { value: SpecsEntry[]; onChange: (v: SpecsEntry[]) => void }) {
  return (
    <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Especificaciones
        </label>
        <button
          type="button"
          onClick={() => onChange([...value, { key: "", value: "" }])}
          style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: s.purpleLight, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "6px" }}
        >
          <Plus size={14} /> Agregar
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {value.map((spec, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "8px", alignItems: "center" }}>
            <input
              placeholder="Ej: Cuerdas"
              value={spec.key}
              onChange={e => onChange(value.map((s, j) => j === i ? { ...s, key: e.target.value } : s))}
              style={{ padding: "8px 12px", background: "rgba(0,0,0,0.2)", border: `1px solid ${s.border}`, borderRadius: "8px", color: s.text, fontSize: "13px", outline: "none" }}
            />
            <input
              placeholder="Ej: 6"
              value={spec.value}
              onChange={e => onChange(value.map((s, j) => j === i ? { ...s, value: e.target.value } : s))}
              style={{ padding: "8px 12px", background: "rgba(0,0,0,0.2)", border: `1px solid ${s.border}`, borderRadius: "8px", color: s.text, fontSize: "13px", outline: "none" }}
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              style={{ background: s.redMuted, border: "none", color: s.red, borderRadius: "8px", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <Minus size={14} />
            </button>
          </div>
        ))}
        {value.length === 0 && (
          <div style={{ padding: "16px", textAlign: "center", fontSize: "13px", color: s.muted, border: `1px dashed ${s.border}`, borderRadius: "8px" }}>
            Sin especificaciones. Haz clic en &quot;Agregar&quot; para añadir.
          </div>
        )}
      </div>
    </div>
  );
}

function emptyForm() {
  return { name: "", category: "guitarras", price: "", rating: "4.5", desc: "", image: "", inStock: true, isNew: true, specs: [] as SpecsEntry[] };
}

function productToForm(p: Product) {
  let specs: SpecsEntry[] = [];
  try {
    const obj = JSON.parse(p.specs);
    specs = Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }));
  } catch { /* empty */ }
  return { name: p.name, category: p.category, price: String(p.price), rating: String(p.rating), desc: p.desc, image: p.image, inStock: p.inStock, isNew: p.isNew, specs };
}

function formToFormData(form: ReturnType<typeof emptyForm>) {
  const fd = new FormData();
  fd.set("name", form.name);
  fd.set("category", form.category);
  fd.set("price", form.price);
  fd.set("rating", form.rating);
  fd.set("desc", form.desc);
  fd.set("image", form.image);
  fd.set("inStock", String(form.inStock));
  fd.set("isNew", String(form.isNew));
  const specsObj: Record<string, string> = {};
  form.specs.forEach(({ key, value }) => { if (key) specsObj[key] = value; });
  fd.set("specs", JSON.stringify(specsObj));
  return fd;
}

function ProductForm({
  initialData,
  onSubmit,
  submitLabel,
  loading,
}: {
  initialData: ReturnType<typeof emptyForm>;
  onSubmit: (form: ReturnType<typeof emptyForm>) => Promise<void>;
  submitLabel: string;
  loading: boolean;
}) {
  const [form, setForm] = useState(initialData);
  const set = (key: keyof typeof form) => (v: unknown) => setForm(f => ({ ...f, [key]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
      <InputField label="Nombre del Producto" name="name" required fullWidth value={form.name} onChange={set("name")} placeholder="Ej: Gibson Les Paul Standard" />

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Categoría <span style={{ color: s.purple }}>*</span></label>
        <select
          name="category"
          value={form.category}
          onChange={e => set("category")(e.target.value)}
          style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", outline: "none" }}
        >
          {CATEGORIES.map(c => <option key={c} value={c} style={{ background: s.surface }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      <InputField label="Precio (S/)" name="price" type="number" step="0.01" min="0" required value={form.price} onChange={set("price")} placeholder="0.00" />
      <InputField label="Calificación" name="rating" type="number" step="0.1" min="1" max="5" required value={form.rating} onChange={set("rating")} placeholder="4.5" />

      <div style={{ gridColumn: "1 / -1", display: "flex", gap: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Toggle value={form.inStock} onChange={set("inStock")} />
          <div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>En Stock</p>
            <p style={{ margin: 0, fontSize: "12px", color: s.muted }}>Disponible para compra</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Toggle value={form.isNew} onChange={set("isNew")} />
          <div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Producto Nuevo</p>
            <p style={{ margin: 0, fontSize: "12px", color: s.muted }}>Mostrar badge &quot;NUEVO&quot;</p>
          </div>
        </div>
      </div>

      <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "6px" }}>
        <label style={{ fontSize: "12px", fontWeight: 600, color: s.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Descripción <span style={{ color: s.purple }}>*</span>
        </label>
        <textarea
          name="desc"
          rows={4}
          required
          value={form.desc}
          onChange={e => set("desc")(e.target.value)}
          placeholder="Describe el producto con detalle..."
          style={{ padding: "10px 14px", background: "rgba(0,0,0,0.25)", border: `1px solid ${s.border}`, color: s.text, borderRadius: "10px", fontSize: "14px", outline: "none", resize: "vertical", fontFamily: "inherit" }}
          onFocus={e => (e.target.style.borderColor = s.purple)}
          onBlur={e => (e.target.style.borderColor = s.border)}
        />
      </div>

      <ImageUploader value={form.image} onChange={set("image")} />
      <SpecsEditor value={form.specs} onChange={set("specs")} />

      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 32px", background: loading ? "rgba(124,58,237,0.5)" : s.purple, color: "#fff",
            border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: "8px", transition: "background 0.2s",
          }}
        >
          {loading ? <><div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Guardando...</> : submitLabel}
        </button>
      </div>
    </form>
  );
}

function StatCard({ label, value, icon, color, muted }: { label: string; value: string; icon: React.ReactNode; color: string; muted: string }) {
  return (
    <div style={{ background: s.card, padding: "24px", borderRadius: "16px", border: `1px solid ${s.border}`, display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: "13px", color: s.muted, fontWeight: 500 }}>{label}</p>
          <p style={{ margin: 0, fontSize: "30px", fontWeight: 800, letterSpacing: "-0.03em" }}>{value}</p>
        </div>
        <div style={{ padding: "12px", background: muted, color, borderRadius: "12px" }}>{icon}</div>
      </div>
    </div>
  );
}

export default function AdminClient({
  session, products = [], purchases = [],
}: {
  session: { name: string };
  products?: Product[];
  purchases?: Purchase[];
}) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const totalRevenue = purchases.reduce((acc, sale) => acc + sale.total, 0);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAdd = async (form: ReturnType<typeof emptyForm>) => {
    setLoading(true);
    try {
      await addProduct(formToFormData(form));
      showToast("¡Producto creado exitosamente!");
    } catch {
      showToast("Error al crear el producto.", false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (form: ReturnType<typeof emptyForm>) => {
    if (!editProduct) return;
    setLoading(true);
    try {
      await updateProduct(editProduct.id, formToFormData(form));
      setEditProduct(null);
      showToast("Producto actualizado.");
    } catch {
      showToast("Error al actualizar.", false);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
    await deleteProduct(id);
    showToast("Producto eliminado.");
  };

  const navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "products", label: "Productos", icon: <Package size={18} />, badge: products.length },
    { id: "add", label: "Nuevo Producto", icon: <PlusCircle size={18} /> },
    { id: "sales", label: "Ventas", icon: <ShoppingBag size={18} />, badge: purchases.length },
  ];

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
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
                <p style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Sonora Admin</p>
                <p style={{ margin: 0, fontSize: "11px", color: s.muted }}>Panel de Control</p>
              </div>
            </div>
          </div>

          <nav style={{ padding: "16px 12px", flex: 1, display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
            <p style={{ fontSize: "10px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px", paddingLeft: "8px" }}>Menú Principal</p>
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "10px", cursor: "pointer",
                  background: tab === item.id ? s.purpleMuted : "transparent",
                  color: tab === item.id ? s.purpleLight : s.muted,
                  border: `1px solid ${tab === item.id ? "rgba(124,58,237,0.2)" : "transparent"}`,
                  textAlign: "left", fontSize: "14px", fontWeight: tab === item.id ? 600 : 400,
                  transition: "all 0.15s", width: "100%",
                }}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge !== undefined && (
                  <span style={{ fontSize: "11px", background: tab === item.id ? s.purple : "rgba(255,255,255,0.08)", color: tab === item.id ? "#fff" : s.muted, padding: "2px 7px", borderRadius: "10px", fontWeight: 700 }}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div style={{ padding: "16px 12px", borderTop: `1px solid ${s.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", marginBottom: "10px" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: `linear-gradient(135deg, ${s.purple}, #c026d3)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "14px", flexShrink: 0 }}>
                {session.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session.name}</p>
                <p style={{ margin: 0, fontSize: "11px", color: s.purple, fontWeight: 600 }}>Administrador</p>
              </div>
            </div>

            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", color: s.muted, textDecoration: "none", fontSize: "13px", borderRadius: "8px", transition: "all 0.15s", marginBottom: "6px" }}>
              <Eye size={15} /> Ver Tienda
            </Link>
            <form action={logout}>
              <button type="submit" style={{ width: "100%", display: "flex", alignItems: "center", gap: "8px", padding: "9px 12px", color: s.red, background: s.redMuted, border: "none", cursor: "pointer", borderRadius: "8px", fontSize: "13px", fontWeight: 600, transition: "all 0.15s" }}>
                <LogOut size={15} /> Cerrar Sesión
              </button>
            </form>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, marginLeft: "260px", padding: "36px 40px", minHeight: "100vh" }}>
          
          {/* Toast */}
          {toast && (
            <div style={{
              position: "fixed", top: "24px", right: "24px", zIndex: 9999,
              background: toast.ok ? s.greenMuted : s.redMuted,
              border: `1px solid ${toast.ok ? s.green : s.red}`,
              color: toast.ok ? s.green : s.red,
              padding: "14px 20px", borderRadius: "12px", fontSize: "14px", fontWeight: 600,
              display: "flex", alignItems: "center", gap: "10px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              animation: "slideIn 0.25s ease",
            }}>
              {toast.ok ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              {toast.msg}
            </div>
          )}

          {/* Header */}
          <header style={{ marginBottom: "36px" }}>
            <h1 style={{ margin: "0 0 4px", fontSize: "26px", fontWeight: 800, letterSpacing: "-0.02em" }}>
              {navItems.find(n => n.id === tab)?.label}
            </h1>
            <p style={{ margin: 0, fontSize: "14px", color: s.muted }}>
              {tab === "dashboard" && "Resumen general de tu tienda"}
              {tab === "products" && `${products.length} productos registrados`}
              {tab === "add" && "Completa todos los campos del producto"}
              {tab === "sales" && `${purchases.length} ventas realizadas`}
            </p>
          </header>

          {/* Dashboard */}
          {tab === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
                <StatCard label="Ingresos Totales" value={`S/ ${totalRevenue.toFixed(2)}`} icon={<TrendingUp size={20} />} color={s.green} muted={s.greenMuted} />
                <StatCard label="Ventas Realizadas" value={String(purchases.length)} icon={<ShoppingBag size={20} />} color={s.purpleLight} muted={s.purpleMuted} />
                <StatCard label="Productos Activos" value={String(products.length)} icon={<Package size={20} />} color={s.sky} muted={s.skyMuted} />
                <StatCard label="Ticket Promedio" value={purchases.length ? `S/ ${(totalRevenue / purchases.length).toFixed(2)}` : "—"} icon={<Users size={20} />} color={s.amber} muted="rgba(251,191,36,0.12)" />
              </div>

              {purchases.length > 0 && (
                <div style={{ background: s.card, borderRadius: "16px", border: `1px solid ${s.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "20px 24px", borderBottom: `1px solid ${s.border}` }}>
                    <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Ventas Recientes</h2>
                  </div>
                  <div>
                    {purchases.slice(0, 5).map((sale, i) => {
                      const items = (() => { try { return JSON.parse(sale.items || "[]"); } catch { return []; } })();
                      const date = new Date(sale.createdAt);
                      return (
                        <div key={sale.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: i < 4 ? `1px solid ${s.border}` : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: s.purpleMuted, display: "flex", alignItems: "center", justifyContent: "center", color: s.purpleLight, fontWeight: 700, fontSize: "13px" }}>
                              #{sale.id}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{items.length} producto{items.length !== 1 ? "s" : ""}</p>
                              <p style={{ margin: 0, fontSize: "12px", color: s.muted }}>{date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                          </div>
                          <span style={{ fontSize: "15px", fontWeight: 700, color: s.green }}>S/ {sale.total.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Product */}
          {tab === "add" && (
            <div style={{ background: s.card, padding: "32px", borderRadius: "20px", border: `1px solid ${s.border}`, maxWidth: "860px" }}>
              <ProductForm
                key="add"
                initialData={emptyForm()}
                onSubmit={handleAdd}
                submitLabel="Crear Producto"
                loading={loading}
              />
            </div>
          )}

          {/* Products Table */}
          {tab === "products" && (
            <div style={{ background: s.card, borderRadius: "20px", border: `1px solid ${s.border}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${s.border}` }}>
                  <tr>
                    <th style={{ padding: "14px 20px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Producto</th>
                    <th style={{ padding: "14px 20px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Categoría</th>
                    <th style={{ padding: "14px 20px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Precio</th>
                    <th style={{ padding: "14px 20px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Estado</th>
                    <th style={{ padding: "14px 20px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: "48px", textAlign: "center", color: s.muted }}>
                      <Package size={32} style={{ opacity: 0.3, marginBottom: "12px", display: "block", margin: "0 auto 12px" }} />
                      No hay productos registrados.
                      <button onClick={() => setTab("add")} style={{ display: "block", margin: "12px auto 0", padding: "8px 16px", background: s.purpleMuted, color: s.purpleLight, border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
                        Crear el primero
                      </button>
                    </td></tr>
                  ) : products.map(p => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${s.border}`, transition: "background 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "44px", height: "44px", borderRadius: "10px", overflow: "hidden", background: "rgba(0,0,0,0.3)", flexShrink: 0 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>{p.name}</p>
                            <p style={{ margin: 0, fontSize: "12px", color: s.muted }}>★ {p.rating}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "12px", padding: "4px 10px", background: s.purpleMuted, color: s.purpleLight, borderRadius: "6px", fontWeight: 600, textTransform: "capitalize" }}>{p.category}</span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "15px", fontWeight: 700 }}>S/ {p.price.toFixed(2)}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "12px", padding: "4px 10px", background: p.inStock ? s.greenMuted : s.redMuted, color: p.inStock ? s.green : s.red, borderRadius: "6px", fontWeight: 600 }}>
                          {p.inStock ? "En Stock" : "Agotado"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => setEditProduct(p)}
                            style={{ background: s.skyMuted, border: "none", color: s.sky, padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
                          >
                            <Edit2 size={14} /> Editar
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            style={{ background: s.redMuted, border: "none", color: s.red, padding: "8px", borderRadius: "8px", cursor: "pointer" }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sales */}
          {tab === "sales" && (
            <div style={{ background: s.card, borderRadius: "20px", border: `1px solid ${s.border}`, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead style={{ background: "rgba(255,255,255,0.02)", borderBottom: `1px solid ${s.border}` }}>
                  <tr>
                    <th style={{ padding: "14px 20px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Orden</th>
                    <th style={{ padding: "14px 20px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Fecha</th>
                    <th style={{ padding: "14px 20px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Artículos</th>
                    <th style={{ padding: "14px 20px", fontSize: "11px", color: s.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: "48px", textAlign: "center", color: s.muted }}>No hay ventas registradas.</td></tr>
                  ) : purchases.map((sale, i) => {
                    const items = (() => { try { return JSON.parse(sale.items || "[]"); } catch { return []; } })();
                    const date = new Date(sale.createdAt);
                    return (
                      <tr key={sale.id} style={{ borderBottom: i < purchases.length - 1 ? `1px solid ${s.border}` : "none", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.015)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "16px 20px" }}>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: s.purpleLight }}>#{sale.id.toString().padStart(4, "0")}</span>
                        </td>
                        <td style={{ padding: "16px 20px", fontSize: "13px", color: s.muted }}>
                          {date.toLocaleDateString()}<br />
                          <span style={{ fontSize: "12px" }}>{date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </td>
                        <td style={{ padding: "16px 20px", maxWidth: "300px" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {items.slice(0, 3).map((item: { name: string }, j: number) => (
                              <span key={j} style={{ fontSize: "12px", padding: "2px 8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", color: s.text }}>{item.name}</span>
                            ))}
                            {items.length > 3 && <span style={{ fontSize: "12px", color: s.muted }}>+{items.length - 3} más</span>}
                          </div>
                        </td>
                        <td style={{ padding: "16px 20px", textAlign: "right", fontSize: "16px", fontWeight: 800, color: s.green }}>S/ {sale.total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {/* Edit Modal */}
        {editProduct && (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", animation: "fadeIn 0.2s ease" }}
            onClick={e => { if (e.target === e.currentTarget) setEditProduct(null); }}
          >
            <div style={{ background: s.surface, border: `1px solid ${s.border}`, borderRadius: "24px", width: "100%", maxWidth: "820px", maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "24px 28px", borderBottom: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Editar Producto</h2>
                  <p style={{ margin: 0, fontSize: "13px", color: s.muted }}>{editProduct.name}</p>
                </div>
                <button onClick={() => setEditProduct(null)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: "8px", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: s.text }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "28px" }}>
                <ProductForm
                  key={editProduct.id}
                  initialData={productToForm(editProduct)}
                  onSubmit={handleUpdate}
                  submitLabel="Guardar Cambios"
                  loading={loading}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
