"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
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

  return showLoader ? (
    <div className="px-7 py-30 text-center text-fg-3">
      <Loader className="mx-auto size-[26px] animate-spin" />
      <div className="mt-3 text-sm">{finishing ? "Creando tu cuenta…" : "Cargando…"}</div>
    </div>
  ) : (
    <RegisterView onSuccess={handleSuccess} onBack={() => router.push("/")} />
  );
}
