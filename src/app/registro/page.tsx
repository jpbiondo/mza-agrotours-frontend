"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import PublicHeader from "./components/PublicHeader";
import Landing from "./components/Landing";
import RegisterView from "./components/RegisterView";
import SuccessView from "./components/SuccessView";
import type { FormData } from "@/types/registro";

type View = "landing" | "registro" | "exito";

function RegistroPageInner() {
  const searchParams = useSearchParams();
  const initialView = (() => {
    const v = searchParams.get("vista");
    if (v === "registro" || v === "exito") return v as View;
    return "landing" as View;
  })();

  const [view, setView] = useState<View>(initialView);
  const [account, setAccount] = useState<FormData | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, [view]);

  const goRegister = () => setView("registro");
  const onSuccess = (data: FormData) => { setAccount(data); setView("exito"); };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream-bg)" }}>
      {/* Success view shows a logged-in header */}
      {view === "exito" ? (
        <header
          style={{
            position: "sticky", top: 0, zIndex: 30,
            background: "rgba(251,249,248,.92)", backdropFilter: "blur(8px)",
            borderBottom: "1px solid var(--outline-variant)",
          }}
        >
          <div
            style={{
              maxWidth: 1160, margin: "0 auto", padding: "0 28px",
              height: 68, display: "flex", alignItems: "center", gap: 11,
            }}
          >
            <Image src="/logo-mark.svg" width={32} height={32} alt="" />
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, color: "var(--green-800)" }}>Mendoza</div>
              <div style={{ fontSize: 9, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 600, color: "var(--brown-700)", marginTop: 2 }}>AgroTours</div>
            </div>
            {account && (
              <span style={{ marginLeft: "auto", fontSize: 13.5, color: "var(--fg-2)" }}>
                Sesión iniciada como <strong style={{ color: "var(--fg-1)" }}>{account.nombre}</strong>
              </span>
            )}
          </div>
        </header>
      ) : (
        <PublicHeader onRegister={goRegister} onHome={() => setView("landing")} />
      )}

      {view === "landing" && <Landing onRegister={goRegister} />}
      {view === "registro" && (
        <RegisterView onSuccess={onSuccess} onBack={() => setView("landing")} />
      )}
      {view === "exito" && account && <SuccessView data={account} />}
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroPageInner />
    </Suspense>
  );
}
