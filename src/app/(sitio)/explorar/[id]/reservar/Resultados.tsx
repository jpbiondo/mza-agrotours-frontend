"use client";

import { useEffect } from "react";
import { X, XCircle } from "lucide-react";

export function CancelToast({ open, onClose, message }: { open: boolean; onClose: () => void; message: string }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 4200);
    return () => clearTimeout(t);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div style={{ position: "fixed", right: 24, bottom: 24, zIndex: 120 }} className="pop">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "var(--fg-1)", color: "var(--fg-on-dark)", borderRadius: 12, boxShadow: "var(--shadow-pop)", maxWidth: 360 }}>
        <XCircle size={18} color="#fff" />
        <span style={{ fontSize: 14, fontWeight: 500 }}>{message}</span>
        <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,.7)", display: "flex", marginLeft: 4 }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
