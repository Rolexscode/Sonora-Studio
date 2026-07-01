"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, ShoppingCart, Star, Package, Sparkles, LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/auth-actions";
import { createPurchase } from "@/app/actions";

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

export default function StoreClient({ initialProducts, session }: { initialProducts: Product[], session: { id: number, name: string, email: string, role: string } | null }) {
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [checkoutMsg, setCheckoutMsg] = useState("");

  const filteredProducts = initialProducts.filter(
    (p) => category === "all" || p.category === category
  );

  const groupedCart = cart.reduce((acc, item) => {
    const found = acc.find(x => x.id === item.id);
    if (found) {
      found.quantity += 1;
    } else {
      acc.push({ ...item, quantity: 1 });
    }
    return acc;
  }, [] as (Product & { quantity: number })[]);

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
    setShowCart(true);
  };

  const removeFromCart = (productId: number) => {
    const index = cart.findIndex(i => i.id === productId);
    if (index > -1) {
      const newCart = [...cart];
      newCart.splice(index, 1);
      setCart(newCart);
    }
  };

  const handleCheckout = async () => {
    if (!session) {
      setCheckoutMsg("Inicia sesión para comprar");
      return;
    }
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    await createPurchase(session.id, cart.map(p => ({ id: p.id, name: p.name, price: p.price, quantity: 1 })), total);
    setCart([]);
    setCheckoutMsg("¡Compra realizada!");
    setTimeout(() => setCheckoutMsg(""), 3000);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="app-wrapper">
      {/* Top Announcement Bar */}
      <div className="announcement-bar">
        <div className="container bar-content" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px', fontSize: '12px' }}>
          <p>Envío gratuito en todos los instrumentos premium. Financiamiento de 12 meses sin intereses.</p>
          <div className="announcement-links" style={{ display: 'flex', gap: '16px' }}>
            <a href="#">Soporte</a>
            <a href="#">Tiendas</a>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="main-header" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(11, 13, 20, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container header-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
          <a href="#" className="logo" style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/assets/images/logo.png" alt="Sonora Studio Logo" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            <span className="logo-text">Sonora Studio</span>
          </a>

          <nav className="nav-desktop">
            <ul className="nav-links" style={{ display: 'flex', gap: '24px', listStyle: 'none' }}>
              {['all', 'guitarras', 'bajos', 'teclados', 'baterias', 'estudio'].map((c) => (
                <li key={c}>
                  <button 
                    onClick={() => setCategory(c)} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: category === c ? '#fff' : '#a1a1aa', 
                      cursor: 'pointer',
                      fontWeight: category === c ? 600 : 400,
                      textTransform: 'capitalize'
                    }}
                  >
                    {c === 'all' ? 'Inicio' : c}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="search-wrapper" style={{ position: 'relative' }}>
              <Search className="search-icon" size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
              <input type="text" placeholder="Buscar..." style={{ padding: '8px 16px 8px 36px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
            </div>
            
            <div style={{ position: 'relative' }}>
              {!session ? (
                <Link href="/login" className="icon-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <User size={20} />
                </Link>
              ) : (
                <>
                  <button onClick={() => setShowDropdown(!showDropdown)} className="icon-btn" style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <User size={20} />
                  </button>
                  
                  {showDropdown && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#12141d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', minWidth: '180px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 100 }}>
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px' }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{session.name}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#a1a1aa' }}>{session.email}</p>
                      </div>
                      
                      {session.role === 'ADMIN' ? (
                        <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontSize: '14px' }}>
                          <LayoutDashboard size={16} /> Panel Admin
                        </Link>
                      ) : (
                        <Link href="/purchases" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontSize: '14px' }}>
                          <Package size={16} /> Mis Compras
                        </Link>
                      )}
                      
                      <form action={logout}>
                        <button type="submit" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: '8px', fontSize: '14px' }}>
                          <LogOut size={16} /> Cerrar Sesión
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowCart(true)} className="icon-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', position: 'relative' }}>
                <ShoppingCart size={20} />
                {cart.length > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#7c3aed', color: '#fff', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cart.length}</span>}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowCart(false)}
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 999 }} 
            />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', maxWidth: '100vw', background: '#12141d', borderLeft: '1px solid rgba(255,255,255,0.1)', zIndex: 1000, display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 50px rgba(0,0,0,0.5)' }}
            >
              <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShoppingCart size={24} /> Tu Carrito</h2>
                <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}>&times;</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {groupedCart.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#a1a1aa', marginTop: '40px' }}>
                    <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                    <p>Tu carrito está vacío</p>
                    <button onClick={() => setShowCart(false)} style={{ marginTop: '16px', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px 16px', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>Seguir comprando</button>
                  </div>
                ) : (
                  groupedCart.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '16px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <img src={item.image} alt={item.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', background: 'rgba(255,255,255,0.1)' }} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{item.name}</h4>
                        <div style={{ color: '#a1a1aa', fontSize: '12px', marginBottom: '8px' }}>S/ {item.price.toFixed(2)} c/u</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', background: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{item.quantity}x</span>
                          <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>Quitar 1</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {groupedCart.length > 0 && (
                <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#a1a1aa', fontSize: '14px' }}>
                    <span>Subtotal</span>
                    <span>S/ {cart.reduce((s, i) => s + i.price, 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '18px', fontWeight: 'bold' }}>
                    <span>Total a Pagar</span>
                    <span style={{ color: '#34d399' }}>S/ {cart.reduce((s, i) => s + i.price, 0).toFixed(2)}</span>
                  </div>
                  {checkoutMsg && <div style={{ color: checkoutMsg.includes('!') ? '#34d399' : '#f87171', fontSize: '14px', marginBottom: '16px', textAlign: 'center', background: checkoutMsg.includes('!') ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)', padding: '8px', borderRadius: '8px' }}>{checkoutMsg}</div>}
                  <button onClick={handleCheckout} style={{ width: '100%', padding: '16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', transition: 'background 0.2s' }}>
                    Procesar Pago Seguro
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* Hero Section */}
      <section className="hero-section" style={{ padding: '80px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', position: 'relative' }}>
        <div className="hero-content" style={{ maxWidth: '600px', zIndex: 2 }}>
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="badge" style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(124, 58, 237, 0.2)', color: '#a78bfa', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', marginBottom: '16px' }}>NOVEDAD EN ESTUDIO</div>
            <h1 style={{ fontSize: '64px', lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.03em' }}>Sonido puro.<br/><span style={{ color: '#7c3aed' }}>Diseño atemporal.</span></h1>
            <p style={{ fontSize: '18px', color: '#a1a1aa', marginBottom: '32px', lineHeight: 1.6 }}>Equipa tu estudio con instrumentos de precisión y tecnología de audio de nivel profesional.</p>
            <button className="btn btn-primary" style={{ padding: '16px 32px', background: '#7c3aed', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '16px' }}>Explorar Catálogo</button>
          </motion.div>
        </div>
        <div className="hero-media" style={{ width: '50%', height: '500px', position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
           <img src="/assets/images/hero_bg_1782346378898.png" alt="Hero Background" style={{ width: '100%', height: '100%', objectFit: 'cover', maskImage: 'linear-gradient(to right, transparent, black 30%)' }} />
        </div>
      </section>

      {/* Product Grid */}
      <section className="main-content container" style={{ padding: '40px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '32px' }}>Colección {category === 'all' ? 'Destacada' : category}</h2>
        </div>

        <motion.div 
          className="product-grid" 
          variants={container}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}
        >
          <AnimatePresence>
            {filteredProducts.map((p) => (
              <motion.div 
                key={p.id}
                variants={item}
                layout
                exit={{ opacity: 0, scale: 0.9 }}
                className="product-card"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.3s' }}
                whileHover={{ y: -5, background: 'rgba(255,255,255,0.04)' }}
              >
                <div className="card-media" style={{ height: '240px', background: '#000', position: 'relative' }}>
                  {p.isNew && <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#7c3aed', color: '#fff', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}><Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />NUEVO</span>}
                  <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="card-content" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase' }}>{p.category}</span>
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#fbbf24' }}><Star size={12} fill="#fbbf24" style={{ marginRight: '4px' }}/> {p.rating}</span>
                  </div>
                  <h3 style={{ fontSize: '18px', marginBottom: '8px', lineHeight: 1.3 }}>{p.name}</h3>
                  <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.desc}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>S/ {p.price.toFixed(2)}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                      style={{ padding: '8px 16px', background: p.inStock ? '#fff' : 'rgba(255,255,255,0.1)', color: p.inStock ? '#000' : '#a1a1aa', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: p.inStock ? 'pointer' : 'not-allowed' }}
                      disabled={!p.inStock}
                    >
                      {p.inStock ? 'Agregar' : 'Agotado'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
}
