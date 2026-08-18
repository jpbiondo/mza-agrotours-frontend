import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface EstablecimientoState {
  /**
   * Establecimiento que el usuario eligió en el switcher. Puede quedar viejo
   * —que le saquen el acceso, por ejemplo—, así que quien lo lee tiene que
   * validarlo contra los accesos vigentes; de eso se ocupa `useEstablecimientos`.
   */
  elegido: string | null;
  elegir: (id: string) => void;
}

/**
 * Cuál de los establecimientos del productor está mirando. Vive fuera de las
 * pantallas porque el switcher está en el shell y todas las pantallas del panel
 * dependen de él; se persiste para no volver siempre al primero al recargar.
 *
 * `skipHydration` + rehidratación manual desde el shell, igual que el store de
 * sesión: sin eso el primer render del cliente no coincidiría con el del
 * servidor.
 */
export const useEstablecimientoStore = create<EstablecimientoState>()(
  persist(
    (set) => ({
      elegido: null,
      elegir: (id) => set({ elegido: id }),
    }),
    {
      name: "agrotours-establecimiento",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ elegido: s.elegido }),
      skipHydration: true,
    },
  ),
);
