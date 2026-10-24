"use client";

import { useEffect } from "react";
import { ShieldCheck, LogIn } from "lucide-react";
import { Button, ResultScreen } from "@/components/ui";

const REDIRECT_MS = 3000;

export default function RecoverDoneView({ onBackLogin }: { onBackLogin: () => void }) {
  useEffect(() => {
    const t = setTimeout(onBackLogin, REDIRECT_MS);
    return () => clearTimeout(t);
  }, [onBackLogin]);

  return (
    <ResultScreen
      icon={<ShieldCheck />}
      title="Contraseña actualizada correctamente"
      action={
        <Button size="lg" onClick={onBackLogin}>
          <LogIn size={18} /> Ir a iniciar sesión
        </Button>
      }
    >
      Ya podés iniciar sesión con tu nueva contraseña.
    </ResultScreen>
  );
}
