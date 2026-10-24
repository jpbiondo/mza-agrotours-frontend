# Auditoría de UI: consistencia visual y de comportamiento

Relevamiento estático de `src/` en la rama `dev` (commit `788bada`, 2026-10-19). No se ejecutó la app: todo sale de leer el código. El informe **describe lo que hay**; no propone soluciones.

**Cómo se contó.** Los conteos salen de búsquedas sobre el código (las etiquetas `<Button>` se parsearon completas, con JSX multilínea). Sirven para comparar magnitudes; un ±2 no cambia ninguna conclusión. Las referencias son `ruta:línea` relativas a `src/`.

**Leyenda de las tablas de la Parte B**

| Código | Significa |
|---|---|
| **SK** | Esqueleto con la forma del contenido (casi siempre vía `AsyncBoundary skeleton=`) |
| **SP** | Spinner centrado de `AsyncBoundary` ("Cargando…") |
| **SB** | Spinner dentro del botón mientras se envía |
| **TX** | El botón sólo cambia el texto ("Ingresando…"), sin spinner |
| **AB-err** | Panel de error de `AsyncBoundary`: ícono, "No pudimos cargar la información", **el mensaje técnico crudo en monoespaciada** y "Reintentar" |
| **FM** | Error de campo con `<FormMessage>` (RHF + zod) |
| **FC** | Contador "faltan N campos" (`<FaltanCampos>`) con el envío deshabilitado hasta completar |
| **SinPermiso** | Pantalla `<SinPermiso>` de `components/GuardRol.tsx:34` |
| **D+title** | Control visible pero deshabilitado, con el motivo en el `title` (tooltip nativo) |
| — | El estado no está resuelto |
| n/a | El estado no aplica a esa pantalla |

---

## Parte A — Componentes

### A1. Botones: implementaciones

| Implementación | Dónde | Usos |
|---|---|---|
| `<Button>` compartido | `components/ui/Button.tsx` | 161 |
| `buttonClasses()` sobre un `<Link>` | ídem | 28 |
| `<ActionBtn>` (acción de fila de tabla) | `components/ui/ActionBtn.tsx` | 12, en 5 archivos |
| Clases heredadas `.btn` / `.btn-primary` / `.btn-neutral` / `.btn-sm` / `.btn-lg` | `app/globals.css:267-300` | 39, en 23 archivos |
| Botones locales con nombre propio | `CardAction` (`app/panel/[establecimientoId]/actividades/ActividadesClient.tsx:39`), `ShareButton` (`app/(sitio)/explorar/[id]/DetalleClient.tsx:25`), `BotonStep` (`app/(sitio)/explorar/[id]/BookingWidget.tsx:~400`), constante `ACCION` (`app/admin/faq/FaqAdminClient.tsx:42`), `BTN_SHELL` (shells), `NAV` (`components/panel/gestion-dias/CalendarioMensual.tsx`) | 6 implementaciones |
| `<button>` crudo con estilos propios usado como botón de acción | ver A1.3 | ~25 |

Las clases `.btn-*` heredadas viven sobre todo en: `AsyncBoundary` (el "Reintentar" de **todas** las pantallas), `GuardRol` (`SinPermiso`), `SiteHeader`, `Hero`, `ActividadCard`, `MisReservasClient`, `ParametrosClient` (7), el flujo de `/acceso` y los detalles públicos de establecimiento y actividad.

#### A1.1 Variantes de `<Button>` / `buttonClasses()` (variante × tamaño)

| Variante | md | sm | lg | Total |
|---|---|---|---|---|
| primary (por defecto o explícita) | 58 | 8 | 14 | 80 |
| neutral | 61 | 19 | 0 | 80 |
| danger | 16 | 0 | 0 | 16 |
| ghost | 5 | 8 | 0 | 13 |

- **ghost** se usa casi sólo en `/panel/{id}/datos` (`SectionCard`, `PortadaCard`, `CobrosCard`, `EliminarEstablecimientoFlow`) y en dos "Cancelar" sueltos (`app/(sitio)/explorar/[id]/reservar/Bloqueo.tsx:59`, `app/panel/[establecimientoId]/reembolsos/ReembolsosClient.tsx:237`).
- **Con ícono / sin ícono**: la gran mayoría lleva ícono lucide a la izquierda; el tamaño del ícono varía entre 13, 15, 16, 17 y 18 px para el mismo tamaño de botón (p. ej. `size-4` en `ActividadesClient.tsx:630` y `size-[17px]` en `components/admin/gcr/shared.tsx:62`, ambos `md`).

#### A1.2 Variantes "de hecho" que `<Button>` no tiene

**Danger de contorno (acción destructiva secundaria): 5 implementaciones**

| Implementación | Dónde |
|---|---|
| `<ActionBtn tone="danger">` | admin cultivos, recetas, establecimientos, administradores; productores (6 usos) |
| `<Button variant="neutral" className="border-danger text-danger">` | `app/(sitio)/mis-reservas/[id]/DetalleClient.tsx:170` (Cancelar reserva), `components/roles/RolesScreen.tsx:437` (Borrar rol), `app/panel/[establecimientoId]/actividades/[id]/calendario/[diaId]/ReservasDiaClient.tsx:331` (además con sombra táctil `danger-fill`) |
| `<button>` crudo | `app/admin/solicitudes/SolicitudesClient.tsx:887` (Rechazar solicitud), `app/(sitio)/cuenta/components/DatosPersonalesForm.tsx:272` (Eliminar cuenta) |
| `CardAction danger` (texto `danger-fg`, sombra inset `danger-fill`) | `ActividadesClient.tsx:51` (Eliminar actividad) |
| Botón de ícono con hover rojo | `app/admin/faq/FaqAdminClient.tsx:96` (Eliminar pregunta) |

**"sm" con texto de 14 px**: `size="sm"` + `className="text-sm"` pisa el `text-xs` del tamaño. 12 usos en `datos/SectionCard.tsx`, `datos/PortadaCard.tsx`, `datos/CobrosCard.tsx`, `components/panel/ActivityForm.tsx:203`, `actividades/[id]/editar/EditarActividadClient.tsx:511`, `components/roles/RolesScreen.tsx:425`.

**Neutral con texto verde**: `RolesScreen.tsx:425` (`text-green-800` sobre neutral), igual que el neutral de `ActionBtn`, mientras que `CardAction` y `<Button variant="neutral">` usan `text-fg-1`.

**Estados deshabilitados**: `Button`, `ActionBtn` y `.btn:disabled` → fondo `cream-tert` + texto `fg-3`. `CardAction` → `opacity-50`. Rechazar solicitud → borde `cream-tert`. Son 3 apariencias.

#### A1.3 Botones crudos con estilo propio usados como acción

| Uso | Dónde |
|---|---|
| Link de texto "Reintentar" subrayado | `app/panel/[establecimientoId]/PanelClient.tsx:362` |
| Link de texto "Volver al listado" | `EditarActividadClient.tsx:219` |
| Link de texto "Cargar más" | `components/notifications/NotificationBell.tsx:267` |
| "Limpiar" / "Limpiar filtros" de texto, con estilos inline | `app/(sitio)/explorar/CatalogClient.tsx:121`, `app/(sitio)/establecimientos/ListClient.tsx:120`, `app/(sitio)/mis-reservas/MisReservasClient.tsx:238` |
| Volver con flecha (texto verde) | `app/(sitio)/incidencias/IncidenciasClient.tsx:234`, `app/(sitio)/mis-solicitudes/nueva/SolicitarAltaClient.tsx:308`, `app/admin/solicitudes/SolicitudesClient.tsx:669`, `app/(sitio)/registro/components/RegisterView.tsx:72` |
| Agregar ítem (borde punteado) | `components/admin/gcr/shared.tsx:321`, `components/admin/gcr/nutricion.tsx:249` (marrón), `components/panel/actividad/campos.tsx:88` (verde), `app/(sitio)/explorar/[id]/reservar/Travelers.tsx:123` (inline) |
| Segmentado Borrador / Público | `ActividadesClient.tsx:96-116` |
| Píldoras de filtro | `app/panel/[establecimientoId]/reservas/ReservasRecibidasClient.tsx:206` (inline), `MisReservasClient`, `CultivosListClient` (`FiltroTemporadaPills`), `components/faq/piezas.tsx`, `NotificationBell.tsx:163` |
| Botón "Cerrar" de ícono | 42 px (`FaqAdminClient.tsx:223`, `gcr/shared.tsx:109`, `admin/incidencias/IncidenciasClient.tsx:365`, `roles/RoleForm.tsx:111`), 38 px radio 10 (`explorar/[id]/ReseniasModal.tsx:80`), 34 px radio 10 (`chat/VisitorChatDrawer.tsx:69`), 32 px (`estadisticas/EstadisticasClient.tsx:181`, `calendario/CalendarioActividadClient.tsx:175`): 4 tamaños |
| "Ver detalle" falso dentro de una tarjeta-link (`<span class="btn btn-primary btn-sm">`) | `components/catalog/ActividadCard.tsx:59` |

#### A1.4 Botón en estado de envío: 3 patrones

| Patrón | Ejemplos | Aprox. |
|---|---|---|
| El ícono se cambia por el spinner y la etiqueta queda fija (`{busy ? <Loader/> : <Check/>} Confirmar`) | `FaqAdminClient.tsx:366`, `EstablecimientosAdminClient.tsx:396`, `deudas/ResolverDeudaModal.tsx:241`, `impagas/[id]/RegistrarPagoModal.tsx:146`, `datos/CobrosCard.tsx:121`, `ParametrosClient.tsx:136` | 15 |
| Spinner + gerundio ("Guardando…", "Cancelando…", "Dando de baja…", "Reprogramando…", "Generando…", "Reservando tus cupos…") | `DatosPersonalesForm.tsx:261`, `ChangePasswordForm.tsx:174`, `ActivityForm.tsx:528`, `EditarActividadClient.tsx:426`, `CancelarReservaModal.tsx:202`, `ActividadesClient.tsx:630`, `ReprogramarClient.tsx:97`, `EstadisticasClient.tsx:218`, `reservar/Bloqueo.tsx:89` | 10 |
| **TX**: sólo texto, sin spinner | `acceso/components/LoginForm.tsx:146` ("Ingresando…"), `registro/components/RegistroForm.tsx:446` ("Creando tu cuenta…"), `acceso/recuperar/components/RecoverEmailForm.tsx:103`, `RecoverResetForm.tsx:129` | 4 |

### A2. Feedback de éxito, error, advertencia e info

#### A2.1 Toasts: 5 implementaciones

| Implementación | Dónde | Aspecto | Posición / z | Cerrar |
|---|---|---|---|---|
| `<Toast>` compartido (`components/ui/Toast.tsx`) | 22 pantallas | relleno verde / rojo / `info`, ícono, título + `sub` opcional en mono | abajo a la derecha, z-150 | no (sin `role` ni `aria-live`) |
| `CancelToast` | `app/(sitio)/explorar/[id]/reservar/Resultados.tsx:6` | fondo `fg-1` (casi negro), radio 12 | abajo a la derecha, z-120 | sí (X) |
| `flash` de Administradores | `app/admin/administradores/AdministradoresClient.tsx:1375` | verde, inline | **abajo al centro** corrido 132 px por el sidebar, z-80 | no |
| `flash` de Solicitudes | `app/admin/solicitudes/SolicitudesClient.tsx:1183` | verde, sombra propia `.18` | abajo a la derecha, z-90 | no |
| `flash` de Parámetros | `app/admin/parametros/ParametrosClient.tsx:285` | verde o rojo, inline | abajo a la derecha, z-90 | no |

**Toast simple vs. detallado.** Simple (sólo título): la mayoría de los éxitos de admin (FAQ, deudas, impagas, incidencias, cultivos, recetas, establecimientos, roles, productores, datos). Detallado (título + `sub`): `mis-reservas/[id]/DetalleClient.tsx:371/381`, `registro/components/RegistroForm.tsx:138-150`, `actividades/ActividadesClient.tsx:413-447`, `actividades/[id]/dias/CalendarioClient.tsx:204/216/230`, `calendario/[diaId]/ReservasDiaClient.tsx:440`, `editar/EditarActividadClient.tsx:196`. El tono `info` aparece una sola vez (`CalendarioClient.tsx:230`).

**Toast de error.** Se usa toast rojo para errores en 7 pantallas: `/cuenta`, `/registro`, valoración de reserva, abrir cultivo o receta en admin, actividades del panel y exportar estadísticas (más el `flash` rojo de parámetros). En el resto el error de una acción se muestra con un `<Alert>` dentro del diálogo o de la página.

**Duración**: 11 valores distintos, cada pantalla con su `setTimeout`.

| ms | Dónde |
|---|---|
| 3200 | roles |
| 3400 | cultivos, recetas, establecimientos (admin), administradores, datos, productores, reembolsos |
| 3600 | parámetros |
| 3800 | solicitudes |
| 4000 | cuenta, registro |
| 4200 | deudas, deudas/[id], FAQ, impagas/[id], incidencias (admin), estadísticas, `CancelToast` |
| 4800 | actividades |
| 5000 | incidencias (visitante) |
| 5200 | días, reservas del día |
| 5500 / 7000 | mis-reservas/[id] (7000 si es error) |
| 1400 + redirección | crear actividad (`ActivityForm.tsx:168`) |

#### A2.2 Avisos en bloque (banners)

| Variante | Usos |
|---|---|
| `<Alert>` compartido (`components/ui/Alert.tsx`), tonos `danger` (por defecto) / `warning` / `success` — **no tiene `info`** | 65 usos en 36 archivos (43 sin tono = danger, 13 warning, 7 danger explícito, 2 success) |
| `FormAlert` propio de `/acceso` (`app/acceso/components/AuthShell.tsx:192`), estilos inline, **sí tiene `info`** | 6 |
| Banners armados a mano con las mismas clases | ~17: `SolicitarAltaClient.tsx:574` y `:604`, `EditarActividadClient.tsx:212` (info) y `:232` (danger), `reservar/ReservaClient.tsx:325` y `:389` (inline), `BookingWidget.tsx:270` y `:283`, `admin/AdminPanelClient.tsx:79`, `gestion-dias/CancelarDiaModal.tsx:67`, `gestion-dias/LoteDrawer.tsx:144`, `actividad/TarifasEditor.tsx:273`, `ActivityForm.tsx:436`, `actividad/DisponibilidadEditor.tsx:214`, `roles/RoleForm.tsx:209`, `gestion-dias/piezas.tsx:70`, `actividad/campos.tsx:67` |

#### A2.3 Diálogos

| Implementación | Escape cierra | Click afuera cierra | Dónde |
|---|---|---|---|
| `<Modal>` (`components/ui/Modal.tsx`) | **no** | sí (salvo `dismissable={false}`) | 36 usos en 22 archivos |
| `<Panel>` (`components/ui/Panel.tsx`) | sí | sí | productores (3), roles, `LoteDrawer` |
| `<Sheet>` (Base UI) | sí | sí | `BookingWidget` (móvil), reembolsos |
| `GcrFormShell` (`components/admin/gcr/shared.tsx:73`) | sí | sí | cultivos, recetas, FAQ, incidencias (admin) |
| `Scrim` propio (`AdministradoresClient.tsx:766`), z-60 | sí | sí | administradores |
| Overlay inline de Parámetros (`ParametrosClient.tsx:107`, `:153`), z-80 | sí | sí | parámetros |
| Cajón inline (`CalendarioActividadClient.tsx:503`), z-120 | — | sí | calendario |
| Cajón de chat (`VisitorChatDrawer.tsx:285`), z-190 | — | sí | chat del visitante |

Velos (scrim) con 6 colores distintos: `rgba(42,38,32,.48)` (`Modal`), `.45` (`Panel`, `GcrFormShell`, `Scrim`, Parámetros), `.32` (`Sheet`, chat), `rgba(31,28,22,.32)` (calendario), `rgba(45,40,30,.42)` (cajones de los shells).

**Cruz de cerrar y scroll** (relevado el 2026-10-24, después de migrar las confirmaciones a `ConfirmDialog`). La regla nueva está en la guía, "Diálogos".

| Qué pasa hoy | Dónde |
|---|---|
| Cabecera fija con cruz, cuerpo con scroll y pie fijo (el patrón de la guía), cada uno armado a mano | `deudas/ResolverDeudaModal.tsx` (ya sobre `Dialog`), `impagas/[id]/RegistrarPagoModal.tsx`, `gestion-dias/AbrirDiaModal.tsx`, `EditarCupoModal.tsx` y `LoteDrawer.tsx` (cruz de `gestion-dias/piezas.tsx`), `mis-reservas/[id]/ValorarModal.tsx`, `explorar/[id]/ReseniasModal.tsx`, los formularios en `GcrFormShell` (cultivos, recetas, FAQ, incidencias), `RoleForm` en `Panel`, `Sheet` (reembolsos, `BookingWidget`) |
| Cruz flotante (`absolute`) y **sin alto máximo**: en una ventana baja la caja se sale de la pantalla | `estadisticas/EstadisticasClient.tsx:181` (exportar reporte) |
| **Sin cruz**: se cierra sólo con "Cancelar", Escape o click afuera | todos los `ConfirmDialog` (hasta esta migración), `ProductorForm` en `Panel`, formulario de administradores en `Scrim`, reprogramar, salir sin guardar (editar actividad, solicitar alta), modal informativo de actividades, los dos de parámetros |
| Pasos sin salida (no llevan cruz a propósito) | "Verificando condiciones…" y "Tu cuenta ha sido eliminada" (`DeleteAccountFlow`), "Verificando…" (`EliminarEstablecimientoFlow`, `CancelarReservaModal`) |

Cada uno arma su cabecera y su pie a mano: el padding de la cabecera va de `px-[26px] py-5` a `px-7 pt-6`, y el pie es crema con borde en unos y blanco sin borde en otros.

**Relevamiento general de los diálogos** (2026-10-24). La decisión que sale de acá está en la guía, decisiones 34 a 36.

| Familia | Diálogo | Base y ancho | Qué tiene de distinto |
|---|---|---|---|
| Confirmaciones | 14 (eliminar, dar de baja, suspender, rechazar, cancelar…) | `ConfirmDialog`, 468 px | Unificadas |
| Formularios largos | Cultivo, receta, FAQ, incidencia (admin) | `GcrFormShell`, 680 px | Cruz y scroll bien; sin trampa de foco ni bloqueo de scroll |
| | Productor: alta y cambio de rol (`ProductoresClient.tsx`, `ProductorForm`) | `Panel`, 620 px | **Sin cruz**: su `PanelHeader` no la tiene |
| | Rol, en admin y en panel (`roles/RoleForm.tsx`) | `Panel`, 720 px | Cruz y scroll bien |
| | Administrador (`AdministradoresClient.tsx`, `AdminForm`) | `Scrim`, 620 px, estilos inline | El rechazo va con `ErrMsg` (texto rojo), no con `Alert` |
| Formularios cortos | Resolver deuda | `Dialog`, 560 px | El piloto |
| | Registrar pago (`impagas/[id]/RegistrarPagoModal.tsx`) | `Modal`, 520 px | Tres zonas armadas a mano |
| | Abrir día, editar cupo (`gestion-dias/`) | `Modal`, 540 px | Tres zonas; cabecera propia con el bloque de la fecha (`CabeceraDia`) y padding `px-6` |
| | Valorar reserva (`mis-reservas/[id]/ValorarModal.tsx`) | `Modal`, 560 px | Pie blanco sin borde y botones invertidos (la acción primero) |
| | Exportar reporte (`estadisticas/EstadisticasClient.tsx:181`) | `Modal`, 520 px | Cruz flotante y sin alto máximo |
| Lectura | Reseñas (`explorar/[id]/ReseniasModal.tsx`) | `Modal`, 720 px | Cruz y scroll bien |
| Varios pasos | Eliminar cuenta, eliminar establecimiento, cancelar reserva | `Modal` para verificar, error y resultado + `ConfirmDialog` para confirmar | Cada paso es otro diálogo: al cambiar de paso uno se cierra y abre el siguiente |
| Avisos sueltos | Confirmar reprogramación, salir sin guardar (editar actividad, solicitar alta), "no es posible eliminar" (actividades) | `Modal`, 440 px y 468 px | Sin cruz |
| Parámetros | Reautenticación, revisión de cambios | Overlays inline, 440 y 620 px, z-80 | Esperan la reautenticación real |
| Cajones laterales | Lote de días (`LoteDrawer`), reembolsos, chat del visitante, calendario | `Panel` derecha 600 px, `Sheet` 460 px, dos propios | Otra familia |

**Estado de la migración** (2026-10-24): los formularios largos (cultivo, receta, FAQ, incidencia, productor, administrador y rol) ya están sobre `Dialog` `lg`, con cruz, trampa de foco y bloqueo de scroll. El `Scrim` de administradores se eliminó y `Panel` quedó sólo para `LoteDrawer`. Falta el resto de la tabla.

**Lo que se repite.** Los cuatro formularios largos son un solo diseño implementado cuatro veces sobre tres bases. Llevan la misma cabecera (etiqueta + título de 24 px + bajada, `px-[26px] py-[22px]` con borde), el mismo cuerpo con scroll y el mismo pie crema. `ProductorForm` y `AdminForm` son casi gemelos: alta por correo con un rol, o cambio del rol ("Cambiar el rol asignado").

**Lo que difiere.**

- **Bases:** seis (`Dialog`, `Modal`, `Panel`, `GcrFormShell`, `Scrim`, overlays de parámetros). Sólo `Dialog` y `Sheet` traen trampa de foco y bloqueo de scroll.
- **Escape:** `Modal` no lo atiende, salvo que la pantalla agregue el suyo (exportar). `Panel`, `GcrFormShell` y `Scrim` sí, cada uno con su propio listener.
- **Cambios sin guardar:** ningún formulario en diálogo pregunta al cerrar. Escape o un click afuera descartan lo escrito.
- **Anchos:** ocho (440, 468, 520, 540, 560, 600, 620, 680 y 720 px).
- **Título:** 16,5, 18, 20, 21, 22 o 24 px.
- **Cabecera:** `py-5`, `py-[22px]` o `pt-[22px] pb-[18px]`; `px-6` o `px-[26px]`.

#### A2.4 Diálogo de resultado y pantalla de resultado

- **Modal de resultado o de proceso**: `cuenta/components/DeleteAccountFlow.tsx:225/253`, `mis-reservas/[id]/CancelarReservaModal.tsx:105` (procesando) y `:140` (resultado), `datos/EliminarEstablecimientoFlow.tsx:118` (verificando) y `:174` (error), `ActividadesClient.tsx:640` (no se puede eliminar).
- **Pantalla de resultado**: `acceso/components/LoginSuccess.tsx` (redirige sola a los 2,6 s), `acceso/recuperar/components/RecoverSentView.tsx`, `RecoverDoneView.tsx` (redirige a los 3 s), `acceso/recuperar/page.tsx:80` (código inválido), confirmación de `mis-solicitudes/nueva`, `mercadopago/vinculacion/VinculacionClient.tsx` (vuelve sola sólo si salió bien), `reservar/Bloqueo.tsx` (cupos retenidos), reprogramación exitosa (`ReprogramarClient.tsx:117`).

#### A2.5 Errores de carga

| Variante | Dónde |
|---|---|
| **AB-err** (`components/AsyncBoundary.tsx:37-50`): muestra `{error}` tal cual en monoespaciada | 48 usos en 44 archivos. El texto suele ser técnico: `Backend respondió 500 (code)` (de `lib/api.ts:23`), `Failed to fetch`, o un código del backend como `env.code` (`hooks/useInfoParaReservar.ts:68`) |
| Texto rojo sin reintentar | `panel/[establecimientoId]/chats/EstChatsClient.tsx:198` |
| Texto gris + link "Reintentar" | `PanelClient.tsx:360` |
| `<Alert>` + reintentar | `explorar/[id]/ReseniasModal.tsx:172`, `datos/CobrosCard.tsx:72` |
| Error + `btn-neutral btn-sm` | `NotificationBell.tsx:201` |
| Sin estado de error (desaparece en silencio) | pronóstico del clima (`explorar/[id]/DetalleClient.tsx:285`) |

#### A2.6 Errores de campo (inline)

| Variante | Usos |
|---|---|
| `<FormMessage>` | 114 en 28 archivos |
| `ErrMsg` locales (mismo diseño, 3 copias) | `AdministradoresClient.tsx:109`, `ProductoresClient.tsx:173`, `roles/RoleForm.tsx:24` (7 usos) |
| `ErrorMsg` de `components/panel/actividad/campos.tsx:25` | 6 |
| `GcrErr` de `components/admin/gcr/shared.tsx:173` | 9 |
| Clase global `.err-msg` (fuera de capa) | 11 en 7 archivos |
| Error inline con estilos propios | `ParametrosClient.tsx:22`, `reservar/Travelers.tsx:57` |
| Borde rojo con la clase heredada `.input.err` / `.textarea.err` | `ProductoresClient.tsx:698`, `:727`, `:863` |

Anuncio para lectores de pantalla: `role="alert"` 3 veces, `aria-live` 4, `role="status"` 1 (`mis-reservas/[id]/DetalleClient.tsx:117`). El `<Toast>` no se anuncia.

### A3. Valores hardcodeados que no salen de tokens

| Categoría | Hallazgo |
|---|---|
| **Estilos inline** | 626 `style={{…}}` en 38 archivos. Los que más tienen: `AdministradoresClient` 79, `ParametrosClient` 71, `explorar/[id]/DetalleClient` 60, `reservar/ReservaClient` 58, `establecimientos/[id]/DetalleClient` 56, `panel/reservas/ReservasRecibidasClient` 50, `acceso/components/AuthShell` 27, `catalog/controls` 23 |
| **Bloques `<style>`** | 6: `establecimientos/[id]/DetalleClient.tsx:245`, `explorar/[id]/DetalleClient.tsx:483`, `reservar/Travelers.tsx:130`, `acceso/components/AuthShell.tsx:125`, `landing/ContactoSection.tsx:128`, `landing/SiteFooter.tsx:84` |
| **Colores hex** | `#fff` ×30 y `text-white` ×68 (el token es `fg-on-dark`). Degradados con hex fuera de la paleta (`#0a2209`, `#4a7c3f`) en `landing/Hero.tsx`, `landing/Photo.tsx` y `acceso/components/AuthShell.tsx`, más copias en minúscula de tokens (`#2d5a27`, `#1e5418`…). Paleta de avatares propia en `chat/VisitorChatDrawer.tsx` (`#D99A4E`, `#B86B4F`, `#6F9E64`…). `#FBF3D6` / `#E6CA72` / `#8A6D12` en `admin/gcr/shared.tsx`, `#F3ECE2` en `admin/recetas/RecetasClient.tsx`, `#EAF1E2` en `panel/charts.tsx` y `EstadisticasClient.tsx` |
| **Dos amarillos de estrella** | `--color-star: #E0A422` es el token, pero `reservar/ReservaClient.tsx` y `establecimientos/[id]/DetalleClient.tsx` pintan la estrella con `#C9A227` (que es `season-growing`) |
| **rgba sueltos** | 6 velos distintos (ver A2.3); sombras `rgba(45,90,39,.16)` y `.18` fuera de los dos tokens (`.08` hover, `.12` pop) |
| **Tamaños de fuente** | 36 tamaños arbitrarios distintos en Tailwind (`text-[13.5px]` ×154, `text-[13px]` ×134, `text-[12.5px]` ×130, `text-[15px]` ×77, `text-[11.5px]` ×73, `text-[14.5px]` ×71…) más 30 valores de `fontSize` inline. El `@theme` no define escala tipográfica (`--body`, `--body-sm`, `--label` están en `:root` y no generan utilidades) |
| **Pesos** | `font-semibold` y `font-bold` se alternan para el mismo rol (títulos de tarjeta, títulos de vacío); inline `fontWeight` 500 ×19, 600 ×61, 700 ×60 |
| **Interletrado** | 15 valores de `tracking-[…]`; el mismo valor escrito de dos formas (`.06em` ×21 y `0.06em` ×4; `-.01em` ×34 y `-0.01em` ×4) |
| **Radios** | Tokens: `sm` 6 px, `md` 8, `lg` 16, `pill`. Arbitrarios: `rounded-[10px]` ×54, `[9px]` ×16, `[var(--radius)]` ×13 (= `rounded-md`), `[14px]` ×12, `[3px]` ×8, `[5px]` ×6, `[16px]` ×6 (= `rounded-lg`), `[12px]` ×5, `[11px]`, `[13px]`, `[7px]`…; `rounded-xl` ×19 y `rounded-2xl` ×5, que salen de `calc(var(--radius) * 1.4)` (11,2 px). Inline: `borderRadius` 10/12/14/9/8/6/5/4 (~30) y `999` ×6 |
| **Sombras** | 25 sombras arbitrarias. La sombra táctil existe como variable (`--btn-tactile-*`) pero está escrita a mano 20 veces (`shadow-[inset_0_-2px_0_var(--green-900)]` ×9, `…var(--green-100)` ×8, `…var(--brown-800)` ×4); `shadow-md` de Tailwind ×2 |
| **Espaciado** | 616 utilidades de espaciado arbitrarias (`gap-[7px]` ×45, `mb-[18px]` ×34, `px-[26px]` ×33, `px-[18px]` ×31, `gap-[18px]` ×25, `px-[22px]` ×25…) y 531 `padding` / `gap` / `margin` inline. `--space-1…8` existen en `:root` pero no en `@theme` |
| **Breakpoints** | Además de `shell:` (1000) y `nav:` (861): `sm:` ×83, 8 arbitrarios (`min-[681px]` ×13, `min-[1041px]` ×7, `min-[941px]`, `min-[1100px]`, `min-[961px]`, `min-[881px]`, `min-[560px]`, `min-[481px]`), 6 `@media` en bloques `<style>` (460, 560, 720, 760, 880, 940) y la constante `BREAKPOINT_SHELL = 1000` en JS (`BookingWidget.tsx:19`) |
| **z-index** | 19 valores. Capas superpuestas fuera de escala: `Scrim` z-60, parámetros z-80, flashes z-80/90, `CancelToast` z-120, `Modal`/`Panel` z-140, `Sheet` z-145, `Toast` z-150, chat z-190/200 |
| **Tipografías** | `fontFamily` inline ×80+, todas con variables del tema: el valor sale del token pero no de la utilidad |

### A4. Qué variante de botón se usa en cada contexto

| Contexto | Variante dominante | Desvíos |
|---|---|---|
| CTA principal del encabezado ("Agregar …") | `Button` primary **lg**: `gcr/shared.tsx:522` (cultivos, recetas), `FaqAdminClient.tsx:578`, `RolesScreen.tsx:340`, `ProductoresClient.tsx:1119` | `.btn-primary .btn-lg` heredado (`AdministradoresClient.tsx:1072`, `ParametrosClient.tsx:247`); **md**: crear actividad (`ActividadesClient.tsx:473`, `buttonClasses()`), nueva solicitud (`MisSolicitudesClient.tsx:126`, `.btn-primary`), reportar incidencia (`incidencias/IncidenciasClient.tsx:157`), exportar reporte (`EstadisticasClient.tsx:292`) |
| Acción de fila de tabla | `ActionBtn` (admin cultivos, recetas, establecimientos, administradores; productores) | `Button neutral sm` con overrides (`RolesScreen.tsx:418-439`); `CardAction` con sombra táctil (actividades); sólo ícono (FAQ); link `buttonClasses({ variant: "neutral", size: "sm" })` "Ver" (`DeudasClient.tsx:95`, `ImpagasClient.tsx:74`) y primary sm (`ImpagasClient.tsx:83`) |
| Confirmación destructiva (pie de diálogo) | `neutral` + `danger`, alineados a la derecha | Textos y orden, ver tabla siguiente |
| Pie de formulario en diálogo | `neutral` "Cancelar" a la izquierda + primary a la derecha | `mis-reservas/[id]/ValorarModal.tsx:151-155` **invierte el orden** (primary primero, ancho completo); el "Cancelar" es `ghost` en reembolsos (`ReembolsosClient.tsx:237`), eliminar establecimiento (`EliminarEstablecimientoFlow.tsx:238`) y liberar cupos (`Bloqueo.tsx:59`); `.btn` heredado en parámetros |
| Volver al listado | 4 variantes: `Button neutral sm` (`ActivityForm.tsx:198`, `EditarActividadClient.tsx:511`); link `.btn-neutral .btn-sm` (`mis-reservas/[id]/DetalleClient.tsx:408`); link `buttonClasses` neutral sm (`deudas/[id]/DetalleDeudaClient.tsx:272`, `impagas/[id]/DetalleReembolsoClient.tsx:256`); texto verde con flecha (incidencias, solicitar alta, solicitudes, registro) | — |
| Reintentar | `.btn-primary` (`AsyncBoundary`) | link subrayado (`PanelClient.tsx:362`), `.btn-neutral .btn-sm` (`NotificationBell.tsx:201`), `Button danger` (`DeleteAccountFlow.tsx:268`) |
| Limpiar filtros | `.btn-neutral` (`CatalogClient.tsx:166`, `ListClient.tsx:165`, `MisReservasClient.tsx:261`) | `Button neutral` "Ver todos" / "Ver todas" (cultivos, ayuda); texto inline (`CatalogClient.tsx:121`, `ListClient.tsx:120`, `MisReservasClient.tsx:238`) |
| Destructiva principal en página (no en diálogo) | — | "Eliminar establecimiento" es `Button danger` relleno (`datos/DatosClient.tsx:620`); "Eliminar cuenta", equivalente, es un `<button>` de contorno rojo (`DatosPersonalesForm.tsx:272`) |

**Textos de los diálogos de confirmación destructiva**

| Cancelar | Confirmar | Dónde |
|---|---|---|
| "No, volver" | "Sí, eliminar" | `gcr/shared.tsx:59-62` (cultivos, recetas) |
| "No, volver" | (danger) | `AdministradoresClient.tsx:755`, `RolesScreen.tsx:489`, `ProductoresClient.tsx:1358` |
| "No, volver" | primary "Reactivar" | `EstablecimientosAdminClient.tsx:433` |
| "Cancelar" | "Eliminar" | `FaqAdminClient.tsx:362-366` |
| "Cancelar" | danger **"Confirmar" con ícono de tilde** (dar de baja actividad) | `ActividadesClient.tsx:626-632` |
| "Cancelar" | "Suspender establecimiento" | `EstablecimientosAdminClient.tsx:392-397` |
| "Cancelar" | "Confirmar cancelación" | `gestion-dias/CancelarDiaModal.tsx:115-121` |
| "Cancelar" | "Confirmo eliminar mi cuenta" | `DeleteAccountFlow.tsx:157-160` |
| "Seguir editando" | danger "Abandonar" | `SolicitarAltaClient.tsx:671-676` |
| "Seguir editando" | **primary** "Salir sin guardar" | `EditarActividadClient.tsx:465-470` |

Los dos diálogos de "salir sin guardar" también difieren en el trato: "¿**Desea** abandonar el formulario?" (`SolicitarAltaClient.tsx:665`) contra "¿Salir sin guardar? … Si **salís** ahora" (`EditarActividadClient.tsx:459`).

### A5. Layouts de cards

**Superficie base.** Dos fuentes: `<Card>` (`components/ui/Card.tsx`, radio `lg`, sin padding) en 30 archivos, y la clase global `.card` (radio `lg` + padding 24 px) en 9 archivos, casi siempre pisando el padding inline (`style={{ padding: 0 }}`). Además, unas 40 superficies `rounded-lg border border-outline-variant bg-surface` armadas a mano.

**Tarjeta de catálogo vertical (foto arriba, cuerpo, pie con borde)**: 7 implementaciones

| Tarjeta | Alto foto | Padding | Título | Hover | Pie / CTA |
|---|---|---|---|---|---|
| `ActividadCard` (`components/catalog/ActividadCard.tsx`) | 180 | 18 | 18,5 px bold | sube 2 px + sombra | precio "Desde" + **botón falso** primary sm |
| `EstablecimientoCard` (`components/catalog/EstablecimientoCard.tsx`) | 150 | 18 | 18,5 bold | sube 2 px | conteo + link verde "Ver establecimiento" |
| `CultivoCard` (`cultivos/CultivosListClient.tsx:76`) | 170 | 18 | 19 semibold | sube 1 px | link verde "Ver cultivo", sin borde de pie |
| `RecetaCard` (`recetas/RecetasListClient.tsx:200`) | 176 | 18 | 19 semibold | sube 1 px | chips de cultivo |
| `RecetaCard` de cultivo (`cultivos/[id]/DetalleClient.tsx:113`) | 140 | 16 | 16 semibold | `TARJETA_HOVER` | "Ver receta" **gris** + flecha |
| `ActividadCard` de cultivo (`cultivos/[id]/DetalleClient.tsx:142`) | 130 | 16 | 15,5 semibold | `TARJETA_HOVER` | precio verde mono + "Ver" |
| `ActividadCard` de establecimiento (`establecimientos/[id]/DetalleClient.tsx:31`), inline | 150 | 16 | 16,5 bold | `.card-hover` (del `<style>` local) | puntuación con estrella `#C9A227` |

La insignia de estado va arriba a la derecha en cultivos y arriba a la izquierda en recetas y establecimientos.

**Tarjeta horizontal con foto**: `ReservaCard` (`mis-reservas/MisReservasClient.tsx:41`), foto de 220 px a la izquierda, grilla de 3 metadatos y pie con total.

**Tarjeta de acceso**: `AccessCard` (`admin/AdminPanelClient.tsx:24`), ícono 52 px radio 13, título 21 px, link verde.

**KPI / métrica**: 8 implementaciones

| Componente | Contenedor | Ícono | Valor |
|---|---|---|---|
| `Stat` (`admin/AdminPanelClient.tsx:12`) | `Card` | 48, `rounded-xl` | mono 28 |
| `GcrStats` (`gcr/shared.tsx:410`) | `Card` | 42, radio 10 | mono `xl` |
| `Kpi` (`admin/deudas/DeudasClient.tsx:28`) | div radio `--radius` (8 px) | 44, radio 11 | **display** 22 |
| `Kpi` (`admin/impagas/ImpagasClient.tsx:30`) | ídem + subtítulo | 44 | display 22 |
| `MiniKpi` (`reembolsos/ReembolsosClient.tsx:32`) | `rounded-md` | 40, radio 10 | display `2xl` |
| `KpiCard` (`estadisticas/EstadisticasClient.tsx:70`) | `Card` p-6, alto mínimo 200, pie con tono | 32, `rounded-lg` | contenido libre |
| `Metrica` (`calendario/CalendarioActividadClient.tsx:73`) | `rounded-lg` p-5 | 46, radio 12, **con borde** | mono 26 |
| `Metric` (`reservas/ReservasRecibidasClient.tsx:113`) | `.card` inline | inline junto al rótulo | display 26 |

A eso se suma la grilla de "últimos 30 días" de `PanelClient.tsx:322`. El valor numérico alterna entre monoespaciada y display; el radio, entre `lg` (16) y `md` (8).

**Contenedor de tabla**: `<Card className="overflow-hidden">` en la mayoría; `.card` con `padding: 0` inline en `AdministradoresClient.tsx:845`, `ParametrosClient.tsx:267`, `ReservasRecibidasClient.tsx:52`.

**Sección de detalle o formulario**: `SectionCard` (`datos/SectionCard.tsx`), `SectionBox` (`admin/solicitudes`), `Bloque` (`impagas/[id]/DetalleReembolsoClient.tsx:159`), `.card` + inline (`explorar/[id]/DetalleClient.tsx:430`, `reservar/ReservaClient.tsx:81`, `:363`), `DiasHorarios` en `Card` p-5 (calendario).

**Card de estado vacío**: borde punteado `sand` (listados públicos, `MisReservas`, ayuda, landing, panel/reservas) o borde sólido (`SinPermiso`, `MisSolicitudes`, admin incidencias). El círculo del ícono mide 56, 64, 68 u 80 px y es `cream-tert` o `green-050`, a veces `rounded-2xl` en vez de círculo (`incidencias/IncidenciasClient.tsx:117`, `admin/incidencias:590`).

---

## Parte B — Estados de pantalla

### Cómo se resuelven 401 y 403 en general

- **No hay manejo de HTTP 401.** `lib/api.ts` convierte cualquier no-2xx en `ApiError`. Ningún hook mira `status === 401`, así que un 401 a mitad de sesión cae como fallo técnico: **AB-err** con `Backend respondió 401` en las lecturas, o mensaje genérico en las escrituras. Lo que sí se maneja es **no tener sesión de Firebase** (`onAuthStateChanged`), y eso es lo que muestran las columnas "401" de abajo.
- **Sesión que vence o se cierra en otra pestaña**: `AuthSync` limpia el store. En `/admin` y `/panel`, `GuardRol` reacciona y redirige. En las pantallas de visitante, sólo las que escuchan `unauthenticated` en su hook.
- **403 sólo se lee explícitamente en 4 hooks** (`useDeudas`, `useImpagas`, `useReembolsosPendientes` y los modales de deudas, impagas y reembolsos). El resto lo trata como error técnico.
- **Navegación**: `AdminShell` y `PanelShell` **ocultan** las entradas del menú sin permiso. `PanelClient` también oculta los accesos rápidos según el permiso.
- **Esperas sin dibujar nada**: `GuardRol`, `GuardPermisoProductor`, `GuardEstablecimientoUrl` y `GuardEstablecimientoSuspendido` devuelven `null` mientras deciden. El área de contenido queda en blanco y el shell sí está.

### B1. Carga, vacío y error

| Ruta | Carga | Vacío (sin datos) | Vacío (filtro / búsqueda) | Error de red / servidor | Error de validación |
|---|---|---|---|---|---|
| `/` (landing) | SK (tarjetas) | caja punteada con texto (`landing/Destacados.tsx:60`) | n/a | AB-err | Contacto: **mock sin validación**; siempre "¡Mensaje enviado!" (`ContactoSection.tsx:40`) |
| `/ayuda` | SK | `FaqVacio` "Todavía no hay preguntas frecuentes" | `FaqVacio` + "Ver todas" | AB-err | n/a |
| `/cultivos` | SK | `Vacio` ilustrado | `Vacio` + "Ver todos" | AB-err | n/a |
| `/cultivos/[id]` | SK | `Vacio` de texto por sección; id inexistente → `NoEncontrado` | n/a | AB-err | n/a |
| `/establecimientos` | SK | `Vacio` | `Vacio` + "Limpiar todo" (`.btn-neutral`) | AB-err | n/a |
| `/establecimientos/[id]` | SK | `Vacio` por sección; `NoEncontrado` (inline) | n/a | AB-err | n/a |
| `/explorar` | SK | `Vacio` | `Vacio` + "Limpiar todo" | AB-err | n/a |
| `/explorar/[id]` | SK; reseñas: SK + spinner "Cargando más reseñas…" | "Todavía no hay reseñas"; sin fechas → `SinReservas`; `NoEncontrado` | reseñas: "No hay reseñas con este filtro" | AB-err; reseñas: `Alert` + reintentar; clima: sin estado de error | n/a |
| `/explorar/[id]/reservar` | **SP** (sin esqueleto) + SB | n/a | n/a | AB-err, **con el código del backend crudo**; al confirmar: `Alert`; cupos agotados: banner + recarga del calendario; liberar falla: `CancelToast` | inline propio por rango etario (`Travelers.tsx:57`); confirmar deshabilitado |
| `/incidencias` | SK + SB | `SinIncidencias` + CTA | n/a | AB-err; envío: `Alert` | FM + FC |
| `/mercadopago/pago` | n/a (redirección de servidor) | n/a | n/a | n/a | n/a |
| `/mercadopago/vinculacion` | — | n/a | n/a | pantalla de resultado (error / cancelado) | n/a |
| `/mis-reservas` | SK | `EmptyState` + "Explorar experiencias" | `EmptyState` + "Limpiar filtros" | AB-err | n/a |
| `/mis-reservas/[id]` | SK; pago en confirmación: `Alert warning` con spinner (consulta periódica) | `NoEncontrada` | n/a | AB-err; valorar: toast rojo detallado; cancelar: `Alert` en el modal | Valorar: FM + FC |
| `/mis-solicitudes` | SK | `EmptyState` + CTA | n/a | AB-err | n/a |
| `/mis-solicitudes/[id]` | SK | `NoEncontrada` | n/a | AB-err | n/a |
| `/mis-solicitudes/nueva` | spinner "Verificando tu sesión…" + SB | n/a | n/a | banner a mano (`SolicitarAltaClient.tsx:604`) | FM + FC + `setError` del servidor |
| `/recetas` | SK | `Vacio` | `Vacio` + acción | AB-err | n/a |
| `/recetas/[id]` | SK | `Vacio` por sección; `NoEncontrada` | n/a | AB-err | n/a |
| `/registro` | **TX** | n/a | n/a | toast rojo detallado | FM + `setError` por código |
| `/registro/completar` | spinner | n/a | n/a | — | n/a |
| `/cuenta` | **SP** + SB | n/a | n/a | AB-err; guardar: `Alert` + toast rojo | FM + `setError` |
| `/acceso` | **TX** | n/a | n/a | `FormAlert` danger | FM |
| `/acceso/recuperar` | spinner (verifica el código) + TX | n/a | n/a | pantalla de código inválido; `FormAlert` | FM |
| `/admin` | SK | n/a | n/a | AB-err | n/a |
| `/admin/administradores` | SK + SB | fila de tabla con texto plano | n/a (no hay búsqueda) | AB-err; acciones: `flash` propio | FM + `ErrMsg` local |
| `/admin/cultivos` | SK + SB | `GcrEmptyState` | `GcrNoMatch` | AB-err; abrir edición: toast rojo; guardar: aviso dentro del panel | FM / `GcrErr` + FC |
| `/admin/recetas` | SK + SB | `GcrEmptyState` | `GcrNoMatch` | ídem cultivos | FM / `GcrErr` + FC |
| `/admin/deudas` | SK | `Vacio` | `Vacio` (buscando / filtrado) | AB-err (403 → "No tenés permiso para ver las deudas") | resolver: FM + FC |
| `/admin/deudas/[id]` | SK | n/a | n/a | AB-err | resolver: FM + FC |
| `/admin/establecimientos` | SK + SB | texto en la tabla | texto en la tabla | AB-err; acción: `Alert` en el modal | suspender: FC (motivo) |
| `/admin/faq` | SK + SB | `FaqVacio` sin datos | `FaqVacio` sin búsqueda / sin categoría | AB-err; borrar: `Alert` en el modal | FM + FC |
| `/admin/impagas` | SK | `Vacio` | `Vacio` | AB-err (403 → mensaje) | n/a |
| `/admin/impagas/[id]` | SK + SB | n/a | n/a | AB-err; `Alert warning` | registrar pago: FM + FC |
| `/admin/incidencias` | SK + SB | caja ilustrada "No hay incidencias reportadas" | "No hay incidencias con ese estado" | AB-err; detalle: error propio en el panel | FM + FC |
| `/admin/parametros` (**mock**) | **SP** "Cargando parámetros…" + SB | n/a | n/a | AB-err; guardar: `flash` rojo propio | error inline propio + `flash` "Revisá los campos marcados" |
| `/admin/roles` | SK | texto (`RolesScreen.tsx:354`) | n/a | AB-err | FM + `ErrMsg` local + FC |
| `/admin/solicitudes` | SK | texto en la tabla | texto en la tabla | AB-err | n/a |
| `/admin/solicitudes/[id]` | SK + spinner en "Aprobar" | n/a | n/a | AB-err; resolver: `.err-msg` (`SolicitudesClient.tsx:910`) | contador de caracteres + `.err-msg` |
| `/panel` | `DashboardSkeleton` → redirige | `EmptyEstablecimiento` | n/a | n/a | n/a |
| `/panel/[id]` | SK | `EmptyEstablecimiento`; reseñas: texto | n/a | AB-err; bloque 30 días: texto + link "Reintentar" | n/a |
| `/panel/[id]/actividades` | SK; spinner en el chip Borrador / Público; SB | "Todavía no hay actividades" + Crear | "Sin coincidencias" | AB-err; `Alert`; toast rojo | n/a |
| `…/actividades/crear` | SB | n/a | n/a | `Alert` | FM + FC por paso (no deja avanzar) |
| `…/actividades/[id]/editar` | SK + SB | n/a | n/a | AB-err; `Alert` | FM + banner a mano "Revisá los campos marcados en rojo" (`EditarActividadClient.tsx:232`) |
| `…/actividades/[id]/dias` | SK | n/a | n/a | AB-err; `Alert`s (suspendido, de baja, borrador); `Alert` en cada modal | modales: FM + FC |
| `…/actividades/[id]/calendario` | SK | `SinSeleccion`; "Sin días cargados." | n/a | AB-err; `Alert` | n/a |
| `…/calendario/[diaId]` | SK (cabecera y tabla) | `SinReservas` | `SinReservas` + limpiar | AB-err; `Alert` en el modal | cancelar día: motivo |
| `…/calendario/[diaId]/reprogramar` | SK + SB | n/a | n/a | AB-err; `Alert` | FM + FC |
| `/panel/[id]/chats` | esqueleto de filas | "Todavía no hay consultas" | "Sin resultados" | **texto rojo, sin reintentar** | n/a |
| `/panel/[id]/datos` | SK + SB por sección | `SinEstablecimiento` propio; cultivos: texto | n/a | AB-err; `Alert`; cobros: `Alert` | FM (reemplaza la ayuda del campo) |
| `/panel/[id]/estadisticas` | SK + SB "Generando…" | `EmptyEstablecimiento`; tabla "No hay actividades vigentes"; KPI "Sin …" | n/a | AB-err; exportar: toast rojo | n/a |
| `/panel/[id]/productores` | SK + SB | `EmptyEstablecimiento`; tabla vacía | n/a | AB-err; `Alert` en paneles | FM + `ErrMsg` local + `.input` / `.textarea` heredados |
| `/panel/[id]/reembolsos` | SK + SB | `SinPendientes`; `SinEstablecimiento` propio | n/a | AB-err; `Alert` en el `Sheet` | n/a |
| `/panel/[id]/reservas` (**mock**) | **SP** "Cargando reservas…" | caja punteada inline | la misma caja con otro texto | AB-err | n/a |
| `/panel/[id]/roles` | SK | `EmptyEstablecimiento`; texto | n/a | AB-err | FM + FC |

### B2. Autorización, confirmaciones y cambios sin guardar

| Ruta | 401 (sin sesión / sesión vencida) | 403 (sin permiso) | Pide confirmación | **No** pide confirmación | Cambios sin guardar al salir |
|---|---|---|---|---|---|
| `/` y páginas públicas de catálogo y detalle | n/a | n/a | n/a | n/a | n/a |
| `/explorar/[id]` | "Contactar" sin sesión → push a `/acceso` (`chat/ContactarEstablecimiento.tsx:32`); "Reservar" lleva a `/reservar` sin chequear | n/a | n/a | n/a | n/a |
| `/explorar/[id]/reservar` | **No redirige**: AB-err "Necesitás iniciar sesión para ver esta actividad" + "Reintentar" (`hooks/useInfoParaReservar.ts:58`) | n/a | confirmar reserva (paso con cupos retenidos) | "Cancelar y liberar cupos" (`Bloqueo.tsx:59`) | — |
| `/incidencias` | redirige a `/acceso`; **pantalla en blanco** mientras tanto (`IncidenciasClient.tsx:333`) | n/a | n/a | "Cancelar" del formulario descarta lo escrito | — |
| `/mis-reservas` | redirige, con spinner | n/a | n/a | n/a | n/a |
| `/mis-reservas/[id]` | redirige, con spinner | n/a | cancelar reserva (`Modal`, con condición de reembolso) | — | valorar: click afuera descarta la reseña |
| `/mis-solicitudes`, `/mis-solicitudes/[id]` | redirige, con spinner | n/a | n/a | n/a | n/a |
| `/mis-solicitudes/nueva` | spinner "Redirigiendo…" | n/a | abandonar el formulario (`Modal`) | — | `Modal` **sólo** desde "Volver" y "Cancelar" (`irA`, `SolicitarAltaClient.tsx:281`); el header, el back del navegador y cerrar la pestaña no avisan |
| `/registro/completar` | redirige, con spinner | n/a | n/a | n/a | n/a |
| `/cuenta` | redirige, con spinner | n/a | eliminar cuenta (flujo de varios `Modal`) | — | — (cambiar de pestaña o salir no avisa) |
| `/acceso`, `/acceso/recuperar`, `/registro` | n/a | n/a | n/a | n/a | — |
| `/mercadopago/vinculacion` | n/a | n/a | n/a | n/a | n/a |
| `/admin` | `GuardRol` redirige; contenido en blanco | sólo exige el rol | n/a | n/a | n/a |
| `/admin/administradores` | ídem | SinPermiso (`LEER_ADMIN`); sin `GESTIONAR` → D+title, también "No podés gestionar tu propia cuenta" | dar de baja (`Scrim`) | — | formulario en `Scrim`: Escape o click afuera descarta |
| `/admin/cultivos`, `/admin/recetas` | ídem | SinPermiso; sin gestionar → D+title + `Alert warning` de sólo lectura | eliminar (`GcrConfirmDelete`) | — | `GcrFormShell`: Escape o click afuera descarta |
| `/admin/deudas`, `/admin/deudas/[id]` | ídem | SinPermiso; 403 de lectura → AB-err; sin gestionar → **acción oculta**; 403 al escribir → `Alert warning` | resolver (paso de confirmación dentro del modal) | — | modal: click afuera descarta |
| `/admin/establecimientos` | ídem | SinPermiso; D+title | suspender (`Modal` con motivo), reactivar (`Modal`) | — | — |
| `/admin/faq` | ídem | SinPermiso (para entrar exige `GESTIONAR_FAQ`; no existe permiso de lectura de FAQ); el cliente no chequea más | eliminar (`Modal`) | — | editor `GcrFormShell`: Escape o click afuera descarta |
| `/admin/impagas`, `/admin/impagas/[id]` | ídem | SinPermiso; sin gestionar → **acción oculta**; link a deudas oculto sin `LEER_DEUDAS` | registrar pago (paso de confirmación dentro del modal) | — | modal: click afuera descarta |
| `/admin/incidencias` | ídem | SinPermiso; sin gestionar → formulario en sólo lectura | cambio de estado (formulario + "Guardar") | — | panel: Escape o click afuera descarta |
| `/admin/parametros` (**mock**) | ídem | **sin permiso fino** (sólo el rol) | reautenticación con contraseña (con el texto "Demo: la contraseña es agrotours", `ParametrosClient.tsx:131`) + modal con el resumen de cambios | "Cancelar cambios" descarta todo | salir en modo edición no avisa |
| `/admin/roles` | ídem | SinPermiso; sólo el líder gestiona → D+title | borrar rol (`Modal`) | — | formulario en `Panel`: Escape descarta |
| `/admin/solicitudes`, `/admin/solicitudes/[id]` | ídem | SinPermiso; sin gestionar → D+title + leyenda visible | — | **Aprobar y Rechazar solicitud** (`SolicitudesClient.tsx:876`, `:887`) | observación escrita: se pierde al salir |
| `/panel` (todas) | `GuardRol` redirige; contenido en blanco | rol productor → SinPermiso; productor suspendido → `GuardProductorSuspendido`; establecimiento ajeno → redirección silenciosa | — | — | — |
| `/panel/[id]` | ídem | accesos rápidos **ocultos** según permiso | n/a | n/a | n/a |
| `/panel/[id]/actividades` | ídem | `GuardGestionarActividad` → SinPermiso; establecimiento suspendido → `Alert` + D+title | dar de baja (`Modal`); con reservas pagadas → modal informativo | **Borrador ⇄ Público** (cambio directo) | n/a |
| `…/actividades/crear` | ídem | SinPermiso; suspendido → **redirección silenciosa** al listado | — | — | — ("Cancelar" y "Volver al listado" salen directo) |
| `…/actividades/[id]/editar` | ídem | ídem crear | salir sin guardar (`Modal`) | — | `Modal` **sólo** desde "Cancelar"; "Volver al listado" (`EditarActividadClient.tsx:511`) y el menú del shell no avisan |
| `…/actividades/[id]/dias` | ídem | ídem; de baja o borrador → D+title + `Alert` | crear en lote (resumen en el cajón) | editar cupo y abrir día (el formulario es la confirmación) | modales y cajón: cerrar descarta |
| `…/actividades/[id]/calendario` | ídem | ídem | n/a | n/a | n/a |
| `…/calendario/[diaId]` | ídem | ídem; día cerrado → deshabilitado | cancelar día (`Modal` con motivo) | — | — |
| `…/calendario/[diaId]/reprogramar` | ídem | `GuardGestionarActividad` (**sin** guard de suspendido) | reprogramar (`Modal`) | — | — |
| `/panel/[id]/chats` | ídem | sin chequeo: si no es miembro, falla la lectura (texto rojo) | n/a | descartar un mensaje fallido | n/a |
| `/panel/[id]/datos` | ídem | `SinPermiso` en el cliente (no líder) | eliminar establecimiento (verificación + escribir "ELIMINAR") | **quitar portada**; "Cancelar" de una sección | secciones en edición: se pierden al salir sin aviso |
| `/panel/[id]/estadisticas` | ídem | `SinPermiso` en el cliente (no líder) | exportar (modal de opciones) | n/a | n/a |
| `/panel/[id]/productores` | ídem | `SinPermiso` sin `LEER`; sin `GESTIONAR` → D+title | borrar (`Modal`); suspender y reactivar (`Panel` con motivo) | — | `Panel`: Escape descarta |
| `/panel/[id]/reembolsos` | ídem | `GuardPermisoProductor` → SinPermiso; 403 en la acción → mensaje | reembolsar (`Sheet` con el detalle) | — | n/a |
| `/panel/[id]/reservas` (**mock**) | ídem | **sin chequeo** | n/a | n/a | n/a |
| `/panel/[id]/roles` | ídem | `SinPermiso` en el cliente (no líder) | borrar rol (`Modal`) | — | formulario en `Panel`: Escape descarta |

---

## 2. Variantes por patrón y cuántas veces aparece cada una

Conteo por pantalla, sobre las 55 rutas de la Parte B.

**Carga**

| Variante | Pantallas |
|---|---|
| SK (esqueleto a medida) | 43 |
| SP (spinner genérico de `AsyncBoundary`) | 4: `/cuenta`, `/reservar`, `/admin/parametros`, `/panel/[id]/reservas` |
| Spinner propio de verificación ("Verificando tu sesión…", "Redirigiendo…") | 8 |
| Contenido en blanco mientras decide un guard | todas las de `/admin` y `/panel` (antes del SK) y `/incidencias` sin sesión |
| Botón al enviar: icono → spinner / spinner + gerundio / sólo texto | ~15 / ~10 / 4 |

**Vacío sin datos**

| Variante | Apariciones |
|---|---|
| Caja punteada con ícono en círculo, título y texto (`Vacio`, `EmptyState`, `FaqVacio`, inline) | 10 |
| Caja de borde sólido con ícono (`MisSolicitudes`, admin incidencias, `SinIncidencias`, `SinPendientes`, actividades) | 5 |
| Componente compartido de admin (`GcrEmptyState`) | 2 |
| Fila de tabla con texto plano | 4 (administradores, establecimientos, solicitudes, productores) |
| Texto suelto dentro de una sección | 9+ (detalles de cultivo, receta y establecimiento; reseñas; panel; estadísticas; calendario; roles) |
| "Sin establecimiento" | 4 versiones: `EmptyEstablecimiento` (5 pantallas), `SinEstablecimiento` de datos, `SinEstablecimiento` de reembolsos, texto plano en chats (`EstChatsClient.tsx:248`) |
| "No encontrado" | 6 pantallas propias (cultivo, receta, establecimiento, actividad, reserva, solicitud), con estilos Tailwind o inline según el archivo |

**Vacío por filtro o búsqueda**

| Variante | Apariciones |
|---|---|
| Caja ilustrada + botón para limpiar (`.btn-neutral` o `Button neutral`) | 8 |
| Caja ilustrada sin acción | 3 (admin incidencias, chats, reseñas) |
| `GcrNoMatch` (texto) | 2 |
| Texto en la fila de la tabla | 2 (establecimientos, solicitudes) |

**Error de red o servidor**

| Variante | Apariciones |
|---|---|
| AB-err con mensaje técnico crudo | 48 usos |
| `<Alert>` dentro del diálogo | ~25 diálogos |
| Toast rojo | 7 pantallas |
| `flash` rojo propio | 1 (parámetros) |
| Texto inline con o sin reintentar | 3 (chats, panel, notificaciones) |
| Banner a mano | 2 (solicitar alta, editar actividad) |

**Error de validación**

| Variante | Apariciones |
|---|---|
| `FormMessage` | 28 archivos |
| Componentes locales de error (`ErrMsg` ×3, `ErrorMsg`, `GcrErr`, `.err-msg`, inline) | 7 implementaciones |
| Envío deshabilitado hasta completar (FC) | 12 formularios |
| Envío siempre habilitado, errores al enviar | auth, cuenta, parámetros, crear actividad (por paso) |

**401 sin sesión**

| Variante | Apariciones |
|---|---|
| Redirige vía `GuardRol` con contenido en blanco | todas las de `/admin` y `/panel` |
| Redirige desde la pantalla con spinner | 7 |
| Redirige con pantalla en blanco | 1 (`/incidencias`) |
| No redirige: muestra AB-err | 1 (`/reservar`) |
| Push a `/acceso` al tocar una acción | 1 (contactar establecimiento) |
| HTTP 401 del backend tratado como 401 | 0 |

**403 sin permiso**

| Variante | Apariciones |
|---|---|
| `SinPermiso` en la ruta (`GuardRol` con permiso) | 13 de admin |
| `SinPermiso` en el cliente o en el `page.tsx` del panel | 12 |
| Ítem de menú oculto | ambos shells |
| D+title | 10 pantallas |
| Acción oculta | 3 (deudas ×2, impagas/[id]) y los accesos rápidos del panel |
| Formulario en sólo lectura | 1 (admin incidencias) |
| AB-err con "No tenés permiso…" | 2 (deudas, impagas) |
| `Alert warning` tras 403 al escribir | 3 |
| Redirección silenciosa | 2 guards (establecimiento ajeno, establecimiento suspendido) |

**Confirmación de acciones destructivas o importantes**

| Variante | Apariciones |
|---|---|
| `<Modal>` armado en cada pantalla | ~16 |
| `GcrConfirmDelete` (compartido de admin) | 2 |
| `Scrim` propio | 1 |
| Paso de confirmación dentro del modal del formulario | 2 (deudas, impagas) |
| `Sheet` | 1 (reembolsos) |
| `Panel` con motivo | 2 (suspender y reactivar productor) |
| Escribir una palabra | 1 (eliminar establecimiento) |
| Reautenticación + resumen | 1 (parámetros) |
| **Sin confirmación** | aprobar / rechazar solicitud, Borrador ⇄ Público, quitar portada, liberar cupos, cancelar edición de sección, cancelar cambios de parámetros |

**Cambios sin guardar**

| Variante | Apariciones |
|---|---|
| `Modal` de abandono desde algunos botones | 2 (solicitar alta, editar actividad) |
| Sin aviso | el resto de los formularios (crear actividad, cuenta, datos, parámetros, todos los formularios en `Modal` / `Panel` / `GcrFormShell` / `Scrim` / `Sheet`) |
| `beforeunload` o bloqueo de navegación del router | 0 |

---

## 3. Componentes compartidos: los que existen y los que faltan

### Existen

| Componente | Dónde | Uso real |
|---|---|---|
| `Button`, `buttonClasses` | `components/ui/Button.tsx` | 161 + 28; conviven con 39 `.btn-*` |
| `ActionBtn` | `components/ui/ActionBtn.tsx` | 12, sólo en 5 archivos |
| `Card` | `components/ui/Card.tsx` | 30 archivos; conviven con `.card` y ~40 superficies a mano |
| `Modal` | `components/ui/Modal.tsx` | 36 usos; sin Escape ni trampa de foco |
| `Panel` | `components/ui/Panel.tsx` | 5 usos |
| `Sheet` | `components/ui/sheet.tsx` | 2 usos |
| `Toast` / `ToastData` | `components/ui/Toast.tsx` | 22 pantallas, cada una con su estado y su `setTimeout` |
| `Alert` | `components/ui/Alert.tsx` | 65 usos; sin tono `info` |
| `EstadoBadge`, `IconCircle`, `Skeleton`, `SectionLabel`, `Estrellas` | `components/ui/` | — |
| Primitivos de formulario (`form`, `input`, `select`, `text-field`, `date-field`…) | `components/ui/` | — |
| `FaltanCampos` / `useCamposFaltantes` | `components/ui/faltan-campos.tsx` | 19 archivos |
| `AsyncBoundary` | `components/AsyncBoundary.tsx` | 48 usos; con estilos inline y `.btn` heredado |
| `SinPermiso`, `GuardRol` | `components/GuardRol.tsx` | — |
| `GuardPermisoProductor`, `GuardGestionarActividad`, `GuardEstablecimientoSuspendido`, `GuardEstablecimientoUrl`, `GuardProductorSuspendido` | `components/panel/` | — |
| `EmptyEstablecimiento` | `app/panel/EmptyEstablecimiento.tsx` | 5 pantallas |
| Esqueletos compartidos | `DashboardSkeleton`, `ChatSkeletons`, `ActividadCardSkeleton`, `EstablecimientoCardSkeleton` | — |
| Piezas de admin de catálogo (`Gcr*`) | `components/admin/gcr/shared.tsx` | `GcrConfirmDelete`, `GcrFormShell`, `GcrFormHeader`/`Footer`, `GcrEmptyState`, `GcrNoMatch`, `GcrStats`, `GcrSearchBar`, `GcrPageHead`, `GcrFlash`, `GcrErr`. Pensadas para cultivos y recetas; FAQ e incidencias reusan algunas |
| `Photo` | `components/landing/Photo.tsx` | foto con degradado por seed |
| `ActividadCard`, `EstablecimientoCard` | `components/catalog/` | sólo en catálogo y landing; los detalles tienen sus propias copias |

### Patrones repetidos sin componente compartido

| Patrón | Implementaciones encontradas |
|---|---|
| Estado vacío (ícono + título + texto + acción) | ≥20 locales: `Vacio` ×9, `EmptyState` ×2, `FaqVacio` ×2, `Sin*` ×7 (y `GcrEmptyState` sólo en admin) |
| Pantalla "no encontrado" | 6 copias |
| Diálogo de confirmación genérico | `GcrConfirmDelete` existe sólo para admin de catálogo; ~16 diálogos armados a mano |
| Gestión de toasts (cola, duración, posición) | 24 copias de `useState` + `setTimeout`, más 4 toasts propios |
| Tarjeta de KPI / métrica | 8 |
| Encabezado de página (migas, título, bajada, CTA) | `GcrPageHead` sólo en admin de catálogo; el resto a mano, con h1 entre 24 y 44 px |
| Migas de pan | a mano en cada pantalla, con Tailwind o inline |
| "Volver" | 4 variantes (A4) |
| Botón de ícono (cerrar, navegación) | 4 tamaños y radios |
| Variante danger de contorno | 5 implementaciones (A1.2) |
| Banner con tono `info` | `Alert` no lo tiene; `FormAlert` sí; ~6 banners info a mano |
| Mensaje de error de campo fuera de `FormMessage` | `ErrMsg` ×3, `ErrorMsg`, `GcrErr`, `.err-msg` |
| Encabezado de tabla | la constante `TH` duplicada en `DeudasClient.tsx:63` e `ImpagasClient.tsx:48`; tablas con `<th>` inline en administradores y parámetros |
| Buscador | `GcrSearchBar` en admin; otros a mano (`MisReservas`, actividades, reservas del panel, chats, deudas, impagas) |
| Píldoras de filtro / pestañas | ≥5 implementaciones |
| Aviso de cambios sin guardar | 2 copias locales |
| Tarjeta de catálogo genérica | 7 variantes (A5) |

---

## 4. Las 10 inconsistencias más visibles para el usuario (por impacto)

1. **Errores técnicos a la vista y un "sin sesión" que no lleva a iniciar sesión.** El panel de error común muestra el mensaje interno tal cual (`Backend respondió 500 (…)`, `Failed to fetch`, códigos como `Actividad.NOT_FOUND`) en monoespaciada (`components/AsyncBoundary.tsx:45`), en 48 lugares. En `/explorar/[id]/reservar`, entrar sin sesión muestra "No pudimos cargar la información… Revisá tu conexión" con un "Reintentar" que nunca va a funcionar, mientras el resto de las pantallas protegidas redirige a `/acceso`. Un 401 del backend con sesión vencida tampoco se distingue de un error de red en ninguna pantalla.

2. **Acciones importantes sin confirmación al lado de otras equivalentes que sí la piden.** Aprobar y rechazar una solicitud de alta se ejecutan con un click (`admin/solicitudes/SolicitudesClient.tsx:876`, `:887`), mientras suspender o reactivar un establecimiento pide un modal. Publicar o pasar a borrador una actividad es directo (`ActividadesClient.tsx:96-116`). Quitar la portada y liberar cupos retenidos tampoco piden nada.

3. **Pérdida de datos sin aviso, y avisos que sólo cubren un botón.** Sólo 2 formularios avisan al salir, y en los dos el aviso depende del botón: en editar actividad, "Cancelar" pregunta pero "Volver al listado" (`EditarActividadClient.tsx:511`) y el menú lateral no. Crear actividad, un asistente de varios pasos, no avisa nunca. Los formularios en paneles de admin (cultivos, recetas, FAQ, administradores, roles, productores) se descartan con Escape o con un click fuera de la caja. Ninguna pantalla cubre el back del navegador ni el cierre de la pestaña.

4. **Cinco toasts distintos.** El compartido es un relleno de color abajo a la derecha, sin botón de cerrar. Reservar usa uno casi negro con X. Administradores lo centra abajo, corrido por el sidebar. Solicitudes y Parámetros tienen los suyos. La duración cambia entre 3,2 y 7 s según la pantalla (11 valores distintos), y el mismo tipo de error sale como toast en unas pantallas y como `Alert` dentro del diálogo en otras.

5. **Diálogos de confirmación que se comportan y se leen distinto.** Los textos varían: "No, volver / Sí, eliminar", "Cancelar / Eliminar", "Cancelar / Confirmar" (dar de baja una actividad con botón rojo y ícono de tilde), "Seguir editando / Abandonar" (rojo) contra "Seguir editando / Salir sin guardar" (verde). Valorar una reserva invierte el orden de los botones. En unos el cancelar es neutral y en otros ghost. Escape cierra los paneles y cajones pero no los `Modal` de confirmación. El aviso de abandono trata de usted ("¿Desea abandonar…?") y el resto de la app de vos.

6. **"Sin permiso" se resuelve de cinco maneras.** Pantalla `SinPermiso`, ítem de menú oculto, botón deshabilitado con tooltip nativo, acción oculta y error genérico con "Reintentar". El mismo caso (tengo lectura pero no gestión) deshabilita el botón en cultivos, recetas, establecimientos, solicitudes y productores, y lo esconde en deudas e impagas. Además, la lectura y la escritura con permiso denegado no se presentan igual: la lectura negada en deudas e impagas aparece como el panel de error genérico con "Reintentar", no como `SinPermiso`.

7. **La acción destructiva tiene cinco estilos.** Contorno rojo con `ActionBtn`, neutral repintado de rojo, `<button>` crudo, `CardAction` con sombra rosada, o un ícono que se pone rojo al pasar. Entre pantallas parecidas, "Eliminar establecimiento" es un botón rojo relleno y "Eliminar cuenta" es de contorno. Los deshabilitados se ven de tres maneras (fondo crema, opacidad 50 %, borde gris).

8. **Estados vacíos y "no encontrado" sin un formato común.** Unas listas muestran una caja punteada ilustrada con acción para limpiar, otras una caja de borde sólido, otras una fila de tabla con texto gris (administradores, establecimientos y solicitudes en admin). El círculo del ícono mide 56, 64, 68 u 80 px. Hay cuatro pantallas distintas para "no tenés establecimiento" (una es texto plano en chats). Los chats muestran el error de carga en rojo y sin forma de reintentar.

9. **Carga que no se ve igual de una pantalla a la otra.** 43 pantallas usan esqueletos con la forma del contenido, pero `/cuenta`, `/reservar`, `/admin/parametros` y `/panel/reservas` muestran un spinner genérico. Sin sesión, unas pantallas muestran "Redirigiendo…" y otras quedan en blanco. En los formularios, login, registro y recuperar contraseña sólo cambian el texto del botón, mientras el resto muestra un spinner.

10. **Deriva tipográfica y de tarjetas.** Los títulos de página van de 24 a 44 px, con 10 tamaños distintos (32 en admin, 30 en el calendario, 34 en productores y roles, 38 en los catálogos públicos). Hay 36 tamaños de fuente arbitrarios. Las tarjetas de catálogo usan 7 alturas de foto (130–180 px), dos pesos de título y tres formas de CTA (botón, link verde, texto gris), y la insignia cambia de esquina. Las métricas tienen 8 implementaciones que alternan el número en monoespaciada o display y el radio de 8 o 16 px. La estrella de puntuación tiene dos amarillos (`#E0A422` y `#C9A227`).
