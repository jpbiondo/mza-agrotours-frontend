import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { ApiError, apiFetch, comoEnvelope, comoPagina } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import type { EstadoIncidencia, IncidenciaPropia, NuevaIncidencia } from "@/types/incidencias";

/**
 * El backend ordena por defecto de la más vieja a la más nueva, y la pantalla
 * las quiere al revés. El tamaño alcanza de sobra para lo que reporta una
 * persona; si algún día no, hay que paginar.
 */
const LISTADO = "/incidencias?size=100&sort=fechaHoraInicio,desc";

/** `EstadoIncidenciaNombre` viaja por su `name()`: no tiene `@JsonValue`. */
const ESTADO: Record<string, EstadoIncidencia> = {
  REPORTADA: "reportada",
  EN_REVISION: "revision",
  RESUELTA: "resuelta",
  DESESTIMADA: "desestimada",
};

/** Ítem crudo de `GET /incidencias`. Campos opcionales: defensivo. */
interface IncidenciaBackend {
  id?: string;
  titulo?: string;
  descripcion?: string;
  estado?: string;
  /** `unknown`: un LocalDateTime mal serializado llega como array. */
  fechaHoraInicio?: unknown;
  diasTranscurridos?: unknown;
  respuestaAdmin?: string | null;
}

function aIncidencia(i: IncidenciaBackend, n: number): IncidenciaPropia {
  return {
    id: i.id ?? `sin-id-${n}`,
    titulo: i.titulo ?? "",
    desc: i.descripcion ?? "",
    estado: (i.estado && ESTADO[i.estado]) || null,
    fechaInicio:
      typeof i.fechaHoraInicio === "string" && i.fechaHoraInicio.trim() ? i.fechaHoraInicio : null,
    dias: typeof i.diasTranscurridos === "number" ? i.diasTranscurridos : null,
    motivo: i.respuestaAdmin?.trim() || null,
  };
}

interface UseMisIncidenciasReturn {
  /** Siempre definido: `[]` significa "cargó y no hay ninguna". */
  incidencias: IncidenciaPropia[];
  isLoading: boolean;
  error: string | null;
  /** No hay sesión de Firebase: la pantalla debe redirigir a /acceso. */
  unauthenticated: boolean;
  reload: () => void;
}

/** Las incidencias que reportó el usuario en sesión. */
export function useMisIncidencias(): UseMisIncidenciasReturn {
  const [nonce, setNonce] = useState(0);
  // Lo cargado junto a la clave que lo trajo: mientras no coincida con la
  // actual, la pantalla está cargando (ver `useRoles`).
  const [cargado, setCargado] = useState<{
    clave: number;
    incidencias: IncidenciaPropia[];
    error: string | null;
    unauthenticated: boolean;
  } | null>(null);
  const alDia = cargado?.clave === nonce;

  useEffect(() => {
    let active = true;
    const fin = (datos: Partial<{ incidencias: IncidenciaPropia[]; error: string; unauthenticated: boolean }>) =>
      setCargado({ clave: nonce, incidencias: [], error: null, unauthenticated: false, ...datos });

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        fin({ unauthenticated: true });
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>(LISTADO, { token });
        if (!active) return;
        const env = comoEnvelope<unknown>(res);
        if (!env.ok) {
          fin({ error: env.code ?? "No pudimos cargar tus incidencias" });
          return;
        }
        fin({ incidencias: comoPagina<IncidenciaBackend>(env.data).items.map(aIncidencia) });
      } catch (e) {
        if (active) fin({ error: e instanceof Error ? e.message : "Error inesperado" });
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return {
    incidencias: alDia ? cargado.incidencias : [],
    isLoading: !alDia,
    error: alDia ? cargado.error : null,
    unauthenticated: alDia ? cargado.unauthenticated : false,
    reload,
  };
}

/** Alta de una incidencia: el backend la crea en estado Reportada. */
export function useReportarIncidencia() {
  const [enviando, setEnviando] = useState(false);

  async function reportar(datos: NuevaIncidencia): Promise<{ ok: boolean; code?: string }> {
    setEnviando(true);
    try {
      const res = await conToken((token) =>
        apiFetch<unknown>("/incidencias/create", {
          method: "POST",
          token,
          body: JSON.stringify({ titulo: datos.titulo, descripcion: datos.desc }),
        }),
      );
      const env = comoEnvelope<unknown>(res);
      return env.ok ? { ok: true } : { ok: false, code: env.code };
    } catch (e) {
      if (e instanceof ApiError) return { ok: false, code: e.code };
      // 2xx con cuerpo vacío: se creó.
      if (e instanceof SyntaxError) return { ok: true };
      return { ok: false };
    } finally {
      setEnviando(false);
    }
  }

  return { reportar, enviando };
}
