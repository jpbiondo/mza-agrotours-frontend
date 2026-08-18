"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { FAQ_DESTACADAS } from "@/data/faq";

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 16, padding: "18px 20px", background: "transparent", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ fontSize: 15.5, fontWeight: 600, color: "var(--fg-1)" }}>{q}</span>
        <ChevronDown
          size={20}
          color="var(--fg-3)"
          style={{ flexShrink: 0, transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      {open && (
        <div className="pop" style={{ padding: "0 20px 20px", fontSize: 14.5, color: "var(--fg-2)", lineHeight: 1.6 }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function FaqSection() {
  return (
    <section id="faq" style={{ maxWidth: 820, margin: "0 auto", padding: "80px 28px" }}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div
          style={{
            width: 48, height: 48, borderRadius: 12, background: "var(--green-050)",
            display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
          }}
        >
          <HelpCircle size={24} color="var(--green-800)" />
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", margin: 0, letterSpacing: "-.01em" }}>
          Preguntas frecuentes
        </h2>
        <p style={{ fontSize: 16, color: "var(--fg-2)", margin: "10px 0 0" }}>
          Todo lo que necesitás saber antes de tu primera experiencia.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {FAQ_DESTACADAS.map((f) => (
          <FaqRow key={f.id} q={f.q} a={f.a} />
        ))}
      </div>
    </section>
  );
}
