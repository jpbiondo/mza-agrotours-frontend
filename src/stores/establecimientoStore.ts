import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface EstablecimientoState {
  /**
   * Último establecimiento que se miró en el panel. Puede quedar viejo —que le
   * saquen el acceso, por ejemplo—, así que quien lo lee tiene que validarlo
   * contra los accesos vigentes; de eso se ocupa `useEstablecimientoPorDefecto`.
   */
  elegido: string | null;
  elegir: (id: string) => void;
  /** true una vez rehidratado desde localStorage. Ver `useEstablecimientoPorDefecto`. */
  hasHydrated: boolean;
}

/**
 * El último establecimiento que miró el productor. En cuál está parado lo dice
 * la URL (`/panel/{id}/...`); esto sólo decide a dónde ir cuando entra por
 * `/panel` a secas, para no mandarlo siempre al primero. Lo actualiza
 * `GuardEstablecimientoUrl` cada vez que se entra a uno.
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
      hasHydrated: false,
    }),
    {
      name: "agrotours-establecimiento",
      storage: createJSONStorage(() => localStorage),
      // La bandera de hidratación no se persiste: describe esta pestaña.
      partialize: (s) => ({ elegido: s.elegido }),
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useEstablecimientoStore.setState({ hasHydrated: true });
      },
    },
  ),
);
