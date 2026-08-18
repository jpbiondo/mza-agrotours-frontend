"use client";

import Link from "next/link";
import { UserCog, ShieldCheck, Warehouse, Ban, AlertTriangle, ArrowRight } from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import { useAdminResumen } from "@/hooks/useAdminResumen";

function Stat({ icon, value, label, danger }: { icon: React.ReactNode; value: number; label: string; danger?: boolean }) {
  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 22px" }}>
      <span style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: danger ? "var(--danger-fill)" : "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
      <span>
        <span style={{ display: "block", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 28, color: "var(--fg-1)", lineHeight: 1 }}>{value}</span>
        <span style={{ display: "block", fontSize: 14.5, color: "var(--fg-2)", marginTop: 5 }}>{label}</span>
      </span>
    </div>
  );
}

function AccessCard({ icon, title, desc, href, cta }: { icon: React.ReactNode; title: string; desc: string; href: string; cta: string }) {
  return (
    <Link href={href} className="card card-hover" style={{ display: "flex", flexDirection: "column", padding: 26, textDecoration: "none", height: "100%" }}>
      <span style={{ width: 52, height: 52, borderRadius: 13, background: "var(--green-050)", border: "1px solid var(--green-300)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>{icon}</span>
      <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 21, color: "var(--fg-1)" }}>{title}</h3>
      <p style={{ margin: "8px 0 18px", color: "var(--fg-2)", fontSize: 15.5, lineHeight: 1.55, flex: 1 }}>{desc}</p>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--green-800)", fontWeight: 600, fontSize: 15 }}>{cta} <ArrowRight size={17} color="var(--green-800)" /></span>
    </Link>
  );
}

export default function AdminPanelClient() {
  const { data, isLoading, error, reload } = useAdminResumen();

  return (
    <>
      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando el resumen…">
        {data && (
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 28px 80px" }}>
          <div style={{ marginBottom: 28 }}>
            <div className="t-label" style={{ color: "var(--brown-700)", marginBottom: 10 }}>Panel del sistema</div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 38, color: "var(--fg-1)", letterSpacing: "-.01em" }}>Hola, Diego</h1>
            <p style={{ margin: "10px 0 0", color: "var(--fg-2)", fontSize: 17, lineHeight: 1.5, maxWidth: 680 }}>Este es el estado general de la plataforma. Desde acá gestionás el equipo de administración, sus permisos y los establecimientos.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 16 }}>
            <Stat icon={<UserCog size={22} color="var(--green-800)" />} value={data.adminCount} label="Administradores activos" />
            <Stat icon={<ShieldCheck size={22} color="var(--green-800)" />} value={data.rolesActivos} label="Roles de administrador" />
            <Stat icon={<Warehouse size={22} color="var(--green-800)" />} value={data.estActivos} label="Establecimientos activos" />
            <Stat icon={<Ban size={22} color={data.estSusp > 0 ? "var(--danger)" : "var(--green-800)"} />} value={data.estSusp} label="Establecimientos suspendidos" danger={data.estSusp > 0} />
          </div>

          {data.estSusp > 0 && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "var(--danger-fill)", border: "1px solid var(--danger)", borderRadius: "var(--radius)", padding: "16px 18px", marginBottom: 32 }}>
              <AlertTriangle size={20} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15.5, color: "var(--fg-1)" }}>{data.estSusp === 1 ? "Hay 1 establecimiento suspendido" : `Hay ${data.estSusp} establecimientos suspendidos`}</div>
                <div style={{ fontSize: 14, color: "var(--fg-2)", marginTop: 3 }}>{data.suspendidos.map((e) => e.nombre).join(" · ")}</div>
              </div>
              <Link href="/admin/establecimientos" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--danger-fg)", fontWeight: 600, fontSize: 14.5, whiteSpace: "nowrap", textDecoration: "none" }}>Revisar <ArrowRight size={16} color="var(--danger-fg)" /></Link>
            </div>
          )}

          <h2 style={{ margin: data.estSusp > 0 ? "0 0 16px" : "32px 0 16px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "var(--fg-1)" }}>Gestiones del sistema</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <AccessCard icon={<UserCog size={25} color="var(--green-800)" />} title="Administradores" desc={`${data.adminCount} activos. Sumá personas al equipo, cambiá su rol o dalas de baja.`} href="/admin/administradores" cta="Gestionar administradores" />
            <AccessCard icon={<ShieldCheck size={25} color="var(--green-800)" />} title="Roles de administrador" desc={`${data.rolesActivos} roles activos. Definí qué puede hacer cada administrador dentro del sistema.`} href="/admin/roles" cta="Gestionar roles" />
            <AccessCard icon={<Warehouse size={25} color="var(--green-800)" />} title="Establecimientos" desc={`${data.estActivos} activos. Supervisá la plataforma y suspendé los que incumplan las normas.`} href="/admin/establecimientos" cta="Ver establecimientos" />
          </div>
        </div>
        )}
      </AsyncBoundary>

      <style>{`
        .card-hover { transition: box-shadow .16s, border-color .16s, transform .16s; }
        .card-hover:hover { box-shadow: var(--shadow-hover); border-color: var(--sand); transform: translateY(-2px); }
      `}</style>
    </>
  );
}
