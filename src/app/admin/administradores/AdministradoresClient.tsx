"use client";

import { useEffect, useState } from "react";
import {
  UserPlus, X, AlertCircle, ShieldCheck, Crown, Pencil, Trash2, UserMinus, Info,
  ChevronRight, Check, CheckCircle2, UserCog, Loader,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { ADMIN_SEED_ROLES, ADMIN_ROLE_BY_ID, admInitials, findRegisteredUser } from "@/data/admin";
import { genId } from "@/lib/id";
import { useAdministradores, useGuardarAdmin, useEliminarAdmin } from "@/hooks/useAdmins";
import type { AdminPerson } from "@/types/admin";

const inputStyle: React.CSSProperties = {
  width: "100%", fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--fg-1)",
  borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--sand)",
  padding: "12px 14px", outline: "none", boxSizing: "border-box",
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ErrMsg({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--danger-fg)" }}><AlertCircle size={15} color="var(--danger)" /> {children}</div>;
}

function RolePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const roles = ADMIN_SEED_ROLES.filter((r) => !r.baja && !r.lider);
  return (
    <div role="radiogroup" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {roles.map((r) => {
        const on = value === r.id;
        return (
          <button key={r.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(r.id)} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", background: on ? "var(--green-050)" : "var(--surface)", border: "1px solid " + (on ? "var(--green-800)" : "var(--outline-variant)"), boxShadow: on ? "inset 0 -2px 0 var(--green-100)" : "none", borderRadius: "var(--radius)", padding: "12px 14px", cursor: "pointer" }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, border: "2px solid " + (on ? "var(--green-800)" : "var(--sand)"), background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>{on && <span style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--green-800)" }} />}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15.5, color: on ? "var(--green-800)" : "var(--fg-1)" }}>{r.nombre}</span>
              <span style={{ display: "block", fontSize: 12.5, color: "var(--fg-3)", marginTop: 2, lineHeight: 1.4 }}>{r.descripcion}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PersonForm({ initial, existingEmails, busy, onCancel, onSave }: { initial: AdminPerson | null; existingEmails: string[]; busy: boolean; onCancel: () => void; onSave: (p: AdminPerson) => void }) {
  const editing = !!initial;
  const [email, setEmail] = useState(initial?.email ?? "");
  const [rolId, setRolId] = useState(initial?.rolId ?? "");
  const [attempted, setAttempted] = useState(false);

  const norm = (s: string) => s.trim().toLowerCase();
  const match = !editing && email.trim() ? findRegisteredUser(email) : null;
  const isDup = !editing && !!email.trim() && existingEmails.map(norm).includes(norm(email));
  const errEmail = editing ? "" : !email.trim() ? "Ingresá el correo electrónico de la persona." : !EMAIL_RE.test(email.trim()) ? "Escribí un correo electrónico válido." : isDup ? "Esa persona ya es administradora del sistema." : !match ? "No hay ninguna cuenta registrada con ese correo." : "";
  const errRol = !rolId ? "Elegí un rol para asignar al administrador." : "";
  const showEmail = (attempted && errEmail) || (isDup ? errEmail : "");
  const showRol = attempted && errRol;

  function handleSave() {
    setAttempted(true);
    if (errEmail || errRol) return;
    if (editing && initial) onSave({ ...initial, rolId });
    else if (match) onSave({ id: genId("a"), nombre: match.nombre, email: match.email, dni: match.dni, rolId, estado: "activo" });
  }

  const lbl: React.CSSProperties = { display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)", marginBottom: 8 };

  return (
    <div style={{ display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 80px)" }}>
      <div style={{ padding: "22px 26px", borderBottom: "1px solid var(--outline-variant)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div className="t-label" style={{ marginBottom: 6 }}>{editing ? "Modificar administrador" : "Nuevo administrador"}</div>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "var(--fg-1)" }}>{editing ? "Cambiar el rol asignado" : "Agregar administrador"}</h2>
          <p style={{ margin: "6px 0 0", color: "var(--fg-2)", fontSize: 14, maxWidth: 460, lineHeight: 1.5 }}>{editing ? "Solo podés cambiar el rol del administrador. El resto de los datos no se modifican desde acá." : "Ingresá el correo de un usuario registrado y elegí su rol. Queda activo en el sistema de inmediato."}</p>
        </div>
        <button type="button" onClick={onCancel} aria-label="Cerrar" style={{ width: 42, height: 42, flexShrink: 0, borderRadius: "var(--radius)", border: "1px solid var(--outline-variant)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} color="var(--fg-2)" /></button>
      </div>

      <div style={{ padding: "22px 26px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
        {editing && initial ? (
          <div style={{ border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", padding: "6px 16px 12px", background: "var(--cream-tert)" }}>
            {[["Nombre", initial.nombre], ["Correo electrónico", initial.email], ["Identificación", initial.dni]].map(([l, v]) => (
              <div key={l} style={{ padding: "10px 0", borderBottom: "1px dashed var(--cream-tert)" }}>
                <div className="t-label">{l}</div>
                <div style={{ fontSize: 14.5, color: "var(--fg-1)", marginTop: 2, fontFamily: l === "Nombre" ? "var(--font-sans)" : "var(--font-mono)" }}>{v}</div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <label htmlFor="adm-email" style={lbl}>Correo electrónico <span style={{ color: "var(--danger)" }}>*</span></label>
            <input id="adm-email" type="email" autoComplete="off" placeholder="nombre@mendozaagrotours.gob.ar" value={email} onChange={(e) => setEmail(e.target.value)} style={showEmail ? { ...inputStyle, borderColor: "var(--danger)" } : inputStyle} />
            <div style={{ marginTop: 7 }}>
              {showEmail ? <ErrMsg>{errEmail}</ErrMsg> : match && !isDup ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--green-050)", border: "1px solid var(--green-300)", borderRadius: "var(--radius)", padding: "10px 12px" }}>
                  <span style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "var(--surface)", border: "1px solid var(--green-300)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--green-800)" }}>{admInitials(match.nombre)}</span>
                  <span>
                    <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14.5, color: "var(--green-800)" }}>{match.nombre}</span>
                    <span style={{ display: "block", fontSize: 12, color: "var(--fg-2)" }}>Cuenta registrada · {match.dni}</span>
                  </span>
                </div>
              ) : <p style={{ margin: 0, fontSize: 12.5, color: "var(--fg-3)" }}>Debe ser el correo de un usuario ya registrado en la plataforma.</p>}
            </div>
          </div>
        )}
        <div>
          <label style={{ ...lbl, marginBottom: 10 }}>Rol asignado <span style={{ color: "var(--danger)" }}>*</span></label>
          {showRol && <div style={{ marginBottom: 12 }}><ErrMsg>{errRol}</ErrMsg></div>}
          <RolePicker value={rolId} onChange={setRolId} />
        </div>
      </div>

      <div style={{ padding: "16px 26px", borderTop: "1px solid var(--outline-variant)", background: "var(--cream-tert)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
        <button type="button" className="btn btn-neutral" onClick={onCancel} disabled={busy}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={busy}>
          {busy ? <Loader size={17} className="spin" /> : editing ? <Check size={17} /> : <UserPlus size={17} />} {editing ? "Guardar cambios" : "Agregar administrador"}
        </button>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, danger, disabled, title, onClick }: { icon: React.ReactNode; label: string; danger?: boolean; disabled?: boolean; title: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, padding: "8px 12px", borderRadius: "var(--radius)", border: "1px solid " + (disabled ? "var(--outline-variant)" : danger ? "var(--danger)" : "var(--sand)"), background: disabled ? "var(--cream-tert)" : "var(--surface)", color: disabled ? "var(--fg-3)" : danger ? "var(--danger)" : "var(--green-800)", cursor: disabled ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
      {icon} {label}
    </button>
  );
}

function Scrim({ onClose, children, width = 620 }: { onClose: () => void; children: React.ReactNode; width?: number }) {
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

function Inner({ initial }: { initial: AdminPerson[] }) {
  const [people, setPeople] = useState<AdminPerson[]>(initial);
  const [form, setForm] = useState<{ open: boolean; initial: AdminPerson | null }>({ open: false, initial: null });
  const [toDelete, setToDelete] = useState<AdminPerson | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const { guardar, isLoading: saving } = useGuardarAdmin();
  const { eliminar, isLoading: deleting } = useEliminarAdmin();

  const activos = people.filter((p) => p.estado === "activo").length;
  const rolesDisp = ADMIN_SEED_ROLES.filter((r) => !r.baja).length;

  function notify(msg: string) { setFlash(msg); setTimeout(() => setFlash((f) => (f === msg ? null : f)), 3400); }

  async function savePerson(person: AdminPerson) {
    const editing = !!form.initial;
    await guardar(person);
    setPeople((prev) => (prev.some((p) => p.id === person.id) ? prev.map((p) => (p.id === person.id ? person : p)) : [...prev, person]));
    setForm({ open: false, initial: null });
    const rol = ADMIN_ROLE_BY_ID[person.rolId];
    notify(editing ? `Se actualizó el rol de ${person.nombre} a «${rol?.nombre ?? ""}».` : `Se agregó a ${person.nombre} al sistema.`);
  }
  async function confirmDelete(person: AdminPerson) {
    await eliminar(person.id);
    setPeople((prev) => prev.filter((p) => p.id !== person.id));
    setToDelete(null);
    notify(`Se quitó a ${person.nombre} del sistema.`);
  }

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", padding: "28px 28px 72px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--fg-3)", fontSize: 13.5, marginBottom: 14 }}>
        <span>Acceso</span><ChevronRight size={15} /><span style={{ color: "var(--fg-2)", fontWeight: 500 }}>Administradores</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ minWidth: 280 }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 34, color: "var(--fg-1)", letterSpacing: "-.01em" }}>Administradores del sistema</h1>
          <p style={{ margin: "10px 0 0", color: "var(--fg-2)", fontSize: 15.5, lineHeight: 1.5, maxWidth: 660 }}>Sumá a las personas del equipo de administración y asignales un rol. Quedan activas de inmediato; el rol define qué puede hacer cada una.</p>
        </div>
        <button type="button" className="btn btn-primary btn-lg" onClick={() => setForm({ open: true, initial: null })}><UserPlus size={18} /> Agregar administrador</button>
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        {[{ icon: <UserCog size={20} color="var(--green-800)" />, label: "Administradores activos", value: activos }, { icon: <ShieldCheck size={20} color="var(--green-800)" />, label: "Roles disponibles", value: rolesDisp }].map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: "12px 16px", minWidth: 190 }}>
            <span style={{ width: 42, height: 42, borderRadius: 10, background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</span>
            <span><span style={{ display: "block", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>{s.value}</span><span style={{ display: "block", fontSize: 12.5, color: "var(--fg-2)" }}>{s.label}</span></span>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
            <thead>
              <tr>{["Administrador", "Correo electrónico", "Identificación", "Rol asignado", "Acciones"].map((h, i) => (
                <th key={h} style={{ textAlign: i === 4 ? "right" : "left", fontWeight: 700, color: "var(--fg-2)", fontSize: 12.5, textTransform: "uppercase", letterSpacing: ".05em", padding: "14px 18px", borderBottom: "2px solid var(--outline-variant)", whiteSpace: "nowrap" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {people.map((p) => {
                const rol = ADMIN_ROLE_BY_ID[p.rolId];
                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--cream-tert)" }}>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--green-050)", border: "1px solid var(--green-300)", color: "var(--green-800)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15.5 }}>{admInitials(p.nombre)}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>{p.nombre}</span>
                          {p.lider && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "var(--brown-700)", background: "var(--cream-tert)", border: "1px solid var(--sand)", borderRadius: "var(--radius-pill)", padding: "3px 10px" }}><Crown size={12} color="var(--brown-700)" /> Líder</span>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", fontFamily: "var(--font-mono)", fontSize: 13.5, color: "var(--fg-1)" }}>{p.email}</td>
                    <td style={{ padding: "14px 18px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--fg-1)" }}>{p.dni}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--green-050)", border: "1px solid var(--green-300)", borderRadius: "var(--radius-pill)", padding: "5px 11px", fontSize: 13, color: "var(--green-800)", fontWeight: 600, whiteSpace: "nowrap" }}><ShieldCheck size={14} color="var(--green-700)" /> {rol?.nombre ?? "—"}</span>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <ActionBtn icon={<Pencil size={17} />} label="Modificar rol" disabled={p.lider} title={p.lider ? "El rol del administrador líder no se puede cambiar" : "Cambiar el rol asignado"} onClick={() => setForm({ open: true, initial: p })} />
                        <ActionBtn icon={<Trash2 size={17} />} label="Borrar" danger disabled={p.lider} title={p.lider ? "El administrador líder no se puede borrar" : "Quitar este administrador"} onClick={() => setToDelete(p)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 16, color: "var(--fg-3)", fontSize: 13 }}>
        <Info size={16} color="var(--fg-3)" /> El <strong style={{ color: "var(--fg-2)", fontWeight: 600, margin: "0 4px" }}>administrador líder</strong> es una figura protegida: no se puede borrar ni cambiarle el rol.
      </div>

      {form.open && (
        <Scrim onClose={() => setForm({ open: false, initial: null })}>
          <PersonForm initial={form.initial} existingEmails={people.map((p) => p.email)} busy={saving} onCancel={() => setForm({ open: false, initial: null })} onSave={savePerson} />
        </Scrim>
      )}

      {toDelete && (
        <Scrim onClose={() => setToDelete(null)} width={460}>
          <div style={{ padding: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <span style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--danger-fill)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><UserMinus size={22} color="var(--danger)" /></span>
              <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>Borrar administrador</h3>
            </div>
            <p style={{ margin: "0 0 22px", color: "var(--fg-2)", fontSize: 15, lineHeight: 1.55 }}>¿Seguro que querés quitar a <strong style={{ color: "var(--fg-1)" }}>{toDelete.nombre}</strong> del sistema? Perderá el acceso al panel de administración.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button type="button" className="btn btn-neutral" onClick={() => setToDelete(null)} disabled={deleting}>No, volver</button>
              <button type="button" className="btn" onClick={() => confirmDelete(toDelete)} disabled={deleting} style={{ background: "var(--danger)", color: "#fff", boxShadow: "inset 0 -2px 0 var(--danger-fg)" }}>{deleting ? <Loader size={17} className="spin" /> : <Trash2 size={17} />} Sí, borrar</button>
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

export default function AdministradoresClient() {
  const { data, isLoading } = useAdministradores();
  return (
    <AdminShell active="admins">
      {isLoading || !data ? (
        <div style={{ padding: "120px 28px", textAlign: "center", color: "var(--fg-3)" }}><Loader size={26} className="spin" /><div style={{ marginTop: 12, fontSize: 14 }}>Cargando administradores…</div></div>
      ) : (
        <Inner initial={data} />
      )}
    </AdminShell>
  );
}
