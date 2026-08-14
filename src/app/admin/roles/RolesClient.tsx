"use client";

import { useEffect, useState } from "react";
import {
  Plus, X, AlertCircle, ShieldCheck, Lock, Pencil, Trash2, Info, ChevronRight, Check,
  CheckCircle2, KeyRound, Users, Lightbulb, UserCog, Loader,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import AdminShell from "@/components/admin/AdminShell";
import { genId } from "@/lib/id";
import { etiquetaPermiso } from "@/lib/permisos";
import { useRoles, useGuardarRol, useDarBajaRol } from "@/hooks/useRoles";
import type { GrupoPermiso, RolAdminDetalle } from "@/types/admin";

const inputStyle: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--fg-1)",
  borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--sand)",
  padding: "12px 14px", outline: "none", boxSizing: "border-box",
};

/** "Gestión de administradores" → "Administradores", para las píldoras de la tabla. */
function etiquetaGrupo(nombre: string): string {
  const corto = nombre.replace(/^gesti[oó]n de\s+/i, "").trim();
  return corto ? corto[0].toUpperCase() + corto.slice(1) : nombre;
}

function ErrMsg({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--danger-fg)" }}><AlertCircle size={15} color="var(--danger)" /> {children}</div>;
}

function BigCheck({ state, size = 24 }: { state: "on" | "off" | "mixed"; size?: number }) {
  const filled = state === "on" || state === "mixed";
  return (
    <span aria-hidden style={{ width: size, height: size, borderRadius: 7, flexShrink: 0, border: "2px solid " + (filled ? "var(--green-800)" : "var(--sand)"), background: filled ? "var(--green-800)" : "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {state === "on" && <Check size={size - 10} color="#fff" />}
      {state === "mixed" && <span style={{ width: size - 12, height: 3, borderRadius: 2, background: "#fff" }} />}
    </span>
  );
}

function PermGroupEditor({ group, selected, onToggleGroup, onTogglePerm }: { group: GrupoPermiso; selected: Set<string>; onToggleGroup: (g: GrupoPermiso) => void; onTogglePerm: (codigo: string) => void }) {
  const count = group.permisos.filter((p) => selected.has(p)).length;
  const groupState = count === 0 ? "off" : count === group.permisos.length ? "on" : "mixed";
  return (
    <div style={{ border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--surface)" }}>
      <button type="button" onClick={() => onToggleGroup(group)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", background: groupState !== "off" ? "var(--green-050)" : "var(--cream-tert)", border: "none", borderBottom: "1px solid var(--outline-variant)", padding: "14px 16px", cursor: "pointer" }}>
        <BigCheck state={groupState} size={25} />
        <span style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "var(--surface)", border: "1px solid var(--outline-variant)", display: "flex", alignItems: "center", justifyContent: "center" }}><ShieldCheck size={19} color="var(--green-800)" /></span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16.5, color: "var(--fg-1)" }}>{group.nombre}</span>
          <span style={{ display: "block", fontSize: 12.5, color: "var(--fg-3)", marginTop: 2 }}>{group.descripcion}</span>
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 600, color: count ? "var(--green-800)" : "var(--fg-3)", background: count ? "var(--green-100)" : "var(--surface)", border: "1px solid " + (count ? "var(--green-300)" : "var(--outline-variant)"), borderRadius: "var(--radius-pill)", padding: "4px 11px", whiteSpace: "nowrap" }}>{count}/{group.permisos.length}</span>
      </button>
      <div style={{ padding: "6px 10px 10px 44px", display: "flex", flexDirection: "column", gap: 3 }}>
        {group.permisos.map((p) => {
          const on = selected.has(p);
          return (
            <button key={p} type="button" onClick={() => onTogglePerm(p)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", background: on ? "var(--green-050)" : "transparent", border: "1px solid " + (on ? "var(--green-300)" : "transparent"), borderRadius: "var(--radius)", padding: "11px 14px", cursor: "pointer" }}>
              <BigCheck state={on ? "on" : "off"} size={23} />
              {/* El código va debajo de la etiqueta: dos permisos de recursos
                  distintos pueden leerse los dos "Ver" dentro del mismo grupo. */}
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 15.5, fontWeight: on ? 600 : 500, color: on ? "var(--green-800)" : "var(--fg-1)" }}>{etiquetaPermiso(p)}</span>
                <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--fg-3)", marginTop: 2 }}>{p}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PermSummary({ perms, grupos }: { perms: string[]; grupos: GrupoPermiso[] }) {
  if (!perms.length) return <span style={{ color: "var(--fg-3)", fontSize: 13 }}>Sin permisos</span>;
  const tiene = new Set(perms);
  const conteos = grupos
    .map((g) => ({ grupo: g, count: g.permisos.filter((p) => tiene.has(p)).length }))
    .filter((x) => x.count > 0);
  return (
    <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {conteos.map(({ grupo, count }) => (
        <span key={grupo.nombre} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--green-050)", border: "1px solid var(--green-300)", borderRadius: "var(--radius-pill)", padding: "4px 10px", fontSize: 12.5, color: "var(--green-800)", fontWeight: 600, whiteSpace: "nowrap" }}>
          <ShieldCheck size={14} color="var(--green-700)" /> {etiquetaGrupo(grupo.nombre)} <span style={{ fontFamily: "var(--font-mono)", opacity: 0.8 }}>{count}</span>
        </span>
      ))}
    </span>
  );
}

function RoleForm({ initial, grupos, existingNames, busy, onCancel, onSave }: { initial: RolAdminDetalle | null; grupos: GrupoPermiso[]; existingNames: string[]; busy: boolean; onCancel: () => void; onSave: (r: RolAdminDetalle) => void }) {
  const editing = !!initial;
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initial?.permisos ?? []));
  const [attempted, setAttempted] = useState(false);

  const togglePerm = (codigo: string) => setSelected((prev) => { const n = new Set(prev); if (n.has(codigo)) n.delete(codigo); else n.add(codigo); return n; });
  const toggleGroup = (group: GrupoPermiso) => setSelected((prev) => { const n = new Set(prev); if (group.permisos.every((p) => n.has(p))) group.permisos.forEach((p) => n.delete(p)); else group.permisos.forEach((p) => n.add(p)); return n; });

  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const isDup = nombre.trim().length >= 3 && existingNames.map(norm).includes(norm(nombre));
  const errNombre = !nombre.trim() ? "Escribí un nombre para el rol." : nombre.trim().length < 3 ? "El nombre debe tener al menos 3 letras." : nombre.trim().length > 40 ? "El nombre no puede superar los 40 caracteres." : isDup ? "Ya existe un rol con ese nombre. Elegí otro." : "";
  const errDesc = !descripcion.trim() ? "Escribí una descripción para el rol." : descripcion.trim().length > 200 ? "La descripción no puede superar los 200 caracteres." : "";
  const errPerms = selected.size === 0 ? "Marcá al menos un permiso para el rol." : "";
  const showNombre = (attempted && errNombre) || (isDup ? errNombre : "");

  function handleSave() {
    setAttempted(true);
    if (errNombre || errDesc || errPerms) return;
    onSave({
      id: initial?.id ?? genId("ar"),
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      permisos: Array.from(selected),
      cantidadUsuarios: initial?.cantidadUsuarios ?? 0,
      esProtegido: initial?.esProtegido ?? false,
    });
  }

  const lbl: React.CSSProperties = { display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)", marginBottom: 8 };

  return (
    <div style={{ display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 80px)" }}>
      <div style={{ padding: "22px 26px", borderBottom: "1px solid var(--outline-variant)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div className="t-label" style={{ marginBottom: 6 }}>{editing ? "Editar rol" : "Nuevo rol"}</div>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "var(--fg-1)" }}>{editing ? (nombre || "Editar rol") : "Crear rol de administrador"}</h2>
          <p style={{ margin: "6px 0 0", color: "var(--fg-2)", fontSize: 14 }}>{editing ? "Modificá el nombre, la descripción o los permisos del rol." : "Definí qué puede hacer un administrador con este rol."}</p>
        </div>
        <button type="button" onClick={onCancel} aria-label="Cerrar" style={{ width: 42, height: 42, flexShrink: 0, borderRadius: "var(--radius)", border: "1px solid var(--outline-variant)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} color="var(--fg-2)" /></button>
      </div>

      <div style={{ padding: "22px 26px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label htmlFor="ar-nombre" style={lbl}>Nombre del rol <span style={{ color: "var(--danger)" }}>*</span></label>
          <input id="ar-nombre" maxLength={40} placeholder="Ej. Moderador de establecimientos" value={nombre} onChange={(e) => setNombre(e.target.value)} style={showNombre ? { ...inputStyle, borderColor: "var(--danger)" } : inputStyle} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 7 }}>
            {showNombre ? <ErrMsg>{errNombre}</ErrMsg> : <p style={{ margin: 0, fontSize: 12.5, color: "var(--fg-3)" }}>Así verán este rol el resto de los administradores.</p>}
            <span style={{ flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: nombre.length > 40 ? "var(--danger)" : "var(--fg-3)" }}>{nombre.length}/40</span>
          </div>
        </div>
        <div>
          <label htmlFor="ar-desc" style={lbl}>Descripción <span style={{ color: "var(--danger)" }}>*</span></label>
          <textarea id="ar-desc" maxLength={200} rows={3} placeholder="Contá para qué sirve este rol dentro del sistema." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} style={{ ...(attempted && errDesc ? { ...inputStyle, borderColor: "var(--danger)" } : inputStyle), minHeight: 84, resize: "vertical" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 7 }}>
            {attempted && errDesc ? <ErrMsg>{errDesc}</ErrMsg> : <span />}
            <span style={{ flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: descripcion.length > 200 ? "var(--danger)" : "var(--fg-3)" }}>{descripcion.length}/200</span>
          </div>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
            <label style={{ ...lbl, marginBottom: 0 }}>Permisos <span style={{ color: "var(--danger)" }}>*</span></label>
            <span style={{ fontSize: 13.5, color: selected.size ? "var(--green-800)" : "var(--fg-3)", fontWeight: 600 }}>{selected.size} {selected.size === 1 ? "permiso seleccionado" : "permisos seleccionados"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, background: "var(--info-fill)", color: "var(--info-fg)", borderRadius: "var(--radius)", padding: "10px 13px", marginBottom: 14, fontSize: 13.5, lineHeight: 1.4 }}>
            <Lightbulb size={17} color="var(--info)" style={{ flexShrink: 0 }} /> <span>Marcá el título de un grupo para activar <strong>todos</strong> sus permisos de una vez. Después destildá los que no necesites.</span>
          </div>
          {attempted && errPerms && <div style={{ marginBottom: 12 }}><ErrMsg>{errPerms}</ErrMsg></div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {grupos.length === 0 ? (
              <p style={{ margin: 0, fontSize: 14, color: "var(--fg-2)" }}>No hay permisos definidos en el sistema todavía.</p>
            ) : grupos.map((g) => <PermGroupEditor key={g.nombre} group={g} selected={selected} onToggleGroup={toggleGroup} onTogglePerm={togglePerm} />)}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 26px", borderTop: "1px solid var(--outline-variant)", background: "var(--cream-tert)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button type="button" className="btn btn-neutral" onClick={onCancel} disabled={busy}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={busy}>{busy ? <Loader size={17} className="spin" /> : <Check size={17} />} {editing ? "Guardar cambios" : "Crear rol"}</button>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, danger, disabled, title, onClick }: { icon: React.ReactNode; label: string; danger?: boolean; disabled?: boolean; title: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, padding: "8px 12px", borderRadius: "var(--radius)", border: "1px solid " + (disabled ? "var(--outline-variant)" : danger ? "var(--danger)" : "var(--sand)"), background: disabled ? "var(--cream-tert)" : "var(--surface)", color: disabled ? "var(--fg-3)" : danger ? "var(--danger)" : "var(--green-800)", cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>{icon} {label}</button>
  );
}

function Scrim({ onClose, children, width = 720 }: { onClose: () => void; children: React.ReactNode; width?: number }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(42,38,32,.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto", backdropFilter: "blur(2px)" }}>
      <div className="pop" style={{ background: "var(--surface)", width: `min(${width}px, 100%)`, borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-pop)", margin: "auto", overflow: "hidden" }}>{children}</div>
    </div>
  );
}

function Inner({ initial, grupos }: { initial: RolAdminDetalle[]; grupos: GrupoPermiso[] }) {
  // Copia local: el alta y la baja todavía son mocks (ver useRoles). Cuando se
  // wireen, esto pasa a ser `reload()` sobre el hook.
  const [roles, setRoles] = useState<RolAdminDetalle[]>(initial);
  const [form, setForm] = useState<{ open: boolean; initial: RolAdminDetalle | null }>({ open: false, initial: null });
  const [toDelete, setToDelete] = useState<RolAdminDetalle | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const { guardar, isLoading: saving } = useGuardarRol();
  const { darBaja, isLoading: deleting } = useDarBajaRol();

  const totalAdmins = roles.reduce((s, r) => s + r.cantidadUsuarios, 0);
  // Un mismo código puede repetirse en dos grupos: se cuentan los distintos.
  const permisosDisponibles = new Set(grupos.flatMap((g) => g.permisos)).size;

  function notify(msg: string) { setFlash(msg); setTimeout(() => setFlash((f) => (f === msg ? null : f)), 3200); }

  async function saveRole(role: RolAdminDetalle) {
    const editing = !!form.initial;
    await guardar(role);
    setRoles((prev) => (prev.some((r) => r.id === role.id) ? prev.map((r) => (r.id === role.id ? role : r)) : [...prev, role]));
    setForm({ open: false, initial: null });
    notify(editing ? `Se guardaron los cambios del rol «${role.nombre}».` : `Se creó el rol «${role.nombre}».`);
  }
  async function confirmDelete(role: RolAdminDetalle) {
    await darBaja(role.id);
    setRoles((prev) => prev.filter((r) => r.id !== role.id));
    setToDelete(null);
    notify(`El rol «${role.nombre}» fue dado de baja.`);
  }

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 28px 72px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13.5, marginBottom: 14 }}>
        <span>Acceso</span><ChevronRight size={15} /><span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Roles de administrador</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ minWidth: 280 }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, color: "var(--fg-1)", letterSpacing: "-.01em" }}>Roles de administrador</h1>
          <p style={{ margin: "10px 0 0", color: "var(--fg-2)", fontSize: 15.5, lineHeight: 1.5, maxWidth: 660 }}>Creá roles para el equipo de administración y elegí qué puede hacer cada uno dentro del sistema.</p>
        </div>
        <button type="button" className="btn btn-primary btn-lg" onClick={() => setForm({ open: true, initial: null })}><Plus size={18} /> Agregar rol</button>
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        {[{ icon: <ShieldCheck size={20} color="var(--green-800)" />, label: "Roles activos", value: roles.length }, { icon: <UserCog size={20} color="var(--green-800)" />, label: "Administradores con rol", value: totalAdmins }, { icon: <KeyRound size={20} color="var(--green-800)" />, label: "Permisos disponibles", value: permisosDisponibles }].map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: "12px 16px", minWidth: 190 }}>
            <span style={{ width: 42, height: 42, borderRadius: 10, background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</span>
            <span><span style={{ display: "block", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>{s.value}</span><span style={{ display: "block", fontSize: 12.5, color: "var(--fg-2)" }}>{s.label}</span></span>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
            <thead>
              <tr>{["Rol de administrador", "Permisos", "Administradores", "Acciones"].map((h, i) => (
                <th key={h} style={{ textAlign: i === 2 ? "center" : i === 3 ? "right" : "left", fontWeight: 700, color: "var(--fg-2)", fontSize: 12.5, textTransform: "uppercase", letterSpacing: ".05em", padding: "14px 16px", borderBottom: "2px solid var(--outline-variant)", whiteSpace: "nowrap" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {roles.length === 0 && (
                <tr><td colSpan={4} style={{ padding: "48px 16px", textAlign: "center", color: "var(--fg-2)", fontSize: 15 }}>Todavía no hay roles de administrador.</td></tr>
              )}
              {roles.map((r) => {
                const tieneUsuarios = r.cantidadUsuarios > 0;
                const noBorrable = tieneUsuarios || r.esProtegido;
                const delTitle = r.esProtegido ? "Este rol está protegido y no se puede dar de baja" : tieneUsuarios ? `No se puede dar de baja: tiene ${r.cantidadUsuarios} ${r.cantidadUsuarios === 1 ? "administrador asignado" : "administradores asignados"}` : "Dar de baja este rol";
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--cream-tert)" }}>
                    <td style={{ padding: "16px", verticalAlign: "top", maxWidth: 340 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16.5, color: "var(--fg-1)" }}>{r.nombre}</span>
                        {r.esProtegido && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "var(--brown-700)", background: "var(--cream-tert)", border: "1px solid var(--sand)", borderRadius: "var(--radius-pill)", padding: "3px 10px" }}><Lock size={12} color="var(--brown-700)" /> Protegido</span>}
                      </div>
                      <div style={{ fontSize: 13.5, color: "var(--fg-2)", marginTop: 4, lineHeight: 1.4 }}>{r.descripcion || "—"}</div>
                    </td>
                    <td style={{ padding: "16px", verticalAlign: "top", maxWidth: 380 }}><PermSummary perms={r.permisos} grupos={grupos} /></td>
                    <td style={{ padding: "16px", textAlign: "center", verticalAlign: "top" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, color: tieneUsuarios ? "var(--fg-1)" : "var(--fg-3)" }}><Users size={16} color={tieneUsuarios ? "var(--brown-700)" : "var(--fg-3)"} /> {r.cantidadUsuarios}</span>
                    </td>
                    <td style={{ padding: "16px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <ActionBtn icon={<Pencil size={17} />} label="Modificar" disabled={r.esProtegido} title={r.esProtegido ? "Este rol está protegido y no se puede modificar" : "Modificar este rol"} onClick={() => setForm({ open: true, initial: r })} />
                        <ActionBtn icon={<Trash2 size={17} />} label="Borrar" danger disabled={noBorrable} title={delTitle} onClick={() => setToDelete(r)} />
                      </div>
                      {tieneUsuarios && !r.esProtegido && <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginTop: 8, fontSize: 11.5, color: "var(--fg-3)" }}><Lock size={13} color="var(--fg-3)" /> No se puede borrar con administradores</div>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 16, color: "var(--fg-3)", fontSize: 13 }}>
        <Info size={16} color="var(--fg-3)" /> Los roles marcados como <strong style={{ color: "var(--fg-2)", fontWeight: 600, margin: "0 4px" }}>Protegidos</strong> son del sistema: no se pueden modificar ni dar de baja.
      </div>

      {form.open && (
        <Scrim onClose={() => setForm({ open: false, initial: null })}>
          <RoleForm initial={form.initial} grupos={grupos} existingNames={roles.filter((r) => !form.initial || r.id !== form.initial!.id).map((r) => r.nombre)} busy={saving} onCancel={() => setForm({ open: false, initial: null })} onSave={saveRole} />
        </Scrim>
      )}

      {toDelete && (
        <Scrim onClose={() => setToDelete(null)} width={460}>
          <div style={{ padding: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <span style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--danger-fill)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Trash2 size={22} color="var(--danger)" /></span>
              <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>Dar de baja el rol</h3>
            </div>
            <p style={{ margin: "0 0 22px", color: "var(--fg-2)", fontSize: 15, lineHeight: 1.55 }}>¿Seguro que querés dar de baja el rol <strong style={{ color: "var(--fg-1)" }}>«{toDelete.nombre}»</strong>? Dejará de estar disponible para asignar a nuevos administradores.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button type="button" className="btn btn-neutral" onClick={() => setToDelete(null)} disabled={deleting}>No, volver</button>
              <button type="button" className="btn" onClick={() => confirmDelete(toDelete)} disabled={deleting} style={{ background: "var(--danger)", color: "#fff", boxShadow: "inset 0 -2px 0 var(--danger-fg)" }}>{deleting ? <Loader size={17} className="spin" /> : <Trash2 size={17} />} Sí, dar de baja</button>
            </div>
          </div>
        </Scrim>
      )}

      {flash && (
        <div className="pop" style={{ position: "fixed", left: "calc(50% + 132px)", bottom: 28, transform: "translateX(-50%)", zIndex: 80, background: "var(--green-800)", color: "#fff", borderRadius: "var(--radius)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "var(--shadow-pop)", fontSize: 15, fontWeight: 500, maxWidth: "calc(100vw - 40px)" }}>
          <CheckCircle2 size={20} color="#fff" /> {flash}
        </div>
      )}
    </div>
  );
}

export default function RolesClient() {
  const { roles, grupos, isLoading, error, reload } = useRoles();
  return (
    <AdminShell active="roles">
      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando roles…">
        <Inner initial={roles} grupos={grupos} />
      </AsyncBoundary>
    </AdminShell>
  );
}
