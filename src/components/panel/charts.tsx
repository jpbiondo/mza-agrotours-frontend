"use client";

import { useEffect, useRef, useState } from "react";
import { moneyAr } from "@/lib/format";
import type { BarDatum } from "@/types/estadisticas";

/** Avance de 0 a 1 en 700ms con ease-out cúbico; vuelve a arrancar cuando cambia `clave`. */
function useEntrada(clave: string | number): number {
  const [k, setK] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / 700);
      setK(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clave]);
  return k;
}

/* ---- Donut de ocupación ------------------------------------------------ */
export function Donut({ value = 75, size = 130, stroke = 14, label }: { value?: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circ;
  const progress = useEntrada(value);

  return (
    <div className="relative" role="img" aria-label={`${value}% de ocupación`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--cream-tert)" strokeWidth={stroke} />
        {/* Con 0% no se dibuja: el extremo redondeado dejaría un punto. */}
        {dash > 0 && (
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--green-800)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash * progress} ${circ}`} transform={`rotate(-90 ${c} ${c})`} />
        )}
      </svg>
      <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">
        <div className={`font-display leading-none font-bold text-fg-1 ${size > 110 ? "text-[28px]" : "text-[22px]"}`}>
          {Math.round(value * progress)}<span className="ml-px text-[0.55em] text-fg-2">%</span>
        </div>
        {label && <div className="text-[11px] font-semibold tracking-[.04em] text-fg-3 uppercase">{label}</div>}
      </div>
    </div>
  );
}

/* ---- Gráfico de barras ------------------------------------------------- */
export function BarChart({ data, height = 240 }: { data: BarDatum[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(720);
  const k = useEntrada(data.map((d) => d.value).join(","));

  const padTop = 24, padBot = 56, padLeft = 36, padRight = 12;
  const max = Math.max(10, ...data.map((d) => d.value));
  // Tope "redondo": de a 5, de a 20 o de a 50 según la escala.
  const niceMax = max <= 20 ? Math.ceil(max / 5) * 5 : max <= 100 ? Math.ceil(max / 20) * 20 : Math.ceil(max / 50) * 50;
  const ticks = [0, niceMax * 0.25, niceMax * 0.5, niceMax * 0.75, niceMax];

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => setW(Math.max(320, entries[0].contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const innerW = w - padLeft - padRight;
  const innerH = height - padTop - padBot;
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.min(56, slot * 0.62);

  return (
    <div ref={ref} className="relative w-full">
      <svg width={w} height={height} className="block overflow-visible" role="img" aria-label="Reservas confirmadas y ganancia por período">
        {ticks.map((t, i) => {
          const y = padTop + innerH - (t / niceMax) * innerH;
          return (
            <g key={i}>
              <line x1={padLeft} x2={w - padRight} y1={y} y2={y} stroke="var(--outline-variant)" strokeWidth={i === 0 ? 1.2 : 1} strokeDasharray={i === 0 ? "0" : "3 4"} />
              <text x={padLeft - 8} y={y + 4} fontFamily="var(--font-mono)" fontSize="11" fill="var(--fg-3)" textAnchor="end">{Math.round(t)}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / niceMax) * innerH * k;
          const x = padLeft + slot * i + (slot - barW) / 2;
          const y = padTop + innerH - h;
          const isHover = hover === i;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={padLeft + slot * i} y={padTop} width={slot} height={innerH} fill="transparent" />
              <rect x={x} y={y} width={barW} height={h} rx="6" ry="6" fill={isHover ? "var(--green-100)" : "#EAF1E2"} stroke="var(--green-600)" strokeWidth="1.5" />
              {isHover && h > 6 && (
                <g>
                  <text x={x + barW / 2} y={y - 22} fontFamily="var(--font-mono)" fontSize="12" fontWeight="600" fill="var(--green-800)" textAnchor="middle">{d.value} {d.value === 1 ? "reserva" : "reservas"}</text>
                  {d.ganancia != null && <text x={x + barW / 2} y={y - 8} fontFamily="var(--font-mono)" fontSize="12" fontWeight="600" fill="var(--fg-2)" textAnchor="middle">{moneyAr(d.ganancia)}</text>}
                </g>
              )}
              <text x={padLeft + slot * i + slot / 2} y={padTop + innerH + 22} fontFamily="var(--font-sans)" fontSize="12.5" fontWeight={isHover ? 700 : 500} fill={isHover ? "var(--green-800)" : "var(--fg-2)"} textAnchor="middle">{d.label}</text>
              {d.ganancia != null && (
                <text x={padLeft + slot * i + slot / 2} y={padTop + innerH + 38} fontFamily="var(--font-mono)" fontSize="11" fontWeight={isHover ? 700 : 500} fill={isHover ? "var(--green-800)" : "var(--fg-3)"} textAnchor="middle">{moneyAr(d.ganancia)}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---- Barra de ocupación inline ----------------------------------------- */
export function OccupancyBar({ value, color }: { value: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex min-w-[180px] items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-pill border border-outline-variant bg-cream-tert">
        {/* Ancho y color son datos, no estilo: van inline. */}
        <div className="h-full rounded-pill bg-green-800 transition-[width] duration-600 ease-[cubic-bezier(.2,0,0,1)]" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="min-w-[42px] text-right font-mono text-[13px] font-semibold text-fg-1">{value}%</div>
    </div>
  );
}
