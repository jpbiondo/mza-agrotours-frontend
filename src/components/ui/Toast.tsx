import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

/** `info`: salió bien pero con algo para leer (p. ej. fechas que se descartaron). */
export type ToastData = { tone: "success" | "danger" | "info"; title: string; sub?: string };

const TONOS = {
  success: { bg: "bg-green-800", Icon: CheckCircle2 },
  danger: { bg: "bg-danger", Icon: AlertTriangle },
  info: { bg: "bg-info", Icon: Info },
};

/** Notificación flotante (abajo a la derecha). */
export function Toast({ tone, title, sub }: ToastData) {
  const { bg, Icon } = TONOS[tone];
  return (
    <div
      className={`pop fixed bottom-6 right-6 z-[150] flex max-w-[400px] items-start gap-[11px] rounded-md p-[14px_18px] text-white shadow-pop ${bg}`}
    >
      <Icon size={19} className="mt-px shrink-0" />
      <div>
        <div className="text-[14.5px] font-semibold">{title}</div>
        {sub && <div className="mt-0.5 font-mono text-[13px] opacity-90">{sub}</div>}
      </div>
    </div>
  );
}
