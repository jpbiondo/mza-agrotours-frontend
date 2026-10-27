import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase.config";
import { apiFetch, comoEnvelope } from "@/lib/api";
import { aCalendario } from "@/lib/calendarioReserva";
import { conToken } from "@/lib/sesion";
import type { MesCalendario } from "@/types/catalogo";
import type { AsyncState } from "@/hooks/useAsync";
import type { InfoParaReservar, Precios, Rango, Viajero } from "@/data/reserva";

const BASE = "/actividades";

interface RangoEtarioBackend {
  precio: number;
  nombre: string;
  edadMinima: number;
  edadMaxima: number;
}

interface UsuarioParaReservar {
  nombreApellido: string,
  fechaNacimiento: string,
  tipoIdentificacion: string,
  numeroIdentificacion: string,
}

interface InfoParaReservarBackend {
  diasActividad: unknown;
  rangosEtarios: RangoEtarioBackend[];
  usuario: UsuarioParaReservar;
  nombre: string;
  ubicacion: string;
  nombreEstablecimiento: string;
  cupoMaximo: number;
  calificacionPromedio: number;
  diasMinReembolso: number;
}

/**
 * GET /actividades/{id}/reservar: la info de la actividad y su disponibilidad
 * necesaria para armar la pantalla de reserva. El endpoint exige sesión, así
 * que se espera a que Firebase confirme el usuario (onAuthStateChanged) antes
 * de pedir: usar `auth.currentUser` directo puede pegarle sin token todavía
 * si la sesión persistida no terminó de rehidratarse (p. ej. al refrescar).
 */
export function useInfoParaReservar(actividadId: string): Omit<AsyncState<InfoParaReservar>, "ultimo"> {
  const [data, setData] = useState<InfoParaReservar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setError("Necesitás iniciar sesión para ver esta actividad");
        setIsLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await apiFetch<unknown>(`${BASE}/${encodeURIComponent(actividadId)}/reservar`, { token });
        if (!active) return;
        const env = comoEnvelope<InfoParaReservarBackend>(res);
        if (!env.ok || !env.data) {
          setError(env.code ?? "No pudimos cargar la información de la actividad");
          return;
        }
        setData(aInfoParaReservar(env.data));
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Error inesperado");
      } finally {
        if (active) setIsLoading(false);
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [actividadId, nonce]);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setNonce((n) => n + 1);
  }, []);

  return { data, isLoading, error, reload };
}

function aInfoParaReservar(d: InfoParaReservarBackend): InfoParaReservar {
  const rangos = aRangos(d.rangosEtarios);
  return {
    nombre: d.nombre ?? "",
    ubicacion: d.ubicacion ?? "",
    nombreEstablecimiento: d.nombreEstablecimiento ?? "",
    cupoMaximo: d.cupoMaximo ?? 0,
    calificacionPromedio: d.calificacionPromedio ?? 0,
    diasMinReembolso: d.diasMinReembolso ?? 0,
    rangos,
    precios: aPrecios(rangos, d.rangosEtarios),
    calendario: aCalendario(d.diasActividad),
    titular: aTitular(d.usuario),
  };
}

/** El input type="date" espera "YYYY-MM-DD"; el backend puede mandar la fecha con hora. */
function aTitular(u: UsuarioParaReservar | undefined): Viajero {
  return {
    nombre: u?.nombreApellido ?? "",
    fechaNac: u?.fechaNacimiento?.slice(0, 10) ?? "",
    tipoDoc: u?.tipoIdentificacion ?? "DNI",
    numDoc: u?.numeroIdentificacion ?? "",
  };
}

/** El id del rango es su posición: no viaja al backend, sólo agrupa precio+viajero en el front. */
function aRangos(v: RangoEtarioBackend[] | undefined): Rango[] {
  return (v ?? []).map((r, i) => {
    const min = r.edadMinima ?? 0;
    const max = r.edadMaxima ?? 200;
    return {
      id: String(i),
      label: r.nombre ?? `Rango ${i + 1}`,
      sub: max >= 150 ? `${min} años o más` : `${min} a ${max} años`,
      min,
      max,
    };
  });
}

function aPrecios(rangos: Rango[], v: RangoEtarioBackend[] | undefined): Precios {
  const precios: Precios = {};
  rangos.forEach((r, i) => { precios[r.id] = v?.[i]?.precio ?? 0; });
  return precios;
}

/**
 * Vuelve a pedir la disponibilidad, para cuando la pantalla ya está armada y se
 * sabe que cambió (otro visitante tomó los cupos). Sale a pedido del usuario,
 * así que va con `conToken` y no espera a `onAuthStateChanged`. No toca el
 * estado de carga de `useInfoParaReservar`: la pantalla no se desarma y no se
 * pierden los visitantes cargados. `null` si no se pudo actualizar.
 */
export async function refrescarCalendario(actividadId: string): Promise<MesCalendario[] | null> {
  try {
    const res = await conToken((token) =>
      apiFetch<unknown>(`${BASE}/${encodeURIComponent(actividadId)}/reservar`, { token }),
    );
    const env = comoEnvelope<InfoParaReservarBackend>(res);
    return env.ok && env.data ? aCalendario(env.data.diasActividad) : null;
  } catch {
    return null;
  }
}
