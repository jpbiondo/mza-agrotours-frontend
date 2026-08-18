import { AlertTriangle, CheckCircle2 } from "lucide-react";

export type ToastData = { tone: "success" | "danger"; title: string; sub?: string };

/** Notificación flotante (abajo a la derecha). */
export function Toast({ tone, title, sub }: ToastData) {
  return (
    <div
      className={`pop fixed bottom-6 right-6 z-[150] flex max-w-[400px] items-start gap-[11px] rounded-md p-[14px_18px] text-white shadow-pop ${
        tone === "danger" ? "bg-danger" : "bg-green-800"
      }`}
    >
      {tone === "danger" ? (
        <AlertTriangle size={19} className="mt-px shrink-0" />
      ) : (
        <CheckCircle2 size={19} className="mt-px shrink-0" />
      )}
      <div>
        <div className="text-[14.5px] font-semibold">{title}</div>
        {sub && <div className="mt-0.5 font-mono text-[13px] opacity-90">{sub}</div>}
      </div>
    </div>
  );
}
