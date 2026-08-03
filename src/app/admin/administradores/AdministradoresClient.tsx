"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserPlus, X, AlertCircle, ShieldCheck, Crown, Pencil, Trash2, Info,
  ChevronRight, CheckCircle2, UserCog, Loader,
} from "lucide-react";
import AsyncBoundary from "@/components/AsyncBoundary";
import AdminShell from "@/components/admin/AdminShell";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui";
import { EMAIL_RE } from "@/data/auth";
import { admInitials } from "@/data/admin";
import {
  useAdministradores, useCrearAdmin, useRolesAdmin, useUsuarioCard,
} from "@/hooks/useAdmins";
import type { AdminSistema, RolAdmin } from "@/types/admin";
import { nuevoAdminSchema, NUEVO_ADMIN_INICIAL, type NuevoAdminForm } from "./schema";

/** Mensajes de error del alta que devuelve el backend. */
const CODIGO_ALTA: Record<string, string> = {
  "AS.adminAlreadyExists": "Esa persona ya es administradora del sistema.",
  "AS.usuarioNotFound": "No hay ninguna cuenta registrada con ese correo.",
};

function ErrMsg({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--danger-fg)" }}>
      <AlertCircle size={15} color="var(--danger)" /> {children}
    </div>
  );
}

function RolePicker({
  roles,
  value,
  onChange,
}: {
  roles: RolAdmin[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (roles.length === 0) {
    return <p style={{ margin: 0, fontSize: 13, color: "var(--fg-3)" }}>No hay roles disponibles para asignar.</p>;
  }
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

/** Estado de la cuenta tipeada: confirma quién es, o por qué no sirve. */
function CuentaPreview({
  email,
  yaEsAdmin,
  card,
  estado,
}: {
  email: string;
  yaEsAdmin: boolean;
  card: { nombre: string; identificacion: string } | null;
  estado: "idle" | "buscando" | "encontrado" | "no-existe" | "error";
}) {
  const hint = (t: string) => <p style={{ margin: 0, fontSize: 12.5, color: "var(--fg-3)" }}>{t}</p>;

  if (!email || !EMAIL_RE.test(email)) {
    return hint("Debe ser el correo de un usuario ya registrado en la plataforma.");
  }
  if (estado === "buscando") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--fg-3)" }}>
        <Loader size={14} className="spin" /> Buscando la cuenta…
      </div>
    );
  }
  if (estado === "no-existe") return <ErrMsg>No hay ninguna cuenta registrada con ese correo.</ErrMsg>;
  if (estado === "error") return hint("No pudimos verificar la cuenta. Se validará al confirmar el alta.");
  if (!card) return hint("Debe ser el correo de un usuario ya registrado en la plataforma.");
  if (yaEsAdmin) return <ErrMsg>Esa persona ya es administradora del sistema.</ErrMsg>;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--green-050)", border: "1px solid var(--green-300)", borderRadius: "var(--radius)", padding: "10px 12px" }}>
      <span style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "var(--surface)", border: "1px solid var(--green-300)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "var(--green-800)" }}>{admInitials(card.nombre)}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14.5, color: "var(--green-800)" }}>{card.nombre}</span>
        <span style={{ display: "block", fontSize: 12, color: "var(--fg-2)" }}>Cuenta registrada · {card.identificacion}</span>
      </span>
    </div>
  );
}

function NuevoAdminForm({
  roles,
  rolesLoading,
  existentes,
  onCancel,
  onCreado,
}: {
  roles: RolAdmin[];
  rolesLoading: boolean;
  existentes: AdminSistema[];
  onCancel: () => void;
  onCreado: (a: AdminSistema) => void;
}) {
  const { crear, isLoading: saving } = useCrearAdmin();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<NuevoAdminForm>({
    resolver: zodResolver(nuevoAdminSchema),
    defaultValues: NUEVO_ADMIN_INICIAL,
    mode: "onTouched",
  });

  const email = useWatch({ control: form.control, name: "email" }).trim();
  const emailValido = EMAIL_RE.test(email);
  const { card, estado } = useUsuarioCard(email, emailValido);

  // El endpoint de la card no dice si ya es administradora: se compara por
  // identificación contra la lista vigente, que es el dato que ambos comparten.
  const yaEsAdmin =
    !!card && existentes.some((a) => a.identificacion === card.identificacion);

  const bloqueado = saving || estado === "buscando" || estado === "no-existe" || yaEsAdmin;

  async function onValid(data: NuevoAdminForm) {
    setSubmitError(null);
    const r = await crear(data.email.trim(), data.rolId);
    if (r.ok && r.admin) {
      onCreado(r.admin);
      return;
    }
    const msg = r.code ? CODIGO_ALTA[r.code] : undefined;
    if (msg) {
      form.setError("email", { message: msg }, { shouldFocus: true });
      return;
    }
    setSubmitError("No pudimos agregar al administrador. Intentá de nuevo en unos minutos.");
  }

  const lbl: React.CSSProperties = { display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)", marginBottom: 8 };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onValid)} noValidate style={{ display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 80px)" }}>
        <div style={{ padding: "22px 26px", borderBottom: "1px solid var(--outline-variant)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div className="t-label" style={{ marginBottom: 6 }}>Nuevo administrador</div>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "var(--fg-1)" }}>Agregar administrador</h2>
            <p style={{ margin: "6px 0 0", color: "var(--fg-2)", fontSize: 14, maxWidth: 460, lineHeight: 1.5 }}>Ingresá el correo de un usuario registrado y elegí su rol. Queda activo en el sistema de inmediato.</p>
          </div>
          <button type="button" onClick={onCancel} aria-label="Cerrar" style={{ width: 42, height: 42, flexShrink: 0, borderRadius: "var(--radius)", border: "1px solid var(--outline-variant)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} color="var(--fg-2)" /></button>
        </div>

        <div style={{ padding: "22px 26px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel required style={lbl}>Correo electrónico</FormLabel>
                <FormControl>
                  <TextField {...field} type="email" inputMode="email" autoComplete="off" placeholder="nombre@mendozaagrotours.gob.ar" />
                </FormControl>
                <div style={{ marginTop: 7 }}>
                  {fieldState.error ? (
                    <FormMessage />
                  ) : (
                    <CuentaPreview email={email} yaEsAdmin={yaEsAdmin} card={card} estado={estado} />
                  )}
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rolId"
            render={({ field }) => (
              <FormItem>
                <FormLabel required style={{ ...lbl, marginBottom: 10 }}>Rol asignado</FormLabel>
                <div style={{ marginBottom: 12 }}><FormMessage /></div>
                <FormControl>
                  {rolesLoading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--fg-3)" }}>
                      <Loader size={15} className="spin" /> Cargando roles…
                    </div>
                  ) : (
                    <RolePicker roles={roles} value={field.value} onChange={field.onChange} />
                  )}
                </FormControl>
              </FormItem>
            )}
          />

          {submitError && <ErrMsg>{submitError}</ErrMsg>}
        </div>

        <div style={{ padding: "16px 26px", borderTop: "1px solid var(--outline-variant)", background: "var(--cream-tert)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="neutral" onClick={onCancel} disabled={saving}>Cancelar</Button>
          <Button type="submit" variant="primary" disabled={bloqueado}>
            {saving ? <Loader size={17} className="spin" /> : <UserPlus size={17} />} Agregar administrador
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ActionBtn({ icon, label, danger, title }: { icon: React.ReactNode; label: string; danger?: boolean; title: string }) {
  return (
    <button type="button" disabled title={title} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 14, padding: "8px 12px", borderRadius: "var(--radius)", border: "1px solid var(--outline-variant)", background: "var(--cream-tert)", color: "var(--fg-3)", cursor: "not-allowed", whiteSpace: "nowrap" }}>
      {icon} {label}{danger ? "" : ""}
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

function Inner() {
  const { administradores, isLoading, error, reload, agregar } = useAdministradores();
  const { roles, isLoading: rolesLoading } = useRolesAdmin();
  const [abierto, setAbierto] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  function notify(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash((f) => (f === msg ? null : f)), 3400);
  }

  function onCreado(a: AdminSistema) {
    agregar(a);
    setAbierto(false);
    notify(`Se agregó a ${a.nombreUsuario} al sistema.`);
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
        <button type="button" className="btn btn-primary btn-lg" onClick={() => setAbierto(true)}><UserPlus size={18} /> Agregar administrador</button>
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        {[
          { icon: <UserCog size={20} color="var(--green-800)" />, label: "Administradores activos", value: administradores.length },
          { icon: <ShieldCheck size={20} color="var(--green-800)" />, label: "Roles disponibles", value: roles.length },
        ].map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius)", padding: "12px 16px", minWidth: 190 }}>
            <span style={{ width: 42, height: 42, borderRadius: 10, background: "var(--green-050)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.icon}</span>
            <span><span style={{ display: "block", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color: "var(--fg-1)" }}>{s.value}</span><span style={{ display: "block", fontSize: 12.5, color: "var(--fg-2)" }}>{s.label}</span></span>
          </div>
        ))}
      </div>

      <AsyncBoundary loading={isLoading} error={error} onRetry={reload} loadingLabel="Cargando administradores…" pad={72}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
              <thead>
                <tr>{["Administrador", "Correo electrónico", "Identificación", "Rol asignado", "Acciones"].map((h, i) => (
                  <th key={h} style={{ textAlign: i === 4 ? "right" : "left", fontWeight: 700, color: "var(--fg-2)", fontSize: 12.5, textTransform: "uppercase", letterSpacing: ".05em", padding: "14px 18px", borderBottom: "2px solid var(--outline-variant)", whiteSpace: "nowrap" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {administradores.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "56px 24px", textAlign: "center", color: "var(--fg-3)", fontSize: 15 }}>
                      Todavía no hay administradores cargados.
                    </td>
                  </tr>
                ) : administradores.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--cream-tert)" }}>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span style={{ width: 42, height: 42, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--green-050)", border: "1px solid var(--green-300)", color: "var(--green-800)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15.5 }}>{admInitials(p.nombreUsuario)}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: "var(--fg-1)" }}>{p.nombreUsuario}</span>
                          {p.esLider && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "var(--brown-700)", background: "var(--cream-tert)", border: "1px solid var(--sand)", borderRadius: "var(--radius-pill)", padding: "3px 10px" }}><Crown size={12} color="var(--brown-700)" /> Líder</span>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", fontFamily: "var(--font-mono)", fontSize: 13.5, color: "var(--fg-1)" }}>{p.emailUsuario}</td>
                    <td style={{ padding: "14px 18px", fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--fg-1)" }}>{p.identificacion}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--green-050)", border: "1px solid var(--green-300)", borderRadius: "var(--radius-pill)", padding: "5px 11px", fontSize: 13, color: "var(--green-800)", fontWeight: 600, whiteSpace: "nowrap" }}><ShieldCheck size={14} color="var(--green-700)" /> {p.nombreRol}</span>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      {/* TODO backend: faltan los endpoints de modificar rol y baja. */}
                      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <ActionBtn icon={<Pencil size={17} />} label="Modificar rol" title="Próximamente" />
                        <ActionBtn icon={<Trash2 size={17} />} label="Borrar" danger title="Próximamente" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AsyncBoundary>

      <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 16, color: "var(--fg-3)", fontSize: 13 }}>
        <Info size={16} color="var(--fg-3)" /> El <strong style={{ color: "var(--fg-2)", fontWeight: 600, margin: "0 4px" }}>administrador líder</strong> es una figura protegida: no se puede borrar ni cambiarle el rol.
      </div>

      {abierto && (
        <Scrim onClose={() => setAbierto(false)}>
          <NuevoAdminForm
            roles={roles}
            rolesLoading={rolesLoading}
            existentes={administradores}
            onCancel={() => setAbierto(false)}
            onCreado={onCreado}
          />
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
  return (
    <AdminShell active="admins">
      <Inner />
    </AdminShell>
  );
}
