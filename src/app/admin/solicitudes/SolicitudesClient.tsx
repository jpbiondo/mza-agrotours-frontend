"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight, Clock, CheckCircle2, XCircle, Search, Inbox, User, MapPin,
  ArrowLeft, Hash, Building2, Mail, Phone, Map, Paperclip, Info, ShieldCheck,
  MessageSquare, AlertCircle, Loader, ClipboardCheck, Eye, FileText,
  Image as ImageIcon, ExternalLink, Landmark, BadgeCheck,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import AdminShell from "@/components/admin/AdminShell";
import { SOL_ESTADO_META } from "@/data/solicitudes";
import { admInitials } from "@/data/admin";
import { fmtFecha, fmtFechaHora } from "@/lib/format";
import { puede } from "@/lib/roles";
import { storageConfigurado, urlDeArchivo } from "@/lib/storage";
import { useAuthStore } from "@/stores/authStore";
import {
  BASE_ADMIN_SOLICITUDES, useSolicitudDetalle,
} from "@/hooks/useSolicitudDetalle";
import { useResolverSolicitud, useSolicitudes, type Resolucion } from "@/hooks/useSolicitudes";
import type {
  EstadoSolicitud, PruebaSolicitud, SolicitudAdminItem, SolicitudDetalle,
} from "@/types/solicitudes";

const OBS_MAX = 1000;
const SIN_GESTION = "Necesitás el permiso de gestión de solicitudes de establecimiento";

const TONE: Record<string, { bg: string; fg: string }> = {
  warning: { bg: "var(--warning-fill)", fg: "var(--warning-fg)" },
  success: { bg: "var(--success-fill)", fg: "var(--success-fg)" },
  danger: { bg: "var(--danger-fill)", fg: "var(--danger-fg)" },
};

function metaDe(estado: EstadoSolicitud) {
  return SOL_ESTADO_META[estado] as
    | (typeof SOL_ESTADO_META)[keyof typeof SOL_ESTADO_META]
    | undefined;
}

function EstadoPill({ estado, big }: { estado: EstadoSolicitud; big?: boolean }) {
  const m = metaDe(estado);
  const t = TONE[m?.tone ?? ""] ?? { bg: "var(--cream-tert)", fg: "var(--fg-2)" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "var(--radius-pill)", padding: big ? "6px 13px" : "4px 11px", fontSize: big ? 13.5 : 12.5, fontWeight: 700, background: t.bg, color: t.fg, whiteSpace: "nowrap" }}>
      {m?.label ?? "Sin estado"}
    </span>
  );
}

/** Iniciales del establecimiento para el tile del listado y la cabecera. */
function estabInitials(nombre: string): string {
  return admInitials(nombre || "?");
}

/* =========================== LISTADO =========================== */

type Filtro = "todas" | EstadoSolicitud;

function List({
  solicitudes,
  onOpen,
}: {
  solicitudes: SolicitudAdminItem[];
  onOpen: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filtro>("pendiente");

  const counts = useMemo(
    () => ({
      pendiente: solicitudes.filter((s) => s.estado === "pendiente").length,
      validada: solicitudes.filter((s) => s.estado === "validada").length,
      rechazada: solicitudes.filter((s) => s.estado === "rechazada").length,
    }),
    [solicitudes],
  );

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return solicitudes.filter((s) => {
      if (filter !== "todas" && s.estado !== filter) return false;
      if (
        q &&
        !(
          s.nombreEstablecimiento.toLowerCase().includes(q) ||
          s.nombreSolicitante.toLowerCase().includes(q) ||
          s.departamento.toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [solicitudes, query, filter]);

  const stats = [
    { icon: <Clock size={20} color="var(--warning-fg)" />, label: "Pendientes", value: counts.pendiente, warn: counts.pendiente > 0 },
    { icon: <CheckCircle2 size={20} color="var(--green-800)" />, label: "Validadas", value: counts.validada },
    { icon: <XCircle size={20} color="var(--green-800)" />, label: "Rechazadas", value: counts.rechazada },
  ];

  const filterBtn = (val: Filtro, label: string, n?: number) => {
    const on = filter === val;
    return (
      <button key={val} type="button" onClick={() => setFilter(val)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: "var(--radius-pill)", fontSize: 13.5, fontWeight: 600, border: "1px solid " + (on ? "var(--green-800)" : "var(--outline-variant)"), background: on ? "var(--green-800)" : "var(--surface)", color: on ? "#fff" : "var(--fg-2)", cursor: "pointer", whiteSpace: "nowrap" }}>
        {label}
        {n != null && <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, padding: "1px 7px", borderRadius: 999, background: on ? "rgba(255,255,255,.22)" : "var(--cream-tert)", color: on ? "#fff" : "var(--fg-2)" }}>{n}</span>}
      </button>
    );
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 28px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13.5, marginBottom: 14 }}>
        <span>Plataforma</span><ChevronRight size={15} /><span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Solicitudes de establecimientos</span>
      </div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", letterSpacing: "-.01em" }}>Solicitudes de establecimientos</h1>
        <p style={{ margin: "10px 0 0", color: "var(--fg-2)", fontSize: 15.5, lineHeight: 1.5, maxWidth: 720 }}>
          Revisá las postulaciones de nuevos establecimientos y validá su veracidad. Aprobá las que cumplan los requisitos o rechazalas dejando una observación.
        </p>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: "12px 16px", minWidth: 180 }}>
            <span style={{ width: 42, height: 42, borderRadius: 10, background: s.warn ? "var(--warning-fill)" : "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</span>
            <span>
              <span style={{ display: "block", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>{s.value}</span>
              <span style={{ display: "block", fontSize: 12.5, color: "var(--fg-2)" }}>{s.label}</span>
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex" }}><Search size={17} color="var(--fg-3)" /></span>
          <input className="input" style={{ paddingLeft: 42 }} placeholder="Buscar por establecimiento, solicitante o departamento" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {filterBtn("pendiente", "Pendientes", counts.pendiente)}
          {filterBtn("validada", "Validadas", counts.validada)}
          {filterBtn("rechazada", "Rechazadas", counts.rechazada)}
          {filterBtn("todas", "Todas")}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {visibles.length === 0 ? (
          <div style={{ padding: "56px 24px", textAlign: "center", color: "var(--fg-3)" }}>
            <Inbox size={32} color="var(--fg-3)" />
            <div style={{ marginTop: 12, fontSize: 15 }}>
              {solicitudes.length === 0
                ? "Todavía no hay solicitudes de establecimientos."
                : "No hay solicitudes que coincidan con la búsqueda."}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 880 }}>
              <thead>
                <tr>{["Establecimiento", "Departamento", "Solicitado", "Estado", ""].map((h, i) => (
                  <th key={i} style={{ textAlign: i === 4 ? "right" : "left", fontWeight: 700, color: "var(--fg-2)", fontSize: 12.5, textTransform: "uppercase", letterSpacing: ".05em", padding: "14px 18px", borderBottom: "2px solid var(--outline-variant)", whiteSpace: "nowrap" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {visibles.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--cream-tert)" }}>
                    <td style={{ padding: "15px 18px", maxWidth: 360 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                        <span style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 10, background: "var(--green-050)", color: "var(--green-800)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, border: "1px solid var(--green-300)" }}>{estabInitials(s.nombreEstablecimiento)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)", lineHeight: 1.25 }}>{s.nombreEstablecimiento || "Sin nombre"}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, fontSize: 12.5, color: "var(--fg-2)" }}>
                            <User size={13} color="var(--fg-3)" />{s.nombreSolicitante || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "15px 18px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "var(--fg-1)" }}><MapPin size={14} color="var(--brown-700)" />{s.departamento || "—"}</span>
                    </td>
                    <td style={{ padding: "15px 18px" }}><span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{fmtFechaHora(s.fechaHoraAlta)}</span></td>
                    <td style={{ padding: "15px 18px" }}><EstadoPill estado={s.estado} /></td>
                    <td style={{ padding: "15px 18px", textAlign: "right" }}>
                      <button type="button" onClick={() => onOpen(s.id)} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontWeight: 600, fontSize: 13.5, padding: "8px 14px", borderRadius: "var(--radius)", cursor: "pointer", whiteSpace: "nowrap", border: "1px solid " + (s.estado === "pendiente" ? "var(--green-800)" : "var(--sand)"), background: s.estado === "pendiente" ? "var(--green-800)" : "var(--surface)", color: s.estado === "pendiente" ? "#fff" : "var(--green-800)", boxShadow: s.estado === "pendiente" ? "inset 0 -2px 0 var(--green-900)" : "none" }}>
                        {s.estado === "pendiente" ? <ClipboardCheck size={16} /> : <Eye size={16} />}
                        {s.estado === "pendiente" ? "Revisar" : "Ver"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================== DETALLE =========================== */

function SectionBox({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 11, padding: "16px 22px", borderBottom: "1px solid var(--cream-tert)" }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
        <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, color: "var(--fg-1)" }}>{title}</h2>
      </header>
      <div style={{ padding: "8px 22px 22px" }}>{children}</div>
    </section>
  );
}

function CritRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ padding: "16px 0", borderBottom: "1px dashed var(--cream-tert)" }}>
      <div className="t-label" style={{ marginBottom: 5, display: "flex", alignItems: "center", gap: 7 }}>{icon}{label}</div>
      <div style={{ fontSize: 15, color: "var(--fg-1)", fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", fontWeight: 500, wordBreak: "break-word" }}>{value || "—"}</div>
    </div>
  );
}

function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="t-label" style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}>{icon}{label}</div>
      <div style={{ fontSize: 14.5, color: "var(--fg-1)", lineHeight: 1.55, wordBreak: "break-word" }}>{value || "—"}</div>
    </div>
  );
}

function PruebaCard({ p }: { p: PruebaSolicitud }) {
  const esPdf = p.extension === "pdf";
  const href = urlDeArchivo(p.key);
  const cuerpo = (
    <>
      <div style={{ height: 108, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", background: esPdf ? "var(--green-050)" : "repeating-linear-gradient(135deg, var(--cream-tert) 0 10px, var(--surface) 10px 20px)" }}>
        {esPdf ? <FileText size={30} color="var(--green-800)" /> : <ImageIcon size={30} color="var(--brown-700)" />}
        {p.extension && <span style={{ position: "absolute", top: 8, right: 8, fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--fg-2)", background: "rgba(251,249,248,.92)", padding: "2px 7px", borderRadius: 999, border: "1px solid var(--outline-variant)" }}>{p.extension}</span>}
      </div>
      <div style={{ padding: "10px 12px", borderTop: "1px solid var(--cream-tert)" }}>
        <div style={{ fontSize: 12.8, fontWeight: 600, color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre || "Archivo sin nombre"}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginTop: 3 }}>
          {href
            ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color: "var(--green-800)" }}><ExternalLink size={12} color="var(--green-800)" />Ver</span>
            : <span style={{ fontSize: 11.5, color: "var(--fg-3)" }}>No disponible</span>}
        </div>
      </div>
    </>
  );

  const base: React.CSSProperties = { display: "flex", flexDirection: "column", textDecoration: "none", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", overflow: "hidden", background: "var(--surface)" };
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" style={base}>{cuerpo}</a>
    : <div style={base}>{cuerpo}</div>;
}

function Detail({
  sol,
  gestionar,
  busy,
  error,
  onBack,
  onResolver,
}: {
  sol: SolicitudDetalle;
  gestionar: boolean;
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onResolver: (estado: Resolucion, obs: string) => void;
}) {
  const [obs, setObs] = useState("");
  const readOnly = sol.estado !== "pendiente";
  const obsErr = obs.length > OBS_MAX;
  const bloqueado = busy || obsErr || !gestionar;

  // Historial: el backend lo devuelve en `estados`; el más reciente lleva la
  // observación con la que se resolvió.
  const ultimo = sol.estados[0];

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 28px 96px" }}>
      <button type="button" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "transparent", border: "none", cursor: "pointer", color: "var(--green-800)", fontSize: 13.5, fontWeight: 600, marginBottom: 14, padding: 0 }}>
        <ArrowLeft size={16} color="var(--green-800)" /> Volver a solicitudes
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0, marginBottom: 24 }}>
        <span style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 12, background: "var(--green-050)", color: "var(--green-800)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, border: "1px solid var(--green-300)" }}>{estabInitials(sol.nombreEstablecimiento)}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "var(--fg-1)", letterSpacing: "-.01em", lineHeight: 1.2 }}>{sol.nombreEstablecimiento || "Solicitud de establecimiento"}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 11, fontSize: 13.5, color: "var(--fg-2)" }}>
            <EstadoPill estado={sol.estado} big />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Hash size={14} color="var(--fg-3)" /><span style={{ fontFamily: "var(--font-mono)" }}>{sol.id}</span></span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Clock size={14} color="var(--fg-3)" />Solicitado el {fmtFechaHora(sol.fechaHoraAlta)}</span>
          </div>
        </div>
      </div>

      <div className="sol-detail-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <SectionBox icon={<ShieldCheck size={16} color="var(--green-800)" />} title="Campos críticos">
            <CritRow icon={<Hash size={13} color="var(--fg-3)" />} label="CUIT" value={sol.cuit} mono />
            <CritRow icon={<Building2 size={13} color="var(--fg-3)" />} label="Razón social" value={sol.razonSocial} />
            <CritRow icon={<Mail size={13} color="var(--fg-3)" />} label="Email" value={sol.email} />
          </SectionBox>

          <SectionBox icon={<Info size={16} color="var(--green-800)" />} title="Datos del establecimiento">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, paddingTop: 8 }}>
              <DetailField icon={<Phone size={13} color="var(--fg-3)" />} label="Teléfono de la organización" value={sol.telefono} />
              <DetailField icon={<MapPin size={13} color="var(--fg-3)" />} label="Domicilio legal" value={sol.domicilioLegal} />
              <DetailField icon={<Map size={13} color="var(--fg-3)" />} label="Departamento" value={sol.departamento} />
              <DetailField icon={<Landmark size={13} color="var(--fg-3)" />} label="CVU" value={sol.cvu} />
            </div>
          </SectionBox>

          <SectionBox icon={<Paperclip size={16} color="var(--green-800)" />} title={`Prueba de existencia y titularidad (${sol.pruebas.length})`}>
            <p style={{ margin: "6px 0 14px", fontSize: 13, color: "var(--fg-3)" }}>
              {storageConfigurado
                ? "Archivos cargados por el postulante (PNG, JPG o PDF)."
                : "No se pueden abrir: falta configurar la URL del almacenamiento."}
            </p>
            {sol.pruebas.length === 0 ? (
              <p style={{ margin: 0, fontSize: 14, color: "var(--fg-2)" }}>La solicitud no tiene pruebas cargadas.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
                {sol.pruebas.map((p, i) => <PruebaCard key={p.key || i} p={p} />)}
              </div>
            )}
          </SectionBox>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <SectionBox icon={<User size={16} color="var(--green-800)" />} title="Datos del solicitante">
            <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "8px 0 14px", borderBottom: "1px dashed var(--cream-tert)" }}>
              <span style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--brown-700)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 15, flexShrink: 0 }}>{admInitials(sol.nombreSolicitante || "?")}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg-1)" }}>{sol.nombreSolicitante || "—"}</div>
                {sol.fechaHoraAltaSolicitante && (
                  <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>Miembro desde {fmtFecha(sol.fechaHoraAltaSolicitante)}</div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--fg-1)" }}>
                <BadgeCheck size={15} color="var(--fg-3)" />
                <span style={{ fontFamily: "var(--font-mono)" }}>{sol.identificacionSolicitante || "—"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--fg-1)", wordBreak: "break-all" }}>
                <Mail size={15} color="var(--fg-3)" />{sol.emailSolicitante || "—"}
              </div>
            </div>
          </SectionBox>

          <SectionBox icon={<MessageSquare size={16} color="var(--green-800)" />} title="Observaciones">
            {readOnly ? (
              <div style={{ paddingTop: 8 }}>
                <p style={{ margin: 0, fontSize: 14, color: ultimo?.observaciones ? "var(--fg-1)" : "var(--fg-3)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                  {ultimo?.observaciones || "Sin observaciones."}
                </p>
                {ultimo?.fecha && (
                  <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={13} color="var(--fg-3)" />{metaDe(sol.estado)?.label} el {fmtFechaHora(ultimo.fecha)}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ paddingTop: 8 }}>
                <textarea
                  className={"textarea" + (obsErr ? " err" : "")}
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  rows={5}
                  disabled={!gestionar}
                  maxLength={OBS_MAX + 200}
                  placeholder="Observaciones sobre la solicitud. Se guardan junto con la decisión."
                  style={{ resize: "vertical", minHeight: 120, fontSize: 14 }}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 7 }}>
                  {obsErr
                    ? <span className="err-msg" style={{ fontSize: 12.5 }}><AlertCircle size={14} color="var(--danger)" />Máximo {OBS_MAX} caracteres.</span>
                    : <span style={{ fontSize: 12, color: "var(--fg-3)" }}>Hasta {OBS_MAX} caracteres.</span>}
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: obsErr ? "var(--danger)" : "var(--fg-3)" }}>{obs.length} / {OBS_MAX}</span>
                </div>
              </div>
            )}
          </SectionBox>

          {!readOnly && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", padding: 18, display: "flex", flexDirection: "column", gap: 10, position: "sticky", top: 84 }}>
              <button
                type="button"
                disabled={bloqueado}
                title={gestionar ? undefined : SIN_GESTION}
                onClick={() => onResolver("VALIDADA", obs.trim())}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "13px 18px", borderRadius: "var(--radius)", border: "none", fontSize: 15, fontWeight: 600, background: bloqueado ? "var(--cream-tert)" : "var(--green-800)", color: bloqueado ? "var(--fg-3)" : "#fff", cursor: bloqueado ? "not-allowed" : "pointer", boxShadow: bloqueado ? "none" : "inset 0 -2px 0 var(--green-900)" }}
              >
                {busy ? <Loader size={18} className="spin" /> : <CheckCircle2 size={18} color={bloqueado ? "var(--fg-3)" : "#fff"} />} Aprobar solicitud
              </button>
              <button
                type="button"
                disabled={bloqueado}
                title={gestionar ? undefined : SIN_GESTION}
                onClick={() => onResolver("RECHAZADA", obs.trim())}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "13px 18px", borderRadius: "var(--radius)", border: "1px solid " + (bloqueado ? "var(--cream-tert)" : "var(--danger)"), fontSize: 15, fontWeight: 600, background: "var(--surface)", color: bloqueado ? "var(--fg-3)" : "var(--danger)", cursor: bloqueado ? "not-allowed" : "pointer" }}
              >
                <XCircle size={18} color={bloqueado ? "var(--fg-3)" : "var(--danger)"} /> Rechazar solicitud
              </button>
              {!gestionar && (
                <div style={{ fontSize: 12, color: "var(--fg-3)", textAlign: "center", lineHeight: 1.45, marginTop: 2 }}>{SIN_GESTION}.</div>
              )}
              {error && <div style={{ marginTop: 2 }}><span className="err-msg" style={{ fontSize: 12.5 }}><AlertCircle size={14} color="var(--danger)" />{error}</span></div>}
            </div>
          )}
        </aside>
      </div>

      <style>{`@media (max-width: 920px) { .sol-detail-grid { grid-template-columns: minmax(0,1fr) !important; } }`}</style>
    </div>
  );
}

/** Carga el detalle de la solicitud abierta y delega el render. */
function DetalleCargado({
  id,
  gestionar,
  onBack,
  onResuelta,
}: {
  id: string;
  gestionar: boolean;
  onBack: () => void;
  onResuelta: (estado: Resolucion) => void;
}) {
  const { solicitud, isLoading, error, notFound, reload } = useSolicitudDetalle(
    id,
    BASE_ADMIN_SOLICITUDES,
  );
  const { resolver, isLoading: resolviendo } = useResolverSolicitud();
  const [errorResolver, setErrorResolver] = useState<string | null>(null);

  async function onResolver(estado: Resolucion, obs: string) {
    setErrorResolver(null);
    const r = await resolver(id, estado, obs);
    if (r.ok) {
      onResuelta(estado);
      return;
    }
    setErrorResolver(
      r.code ?? "No pudimos procesar la solicitud. Intentá de nuevo en unos minutos.",
    );
  }

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando la solicitud…" pad={72}>
        {notFound || !solicitud ? (
          <div style={{ padding: "56px 24px", textAlign: "center", color: "var(--fg-3)" }}>
            <Inbox size={32} color="var(--fg-3)" />
            <div style={{ marginTop: 12, fontSize: 15 }}>No encontramos esta solicitud.</div>
            <button type="button" className="btn btn-neutral" style={{ marginTop: 18 }} onClick={onBack}>Volver a solicitudes</button>
          </div>
        ) : (
          <Detail
            sol={solicitud}
            gestionar={gestionar}
            busy={resolviendo}
            error={errorResolver}
            onBack={onBack}
            onResolver={onResolver}
          />
        )}
      </AsyncBoundary>
    </div>
  );
}

function Inner() {
  const { solicitudes, isLoading, error, reload } = useSolicitudes();
  const accesos = useAuthStore((s) => s.accesos);
  const gestionar = puede(accesos, "GESTIONAR_SOLICITUD_ESTABLECIMIENTO");
  const [abierta, setAbierta] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [abierta]);

  function notify(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash((f) => (f === msg ? null : f)), 3800);
  }

  function onResuelta(estado: Resolucion) {
    setAbierta(null);
    // La lista trae el estado nuevo; se recarga en vez de parchearla a mano.
    reload();
    notify(
      estado === "VALIDADA"
        ? "Solicitud del establecimiento aprobada correctamente"
        : "Solicitud del establecimiento rechazada correctamente",
    );
  }

  return (
    <>
      {abierta ? (
        <DetalleCargado
          id={abierta}
          gestionar={gestionar}
          onBack={() => setAbierta(null)}
          onResuelta={onResuelta}
        />
      ) : (
        <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando solicitudes…">
          <List solicitudes={solicitudes} onOpen={setAbierta} />
        </AsyncBoundary>
      )}

      {flash && (
        <div className="pop" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 90, maxWidth: 400, background: "var(--green-800)", color: "#fff", borderRadius: "var(--radius)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 11, fontWeight: 500, fontSize: 14.5, boxShadow: "0px 8px 24px rgba(45,90,39,0.18)" }}>
          <CheckCircle2 size={19} color="#fff" /> {flash}
        </div>
      )}
    </>
  );
}

export default function SolicitudesClient() {
  return (
    <AdminShell active="solicitudes">
      <Inner />
    </AdminShell>
  );
}
