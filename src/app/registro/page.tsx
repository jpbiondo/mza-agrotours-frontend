"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import RegisterView from "./components/RegisterView";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { DESTINO_DEFAULT } from "@/data/auth";
import type { FormData } from "@/types/registro";

export default function RegistroPage() {
  const router = useRouter();
  const { login } = useAuth();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const nombre = useAuthStore((s) => s.nombre);
  const [finishing, setFinishing] = useState(false);

  const loggedIn = hasHydrated && !!nombre;

  // Si ya hay sesión, no mostramos el registro: al destino post-login.
  useEffect(() => {
    if (loggedIn) router.replace(DESTINO_DEFAULT.href);
  }, [loggedIn, router]);

  // La cuenta ya está creada (backend). Iniciamos sesión con las mismas credenciales
  // y redirigimos al destino post-login, ya autenticados.
  async function handleSuccess(data: FormData) {
    setFinishing(true);
    try {
      await login({ email: data.email, password: data.password });
      // Navegación dura para que la navbar se hidrate en estado logueado.
      window.location.href = DESTINO_DEFAULT.href;
    } catch {
      // La cuenta se creó pero el login automático falló: que ingrese manualmente.
      router.replace("/acceso");
    }
  }

  // Evitamos el flash del formulario mientras hidrata, si ya está logueado, o
  // mientras completamos el alta + login automático.
  const showLoader = !hasHydrated || loggedIn || finishing;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <SiteHeader />
      {showLoader ? (
        <div style={{ padding: "120px 28px", textAlign: "center", color: "var(--fg-3)" }}>
          <Loader size={26} className="spin" />
          <div style={{ marginTop: 12, fontSize: 14 }}>
            {finishing ? "Creando tu cuenta…" : "Cargando…"}
          </div>
        </div>
      ) : (
        <RegisterView onSuccess={handleSuccess} onBack={() => router.push("/")} />
      )}
    </div>
  );
}
