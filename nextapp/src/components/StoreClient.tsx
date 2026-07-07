"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, ShoppingCart, Star, Package, Sparkles, LogOut, LayoutDashboard, Menu, X, ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";
import Link from "next/link";
import { logout } from "@/app/auth-actions";
import { createPurchase } from "@/app/actions";

interface Product {
  id: number;
  name: string;
  categoryId: number | null;
  category: { id: number; name: string } | null;
  price: number;
  rating: number;
  inStock: boolean;
  stock: number;
  isNew: boolean;
  desc: string;
  specs: string;
  image: string;
}
interface Promotion {
  id: number;
  title: string;
  discount: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  targetType: string;
  targetId: number | null;
}

export default function StoreClient({ initialProducts, categories, session, activePromotions = [] }: { initialProducts: Product[], categories: { id: number; name: string }[], session: { id: number, name: string, email: string, role: string } | null, activePromotions?: Promotion[] }) {
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<Product[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [checkoutMsg, setCheckoutMsg] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "payment">("cart");
  const [paymentMethods, setPaymentMethods] = useState<{method: string, amount: number}[]>([{ method: "Efectivo", amount: 0 }]);

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("sonora-cart");
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("sonora-cart", JSON.stringify(cart));
    }
  }, [cart, isClient]);

  const filteredProducts = initialProducts.filter(
    (p) => {
      const matchCategory = category === "all" || p.category?.name === category;
      const matchSearch = searchQuery === "" || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.desc.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    }
  );

  const getDiscountedPrice = (product: Product) => {
    const prodPromo = activePromotions.find(p => p.targetType === 'PRODUCT' && p.targetId === product.id);
    if (prodPromo) return product.price * (1 - prodPromo.discount / 100);

    const catPromo = activePromotions.find(p => p.targetType === 'CATEGORY' && p.targetId === product.categoryId);
    if (catPromo) return product.price * (1 - catPromo.discount / 100);

    const allPromo = activePromotions.find(p => p.targetType === 'ALL');
    if (allPromo) return product.price * (1 - allPromo.discount / 100);

    return product.price;
  };

  const mappedProducts = filteredProducts.map(p => ({
    ...p,
    discountedPrice: getDiscountedPrice(p),
    originalPrice: p.price
  }));

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
    
    const cartTotal = cart.reduce((s, i) => s + getDiscountedPrice(i), 0);
    const paidTotal = paymentMethods.reduce((s, p) => s + p.amount, 0);
    
    if (Math.abs(cartTotal - paidTotal) > 0.01) {
      setCheckoutMsg("El total pagado debe ser exactamente igual al monto de la compra.");
      return;
    }

    setCheckoutMsg("Procesando pago...");
    try {
      await createPurchase(
        session.id,
        groupedCart.map(i => ({ id: i.id, name: i.name, price: getDiscountedPrice(i), quantity: i.quantity })),
        cartTotal,
        JSON.stringify(paymentMethods.filter(p => p.amount > 0))
      );
      setCart([]);
      setCheckoutMsg("¡Compra realizada con éxito!");
      setCheckoutStep("cart");
      setPaymentMethods([{ method: "Efectivo", amount: 0 }]);
      setTimeout(() => {
        setCheckoutMsg("");
        setShowCart(false);
      }, 2000);
    } catch (e) {
      setCheckoutMsg("Error al procesar. Intenta nuevamente.");
    }
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
    <div className="app-wrapper" style={{ paddingTop: 0 }}>
      {/* Top Announcement Bar */}
      {activePromotions.length > 0 ? (
        <div className="announcement-bar" style={{ background: 'linear-gradient(90deg, #7c3aed, #db2777)', color: 'white', textAlign: 'center', padding: '10px 24px', fontWeight: 'bold', fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', position: 'relative', top: 0, zIndex: 101, height: 'auto', minHeight: '38px' }}>
          <Sparkles size={16} />
          {activePromotions[0].title} - ¡Hasta {Math.max(...activePromotions.map(p => p.discount))}% de descuento!
          <Sparkles size={16} />
        </div>
      ) : (
        <div className="announcement-bar" style={{ position: 'relative', top: 0, zIndex: 101, height: 'auto', minHeight: '38px' }}>
          <div className="container bar-content" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 24px', fontSize: '12px' }}>
            <p>Envío gratuito en todos los instrumentos premium. Financiamiento de 12 meses sin intereses.</p>
            <div className="announcement-links" style={{ display: 'flex', gap: '16px' }}>
              <a href="#">Soporte</a>
              <a href="#">Tiendas</a>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Header */}
      <header className="main-header" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(11, 13, 20, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container header-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
          <a href="#" className="logo" style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/assets/images/logo.png" alt="Sonora Studio Logo" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            <span className="logo-text">Sonora Studio</span>
          </a>

          <nav className="nav-desktop hide-scrollbar" style={{ flex: 1, margin: '0 24px', overflowX: 'auto' }}>
            <ul className="nav-links" style={{ display: 'flex', gap: '18px', listStyle: 'none', margin: 0, padding: 0, whiteSpace: 'nowrap' }}>
              {['all', ...categories.map(c => c.name)].map((c) => (
                <li key={c} style={{ flexShrink: 0 }}>
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
              <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '8px 16px 8px 36px', borderRadius: '24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
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
            
            <button className="icon-btn mobile-menu-btn" onClick={() => setShowMobileMenu(true)}>
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <div 
        className="mobile-drawer-overlay" 
        style={{ display: showMobileMenu ? 'block' : 'none' }} 
        onClick={() => setShowMobileMenu(false)}
      ></div>
      <div className={`mobile-drawer ${showMobileMenu ? 'active' : ''}`}>
        <div className="drawer-header">
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Menú</span>
          <button onClick={() => setShowMobileMenu(false)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex' }}>
            <X size={24} />
          </button>
        </div>
        <nav className="nav-mobile">
          <ul>
            {['all', 'guitarras', 'bajos', 'teclados', 'baterias', 'estudio'].map((c) => (
              <li key={`mobile-${c}`}>
                <button 
                  onClick={() => { setCategory(c); setShowMobileMenu(false); }} 
                  style={{ 
                    background: 'none', border: 'none', padding: 0, textAlign: 'left',
                    color: category === c ? '#fff' : '#a1a1aa', cursor: 'pointer',
                    fontSize: '18px', fontWeight: category === c ? 700 : 500,
                    textTransform: 'capitalize', width: '100%'
                  }}
                >
                  {c === 'all' ? 'Inicio' : c}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

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
                <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {checkoutStep === "payment" && <button onClick={() => setCheckoutStep("cart")} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', padding: 0 }}><X size={20} style={{ transform: 'rotate(45deg)' }}/></button>}
                  {checkoutStep === "cart" ? <><ShoppingCart size={24} /> Tu Carrito</> : 'Pago'}
                </h2>
                <button onClick={() => { setShowCart(false); setCheckoutStep("cart"); }} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}>&times;</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {checkoutStep === "cart" ? (
                  groupedCart.length === 0 ? (
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
                          <div style={{ color: '#a1a1aa', fontSize: '12px', marginBottom: '8px' }}>S/ {getDiscountedPrice(item).toFixed(2)} c/u</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '2px' }}>
                              <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', padding: '4px' }}><Minus size={14} /></button>
                              <span style={{ fontSize: '12px', fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                              <button onClick={() => { const p = initialProducts.find(x => x.id === item.id); if(p) addToCart(p); }} style={{ background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', display: 'flex', padding: '4px' }}><Plus size={14} /></button>
                            </div>
                            <button onClick={() => { const newCart = cart.filter(x => x.id !== item.id); setCart(newCart); }} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', padding: '4px' }}><Trash2 size={16} /></button>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  <div>
                    <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Métodos de Pago</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                      {paymentMethods.map((pm, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select 
                            value={pm.method}
                            onChange={(e) => { const newPm = [...paymentMethods]; newPm[idx].method = e.target.value; setPaymentMethods(newPm); }}
                            style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                          >
                            <option value="Efectivo" style={{ background: '#12141d' }}>Efectivo</option>
                            <option value="Yape" style={{ background: '#12141d' }}>Yape</option>
                            <option value="Plin" style={{ background: '#12141d' }}>Plin</option>
                            <option value="Tarjeta" style={{ background: '#12141d' }}>Tarjeta</option>
                            <option value="Transferencia" style={{ background: '#12141d' }}>Transferencia</option>
                          </select>
                          <span style={{ color: '#a1a1aa' }}>S/</span>
                          <input 
                            type="number" 
                            value={pm.amount || ''}
                            onChange={(e) => { const newPm = [...paymentMethods]; newPm[idx].amount = parseFloat(e.target.value) || 0; setPaymentMethods(newPm); }}
                            placeholder="0.00"
                            style={{ width: '100px', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                          />
                          {paymentMethods.length > 1 && (
                            <button onClick={() => { const newPm = paymentMethods.filter((_, i) => i !== idx); setPaymentMethods(newPm); }} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '4px' }}><X size={16} /></button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setPaymentMethods([...paymentMethods, { method: "Yape", amount: 0 }])}
                      style={{ background: 'none', border: '1px dashed rgba(255,255,255,0.2)', color: '#a1a1aa', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', width: '100%', fontSize: '14px', transition: 'background 0.2s' }}
                    >
                      + Añadir método de pago
                    </button>
                    
                    <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                        <span style={{ color: '#a1a1aa' }}>Total Compra:</span>
                        <span>S/ {cart.reduce((s, i) => s + getDiscountedPrice(i), 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                        <span style={{ color: '#a1a1aa' }}>Total Pagado:</span>
                        <span style={{ color: paymentMethods.reduce((s, p) => s + p.amount, 0) >= cart.reduce((s, i) => s + getDiscountedPrice(i), 0) - 0.01 ? '#34d399' : '#fbbf24' }}>S/ {paymentMethods.reduce((s, p) => s + p.amount, 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '8px' }}>
                        <span style={{ color: '#a1a1aa' }}>Falta pagar:</span>
                        <span style={{ color: '#f87171' }}>S/ {Math.max(0, cart.reduce((s, i) => s + getDiscountedPrice(i), 0) - paymentMethods.reduce((s, p) => s + p.amount, 0)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {groupedCart.length > 0 && (
                <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                  {checkoutStep === "cart" && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#a1a1aa', fontSize: '14px' }}>
                        <span>Subtotal</span>
                        <span>S/ {cart.reduce((s, i) => s + getDiscountedPrice(i), 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '18px', fontWeight: 'bold' }}>
                        <span>Total a Pagar</span>
                        <span style={{ color: '#34d399' }}>S/ {cart.reduce((s, i) => s + getDiscountedPrice(i), 0).toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {checkoutMsg && <div style={{ color: checkoutMsg.includes('!') ? '#34d399' : '#f87171', fontSize: '14px', marginBottom: '16px', textAlign: 'center', background: checkoutMsg.includes('!') ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)', padding: '8px', borderRadius: '8px' }}>{checkoutMsg}</div>}
                  <button 
                    onClick={checkoutStep === "cart" ? () => {
                      if (!session) {
                        setCheckoutMsg("Debes iniciar sesión para proceder al pago.");
                        return;
                      }
                      setCheckoutMsg("");
                      setCheckoutStep("payment"); 
                      setPaymentMethods([{ method: "Efectivo", amount: cart.reduce((s, i) => s + getDiscountedPrice(i), 0) }]);
                    } : handleCheckout} 
                    style={{ width: '100%', padding: '16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px', transition: 'background 0.2s' }}
                  >
                    {checkoutStep === "cart" ? 'Proceder al Pago' : 'Confirmar y Pagar'}
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
            <button onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-primary" style={{ padding: '16px 32px', background: '#7c3aed', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '16px' }}>Explorar Catálogo</button>
          </motion.div>
        </div>
        <div className="hero-media" style={{ width: '50%', height: '500px', position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
           <img src="/assets/images/hero_bg_1782346378898.png" alt="Hero Background" style={{ width: '100%', height: '100%', objectFit: 'cover', maskImage: 'linear-gradient(to right, transparent, black 30%)' }} />
        </div>
      </section>

      {/* Product Grid */}
      <section id="catalog" className="main-content container" style={{ padding: '40px 24px' }}>
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
            {mappedProducts.map((p) => (
              <motion.div 
                key={p.id}
                variants={item}
                layout
                exit={{ opacity: 0, scale: 0.9 }}
                className="product-card"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.3s' }}
                whileHover={{ y: -5, background: 'rgba(255,255,255,0.04)' }}
                onClick={() => setSelectedProduct(p)}
              >
                <div className="card-media" style={{ height: '240px', background: '#000', position: 'relative' }}>
                  {p.isNew && <span style={{ position: 'absolute', top: '12px', left: '12px', background: '#7c3aed', color: '#fff', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', zIndex: 10 }}><Sparkles size={12} style={{ display: 'inline', marginRight: '4px' }} />NUEVO</span>}
                  {p.discountedPrice < p.originalPrice && <span style={{ position: 'absolute', top: '12px', right: '12px', background: '#db2777', color: '#fff', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', zIndex: 10 }}>-{Math.round((1 - p.discountedPrice / p.originalPrice) * 100)}%</span>}
                  <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div className="card-content" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#a1a1aa', textTransform: 'uppercase' }}>{p.category?.name || "Sin Categoría"}</span>
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: '#fbbf24' }}><Star size={12} fill="#fbbf24" style={{ marginRight: '4px' }}/> {p.rating}</span>
                  </div>
                  <h3 style={{ fontSize: '18px', marginBottom: '8px', lineHeight: 1.3 }}>{p.name}</h3>
                  <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.desc}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {p.discountedPrice < p.originalPrice && <span style={{ fontSize: '12px', color: '#a1a1aa', textDecoration: 'line-through' }}>S/ {p.originalPrice.toFixed(2)}</span>}
                      <span style={{ fontSize: '20px', fontWeight: 'bold', color: p.discountedPrice < p.originalPrice ? '#db2777' : '#fff' }}>S/ {p.discountedPrice.toFixed(2)}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                      style={{ padding: '8px 16px', background: (p.inStock && p.stock > 0) ? '#fff' : 'rgba(255,255,255,0.1)', color: (p.inStock && p.stock > 0) ? '#000' : '#a1a1aa', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: (p.inStock && p.stock > 0) ? 'pointer' : 'not-allowed' }}
                      disabled={!(p.inStock && p.stock > 0)}
                    >
                      {(p.inStock && p.stock > 0) ? 'Agregar' : 'Agotado'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              style={{ background: '#12141d', width: '100%', maxWidth: '900px', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexWrap: 'wrap', maxHeight: '90vh', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
              >
                <X size={20} />
              </button>

              <div style={{ flex: '1 1 400px', background: '#000', position: 'relative' }}>
                <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '300px' }} />
                {selectedProduct.isNew && <span style={{ position: 'absolute', top: '24px', left: '24px', background: '#7c3aed', color: '#fff', fontSize: '12px', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold' }}><Sparkles size={14} style={{ display: 'inline', marginRight: '6px' }} />NUEVO</span>}
              </div>
              
              <div style={{ flex: '1 1 400px', padding: '40px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', color: '#7c3aed', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{selectedProduct.category?.name || "Sin Categoría"}</span>
                  <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#fbbf24', fontWeight: 'bold' }}><Star size={16} fill="#fbbf24" style={{ marginRight: '6px' }}/> {selectedProduct.rating} / 5</span>
                </div>
                
                <h2 style={{ fontSize: '32px', marginBottom: '16px', lineHeight: 1.2 }}>{selectedProduct.name}</h2>
                <p style={{ fontSize: '16px', color: '#a1a1aa', marginBottom: '32px', lineHeight: 1.6 }}>{selectedProduct.desc}</p>
                
                <div style={{ marginBottom: '32px' }}>
                  <h4 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#a1a1aa', letterSpacing: '0.05em', marginBottom: '12px' }}>Especificaciones</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {Object.entries(JSON.parse(selectedProduct.specs || '{}')).map(([key, val]) => (
                      <div key={key} style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', marginBottom: '4px' }}>{key}</div>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{String(val)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '4px' }}>Precio</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: getDiscountedPrice(selectedProduct) < selectedProduct.price ? '#db2777' : '#fff' }}>S/ {getDiscountedPrice(selectedProduct).toFixed(2)}</div>
                      {getDiscountedPrice(selectedProduct) < selectedProduct.price && (
                        <div style={{ fontSize: '18px', color: '#a1a1aa', textDecoration: 'line-through' }}>S/ {selectedProduct.price.toFixed(2)}</div>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: (selectedProduct.inStock && selectedProduct.stock > 0) ? '#34d399' : '#f87171', marginTop: '4px' }}>
                      {(selectedProduct.inStock && selectedProduct.stock > 0) ? `En Stock (${selectedProduct.stock} un.)` : 'Agotado'}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                    style={{ padding: '16px 32px', background: (selectedProduct.inStock && selectedProduct.stock > 0) ? '#7c3aed' : 'rgba(255,255,255,0.1)', color: (selectedProduct.inStock && selectedProduct.stock > 0) ? '#fff' : '#a1a1aa', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: (selectedProduct.inStock && selectedProduct.stock > 0) ? 'pointer' : 'not-allowed', fontSize: '16px', transition: 'transform 0.2s, background 0.2s', display: 'flex', alignItems: 'center', gap: '12px' }}
                    disabled={!(selectedProduct.inStock && selectedProduct.stock > 0)}
                    onMouseOver={(e) => { if(selectedProduct.inStock && selectedProduct.stock > 0) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; }}
                  >
                    <ShoppingBag size={20} />
                    {(selectedProduct.inStock && selectedProduct.stock > 0) ? 'Agregar al Carrito' : 'Agotado'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
