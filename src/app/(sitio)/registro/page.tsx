"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import RegisterView from "./components/RegisterView";
import { useCuentaFirebase } from "@/hooks/useCuentaFirebase";
import { useAuthStore } from "@/stores/authStore";
import { DESTINO_DEFAULT, RUTA_COMPLETAR_REGISTRO } from "@/data/auth";

export default function RegistroPage() {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const nombre = useAuthStore((s) => s.nombre);
  const [finishing, setFinishing] = useState(false);
  const cuentaFirebase = useCuentaFirebase();

  const loggedIn = hasHydrated && !!nombre;

  // Si ya hay sesión, no mostramos el registro: al destino post-login.
  useEffect(() => {
    if (loggedIn) router.replace(DESTINO_DEFAULT.href);
  }, [loggedIn, router]);

  // Cuenta de Firebase sin perfil (alta a medias): se completa, no se vuelve a
  // hacer el sign-up, que crearía otra cuenta o fallaría con email-already-in-use.
  const altaIncompleta =
    hasHydrated && !cuentaFirebase.checking && !!cuentaFirebase.email && !nombre;
  useEffect(() => {
    if (altaIncompleta) router.replace(RUTA_COMPLETAR_REGISTRO);
  }, [altaIncompleta, router]);

  // Cuenta y perfil creados, y el perfil ya está en el store: navegación dura
  // para que la navbar se hidrate en estado logueado.
  function handleSuccess() {
    setFinishing(true);
    window.location.href = DESTINO_DEFAULT.href;
  }

  // Mientras navegamos al destino tras el alta.
  if (finishing) {
    return (
      <div className="px-7 py-30 text-center text-fg-3">
        <Loader className="mx-auto size-[26px] animate-spin" />
        <div className="mt-3 text-sm">Creando tu cuenta…</div>
      </div>
    );
  }

  // Mientras hidrata, si ya está logueado o si hay un alta a medias, se decide
  // adónde va sin dibujar nada, como en los guards de sesión: evita el flash
  // del formulario.
  if (!hasHydrated || loggedIn || altaIncompleta) return null;

  return <RegisterView onSuccess={handleSuccess} onBack={() => router.push("/")} />;
}
