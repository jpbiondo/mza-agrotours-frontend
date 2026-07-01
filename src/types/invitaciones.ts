export type EstadoInvitacion = "pendiente" | "aceptada" | "rechazada";

export interface Invitacion {
  id: string;
  finca: string;
  /** id de finca en el panel de gestión. */
  fincaId: string;
  location: string;
  rol: string;
  rolDesc: string;
  invitedBy: string;
  invitedByRole: string;
  sentAt: string;
  email: string;
  seed: number;
  estado: EstadoInvitacion;
}
