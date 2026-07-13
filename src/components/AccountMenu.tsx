"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import {
  ChevronDown,
  UserRound,
  LifeBuoy,
  ShieldCheck,
  LogOut,
  Sprout,
  LayoutDashboard,
} from "lucide-react";
import { auth } from "../../firebase.config";
import { useAuthStore } from "@/stores/authStore";

const avatarStyle: React.CSSProperties = {
  flexShrink: 0,
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: "var(--brown-700)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 600,
  fontSize: 13.5,
  boxShadow: "inset 0 -2px 0 var(--brown-800)",
};
const itemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 11,
  padding: "9px 10px",
  borderRadius: 10,
  textDecoration: "none",
  color: "var(--fg-1)",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const nombre = useAuthStore((s) => s.nombre);
  const email = useAuthStore((s) => s.email);
  const roles = useAuthStore((s) => s.roles);

  // Hasta rehidratar, mostramos un estado neutro que coincide con el render del servidor.
  const ready = hasHydrated && !!nombre;
  const displayName = ready ? nombre! : "Mi cuenta";
  const displayEmail = ready ? (email ?? "") : "";
  const initials = ready ? initialsOf(nombre!) : "··";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    try {
      await signOut(auth);
    } finally {
      useAuthStore.getState().clear();
      window.location.href = "/acceso";
    }
  }

  const item = (
    Icon: typeof UserRound,
    label: string,
    href: string,
    danger?: boolean,
  ) => (
    <Link
      href={href}
      role="menuitem"
      onClick={() => setOpen(false)}
      style={{
        ...itemStyle,
        color: danger ? "var(--danger-fg)" : "var(--fg-1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? "var(--danger-fill)"
          : "var(--cream-tert)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon size={17} color={danger ? "var(--danger-fg)" : "var(--fg-2)"} />
      <span style={{ flex: 1 }}>{label}</span>
    </Link>
  );

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Tu cuenta"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "3px 6px 3px 3px",
          border:
            "1px solid " + (open ? "var(--outline-variant)" : "transparent"),
          borderRadius: 999,
          background: open ? "var(--surface)" : "transparent",
          cursor: "pointer",
        }}
      >
        <span style={avatarStyle}>{initials}</span>
        <ChevronDown
          size={15}
          color="var(--fg-3)"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .16s ease-out",
          }}
        />
      </button>

      {open && (
        <div
          className="pop"
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: 264,
            background: "var(--surface)",
            border: "1px solid var(--outline-variant)",
            borderRadius: 14,
            boxShadow: "var(--shadow-pop)",
            overflow: "hidden",
            zIndex: 60,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "14px 14px",
              borderBottom: "1px solid var(--outline-variant)",
              background: "var(--cream-tert)",
            }}
          >
            <span
              style={{ ...avatarStyle, width: 40, height: 40, fontSize: 15 }}
            >
              {initials}
            </span>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14.5,
                  color: "var(--fg-1)",
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--fg-3)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {displayEmail}
              </div>
            </div>
          </div>
          <div style={{ padding: 6 }}>
            {item(UserRound, "Mi cuenta", "/cuenta")}
            {ready &&
              roles.includes("productor") &&
              item(Sprout, "Panel de productor", "/panel")}
            {ready &&
              roles.includes("admin") &&
              item(LayoutDashboard, "Panel de administrador", "/admin")}
            {item(LifeBuoy, "Ayuda", "/#faq")}
            {item(ShieldCheck, "Acceso y seguridad", "/cuenta?tab=seguridad")}
            <div
              style={{
                height: 1,
                background: "var(--outline-variant)",
                margin: "6px 4px",
              }}
            />
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              style={{
                ...itemStyle,
                width: "100%",
                border: "none",
                background: "transparent",
                color: "var(--danger-fg)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--danger-fill)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <LogOut size={17} color="var(--danger-fg)" />
              <span style={{ flex: 1, textAlign: "left" }}>Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
