import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Rol } from "@/types/auth";

interface SesionData {
  nombre: string;
  email: string;
  roles: Rol[];
}

interface AuthState {
  nombre: string | null;
  email: string | null;
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
      roles: [],
      hasHydrated: false,
      setSession: ({ nombre, email, roles }) => set({ nombre, email, roles }),
      clear: () => set({ nombre: null, email: null, roles: [] }),
    }),
    {
      name: "agrotours-auth",
      storage: createJSONStorage(() => localStorage),
      // Solo persistimos los datos de sesión, no la bandera de hidratación.
      partialize: (s) => ({ nombre: s.nombre, email: s.email, roles: s.roles }),
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hasHydrated: true });
      },
    },
  ),
);
