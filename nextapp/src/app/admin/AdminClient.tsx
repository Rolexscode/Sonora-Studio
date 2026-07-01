"use client";

import { addProduct, deleteProduct } from "@/app/actions";
import { logout } from "@/app/auth-actions";
import { useState } from "react";
import Link from "next/link";
import { LogOut, Package, PlusCircle, ShoppingBag, Trash2, LayoutDashboard } from "lucide-react";

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

export default function AdminClient({ session, products = [], purchases = [] }: { session: { name: string }, products?: Product[], purchases?: Purchase[] }) {
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState("dashboard");

  const totalRevenue = purchases.reduce((acc, sale) => acc + sale.total, 0);
  const totalSales = purchases.length;
  const totalProducts = products.length;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addProduct(formData);
    setMsg("¡Producto creado exitosamente!");
    (e.target as HTMLFormElement).reset();
    setTimeout(() => setMsg(""), 3000);
  };

  const handleDelete = async (id: number) => {
    if(confirm("¿Seguro que deseas eliminar este producto?")) {
      await deleteProduct(id);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'products', label: 'Productos', icon: <Package size={18} /> },
    { id: 'add', label: 'Agregar Producto', icon: <PlusCircle size={18} /> },
    { id: 'sales', label: 'Ventas', icon: <ShoppingBag size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0d14', color: '#fff', fontFamily: 'var(--font-jakarta)' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', background: '#12141d', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', top: 0, left: 0 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '20px', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/assets/images/logo.png" alt="Sonora Studio Logo" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
            Sonora Admin
          </h2>
          <p style={{ color: '#a1a1aa', margin: 0, fontSize: '12px' }}>Panel de Control</p>
        </div>

        <nav style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '8px' }}>Navegación</p>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                background: tab === item.id ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                color: tab === item.id ? '#a78bfa' : '#a1a1aa',
                border: 'none', textAlign: 'left', fontSize: '14px', fontWeight: tab === item.id ? 600 : 400,
                transition: 'all 0.2s'
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '24px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '0 8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {session.name.charAt(0)}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{session.name}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#a1a1aa' }}>Admin</p>
            </div>
          </div>
          <Link href="/" style={{ display: 'block', padding: '10px 16px', color: '#a1a1aa', textDecoration: 'none', fontSize: '14px', marginBottom: '8px', borderRadius: '8px' }}>Ver Tienda</Link>
          <form action={logout}>
            <button type="submit" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}>
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: '260px', padding: '40px', maxWidth: '1200px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', margin: 0 }}>{navItems.find(n => n.id === tab)?.label}</h1>
        </header>

        {msg && <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>{msg}</div>}

        {tab === "dashboard" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ background: '#12141d', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#a1a1aa', fontSize: '14px', fontWeight: 600 }}>Ingresos Totales</span>
                <div style={{ padding: '8px', background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa', borderRadius: '8px' }}><ShoppingBag size={20} /></div>
              </div>
              <span style={{ fontSize: '32px', fontWeight: 'bold' }}>S/ {totalRevenue.toFixed(2)}</span>
            </div>
            
            <div style={{ background: '#12141d', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#a1a1aa', fontSize: '14px', fontWeight: 600 }}>Ventas Realizadas</span>
                <div style={{ padding: '8px', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', borderRadius: '8px' }}><Package size={20} /></div>
              </div>
              <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{totalSales}</span>
            </div>

            <div style={{ background: '#12141d', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#a1a1aa', fontSize: '14px', fontWeight: 600 }}>Productos Activos</span>
                <div style={{ padding: '8px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: '8px' }}><LayoutDashboard size={20} /></div>
              </div>
              <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{totalProducts}</span>
            </div>
          </div>
        )}

        {tab === "add" && (
          <div style={{ background: '#12141d', padding: '32px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#a1a1aa', fontSize: '14px' }}>Nombre del Producto</label>
                <input name="name" type="text" required style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#a1a1aa', fontSize: '14px' }}>Categoría</label>
                <select name="category" required style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontSize: '14px', outline: 'none' }}>
                  <option value="guitarras">Guitarras</option>
                  <option value="bajos">Bajos</option>
                  <option value="teclados">Teclados</option>
                  <option value="baterias">Baterías</option>
                  <option value="estudio">Estudio</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#a1a1aa', fontSize: '14px' }}>Precio (S/)</label>
                  <input name="price" type="number" step="0.01" required style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#a1a1aa', fontSize: '14px' }}>Calificación</label>
                  <input name="rating" type="number" step="0.1" max="5" min="1" required style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#a1a1aa', fontSize: '14px' }}>Descripción</label>
                <textarea name="desc" rows={5} required style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical' }} />
              </div>
              
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="submit" style={{ padding: '12px 32px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s' }}>
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        )}

        {tab === "products" && (
          <div style={{ background: '#12141d', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <tr>
                  <th style={{ padding: '16px 24px', fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase' }}>Producto</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase' }}>Categoría</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase' }}>Precio</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#a1a1aa' }}>No hay productos registrados.</td></tr>
                ) : products.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#a1a1aa', textTransform: 'capitalize' }}>{p.category}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600 }}>S/ {p.price.toFixed(2)}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button onClick={() => handleDelete(p.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#f87171', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "sales" && (
          <div style={{ background: '#12141d', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <tr>
                  <th style={{ padding: '16px 24px', fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase' }}>ID Venta</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase' }}>Fecha</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase' }}>Artículos</th>
                  <th style={{ padding: '16px 24px', fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#a1a1aa' }}>No hay ventas registradas.</td></tr>
                ) : purchases.map(sale => {
                  const items = JSON.parse(sale.items || '[]');
                  const date = new Date(sale.createdAt);
                  return (
                    <tr key={sale.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 600 }}>#{sale.id.toString().padStart(4, '0')}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#a1a1aa' }}>{date.toLocaleDateString()} {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', color: '#a1a1aa' }}>
                        {items.length} prod. <span style={{ opacity: 0.5 }}>({items.map((i:{name: string})=>i.name).join(', ').substring(0, 30)}...)</span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 'bold', color: '#34d399', textAlign: 'right' }}>S/ {sale.total.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
