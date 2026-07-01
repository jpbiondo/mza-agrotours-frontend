"use client";

import { Loader, AlertTriangle, RotateCcw } from "lucide-react";

interface AsyncBoundaryProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  loadingLabel?: string;
  /** Vertical padding of the loading/error state (bigger for full pages). */
  pad?: number;
  children: React.ReactNode;
}

/**
 * Estado compartido de carga / error para las lecturas asíncronas.
 * Muestra spinner mientras carga, un panel con "Reintentar" ante un error,
 * o el contenido cuando hay datos.
 */
export default function AsyncBoundary({ loading, error, onRetry, loadingLabel = "Cargando…", pad = 120, children }: AsyncBoundaryProps) {
  if (loading) {
    return (
      <div style={{ padding: `${pad}px 28px`, textAlign: "center", color: "var(--fg-3)" }}>
        <Loader size={26} className="spin" />
        <div style={{ marginTop: 12, fontSize: 14 }}>{loadingLabel}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: `${pad}px 28px`, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <span style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--danger-fill)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <AlertTriangle size={26} color="var(--danger-fg)" />
        </span>
        <h2 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, color: "var(--fg-1)" }}>No pudimos cargar la información</h2>
        <p style={{ margin: "0 auto 18px", maxWidth: 380, color: "var(--fg-2)", fontSize: 14.5, lineHeight: 1.5 }}>Ocurrió un problema al obtener los datos. Revisá tu conexión y volvé a intentarlo.</p>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)", marginBottom: 18 }}>{error}</div>
        {onRetry && (
          <button type="button" className="btn btn-primary" onClick={onRetry}><RotateCcw size={16} /> Reintentar</button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
