"use client";

import { useRouter } from "next/navigation";
import { Loader, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { useChatDeActividad } from "@/hooks/useChats";
import { useChatDrawer } from "@/stores/chatDrawerStore";

/**
 * Abre el chat del visitante con el establecimiento sobre una actividad. Si ya
 * tiene uno, dice "Continuar chat" y lo abre en el drawer global del header; si
 * no, abre uno nuevo con un mensaje de arranque, y el chat se crea recién al
 * enviarlo. Sin sesión no hay drawer: manda a iniciar sesión.
 */
export default function ContactarEstablecimiento({
  actividadId, establecimientoId, titulo, etiqueta = "Contactar", size, className,
}: {
  actividadId: string;
  establecimientoId: string;
  /** Título del chat: el nombre de la actividad, igual que lo deja el backend en el inbox. */
  titulo: string;
  etiqueta?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const router = useRouter();
  const chat = useChatDeActividad(actividadId);
  const abrirChat = useChatDrawer((s) => s.abrir);

  function contactar() {
    if (chat.estado === "sin-sesion") {
      router.push("/acceso");
      return;
    }
    if (chat.estado !== "listo") return;
    abrirChat({
      id: chat.chatId,
      establecimientoId,
      titulo,
      nuevo: chat.existe ? undefined : { actividadId },
    });
  }

  const iconSize = size === "sm" ? 15 : 17;
  return (
    <Button variant="neutral" size={size} className={className} onClick={contactar} disabled={chat.estado === "cargando"}>
      {chat.estado === "cargando"
        ? <Loader size={iconSize} className="spin" aria-hidden />
        : <MessageCircle size={iconSize} aria-hidden />}
      {chat.estado === "listo" && chat.existe ? "Continuar chat" : etiqueta}
    </Button>
  );
}
