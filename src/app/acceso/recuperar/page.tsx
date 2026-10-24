"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthHeader, AuthLayout } from "../components/AuthShell";
import RecoverEmailForm from "./components/RecoverEmailForm";
import RecoverSentView from "./components/RecoverSentView";
import RecoverResetForm from "./components/RecoverResetForm";
import RecoverDoneView from "./components/RecoverDoneView";
import { verificarResetCode } from "@/lib/passwordReset";
import { Button, ResultScreen } from "@/components/ui";
import { Cargando } from "@/components/AsyncView";

type View = "email" | "sent" | "verifying" | "reset" | "invalid" | "done";

const LAYOUT: Record<View, { eyebrow: string; quote: string }> = {
  email: { eyebrow: "Recuperá tu acceso", quote: "Tu lugar en la finca te espera. Recuperá el acceso en un par de pasos." },
  sent: { eyebrow: "Revisá tu correo", quote: "Tu lugar en la finca te espera. Recuperá el acceso en un par de pasos." },
  verifying: { eyebrow: "Verificando el enlace", quote: "Una contraseña robusta protege tu cuenta y tus reservas." },
  reset: { eyebrow: "Nueva contraseña", quote: "Una contraseña robusta protege tu cuenta y tus reservas." },
  invalid: { eyebrow: "Enlace no válido", quote: "Una contraseña robusta protege tu cuenta y tus reservas." },
  done: { eyebrow: "¡Listo!", quote: "Una contraseña robusta protege tu cuenta y tus reservas." },
};

function RecuperarInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const [view, setView] = useState<View>(oobCode ? "verifying" : "email");
  const [email, setEmail] = useState("");

  useEffect(() => { window.scrollTo(0, 0); }, [view]);

  // Llegada desde el correo con ?oobCode → verificar el código y mostrar el reset.
  useEffect(() => {
    if (!oobCode) return;
    let active = true;
    verificarResetCode(oobCode).then((r) => {
      if (!active) return;
      if (r.ok) { setEmail(r.email ?? ""); setView("reset"); }
      else setView("invalid");
    });
    return () => { active = false; };
  }, [oobCode]);

  const goLogin = () => router.push("/acceso");
  const pedirNuevo = () => { router.replace("/acceso/recuperar"); setView("email"); };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      <AuthHeader onHome={() => router.push("/")} />
      <AuthLayout eyebrow={LAYOUT[view].eyebrow} quote={LAYOUT[view].quote}>
        {view === "email" && (
          <RecoverEmailForm
            onSent={(mail) => { setEmail(mail); setView("sent"); }}
            onBack={goLogin}
          />
        )}
        {view === "sent" && (
          <RecoverSentView
            email={email}
            onBackLogin={goLogin}
            onResend={() => setView("email")}
          />
        )}
        {view === "verifying" && <Cargando label="Verificando el enlace…" pad="sm" />}
        {view === "reset" && oobCode && (
          <RecoverResetForm oobCode={oobCode} onSuccess={() => setView("done")} />
        )}
        {view === "invalid" && (
          <ResultScreen
            tone="danger"
            title="El enlace no es válido"
            action={
              <Button size="lg" onClick={pedirNuevo}>
                Solicitar un nuevo enlace
              </Button>
            }
          >
            El enlace de recuperación expiró o ya fue usado. Solicitá uno nuevo para continuar.
          </ResultScreen>
        )}
        {view === "done" && <RecoverDoneView onBackLogin={goLogin} />}
      </AuthLayout>
    </div>
  );
}

export default function RecuperarPage() {
  return (
    <Suspense>
      <RecuperarInner />
    </Suspense>
  );
}
