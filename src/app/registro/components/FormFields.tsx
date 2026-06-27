"use client";

import { useState, useEffect, useRef } from "react";
import {
  AlertCircle, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Check, CheckCircle2, Circle, ShieldCheck, Info, CalendarDays,
  Eye, EyeOff, Flag as FlagIcon,
} from "lucide-react";
import type { Pais } from "@/data/registro";

/* ---- Field wrapper --------------------------------------------------- */
interface FieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string | false | null;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

export function Field({ label, required, optional, error, hint, children, htmlFor }: FieldProps) {
  return (
    <div className="field" style={{ gap: 7 }}>
      <label
        htmlFor={htmlFor}
        style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13.5, fontWeight: 600, color: "var(--fg-1)" }}
      >
        {label}
        {required && <span style={{ color: "var(--danger)" }}>*</span>}
        {optional && (
          <span style={{ fontSize: 11.5, fontWeight: 500, color: "var(--fg-3)", fontStyle: "italic" }}>(opcional)</span>
        )}
      </label>
      {children}
      {error ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--danger-fg)" }}>
          <AlertCircle size={14} />
          {error}
        </div>
      ) : hint ? (
        <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{hint}</div>
      ) : null}
    </div>
  );
}

/* ---- Text input ------------------------------------------------------ */
interface TextInputProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  error?: string | false | null;
  icon?: React.ReactNode;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  rightSlot?: React.ReactNode;
}

export function TextInput({
  id, value, onChange, error, icon, type = "text",
  placeholder, maxLength, inputMode, autoComplete, rightSlot,
}: TextInputProps) {
  const [focus, setFocus] = useState(false);
  const errored = !!error;
  const tight = focus || errored;
  const iconColor = focus ? "var(--green-800)" : errored ? "var(--danger)" : "var(--fg-3)";

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
      {icon && (
        <span style={{ position: "absolute", left: 14, color: iconColor, display: "inline-flex", pointerEvents: "none" }}>
          {icon}
        </span>
      )}
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: "100%",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--body)",
          color: "var(--fg-1)",
          borderRadius: "var(--radius)",
          background: errored && !focus ? "var(--danger-fill)" : "var(--surface)",
          border: focus
            ? "2px solid var(--green-800)"
            : errored
            ? "2px solid var(--danger)"
            : "1px solid var(--sand)",
          padding: tight ? "12px 14px" : "13px 15px",
          paddingLeft: icon ? (tight ? 43 : 44) : tight ? 14 : 15,
          paddingRight: rightSlot ? 44 : tight ? 14 : 15,
          boxSizing: "border-box",
          outline: "none",
          transition: "border-color .16s, background-color .16s",
        }}
      />
      {rightSlot && <span style={{ position: "absolute", right: 10 }}>{rightSlot}</span>}
    </div>
  );
}

/* ---- Generic searchable select --------------------------------------- */
interface SelectInputProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  options: readonly string[];
  placeholder?: string;
  icon?: React.ReactNode;
  error?: string | false | null;
}

export function SelectInput({ id, value, onChange, options, placeholder, icon, error }: SelectInputProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQ("");
      }
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const errored = !!error;
  const filtered = options.filter((o) => o.toLowerCase().includes(q.toLowerCase()));

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          borderRadius: "var(--radius)",
          cursor: "pointer",
          textAlign: "left",
          background: errored && !open ? "var(--danger-fill)" : "var(--surface)",
          border: open
            ? "2px solid var(--green-800)"
            : errored
            ? "2px solid var(--danger)"
            : "1px solid var(--sand)",
          padding: open || errored ? "12px 14px" : "13px 15px",
          fontFamily: "var(--font-sans)",
          fontSize: "var(--body)",
          color: value ? "var(--fg-1)" : "var(--fg-3)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          {icon && (
            <span style={{ color: value ? "var(--green-800)" : errored ? "var(--danger)" : "var(--fg-3)" }}>
              {icon}
            </span>
          )}
          {value || placeholder}
        </span>
        <ChevronDown size={16} color="var(--fg-3)" />
      </button>

      {open && (
        <div
          className="pop"
          style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 50,
            background: "var(--surface)", borderRadius: "var(--radius-lg)",
            border: "1px solid var(--outline-variant)", boxShadow: "var(--shadow-pop)", overflow: "hidden",
          }}
        >
          <div style={{ padding: 10, borderBottom: "1px solid var(--cream-tert)" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <span style={{ position: "absolute", left: 10, color: "var(--fg-3)", display: "inline-flex" }}>
                <Search size={15} />
              </span>
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar…"
                style={{
                  width: "100%", border: "1px solid var(--sand)", borderRadius: 8,
                  padding: "8px 10px 8px 32px", fontFamily: "var(--font-sans)",
                  fontSize: 13.5, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 240, overflowY: "auto", padding: 6 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "14px 12px", fontSize: 13, color: "var(--fg-3)", textAlign: "center" }}>
                Sin resultados
              </div>
            ) : (
              filtered.map((o) => {
                const sel = o === value;
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => { onChange(o); setOpen(false); setQ(""); }}
                    onMouseEnter={(e) => { if (!sel) (e.currentTarget as HTMLButtonElement).style.background = "var(--cream-tert)"; }}
                    onMouseLeave={(e) => { if (!sel) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    style={{
                      width: "100%", textAlign: "left", padding: "9px 12px",
                      borderRadius: 8, border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: sel ? "var(--green-050)" : "transparent",
                      color: "var(--fg-1)", fontFamily: "var(--font-sans)",
                      fontSize: 14, fontWeight: sel ? 600 : 400,
                    }}
                  >
                    {o}
                    {sel && <Check size={16} color="var(--green-800)" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Flag image (flagcdn) -------------------------------------------- */
function Flag({ code, size = 22 }: { code: string; size?: number }) {
  const w = size, h = Math.round(size * 0.75);
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      width={w}
      height={h}
      alt=""
      style={{
        width: w, height: h, flexShrink: 0, objectFit: "cover",
        borderRadius: 3, boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)", display: "block",
      }}
    />
  );
}

/* ---- Country select (país + bandera) --------------------------------- */
interface CountrySelectProps {
  id?: string;
  value: string;
  onChange: (val: string) => void;
  options: readonly Pais[];
  placeholder?: string;
  error?: string | false | null;
}

export function CountrySelect({ id, value, onChange, options, placeholder, error }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQ("");
      }
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const errored = !!error;
  const selected = options.find((o) => o.name === value) ?? null;
  const filtered = options.filter((o) => o.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 10,
          borderRadius: "var(--radius)", cursor: "pointer", textAlign: "left",
          background: errored && !open ? "var(--danger-fill)" : "var(--surface)",
          border: open
            ? "2px solid var(--green-800)"
            : errored
            ? "2px solid var(--danger)"
            : "1px solid var(--sand)",
          padding: open || errored ? "12px 14px" : "13px 15px",
          fontFamily: "var(--font-sans)", fontSize: "var(--body)",
          color: selected ? "var(--fg-1)" : "var(--fg-3)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 11, minWidth: 0 }}>
          {selected ? (
            <Flag code={selected.code} size={24} />
          ) : (
            <FlagIcon size={18} color="var(--fg-3)" />
          )}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selected ? selected.name : placeholder}
          </span>
        </span>
        <ChevronDown size={16} color="var(--fg-3)" />
      </button>

      {open && (
        <div
          className="pop"
          style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 50,
            background: "var(--surface)", borderRadius: "var(--radius-lg)",
            border: "1px solid var(--outline-variant)", boxShadow: "var(--shadow-pop)", overflow: "hidden",
          }}
        >
          <div style={{ padding: 10, borderBottom: "1px solid var(--cream-tert)" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <span style={{ position: "absolute", left: 10, color: "var(--fg-3)", display: "inline-flex" }}>
                <Search size={15} />
              </span>
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar país…"
                style={{
                  width: "100%", border: "1px solid var(--sand)", borderRadius: 8,
                  padding: "8px 10px 8px 32px", fontFamily: "var(--font-sans)",
                  fontSize: 13.5, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          <div style={{ maxHeight: 240, overflowY: "auto", padding: 6 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "14px 12px", fontSize: 13, color: "var(--fg-3)", textAlign: "center" }}>
                Sin resultados
              </div>
            ) : (
              filtered.map((o) => {
                const sel = o.name === value;
                return (
                  <button
                    key={o.code}
                    type="button"
                    onClick={() => { onChange(o.name); setOpen(false); setQ(""); }}
                    onMouseEnter={(e) => { if (!sel) (e.currentTarget as HTMLButtonElement).style.background = "var(--cream-tert)"; }}
                    onMouseLeave={(e) => { if (!sel) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    style={{
                      width: "100%", textAlign: "left", padding: "9px 12px",
                      borderRadius: 8, border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                      background: sel ? "var(--green-050)" : "transparent",
                      color: "var(--fg-1)", fontFamily: "var(--font-sans)",
                      fontSize: 14, fontWeight: sel ? 600 : 400,
                    }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 11 }}>
                      <Flag code={o.code} size={24} />
                      {o.name}
                    </span>
                    {sel && <Check size={16} color="var(--green-800)" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Date picker ----------------------------------------------------- */
const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const MESES_LARGOS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function fmtFecha(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function mondayIndex(jsDay: number) { return (jsDay + 6) % 7; }

interface DatePickerProps {
  value: Date | null;
  onChange: (d: Date) => void;
  error?: string | false | null;
  placeholder?: string;
}

const navBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: "1px solid var(--outline-variant)",
  background: "var(--surface)", cursor: "pointer", display: "inline-flex",
  alignItems: "center", justifyContent: "center", color: "var(--fg-2)",
};

export function DatePicker({ value, onChange, error, placeholder = "Seleccioná una fecha" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [yearMode, setYearMode] = useState(false);
  const today = new Date();
  const [view, setView] = useState(() => value ?? new Date(2000, 0, 1));
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const y = view.getFullYear();
  const m = view.getMonth();
  const firstDay = mondayIndex(new Date(y, m, 1).getDay());
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selDay =
    value && value.getFullYear() === y && value.getMonth() === m ? value.getDate() : null;
  const isFuture = (d: number) => new Date(y, m, d) > today;

  const goMonth = (delta: number) => {
    let nm = m + delta, ny = y;
    if (nm < 0) { nm = 11; ny--; } else if (nm > 11) { nm = 0; ny++; }
    setView(new Date(ny, nm, 1));
  };

  const limit = today.getFullYear();
  const years: number[] = [];
  for (let yr = limit; yr >= limit - 100; yr--) years.push(yr);

  const errored = !!error;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 10, padding: "13px 15px", borderRadius: "var(--radius)",
          border: open
            ? "2px solid var(--green-800)"
            : errored
            ? "2px solid var(--danger)"
            : "1px solid var(--sand)",
          background: errored && !open ? "var(--danger-fill)" : "var(--surface)",
          cursor: "pointer", textAlign: "left",
          fontFamily: "var(--font-sans)", fontSize: "var(--body)",
          color: value ? "var(--fg-1)" : "var(--fg-3)",
          paddingLeft: open || errored ? 15 : 16,
          paddingRight: open || errored ? 15 : 16,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <CalendarDays size={18} color={value ? "var(--green-800)" : errored ? "var(--danger)" : "var(--fg-3)"} />
          {value ? fmtFecha(value) : placeholder}
        </span>
        <ChevronDown size={16} color="var(--fg-3)" />
      </button>

      {open && (
        <div
          className="pop"
          style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 50,
            width: 320, background: "var(--surface)", borderRadius: "var(--radius-lg)",
            border: "1px solid var(--outline-variant)", boxShadow: "var(--shadow-pop)", padding: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button type="button" onClick={() => goMonth(-1)} style={navBtn}>
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => setYearMode((v) => !v)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "transparent", border: "none", cursor: "pointer",
                fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15.5, color: "var(--fg-1)",
              }}
            >
              {MESES_LARGOS[m]} {y}
              {yearMode ? <ChevronUp size={15} color="var(--fg-3)" /> : <ChevronDown size={15} color="var(--fg-3)" />}
            </button>
            <button type="button" onClick={() => goMonth(1)} style={navBtn}>
              <ChevronRight size={18} />
            </button>
          </div>

          {yearMode ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, maxHeight: 240, overflowY: "auto" }}>
              {years.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => { setView(new Date(yr, m, 1)); setYearMode(false); }}
                  style={{
                    padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
                    fontFamily: "var(--font-mono)", fontSize: 13.5,
                    background: yr === y ? "var(--green-800)" : "transparent",
                    color: yr === y ? "#fff" : "var(--fg-2)", fontWeight: yr === y ? 700 : 500,
                  }}
                >
                  {yr}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 6 }}>
                {DIAS_SEMANA.map((d) => (
                  <div
                    key={d}
                    style={{
                      textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--fg-3)",
                      textTransform: "uppercase", letterSpacing: ".04em", padding: "4px 0",
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                {cells.map((d, i) => {
                  if (d === null) return <div key={i} />;
                  const sel = d === selDay;
                  const future = isFuture(d);
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={future}
                      onClick={() => { onChange(new Date(y, m, d)); setOpen(false); }}
                      onMouseEnter={(e) => { if (!sel && !future) (e.currentTarget as HTMLButtonElement).style.background = "var(--green-050)"; }}
                      onMouseLeave={(e) => { if (!sel) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                      style={{
                        aspectRatio: "1", borderRadius: 8, border: "none",
                        cursor: future ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: sel ? 700 : 500,
                        background: sel ? "var(--green-800)" : "transparent",
                        color: future ? "var(--fg-3)" : sel ? "#fff" : "var(--fg-1)",
                        opacity: future ? 0.35 : 1,
                        transition: "background-color .12s",
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- Password checks & meter ----------------------------------------- */
export function passwordChecks(pw: string) {
  return {
    length: pw.length >= 8,
    special: /[!@#$%^&*(),.?":{}|<>_\-[\]\\/;'`~+=]/.test(pw),
  };
}

export function PasswordMeter({ value }: { value: string }) {
  const c = passwordChecks(value);
  const items = [
    { ok: c.length, label: "Al menos 8 caracteres" },
    { ok: c.special, label: "Al menos un carácter especial" },
  ];
  const okCount = items.filter((i) => i.ok).length;
  const allOk = okCount === items.length;

  const miss: string[] = [];
  if (!c.length) miss.push("al menos 8 caracteres");
  if (!c.special) miss.push("un carácter especial");
  const faltanTxt =
    miss.length === 0 ? "" :
    miss.length === 1 ? `Debe contener ${miss[0]}.` :
    `Debe contener ${miss.slice(0, -1).join(", ")} y ${miss[miss.length - 1]}.`;

  const strength = allOk
    ? { label: "Robusta", color: "var(--success-fg)" }
    : okCount === 1
    ? { label: "Media", color: "var(--warning-fg)" }
    : { label: "Débil", color: "var(--danger-fg)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ flex: 1, display: "flex", gap: 4 }}>
          {items.map((_, i) => (
            <span
              key={i}
              style={{
                flex: 1, height: 5, borderRadius: 999,
                background: i < okCount ? strength.color : "var(--cream-tert)",
                transition: "background-color .18s",
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: strength.color, minWidth: 52, textAlign: "right" }}>
          {value ? strength.label : ""}
        </span>
      </div>

      {allOk ? (
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "var(--success-fg)", fontWeight: 600 }}>
          <ShieldCheck size={14} /> La contraseña cumple los requisitos.
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 7, fontSize: 12.5, color: "var(--warning-fg)", lineHeight: 1.4 }}>
          <span style={{ display: "inline-flex", marginTop: 1 }}><Info size={14} /></span>
          <span>{faltanTxt}</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((it) => (
          <div
            key={it.label}
            style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: it.ok ? "var(--success-fg)" : "var(--fg-3)", transition: "color .15s" }}
          >
            {it.ok ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            {it.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- Eye toggle button ------------------------------------------------ */
export function EyeToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        background: "transparent", border: "none", cursor: "pointer",
        padding: 6, color: "var(--fg-3)", display: "inline-flex",
      }}
      aria-label={shown ? "Ocultar contraseña" : "Mostrar contraseña"}
    >
      {shown ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}
