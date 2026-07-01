"use client";

import { useState } from "react";
import { login } from "@/app/auth-actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const res = await login(formData);
    if (res?.error) {
      setError(res.error);
    } else {
      if (res?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/purchases");
      }
      router.refresh();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0d14', color: '#fff', fontFamily: 'var(--font-jakarta)' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.03)', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src="/assets/images/logo.png" alt="Sonora Studio Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', marginBottom: '16px', objectFit: 'cover' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Iniciar Sesión</h1>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>Accede a Sonora Studio Premium</p>
        </div>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '12px', borderRadius: '8px', marginBottom: '24px', textAlign: 'center', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#a1a1aa', fontSize: '14px' }}>Correo Electrónico</label>
            <input name="email" type="email" required style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', outline: 'none' }} placeholder="admin@sonora.com o cliente@sonora.com" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#a1a1aa', fontSize: '14px' }}>Contraseña</label>
            <input name="password" type="password" required style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', outline: 'none' }} placeholder="123" />
          </div>
          <button type="submit" style={{ padding: '14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '8px', transition: 'background 0.2s' }}>Entrar a mi cuenta</button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link href="/" style={{ color: '#a1a1aa', textDecoration: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            Volver a la Tienda
          </Link>
        </div>
      </div>
    </div>
  );
}
