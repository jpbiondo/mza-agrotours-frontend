"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight, Search, Clock, CheckCircle2, XCircle, Inbox, AlertTriangle, User, MapPin,
  ClipboardCheck, Eye, ArrowLeft, Hash, ShieldCheck, ShieldAlert, Info, Check, Building2,
  Mail, AlignLeft, Phone, Map as MapIcon, Paperclip, FileText, Image as ImageIcon, ExternalLink,
  MessageSquare, AlertCircle, Loader,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import AdminShell from "@/components/admin/AdminShell";
import { admInitials, estabInitials } from "@/data/admin";
import { SOL_ESTADO_META, chequearCoincidencias, vigenteQueCoincide, fmtBytes } from "@/data/solicitudes";
import { useSolicitudes, useResolverSolicitud } from "@/hooks/useSolicitudes";
import type { Coincidencias, EstadoSolicitud, Solicitud } from "@/types/solicitudes";

const OBS_MAX = 1000;
const TONE: Record<string, { bg: string; fg: string }> = {
  warning: { bg: "var(--warning-fill)", fg: "var(--warning-fg)" },
  success: { bg: "var(--success-fill)", fg: "var(--success-fg)" },
  danger: { bg: "var(--danger-fill)", fg: "var(--danger-fg)" },
};

function EstadoPill({ estado }: { estado: EstadoSolicitud }) {
  const m = SOL_ESTADO_META[estado];
  const t = TONE[m.tone];
  return <span style={{ display: "inline-flex", alignItems: "center", borderRadius: "var(--radius-pill)", padding: "4px 11px", fontSize: 12.5, fontWeight: 700, background: t.bg, color: t.fg }}>{m.label}</span>;
}

/* ---- Lista ------------------------------------------------------------- */
function List({ solicitudes, onOpen }: { solicitudes: Solicitud[]; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todas" | EstadoSolicitud>("pendiente");

  const counts = useMemo(() => ({
    pendiente: solicitudes.filter((s) => s.estado === "pendiente").length,
    validada: solicitudes.filter((s) => s.estado === "validada").length,
    rechazada: solicitudes.filter((s) => s.estado === "rechazada").length,
  }), [solicitudes]);

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return solicitudes.filter((s) => {
      if (filter !== "todas" && s.estado !== filter) return false;
      if (q && !(s.nombreEstablecimiento.toLowerCase().includes(q) || s.productor.nombre.toLowerCase().includes(q) || s.departamento.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [solicitudes, query, filter]);

  const stat = [
    { icon: <Clock size={20} color={counts.pendiente > 0 ? "var(--warning-fg)" : "var(--green-800)"} />, label: "Pendientes", value: counts.pendiente, warn: counts.pendiente > 0 },
    { icon: <CheckCircle2 size={20} color="var(--green-800)" />, label: "Validadas", value: counts.validada, warn: false },
    { icon: <XCircle size={20} color="var(--green-800)" />, label: "Rechazadas", value: counts.rechazada, warn: false },
  ];

  const filterBtn = (val: "todas" | EstadoSolicitud, label: string, n?: number) => {
    const on = filter === val;
    return (
      <button type="button" onClick={() => setFilter(val)} style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: "var(--radius-pill)", fontSize: 13.5, fontWeight: 600, border: "1px solid " + (on ? "var(--green-800)" : "var(--outline-variant)"), background: on ? "var(--green-800)" : "var(--surface)", color: on ? "#fff" : "var(--fg-2)", cursor: "pointer", whiteSpace: "nowrap" }}>
        {label}
        {n != null && <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12, padding: "1px 7px", borderRadius: 999, background: on ? "rgba(255,255,255,.22)" : "var(--cream-tert)", color: on ? "#fff" : "var(--fg-2)" }}>{n}</span>}
      </button>
    );
  };

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 28px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13.5, marginBottom: 14 }}><span>Plataforma</span><ChevronRight size={15} /><span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Solicitudes de establecimientos</span></div>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 32, color: "var(--fg-1)", letterSpacing: "-.01em" }}>Solicitudes de establecimientos</h1>
        <p style={{ margin: "10px 0 0", color: "var(--fg-2)", fontSize: 15.5, lineHeight: 1.5, maxWidth: 720 }}>Revisá las postulaciones de nuevos establecimientos y validá su veracidad. Aprobá las que cumplan los requisitos o rechazalas dejando una observación.</p>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        {stat.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: "12px 16px", minWidth: 180 }}>
            <span style={{ width: 42, height: 42, borderRadius: 10, background: s.warn ? "var(--warning-fill)" : "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</span>
            <span><span style={{ display: "block", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>{s.value}</span><span style={{ display: "block", fontSize: 12.5, color: "var(--fg-2)" }}>{s.label}</span></span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex" }}><Search size={17} color="var(--fg-3)" /></span>
          <input placeholder="Buscar por establecimiento, productor o departamento" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: "100%", fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--fg-1)", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--sand)", padding: "11px 14px 11px 42px", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{filterBtn("pendiente", "Pendientes", counts.pendiente)}{filterBtn("validada", "Validadas", counts.validada)}{filterBtn("rechazada", "Rechazadas", counts.rechazada)}{filterBtn("todas", "Todas")}</div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {visibles.length === 0 ? (
          <div style={{ padding: "56px 24px", textAlign: "center", color: "var(--fg-3)" }}><Inbox size={32} color="var(--fg-3)" /><div style={{ marginTop: 12, fontSize: 15 }}>No hay solicitudes que coincidan con la búsqueda.</div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 880 }}>
              <thead>
                <tr>{["Establecimiento", "Departamento", "Solicitado", "Estado", ""].map((h, i) => (
                  <th key={i} style={{ textAlign: i === 4 ? "right" : "left", fontWeight: 700, color: "var(--fg-2)", fontSize: 12.5, textTransform: "uppercase", letterSpacing: ".05em", padding: "14px 18px", borderBottom: "2px solid var(--outline-variant)", whiteSpace: "nowrap" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {visibles.map((s) => {
                  const coin = chequearCoincidencias(s);
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid var(--cream-tert)" }}>
                      <td style={{ padding: "15px 18px", maxWidth: 360 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                          <span style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 10, background: "var(--green-050)", color: "var(--green-800)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, border: "1px solid var(--green-300)" }}>{estabInitials(s.nombreEstablecimiento)}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)", lineHeight: 1.25 }}>{s.nombreEstablecimiento}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, fontSize: 12.5, color: "var(--fg-2)" }}>
                              <User size={13} color="var(--fg-3)" /> {s.productor.nombre}
                              {s.estado === "pendiente" && coin.alguna && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 4, color: "var(--danger-fg)", fontWeight: 600 }}><AlertTriangle size={12} color="var(--danger)" /> Coincidencias</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "15px 18px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, color: "var(--fg-1)" }}><MapPin size={14} color="var(--brown-700)" /> {s.departamento}</span></td>
                      <td style={{ padding: "15px 18px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>{s.solicitado}</td>
                      <td style={{ padding: "15px 18px" }}><EstadoPill estado={s.estado} /></td>
                      <td style={{ padding: "15px 18px", textAlign: "right" }}>
                        <button type="button" onClick={() => onOpen(s.id)} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontWeight: 600, fontSize: 13.5, padding: "8px 14px", borderRadius: "var(--radius)", cursor: "pointer", whiteSpace: "nowrap", border: "1px solid " + (s.estado === "pendiente" ? "var(--green-800)" : "var(--sand)"), background: s.estado === "pendiente" ? "var(--green-800)" : "var(--surface)", color: s.estado === "pendiente" ? "#fff" : "var(--green-800)" }}>
                          {s.estado === "pendiente" ? <ClipboardCheck size={16} /> : <Eye size={16} />} {s.estado === "pendiente" ? "Revisar" : "Ver"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Detalle ----------------------------------------------------------- */
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

function CritRow({ icon, label, value, mono, match }: { icon: React.ReactNode; label: string; value: string; mono?: boolean; match: { nombre: string } | null }) {
  return (
    <div style={{ padding: "16px 0", borderBottom: "1px dashed var(--cream-tert)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div className="t-label" style={{ marginBottom: 5, display: "flex", alignItems: "center", gap: 7 }}>{icon} {label}</div>
          <div style={{ fontSize: 15, color: "var(--fg-1)", fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", fontWeight: 500, wordBreak: "break-word" }}>{value}</div>
        </div>
        <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: "var(--radius-pill)", fontSize: 12.5, fontWeight: 600, background: match ? "var(--danger-fill)" : "var(--success-fill)", color: match ? "var(--danger-fg)" : "var(--success-fg)", border: "1px solid " + (match ? "var(--danger)" : "var(--success)") }}>
          {match ? <AlertTriangle size={14} color="var(--danger-fg)" /> : <Check size={14} color="var(--success-fg)" />} {match ? "Coincide con uno vigente" : "Sin coincidencias"}
        </span>
      </div>
      {match && <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--danger-fg)", background: "var(--surface)", border: "1px solid var(--danger)", borderRadius: "var(--radius)", padding: "9px 12px" }}><Info size={14} color="var(--danger)" /> Ya existe un establecimiento vigente con este dato: <strong>{match.nombre}</strong></div>}
    </div>
  );
}

function DetailField({ icon, label, value, full }: { icon: React.ReactNode; label: string; value: string; full?: boolean }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
      <div className="t-label" style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}>{icon} {label}</div>
      <div style={{ fontSize: 14.5, color: "var(--fg-1)", lineHeight: 1.55 }}>{value}</div>
    </div>
  );
}

function Detail({ sol, busy, onBack, onApprove, onReject }: { sol: Solicitud; busy: boolean; onBack: () => void; onApprove: (obs: string) => void; onReject: (obs: string) => void }) {
  const [obs, setObs] = useState(sol.observacion || "");
  const coin: Coincidencias = useMemo(() => chequearCoincidencias(sol), [sol]);
  const readOnly = sol.estado !== "pendiente";
  const obsErr = obs.length > OBS_MAX;
  const aprobarDisabled = readOnly || coin.alguna || obsErr || busy;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 28px 96px" }}>
      <button type="button" onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "transparent", border: "none", cursor: "pointer", color: "var(--green-800)", fontSize: 13.5, fontWeight: 600, marginBottom: 14, padding: 0 }}><ArrowLeft size={16} color="var(--green-800)" /> Volver a solicitudes</button>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <span style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 12, background: "var(--green-050)", color: "var(--green-800)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 19, border: "1px solid var(--green-300)" }}>{estabInitials(sol.nombreEstablecimiento)}</span>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 28, color: "var(--fg-1)", letterSpacing: "-.01em", lineHeight: 1.2 }}>{sol.nombreEstablecimiento}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 11, fontSize: 13.5, color: "var(--fg-2)" }}>
            <EstadoPill estado={sol.estado} />
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Hash size={14} color="var(--fg-3)" /><span style={{ fontFamily: "var(--font-mono)" }}>{sol.id.toUpperCase()}</span></span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Clock size={14} color="var(--fg-3)" /> Solicitado el {sol.solicitado}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 24, background: coin.alguna ? "var(--danger-fill)" : "var(--success-fill)", border: "1px solid " + (coin.alguna ? "var(--danger)" : "var(--success)"), borderRadius: "var(--radius)", padding: "14px 16px" }}>
        {coin.alguna ? <ShieldAlert size={20} color="var(--danger-fg)" style={{ flexShrink: 0 }} /> : <ShieldCheck size={20} color="var(--success-fg)" style={{ flexShrink: 0 }} />}
        <div style={{ fontSize: 14, color: coin.alguna ? "var(--danger-fg)" : "var(--success-fg)", lineHeight: 1.5 }}>
          {coin.alguna ? <span><strong>No se puede aprobar.</strong> Uno o más campos críticos coinciden con un establecimiento ya vigente. Revisá los datos marcados; podés rechazar la solicitud dejando una observación.</span> : <span><strong>Apta para aprobar.</strong> Ningún campo crítico coincide con establecimientos vigentes.</span>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 24, alignItems: "start" }} className="sol-detail-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
          <SectionBox icon={<ShieldCheck size={16} color="var(--green-800)" />} title="Campos críticos">
            <CritRow icon={<Hash size={13} color="var(--fg-3)" />} label="CUIL" value={sol.cuil} mono match={coin.cuil ? vigenteQueCoincide("cuil", sol.cuil) : null} />
            <CritRow icon={<Building2 size={13} color="var(--fg-3)" />} label="Razón social" value={sol.razonSocial} match={coin.razonSocial ? vigenteQueCoincide("razonSocial", sol.razonSocial) : null} />
            <CritRow icon={<Mail size={13} color="var(--fg-3)" />} label="Email" value={sol.email} match={coin.email ? vigenteQueCoincide("email", sol.email) : null} />
          </SectionBox>

          <SectionBox icon={<Info size={16} color="var(--green-800)" />} title="Datos del establecimiento">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, paddingTop: 8 }}>
              <DetailField icon={<AlignLeft size={13} color="var(--fg-3)" />} label="Descripción" value={sol.descripcion} full />
              <DetailField icon={<Phone size={13} color="var(--fg-3)" />} label="Teléfono de la organización" value={sol.telefono} />
              <DetailField icon={<MapPin size={13} color="var(--fg-3)" />} label="Domicilio legal" value={sol.domicilioLegal} />
              <DetailField icon={<MapIcon size={13} color="var(--fg-3)" />} label="Departamento" value={sol.departamento} />
            </div>
          </SectionBox>

          <SectionBox icon={<Paperclip size={16} color="var(--green-800)" />} title={`Prueba de existencia y titularidad (${sol.pruebas.length})`}>
            <p style={{ margin: "6px 0 14px", fontSize: 13, color: "var(--fg-3)" }}>Archivos cargados por el postulante (PNG, JPG, JPEG, WEBP o PDF).</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
              {sol.pruebas.map((p, i) => {
                const isImg = p.type !== "pdf";
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", overflow: "hidden", background: "var(--surface)" }}>
                    <div style={{ height: 108, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", background: isImg ? "repeating-linear-gradient(135deg, var(--cream-tert) 0 10px, var(--surface) 10px 20px)" : "var(--green-050)" }}>
                      {isImg ? <ImageIcon size={30} color="var(--brown-700)" /> : <FileText size={30} color="var(--green-800)" />}
                      <span style={{ position: "absolute", top: 8, right: 8, fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", color: "var(--fg-2)", background: "rgba(251,249,248,.92)", padding: "2px 7px", borderRadius: 999, border: "1px solid var(--outline-variant)" }}>{p.type}</span>
                    </div>
                    <div style={{ padding: "10px 12px", borderTop: "1px solid var(--cream-tert)" }}>
                      <div style={{ fontSize: 12.8, fontWeight: 600, color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 3 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>{fmtBytes(p.size)}</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 600, color: "var(--green-800)" }}><ExternalLink size={12} color="var(--green-800)" /> Ver</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionBox>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <SectionBox icon={<User size={16} color="var(--green-800)" />} title="Datos del productor">
            <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "8px 0 14px", borderBottom: "1px dashed var(--cream-tert)" }}>
              <span style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--brown-700)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 15 }}>{admInitials(sol.productor.nombre)}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--fg-1)" }}>{sol.productor.nombre}</div>
                <div style={{ fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>Miembro desde {sol.productor.miembroDesde}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--fg-1)" }}><Hash size={15} color="var(--fg-3)" /><span style={{ fontFamily: "var(--font-mono)" }}>DNI {sol.productor.dni}</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: "var(--fg-1)", wordBreak: "break-all" }}><Mail size={15} color="var(--fg-3)" /> {sol.productor.email}</div>
            </div>
          </SectionBox>

          <SectionBox icon={<MessageSquare size={16} color="var(--green-800)" />} title="Observaciones">
            {readOnly ? (
              <div style={{ paddingTop: 8 }}>
                <p style={{ margin: 0, fontSize: 14, color: sol.observacion ? "var(--fg-1)" : "var(--fg-3)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{sol.observacion || "Sin observaciones."}</p>
                {sol.resueltoPor && <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6 }}><Clock size={13} color="var(--fg-3)" /> {SOL_ESTADO_META[sol.estado].label} el {sol.resuelto} · por {sol.resueltoPor}</div>}
              </div>
            ) : (
              <div style={{ paddingTop: 8 }}>
                <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={5} maxLength={OBS_MAX + 200} placeholder="Observaciones sobre la solicitud (opcional). Se guardan junto con la decisión." style={{ width: "100%", resize: "vertical", minHeight: 120, fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--fg-1)", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid " + (obsErr ? "var(--danger)" : "var(--sand)"), padding: "12px 14px", outline: "none", boxSizing: "border-box" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 7 }}>
                  {obsErr ? <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--danger-fg)" }}><AlertCircle size={14} color="var(--danger)" /> Máximo {OBS_MAX} caracteres.</span> : <span style={{ fontSize: 12, color: "var(--fg-3)" }}>Hasta {OBS_MAX} caracteres.</span>}
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: obs.length > OBS_MAX ? "var(--danger)" : "var(--fg-3)" }}>{obs.length} / {OBS_MAX}</span>
                </div>
              </div>
            )}
          </SectionBox>

          {!readOnly && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              <button type="button" disabled={aprobarDisabled} onClick={() => onApprove(obs.trim())} title={coin.alguna ? "No se puede aprobar: hay campos críticos que coinciden con establecimientos vigentes." : undefined} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "13px 18px", borderRadius: "var(--radius)", border: "none", fontSize: 15, fontWeight: 600, background: aprobarDisabled ? "var(--cream-tert)" : "var(--green-800)", color: aprobarDisabled ? "var(--fg-3)" : "#fff", cursor: aprobarDisabled ? "not-allowed" : "pointer", boxShadow: aprobarDisabled ? "none" : "inset 0 -2px 0 var(--green-900)" }}>
                {busy ? <Loader size={18} className="spin" /> : <CheckCircle2 size={18} color={aprobarDisabled ? "var(--fg-3)" : "#fff"} />} Aprobar solicitud
              </button>
              <button type="button" disabled={obsErr || busy} onClick={() => onReject(obs.trim())} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "13px 18px", borderRadius: "var(--radius)", border: "1px solid " + (obsErr ? "var(--cream-tert)" : "var(--danger)"), fontSize: 15, fontWeight: 600, background: "var(--surface)", color: obsErr ? "var(--fg-3)" : "var(--danger)", cursor: obsErr || busy ? "not-allowed" : "pointer" }}>
                <XCircle size={18} color={obsErr ? "var(--fg-3)" : "var(--danger)"} /> Rechazar solicitud
              </button>
              {coin.alguna && <div style={{ fontSize: 12, color: "var(--fg-3)", textAlign: "center", lineHeight: 1.45, marginTop: 2 }}>El botón “Aprobar” se habilita cuando ningún campo crítico coincide con un establecimiento vigente.</div>}
            </div>
          )}
        </aside>
      </div>

      <style>{`@media (max-width: 880px) { .sol-detail-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

function Inner({ initial }: { initial: Solicitud[] }) {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(initial);
  const [selId, setSelId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: "success" | "danger"; msg: string } | null>(null);
  const { resolver, isLoading } = useResolverSolicitud();

  const sel = solicitudes.find((s) => s.id === selId) || null;

  function notify(t: { tone: "success" | "danger"; msg: string }) { setToast(t); setTimeout(() => setToast((c) => (c === t ? null : c)), 3800); }

  async function resolverSol(estado: "validada" | "rechazada", observacion: string) {
    if (!sel) return;
    await resolver(sel.id, estado, observacion);
    setSolicitudes((prev) => prev.map((s) => (s.id === sel.id ? { ...s, estado, observacion, resueltoPor: "Diego Ferreyra", resuelto: nowStamp() } : s)));
    setSelId(null);
    window.scrollTo({ top: 0 });
    notify({ tone: "success", msg: estado === "validada" ? "Solicitud del establecimiento aprobada correctamente" : "Solicitud del establecimiento rechazada correctamente" });
  }

  return (
    <>
      {sel ? (
        <Detail sol={sel} busy={isLoading} onBack={() => { setSelId(null); window.scrollTo({ top: 0 }); }} onApprove={(obs) => resolverSol("validada", obs)} onReject={(obs) => resolverSol("rechazada", obs)} />
      ) : (
        <List solicitudes={solicitudes} onOpen={(id) => { setSelId(id); window.scrollTo({ top: 0 }); }} />
      )}
      {toast && (
        <div className="pop" style={{ position: "fixed", right: 24, bottom: 24, zIndex: 90, maxWidth: 400, background: toast.tone === "danger" ? "var(--danger-fill)" : "var(--green-800)", color: toast.tone === "danger" ? "var(--danger-fg)" : "#fff", border: toast.tone === "danger" ? "1px solid var(--danger)" : "none", borderRadius: "var(--radius)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 11, fontWeight: 500, fontSize: 14.5, boxShadow: "var(--shadow-pop)" }}>
          {toast.tone === "danger" ? <AlertCircle size={19} color="var(--danger-fg)" /> : <CheckCircle2 size={19} color="#fff" />} {toast.msg}
        </div>
      )}
    </>
  );
}

function nowStamp(): string {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(n.getDate())}/${p(n.getMonth() + 1)}/${n.getFullYear()} · ${p(n.getHours())}:${p(n.getMinutes())}`;
}

export default function SolicitudesClient() {
  const { data, isLoading, error, reload } = useSolicitudes();
  return (
    <AdminShell active="solicitudes">
      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando solicitudes…">
        {data && <Inner initial={data} />}
      </AsyncBoundary>
    </AdminShell>
  );
}
