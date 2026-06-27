"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthHeader, AuthLayout } from "./components/AuthShell";
import LoginForm from "./components/LoginForm";
import LoginSuccess from "./components/LoginSuccess";
import type { Cuenta } from "@/types/auth";

type View = "login" | "login-ok";

export default function AccesoPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("login");
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, [view]);

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
            onSuccess={(c) => { setCuenta(c); setView("login-ok"); }}
            // TODO: flujo de recuperación de contraseña (US: Recuperar contraseña)
            onRecover={() => {}}
          />
        )}
        {view === "login-ok" && cuenta && <LoginSuccess cuenta={cuenta} />}
      </AuthLayout>
    </div>
  );
}