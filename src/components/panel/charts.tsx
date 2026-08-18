"use client";

import { useEffect, useRef, useState } from "react";
import { fmtMoney } from "@/data/estadisticas";
import type { BarDatum } from "@/types/estadisticas";

/* ---- Donut de ocupación ------------------------------------------------ */
export function Donut({ value = 75, size = 130, stroke = 14, label }: { value?: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circ;

  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const k = Math.min(1, (t - start) / 700);
      setProgress(1 - Math.pow(1 - k, 3));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--cream-tert)" strokeWidth={stroke} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--green-800)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash * progress} ${circ}`} transform={`rotate(-90 ${cx} ${cy})`} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 2 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: size > 110 ? 28 : 22, color: "var(--fg-1)", lineHeight: 1 }}>
          {Math.round(value * progress)}<span style={{ fontSize: "0.55em", color: "var(--fg-2)", marginLeft: 1 }}>%</span>
        </div>
        {label && <div style={{ fontSize: 11, color: "var(--fg-3)", letterSpacing: ".04em", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>}
      </div>
    </div>
  );
}

/* ---- Gráfico de barras mensual ----------------------------------------- */
export function BarChart({ data, height = 240 }: { data: BarDatum[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(720);
  const [k, setK] = useState(0);

  const padTop = 24, padBot = 56, padLeft = 36, padRight = 12;
  const max = Math.max(10, ...data.map((d) => d.value));
  const niceMax = max <= 20 ? Math.ceil(max / 5) * 5 : max <= 100 ? Math.ceil(max / 20) * 20 : Math.ceil(max / 50) * 50;
  const ticks = [0, niceMax * 0.25, niceMax * 0.5, niceMax * 0.75, niceMax];

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => setW(Math.max(320, entries[0].contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const seriesKey = data.map((d) => d.value).join(",");
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
  }, [seriesKey]);

  const innerW = w - padLeft - padRight;
  const innerH = height - padTop - padBot;
  const slot = innerW / data.length;
  const barW = Math.min(56, slot * 0.62);

  return (
    <div ref={ref} style={{ width: "100%", position: "relative" }}>
      <svg width={w} height={height} style={{ display: "block", overflow: "visible" }}>
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
                  <text x={x + barW / 2} y={y - 22} fontFamily="var(--font-mono)" fontSize="12" fontWeight="600" fill="var(--green-800)" textAnchor="middle">{d.value} reservas</text>
                  {d.ganancia != null && <text x={x + barW / 2} y={y - 8} fontFamily="var(--font-mono)" fontSize="12" fontWeight="600" fill="var(--fg-2)" textAnchor="middle">{fmtMoney(d.ganancia)}</text>}
                </g>
              )}
              <text x={padLeft + slot * i + slot / 2} y={padTop + innerH + 22} fontFamily="var(--font-sans)" fontSize="12.5" fontWeight={isHover ? 700 : 500} fill={isHover ? "var(--green-800)" : "var(--fg-2)"} textAnchor="middle">{d.label}</text>
              {d.ganancia != null && (
                <text x={padLeft + slot * i + slot / 2} y={padTop + innerH + 38} fontFamily="var(--font-mono)" fontSize="11" fontWeight={isHover ? 700 : 500} fill={isHover ? "var(--green-800)" : "var(--fg-3)"} textAnchor="middle">{fmtMoney(d.ganancia)}</text>
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
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 180 }}>
      <div style={{ flex: 1, height: 10, background: "var(--cream-tert)", border: "1px solid var(--outline-variant)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, value))}%`, background: color || "var(--green-800)", borderRadius: 999, transition: "width .6s cubic-bezier(.2,0,0,1)" }} />
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color: "var(--fg-1)", minWidth: 42, textAlign: "right" }}>{value}%</div>
    </div>
  );
}
