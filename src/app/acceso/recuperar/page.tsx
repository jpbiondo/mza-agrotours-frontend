"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader, AlertTriangle } from "lucide-react";
import { AuthHeader, AuthLayout } from "../components/AuthShell";
import RecoverEmailForm from "./components/RecoverEmailForm";
import RecoverSentView from "./components/RecoverSentView";
import RecoverResetForm from "./components/RecoverResetForm";
import RecoverDoneView from "./components/RecoverDoneView";
import { verificarResetCode } from "@/lib/passwordReset";

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
        {view === "verifying" && (
          <div style={{ textAlign: "center", padding: "60px 8px", color: "var(--fg-3)" }}>
            <Loader size={28} className="spin" />
            <div style={{ marginTop: 12, fontSize: 14 }}>Verificando el enlace…</div>
          </div>
        )}
        {view === "reset" && oobCode && (
          <RecoverResetForm oobCode={oobCode} onSuccess={() => setView("done")} />
        )}
        {view === "invalid" && (
          <div data-screen-label="Recuperar contraseña · enlace inválido" style={{ textAlign: "center", paddingTop: 8 }}>
            <div
              className="pop"
              style={{
                width: 80, height: 80, borderRadius: "50%", background: "var(--danger-fill)",
                display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px",
              }}
            >
              <AlertTriangle size={38} color="var(--danger-fg)" />
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 27, color: "var(--fg-1)", margin: 0 }}>
              El enlace no es válido
            </h1>
            <p style={{ fontSize: 15, color: "var(--fg-2)", lineHeight: 1.55, margin: "12px 0 26px" }}>
              El enlace de recuperación expiró o ya fue usado. Solicitá uno nuevo para continuar.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={pedirNuevo}
            >
              Solicitar un nuevo enlace
            </button>
          </div>
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
