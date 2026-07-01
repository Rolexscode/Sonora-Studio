"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { syncGoogleUser } from "@/app/auth-actions";

function CallbackContent() {
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      router.push("/login");
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(async ({ data, error }) => {
      if (error || !data.user) {
        setError("No se pudo autenticar. Intenta de nuevo.");
        return;
      }
      const email = data.user.email!;
      const name = data.user.user_metadata?.full_name || data.user.user_metadata?.name || email.split("@")[0];
      const result = await syncGoogleUser(email, name);
      if (result?.success) {
        router.push(result.role === "ADMIN" ? "/admin" : "/");
        router.refresh();
      } else {
        setError("Error al crear la sesión.");
      }
    });
  }, [searchParams, router]);

  const purple = "#7c3aed";

  if (error) return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "#f87171", marginBottom: "16px" }}>{error}</p>
      <button onClick={() => router.push("/login")}
        style={{ padding: "10px 24px", background: purple, color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>
        Volver al Login
      </button>
    </div>
  );

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: purple, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
      <p style={{ color: "#6b7280", fontSize: "14px" }}>Iniciando sesión con Google...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080a12", color: "#e5e7eb", fontFamily: "system-ui, sans-serif" }}>
        <Suspense fallback={
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#6b7280", fontSize: "14px" }}>Cargando...</p>
          </div>
        }>
          <CallbackContent />
        </Suspense>
      </div>
    </>
  );
}
