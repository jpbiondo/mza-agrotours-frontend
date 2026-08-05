import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { rolesDe } from "@/lib/roles";
import type { Acceso, Rol } from "@/types/auth";

interface SesionData {
  nombre: string;
  email: string;
  accesos: Acceso[];
}

interface AuthState {
  nombre: string | null;
  email: string | null;
  /** Roles con sus permisos, tal como los devuelve /usuario/me. */
  accesos: Acceso[];
  /**
   * Derivado de `accesos` al setear la sesión, no en un selector: un selector
   * que arma el array en cada render devuelve una referencia nueva cada vez y
   * hace re-renderizar a todo el que lo lea.
   */
  roles: Rol[];
  /** true una vez que se rehidrató desde localStorage (evita el flash de SSR). */
  hasHydrated: boolean;
  setSession: (s: SesionData) => void;
  clear: () => void;
}

/**
 * Estado global de sesión: solo datos de display (nombre, email, roles).
 * NUNCA guarda el ID token — de eso se ocupa el SDK de Firebase.
 *
 * Persistido en localStorage (por dispositivo/origen) para sobrevivir el redirect
 * duro post-login y los reloads. `skipHydration` + rehidratación manual en <AuthSync>
 * garantiza que el primer render del cliente coincida con el del servidor.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      nombre: null,
      email: null,
      accesos: [],
      roles: [],
      hasHydrated: false,
      setSession: ({ nombre, email, accesos }) =>
        set({ nombre, email, accesos, roles: rolesDe(accesos) }),
      clear: () => set({ nombre: null, email: null, accesos: [], roles: [] }),
    }),
    {
      name: "agrotours-auth",
      storage: createJSONStorage(() => localStorage),
      // Solo persistimos los datos de sesión, no la bandera de hidratación.
      partialize: (s) => ({
        nombre: s.nombre,
        email: s.email,
        accesos: s.accesos,
        roles: s.roles,
      }),
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hasHydrated: true });
      },
    },
  ),
);
