"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthHeader, AuthLayout } from "./components/AuthShell";
import LoginForm from "./components/LoginForm";
import LoginSuccess from "./components/LoginSuccess";
import type { Cuenta } from "@/types/auth";

type View = "login" | "login-ok";

/** Avisos que llegan por `?motivo=…` (p. ej. tras cambiar el email en Mi cuenta). */
const NOTICES: Record<string, string> = {
  "email-actualizado":
    "Actualizamos tu correo. Iniciá sesión de nuevo con tu nuevo email.",
};

function AccesoInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<View>("login");
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const notice = NOTICES[searchParams.get("motivo") ?? ""];

  const layout =
    view === "login-ok"
      ? { eyebrow: "Sesión iniciada", quote: "Cada cosecha es una historia. Sumate a vivirla junto a quienes la cultivan." }
      : {
          eyebrow: "Bienvenido de nuevo",
          quote: "Cada cosecha es una historia. Sumate a vivirla junto a quienes la cultivan.",
          quoteAuthor: "— Productores de Mendoza AgroTours",
        };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <AuthHeader onHome={() => router.push("/")} />
      <AuthLayout eyebrow={layout.eyebrow} quote={layout.quote} quoteAuthor={layout.quoteAuthor}>
        {view === "login" && (
          <LoginForm
            notice={notice}
            onSuccess={(c) => { setCuenta(c); setView("login-ok"); }}
            onRecover={() => router.push("/acceso/recuperar")}
          />
        )}
        {view === "login-ok" && cuenta && <LoginSuccess cuenta={cuenta} />}
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
