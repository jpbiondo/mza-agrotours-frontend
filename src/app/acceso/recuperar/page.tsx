"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthHeader, AuthLayout } from "../components/AuthShell";
import RecoverEmailForm from "./components/RecoverEmailForm";
import RecoverSentView from "./components/RecoverSentView";
import RecoverResetForm from "./components/RecoverResetForm";
import RecoverDoneView from "./components/RecoverDoneView";

type View = "email" | "sent" | "reset" | "done";

const LAYOUT: Record<View, { eyebrow: string; quote: string }> = {
  email: { eyebrow: "Recuperá tu acceso", quote: "Tu lugar en la finca te espera. Recuperá el acceso en un par de pasos." },
  sent: { eyebrow: "Revisá tu correo", quote: "Tu lugar en la finca te espera. Recuperá el acceso en un par de pasos." },
  reset: { eyebrow: "Nueva contraseña", quote: "Una contraseña robusta protege tu cuenta y tus reservas." },
  done: { eyebrow: "¡Listo!", quote: "Una contraseña robusta protege tu cuenta y tus reservas." },
};

export default function RecuperarPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("email");
  const [email, setEmail] = useState("");

  useEffect(() => { window.scrollTo(0, 0); }, [view]);

  const goLogin = () => router.push("/acceso");

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
            onOpenLink={() => setView("reset")}
            onBackLogin={goLogin}
            onResend={() => setView("email")}
          />
        )}
        {view === "reset" && <RecoverResetForm onSuccess={() => setView("done")} />}
        {view === "done" && <RecoverDoneView onBackLogin={goLogin} />}
      </AuthLayout>
    </div>
  );
}
