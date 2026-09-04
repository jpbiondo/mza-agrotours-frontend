import { useEffect, useState } from "react";
import { ApiError, apiFetch, comoEnvelope } from "@/lib/api";
import { conToken } from "@/lib/sesion";
import type { UsuarioCard } from "@/types/usuario";

type EstadoCard = "idle" | "buscando" | "encontrado" | "no-existe" | "error";

interface UseUsuarioCardReturn {
  card: UsuarioCard | null;
  estado: EstadoCard;
}

/**
 * Busca la cuenta del email tipeado (GET /usuario/card/{email}), con un debounce
 * para no pegarle al backend en cada tecla. `habilitado` lo controla el llamador
 * para no consultar mientras el email todavía no es válido.
 *
 * Lo usan todas las altas que se hacen "por correo de un usuario ya registrado":
 * administradores del sistema y productores del establecimiento.
 */
export function useUsuarioCard(
  email: string,
  habilitado: boolean,
): UseUsuarioCardReturn {
  const clave = habilitado && email ? email : "";
  // El resultado se guarda junto a la clave que lo produjo: así el estado de
  // carga se deriva comparando (como en `useAsync`) en vez de setearlo dentro
  // del efecto, que dispara renders en cascada.
  const [res, setRes] = useState<{
    clave: string;
    card: UsuarioCard | null;
    estado: EstadoCard;
  }>({
    clave: "",
    card: null,
    estado: "idle",
  });

  useEffect(() => {
    if (!clave) return;

    let active = true;
    const t = setTimeout(async () => {
      try {
        const raw = await conToken((token) =>
          apiFetch<unknown>(`/usuario/card/${encodeURIComponent(clave)}`, {
            token,
          }),
        );
        if (!active) return;
        // Sin cuenta, el backend responde 404 o un envelope ok:false; las dos
        // formas significan lo mismo acá: no hay usuario con ese correo.
        const env = comoEnvelope<UsuarioCard>(raw);
        const data = env.ok ? (env.data ?? null) : null;
        setRes(
          data?.nombre
            ? { clave, card: data, estado: "encontrado" }
            : { clave, card: null, estado: "no-existe" },
        );
      } catch (e) {
        if (!active) return;
        // Un 404 es "no hay cuenta con ese correo", no un fallo técnico.
        const estado: EstadoCard =
          e instanceof ApiError && e.status === 404 ? "no-existe" : "error";
        setRes({ clave, card: null, estado });
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [clave]);

  if (!clave) return { card: null, estado: "idle" };
  if (res.clave !== clave) return { card: null, estado: "buscando" };
  return { card: res.card, estado: res.estado };
}
