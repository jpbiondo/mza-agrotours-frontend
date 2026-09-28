"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import RegisterView from "../components/RegisterView";
import { cerrarSesion } from "@/hooks/useAuth";
import { useCuentaFirebase } from "@/hooks/useCuentaFirebase";
import { useAuthStore } from "@/stores/authStore";
import { DESTINO_DEFAULT } from "@/data/auth";

/**
 * Alta a medias: la cuenta de Firebase existe y tiene la sesión iniciada, pero
 * el backend no tiene su perfil (falló el POST, se cerró la app…). Se piden
 * sólo los datos del perfil; email y contraseña ya son de Firebase.
 */
export default function CompletarRegistroClient() {
  const router = useRouter();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const nombre = useAuthStore((s) => s.nombre);
  const { checking, email } = useCuentaFirebase();
  const [finishing, setFinishing] = useState(false);

  const sinSesion = !checking && !email;
  // Con perfil no hay nada que completar. Si lo cacheado estaba viejo, AuthSync
  // lo detecta al revalidar y vuelve a traer acá.
  const conPerfil = hasHydrated && !!nombre;

  useEffect(() => {
    if (sinSesion) router.replace("/acceso");
    else if (conPerfil && !finishing) router.replace(DESTINO_DEFAULT.href);
  }, [sinSesion, conPerfil, finishing, router]);

  // Navegación dura para que la navbar se hidrate en estado logueado.
  function handleSuccess() {
    setFinishing(true);
    window.location.href = DESTINO_DEFAULT.href;
  }

  if (!hasHydrated || checking || sinSesion || conPerfil || finishing) {
    return (
      <div className="px-7 py-30 text-center text-fg-3">
        <Loader className="mx-auto size-[26px] animate-spin" />
        <div className="mt-3 text-sm">
          {finishing ? "Terminando tu registro…" : "Cargando…"}
        </div>
      </div>
    );
  }

  return (
    <RegisterView
      modo="completar"
      emailCuenta={email ?? ""}
      onSuccess={handleSuccess}
      onBack={() => cerrarSesion("/")}
    />
  );
}
