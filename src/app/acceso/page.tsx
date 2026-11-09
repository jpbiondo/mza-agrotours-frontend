"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader } from "lucide-react";
import { AuthHeader, AuthLayout } from "./components/AuthShell";
import LoginForm from "./components/LoginForm";
import LoginSuccess from "./components/LoginSuccess";
import type { Cuenta } from "@/types/auth";
import { destinoSeguro, type MotivoAcceso } from "@/lib/volver";

/** `volviendo`: hay a dónde volver y se navega directo, sin la pantalla de resultado. */
type View = "login" | "login-ok" | "volviendo";

/** Avisos que llegan por `?motivo=…` (p. ej. tras cambiar el email en Mi cuenta). */
const NOTICES: Record<MotivoAcceso, string> = {
  "email-actualizado":
    "Actualizamos tu correo. Iniciá sesión de nuevo con tu nuevo email.",
  "sesion-vencida":
    "Tu sesión venció. Iniciá sesión de nuevo y te llevamos a donde estabas.",
};

function AccesoInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>("login");
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const notice = NOTICES[(searchParams.get("motivo") ?? "") as MotivoAcceso];
  // A dónde volver después del login (lo pone el guard que mandó acá).
  const volver = destinoSeguro(searchParams.get("volver"));

  const layout =
    view === "login-ok"
      ? { eyebrow: "Sesión iniciada", quote: "Cada cosecha es una historia. Sumate a vivirla junto a quienes la cultivan." }
      : {
          eyebrow: "Bienvenido de nuevo",
          quote: "Cada cosecha es una historia. Sumate a vivirla junto a quienes la cultivan.",
          quoteAuthor: "— Mendoza AgroTours",
        };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <AuthHeader onHome={() => router.push("/")} />
      <AuthLayout eyebrow={layout.eyebrow} quote={layout.quote} quoteAuthor={layout.quoteAuthor}>
        {view === "login" && (
          <LoginForm
            notice={notice}
            volver={volver}
            onSuccess={(c) => {
              // Si se vino a mitad de algo (p. ej. una reserva con el día y los
              // visitantes en la URL), se retoma sin hacer esperar la bienvenida.
              // Navegación dura, como `LoginSuccess`: la navbar arranca logueada.
              if (volver) {
                setView("volviendo");
                window.location.replace(volver);
                return;
              }
              setCuenta(c);
              setView("login-ok");
            }}
          />
        )}
        {view === "login-ok" && cuenta && <LoginSuccess cuenta={cuenta} volver={volver} />}
        {view === "volviendo" && (
          <div className="py-16 text-center text-fg-3" role="status">
            <Loader className="mx-auto size-[26px] animate-spin" aria-hidden />
            <div className="mt-3 text-sm">Iniciando sesión…</div>
          </div>
        )}
      </AuthLayout>
    </div>
  );
}

export default function AccesoPage() {
  return (
    <Suspense>
      <AccesoInner />
    </Suspense>
  );
}
