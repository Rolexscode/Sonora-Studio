"use server";

import { getSession, logout } from "@/app/auth-actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, LogOut, ArrowLeft, ReceiptText, User } from "lucide-react";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function PurchasesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const purchases = await prisma.purchase.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0d14', color: '#fff', fontFamily: 'var(--font-jakarta)' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', background: '#12141d', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', top: 0, left: 0 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '20px', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/assets/images/logo.png" alt="Sonora Studio Logo" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
            Sonora Studio
          </h2>
          <p style={{ color: '#a1a1aa', margin: 0, fontSize: '12px' }}>Panel de Usuario</p>
        </div>

        <nav style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '8px' }}>Navegación</p>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
            background: 'rgba(124, 58, 237, 0.1)', color: '#a78bfa',
            border: 'none', textAlign: 'left', fontSize: '14px', fontWeight: 600,
          }}>
            <ReceiptText size={18} /> Mis Compras
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', cursor: 'not-allowed',
            background: 'transparent', color: '#a1a1aa',
            border: 'none', textAlign: 'left', fontSize: '14px', fontWeight: 400, opacity: 0.5
          }}>
            <User size={18} /> Mi Perfil
          </div>
        </nav>

        <div style={{ padding: '24px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '0 8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {session.name.charAt(0)}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{session.name}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#a1a1aa' }}>Usuario</p>
            </div>
          </div>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', color: '#a1a1aa', textDecoration: 'none', fontSize: '14px', marginBottom: '8px', borderRadius: '8px', transition: 'background 0.2s' }}>
            <ArrowLeft size={16} /> Volver a la Tienda
          </Link>
          <form action={logout}>
            <button type="submit" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}>
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, marginLeft: '260px', padding: '40px', maxWidth: '1000px' }}>
        <header style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '28px', margin: '0 0 8px' }}>Historial de Compras</h1>
          <p style={{ color: '#a1a1aa', margin: 0, fontSize: '14px' }}>Revisa el detalle de tus pedidos y boletas electrónicas.</p>
        </header>

        {purchases.length === 0 ? (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.2)', padding: '60px 20px', borderRadius: '16px', textAlign: 'center' }}>
            <Package size={48} color="#a1a1aa" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Aún no tienes compras</h2>
            <p style={{ color: '#a1a1aa', maxWidth: '400px', margin: '0 auto 24px' }}>Explora nuestro catálogo premium y equípate con los mejores instrumentos y equipos de estudio.</p>
            <Link href="/" style={{ padding: '12px 24px', background: '#7c3aed', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'inline-block' }}>Ir al Catálogo</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
            {purchases.map(p => {
              const items = JSON.parse(p.items || '[]');
              const date = new Date(p.createdAt);
              return (
                <div key={p.id} style={{ background: '#fff', color: '#111', borderRadius: '4px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                  {/* Decorative edges TOP */}
                  <div style={{ position: 'absolute', top: '-10px', left: 0, right: 0, height: '20px', background: 'radial-gradient(circle, #0b0d14 50%, transparent 50%)', backgroundSize: '20px 20px', backgroundPosition: '-10px 0' }}></div>
                  
                  {/* Boleta Header */}
                  <div style={{ borderBottom: '2px dashed #ccc', padding: '32px 24px 24px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: '20px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800 }}>Sonora Studio</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>RUC: 20123456789</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>Av. La Música 123, Lima, Perú</p>
                    
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>BOLETA ELECTRÓNICA</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#f00' }}>B001-{p.id.toString().padStart(6, '0')}</span>
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#666' }}>
                      <span>FECHA: {date.toLocaleDateString()}</span>
                      <span>HORA: {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>

                  {/* Boleta Body */}
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '12px', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                      <span style={{ flex: 1 }}>CANT / DESC</span>
                      <span style={{ width: '80px', textAlign: 'right' }}>IMPORTE</span>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '80px' }}>
                      {items.map((item: { quantity: number, name: string, price: number }, i: number) => (
                        <li key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ flex: 1, paddingRight: '8px' }}>{item.quantity}x {item.name}</span>
                          <span style={{ width: '80px', textAlign: 'right' }}>S/ {(item.quantity * item.price).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Boleta Footer */}
                  <div style={{ padding: '0 24px 32px', borderTop: '2px dashed #ccc', paddingTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: '#666' }}>
                      <span>OP. GRAVADA</span>
                      <span>S/ {(p.total / 1.18).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '16px', color: '#666' }}>
                      <span>IGV (18%)</span>
                      <span>S/ {(p.total - (p.total / 1.18)).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', borderTop: '1px solid #111', paddingTop: '16px' }}>
                      <span>TOTAL A PAGAR</span>
                      <span>S/ {p.total.toFixed(2)}</span>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
                      ¡Gracias por su compra!
                    </div>
                  </div>
                  
                  {/* Decorative edges BOTTOM */}
                  <div style={{ position: 'absolute', bottom: '-10px', left: 0, right: 0, height: '20px', background: 'radial-gradient(circle, #0b0d14 50%, transparent 50%)', backgroundSize: '20px 20px', backgroundPosition: '-10px 0' }}></div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
