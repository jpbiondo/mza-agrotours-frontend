import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { confirm } from "@/components/ui/confirm-dialog";

const DIALOGO = {
  title: "¿Salir sin guardar?",
  description: "Hiciste cambios que todavía no se guardaron. Si salís ahora, los vas a perder.",
  confirmLabel: "Salir sin guardar",
  cancelLabel: "Seguir editando",
  tone: "danger" as const,
};

/**
 * Avisa antes de perder cambios sin guardar. Con `dirty` en true cubre toda
 * salida de la pantalla:
 *
 * - un link interno cualquiera, incluido el menú del shell y la navbar;
 * - el back del navegador;
 * - recargar o cerrar la pestaña (el aviso nativo del navegador, que no se
 *   puede personalizar).
 *
 * Para los botones propios ("Cancelar", "Volver") que navegan con el router,
 * `salir(destino)`. Para cerrar un diálogo o panel de formulario (Escape,
 * click afuera, "Cancelar"), `confirmarDescarte()` antes de cerrarlo.
 *
 * Con react-hook-form, `dirty` es `formState.isDirty` (más lo que no viva en
 * el form, como fotos). En la edición en línea, una sección abierta y tocada
 * también cuenta.
 *
 * Límite conocido: para atajar el back se apila una entrada extra del historial
 * con la misma URL. Si después se guarda y se navega, esa entrada queda: el back
 * desde la pantalla siguiente pasa una vez por la misma URL.
 */
export function useAvisoSalida(dirty: boolean) {
  const router = useRouter();
  const dirtyRef = useRef(dirty);
  const saliendo = useRef(false);
  const preguntando = useRef(false);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  // Pregunta una sola vez aunque lleguen dos intentos de salida juntos.
  const preguntar = useCallback(async (): Promise<boolean> => {
    if (preguntando.current) return false;
    preguntando.current = true;
    try {
      return await confirm(DIALOGO);
    } finally {
      preguntando.current = false;
    }
  }, []);

  // Recargar o cerrar la pestaña.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saliendo.current) return;
      e.preventDefault();
      // Chrome y Edge todavía lo piden para mostrar el aviso.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // Links internos. En captura sobre `document`: corre antes que el onClick de
  // `<Link>` (React escucha en la raíz), así se puede frenar la navegación.
  useEffect(() => {
    if (!dirty) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Un ancla en la misma página no sale de la pantalla.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      e.preventDefault();
      e.stopPropagation();
      const destino = url.pathname + url.search + url.hash;
      void preguntar().then((ok) => {
        if (!ok) return;
        saliendo.current = true;
        router.push(destino);
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [dirty, preguntar, router]);

  // Back del navegador: se apila una entrada con la misma URL, y al volver a la
  // anterior se pregunta. Si confirma, se retrocede de verdad (dos lugares: la
  // entrada vuelta a apilar y la de la pantalla).
  useEffect(() => {
    if (!dirty) return;
    window.history.pushState({ avisoSalida: true }, "", window.location.href);
    const onPopState = () => {
      if (saliendo.current || !dirtyRef.current) return;
      window.history.pushState({ avisoSalida: true }, "", window.location.href);
      void preguntar().then((ok) => {
        if (!ok) return;
        saliendo.current = true;
        window.history.go(-2);
      });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [dirty, preguntar]);

  /** Navega a `destino`; si hay cambios, pregunta antes. */
  const salir = useCallback(
    async (destino: string) => {
      if (dirtyRef.current && !(await preguntar())) return;
      saliendo.current = true;
      router.push(destino);
    },
    [preguntar, router],
  );

  /** `true` si se puede cerrar: no hay cambios, o el usuario confirmó descartarlos. */
  const confirmarDescarte = useCallback(
    async () => !dirtyRef.current || (await preguntar()),
    [preguntar],
  );

  return { salir, confirmarDescarte };
}
