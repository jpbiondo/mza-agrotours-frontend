import { CheckCircle2, Circle, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function passwordChecks(pw: string) {
  return {
    length: pw.length >= 8,
    special: /[!@#$%^&*(),.?":{}|<>_\-[\]\\/;'`~+=]/.test(pw),
  };
}

/** Medidor de fortaleza + checklist de requisitos de contraseña. */
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
    miss.length === 0
      ? ""
      : miss.length === 1
      ? `Debe contener ${miss[0]}.`
      : `Debe contener ${miss.slice(0, -1).join(", ")} y ${miss[miss.length - 1]}.`;

  const strength = allOk
    ? { label: "Robusta", cls: "text-success-fg", bar: "bg-success-fg" }
    : okCount === 1
    ? { label: "Media", cls: "text-warning-fg", bar: "bg-warning-fg" }
    : { label: "Débil", cls: "text-danger-fg", bar: "bg-danger-fg" };

  return (
    <div className="mt-2 flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5">
        <div className="flex flex-1 gap-1">
          {items.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-[5px] flex-1 rounded-full transition-colors",
                i < okCount ? strength.bar : "bg-cream-tert"
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            "min-w-[52px] text-right text-[11.5px] font-bold",
            strength.cls
          )}
        >
          {value ? strength.label : ""}
        </span>
      </div>

      {allOk ? (
        <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-success-fg">
          <ShieldCheck className="size-3.5" /> La contraseña cumple los requisitos.
        </div>
      ) : (
        <div className="flex items-start gap-1.5 text-[12.5px] leading-snug text-warning-fg">
          <Info className="mt-px size-3.5 shrink-0" />
          <span>{faltanTxt}</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {items.map((it) => (
          <div
            key={it.label}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              it.ok ? "text-success-fg" : "text-fg-3"
            )}
          >
            {it.ok ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <Circle className="size-3.5" />
            )}
            {it.label}
          </div>
        ))}
      </div>
    </div>
  );
}
