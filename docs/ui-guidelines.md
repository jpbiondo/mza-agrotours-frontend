# Guía de UI (borrador)

Sale de [`ui-audit.md`](ui-audit.md). Cada regla dice **cuándo** se usa cada variante y qué la implementa. La API de cada pieza está en "Componentes y APIs compartidas", al final. ✅ = existe · 🆕 = falta.

## Botones — `Button` / `buttonClasses` ✅

| Cuándo | Variante |
|---|---|
| La acción principal de una zona (página, diálogo, tarjeta). Una sola por zona | `primary` |
| CTA del encabezado de página ("Agregar …") | `primary md`, igual que el resto de los botones de la página. *Decisión del equipo* |
| Acción secundaria, y "Cancelar" en el pie de un diálogo | `neutral`. *Tiene 61 usos. `ghost` se elimina: sus 13 usos pasan a `neutral`* |
| Zonas densas: filas, tarjetas, edición en línea | `sm`, tal cual, sin pisar el tamaño del texto (los `size="sm" className="text-sm"` vuelven a `sm`) |
| Confirmar una acción destructiva **dentro** del diálogo de confirmación | `danger` relleno. *Es el uso de 15 de sus 16 apariciones*. Sólo para confirmar: "Reintentar" o "Cerrar" dentro de un flujo destructivo van en `primary` y `neutral` |
| Disparar una acción destructiva desde la página (abre el diálogo) | `danger-outline` ✅. *Hoy hay 5 implementaciones; esta generaliza el `ActionBtn tone="danger"`, que es la más usada* |
| Acciones de fila de tabla o de tarjeta de listado | `ActionBtn` ✅ (`neutral` / `danger`), con `href` si la acción navega ("Detalle", "Modificar"). Reemplaza `CardAction`, los `Button sm` y los links con `buttonClasses` de las filas, y los botones de sólo ícono. En una fila no va `primary` |
| Acción menor en línea con el contenido: "Cargar más", "Reintentar" junto a un mensaje, "Limpiar filtros" o "Limpiar búsqueda" junto al contador, un link dentro de un aviso | `Button variant="text"` ✅: texto verde, sin caja, subrayado al pasar el mouse |
| Volver a la pantalla anterior | `BackLink` ✅: texto verde con flecha. *Es la variante más usada (4 de 9)* |
| Botón de sólo ícono (cerrar, mes anterior/siguiente, quitar, abrir el menú del shell) | `IconButton` ✅, 36 px, siempre con `aria-label`. También en el shell: el menú y su cierre miden 36 px como el resto. *Decisión del equipo* |
| Volver dentro de un mismo panel, sin texto (lista ↔ conversación en los chats) | `IconButton appearance="plain"`. `BackLink` es para salir de la pantalla |
| El ícono es la acción principal (enviar un mensaje) | `IconButton appearance="primary"` ✅ |
| Mientras se envía, o mientras se resuelve lo que hace falta para ejecutar la acción | `Button loading` / `IconButton loading` ✅: el spinner reemplaza al ícono, la etiqueta no cambia y el botón queda deshabilitado. *Es el patrón de ~15 de 29 casos* |

**Fuera de estas reglas.** Los botones que son parte de otro control se resuelven con ese control, no con `IconButton`: limpiar el texto de un buscador, mostrar u ocultar una contraseña, el +/− de un selector de cantidad y las flechas de un carrusel de fotos. Tampoco son botones el segmentado Borrador/Público, las píldoras de filtro ni el "agregar ítem" con borde punteado: son patrones propios, todavía sin componente.

Lo mismo vale para los controles de la barra de filtros de `/explorar`, en `src/components/catalog/controls.tsx`: el disparador "Más filtros" (`MoreFiltersButton`, con contador y chevron, que abre el panel de filtros secundarios), los chips de selección única (`ChipGroup`) y los botones de orden de tres estados (`SortToggles`: sin orden → ↑ → ↓). Son parte del control de filtros, como el disparador de `FilterSelect`. *Decisión provisoria del equipo.*

> **Para quien agregue UI (incluido Claude):** si aparece otro disparador de panel, otro grupo de chips o otro toggle de orden fuera de `/explorar` —por ejemplo, en el catálogo de establecimientos o en un listado del panel—, **avisale al equipo antes de copiarlo**. Es la señal para unificar estos controles en un primitivo de `src/components/ui/` en vez de sumar otra variante a mano.

Las clases `.btn-*` de `globals.css` no se usan en código nuevo.

## Feedback

| Cuándo | Qué se muestra | Implementación |
|---|---|---|
| Una acción salió bien y el usuario sigue en la misma pantalla | Toast `success` de 4 s. Lleva `sub` sólo si hay un dato que leer (nombre, fecha, cupos) | `notify.success` / `notify.successDetailed` ✅. Reemplaza las 24 copias de `useState`+`setTimeout` y los 4 toasts propios |
| Una acción **reversible** salió bien (publicar o pasar a borrador) | Toast con botón **Deshacer**, 6 s, sin modal previo. *Quitar la portada no cuenta: el backend no garantiza que el archivo siga en el bucket* | `notify.undoable` ✅ |
| Falló una acción **lanzada desde un diálogo** | `Alert danger` dentro del diálogo. El diálogo queda abierto con lo cargado. *Es el caso de ~25 diálogos* | `Alert` ✅ (o `error` de `ConfirmDialog`) |
| Falló una acción lanzada sin diálogo (toggle, acción de fila) | Toast `danger` de 7 s, con botón de cerrar. Dura más que el de éxito porque hay que leer qué falló. *El envío de un formulario no entra acá: ver "Errores de formulario"* | `notify.error` ✅ |
| La acción ya no aplica porque lo que se ve quedó viejo (otro usuario o pestaña lo resolvió) | Se cierra el diálogo o panel, se recarga y sale un toast `info` que dice qué pasó | `notify.info` ✅ |
| Un estado de la pantalla limita lo que se puede hacer o cambia lo que ven otros (sólo lectura, suspendido, borrador) | `Alert` persistente arriba del contenido: `warning` si bloquea o si advierte algo que el usuario no debería pasar por alto aunque no le impida nada (establecimiento suspendido: no se ve en el catálogo), `info` si sólo informa | `Alert` ✅, con tono `info` ✅ |
| Un aviso de contexto dentro de una tarjeta, un formulario o un diálogo (cupos, reembolsos que se van a emitir, fechas descartadas) | `Alert` en el lugar donde hace falta, con el tono de lo que avisa. Nunca una caja armada a mano | `Alert` ✅ |
| Termina un proceso que cambia de contexto (login, alta enviada, pago, reprogramación, baja de un establecimiento) | Pantalla de resultado con un ícono, un título y un único CTA. Si hay otra salida (reenviar un correo), va como link dentro del texto | `ResultScreen` ✅ |
| Feedback dentro del propio control ("Link copiado" en el botón Compartir) | El control cambia su texto o ícono un momento; no hace falta toast | — |

Nunca se muestra un mensaje técnico (`Backend respondió…`, códigos `X.y`). Cada código de dominio se traduce a un mensaje en el hook. Si no hay traducción, `clasificarError` ✅ elige el texto genérico de su categoría (ver "Error genérico").

## Confirmaciones — `ConfirmDialog` / `confirm()` ✅

Está hecho sobre el `Dialog` de Base UI: tiene trampa de foco y cierra con Escape y con click afuera, salvo mientras procesa.

| Cuándo | Qué pide |
|---|---|
| La acción es irreversible o afecta a otra persona: eliminar, dar de baja, cancelar una reserva o un día, suspender, rechazar una solicitud, reembolsar | `ConfirmDialog`. A la izquierda "Cancelar" (`neutral`); a la derecha **el verbo de la acción** ("Eliminar receta", "Cancelar día"), en `danger` si destruye o `primary` si no. *"Cancelar" ya es el texto más usado; el verbo concreto reemplaza a "Sí, eliminar" y "Confirmar"* |
| La acción necesita un motivo (suspender, cancelar un día) | El mismo `ConfirmDialog` con el campo en `children` y `confirmDisabled` hasta que esté completo |
| La acción mueve plata (resolver una deuda, registrar un pago, reembolsar) | Un paso de confirmación con el resumen (monto, medio, destinatario) dentro del mismo modal o cajón, antes de ejecutar |
| Aprobar una solicitud de alta | No lleva `ConfirmDialog`: la observación escrita alcanza como confirmación. Rechazar sí lo lleva |
| Se destruye una cuenta o un establecimiento | `ConfirmDialog` con `requireText` (escribir una palabra). Sólo en esos dos casos |
| Se cambian los parámetros del sistema | Reautenticación con la contraseña (`reauthenticateWithCredential` de Firebase 🆕; hoy es un mock) y después el modal con el resumen de cambios. **Sólo en esta pantalla** |
| La acción es reversible | No se confirma: toast con Deshacer (ver Feedback) |
| Se envía un formulario | No se confirma: el formulario ya es la confirmación |

## Diálogos — `Dialog` / `DialogHeader` / `DialogBody` / `DialogFooter` ✅

Todo diálogo centrado se arma en tres zonas, y sólo el cuerpo scrollea. Es lo que ya hacían a mano deudas, impagas, los diálogos de un día y los formularios de catálogo; ahora sale de la base.

| Cuándo | Qué se muestra | Implementación |
|---|---|---|
| Qué ancho lleva | `sm` (468 px): confirmaciones y avisos. `md` (560 px): formularios cortos (resolver deuda, registrar pago, abrir día, valorar, exportar). `lg` (680 px): formularios largos (catálogo, productor, administrador, rol) y lecturas (reseñas). El título acompaña: 20 px en `sm` y `md`, 24 px en `lg` | `DialogContent size` ✅ |
| Cualquier diálogo | **Cabecera fija** con el título a la izquierda y la **cruz** arriba a la derecha (`IconButton`, `aria-label="Cerrar"`). Debajo, un borde | `DialogHeader` ✅ |
| El contenido no entra en el alto de la ventana | Sólo scrollea el **cuerpo**. El título y las acciones quedan a la vista | `DialogBody` ✅ |
| Las acciones del diálogo | **Pie fijo** crema con borde: "Cancelar" a la izquierda y la acción a la derecha. Arriba de los botones, el `Alert` del rechazo; debajo, `FaltanCampos` | `DialogFooter` ✅ con `alert` y `note` |
| La cruz, Escape y el click afuera | Hacen lo mismo que "Cancelar". Si hay cambios sin guardar, piden la misma confirmación (`confirmarDescarte()`) | El `onOpenChange` del `Dialog` |
| Mientras se procesa la acción | La cruz queda deshabilitada y el diálogo no se cierra | `DialogHeader closeDisabled`, `disablePointerDismissal` |
| Un paso sin salida (verificando, resultado final que obliga a seguir) | Sin cruz | `DialogHeader hideClose` |
| Falla la lectura de lo que el diálogo muestra (p. ej. el detalle de una incidencia) | El aviso y "Reintentar" en el cuerpo; el pie, con "Cerrar" (`neutral`) como única acción | `DialogBody` + `DialogFooter` |
| Al abrir | El foco va al primer campo del cuerpo. Sin campos, a la cruz: nunca arranca sobre la acción destructiva | `DialogContent` ✅ (se pisa con `initialFocus`) |
| Una confirmación | Las mismas tres zonas. La cruz convive con "Cancelar" | `ConfirmDialog` ✅ ya las usa |

**Cambios sin guardar en un diálogo.** La regla de "Cambios sin guardar" (Escape, la cruz y el click afuera preguntan si hay algo cargado) **queda postergada** para los diálogos: la migración no la suma. Mientras tanto, cerrar un formulario en diálogo lo descarta como hasta ahora.

**Migración.** `Modal` y los overlays de parámetros se pasan a `Dialog` **de a una pantalla**, cuando se las toca. Ya están migrados los formularios largos: catálogo, FAQ e incidencias (`GcrFormShell` es ahora un `Dialog` `lg`), productor, administrador (se eliminó su `Scrim`) y rol (dejó `Panel`). Al migrar una, gana también la trampa de foco, Escape y el bloqueo de scroll que `Modal` no tiene. Los cajones laterales (`Sheet`, `LoteDrawer`) siguen con su propia cabecera y cuerpo: ya cumplen la regla. El estado de cada pantalla está en [`ui-audit.md`](ui-audit.md), A2.3.

## Carga

| Cuándo | Qué se muestra | Implementación |
|---|---|---|
| Primera carga de contenido con forma conocida (lista, tabla, detalle, métricas) | Un esqueleto con esa forma. *Lo usan 43 de 47 pantallas* | `AsyncView skeleton=` ✅ con `Skeleton layout=` ✅, o un esqueleto propio |
| Primera carga sin forma predecible | Spinner centrado | `AsyncView` ✅ |
| Recarga después de una acción, o cambio de filtro o de mes | Queda el contenido anterior; se marca la zona con `aria-busy`, sin esqueleto | `ultimo` de `useLecturaConToken` ✅ |
| "Cargar más" | Spinner en línea al pie de la lista | — |
| Un guard decide sesión o permiso | Nada, el área queda vacía. *Ya lo hace `GuardRol` en ~30 rutas: dura un frame y un cartel se leería como demora* | `GuardRol` ✅, `GuardSesion` ✅ para las pantallas de visitante |
| Envío de formulario o acción | Spinner en el botón | `Button loading` ✅, `ActionBtn loading` ✅ |

## Estados vacíos — `EmptyState` ✅

Reemplaza a los más de 20 locales (`Vacio`, `EmptyState`, `FaqVacio`, `Sin*`, `GcrEmptyState`).

| Cuándo | Variante |
|---|---|
| Todavía no hay datos | `kind="empty"`: caja punteada con ícono, título, texto y, **si el usuario puede crear**, el CTA para crear (`primary`) en `action`. *La caja punteada es la más usada (10)* |
| Hay datos, pero el filtro o la búsqueda no devuelve nada | `kind="no-results"`: ícono `SearchX`, "No encontramos …" y botón `neutral` "Limpiar filtros" (`onClear`), siempre |
| Una sección vacía dentro de un detalle | `size="inline"`: una línea de texto, sin ícono |
| Tabla vacía | El `EmptyState` va **en lugar** de la tabla, nunca como fila |
| No hay establecimiento activo | `EmptyEstablecimiento` ✅ en todas las pantallas del panel |

## Errores de formulario

| Cuándo | Qué se muestra | Implementación |
|---|---|---|
| Un campo no pasa el esquema | Mensaje debajo del campo | `FormMessage` ✅. *Tiene 114 usos; los `ErrMsg`, `GcrErr`, `.err-msg` y errores inline se migran a este* |
| Faltan campos para poder enviar | Envío deshabilitado + contador "faltan N campos" con `verQueFalta`. *Lo usan 12 formularios, contra 5 que no* | `FaltanCampos` ✅ |
| Formularios cortos de cuenta: login, registro, recuperar contraseña, `/cuenta` | **Excepción**: el envío está siempre habilitado y los errores aparecen al enviar | RHF ✅ |
| El backend rechaza un campo (código de dominio asociable al campo) | `form.setError` y se ve en el `FormMessage` de ese campo | RHF ✅ |
| El backend rechaza el envío completo | `Alert danger` arriba del pie del formulario, nunca un toast | `Alert` ✅ |

## Autorización

| Cuándo | Qué pasa | Implementación |
|---|---|---|
| Se entra a una pantalla protegida sin sesión, o se toca una acción que la exige (reservar, contactar) | Redirige a `/acceso?volver=<ruta actual>`; después del login vuelve a esa ruta | `GuardRol` ✅ / `GuardSesion` ✅ + `rutaAcceso` ✅; `/acceso` ya respeta `volver` ✅ |
| El backend rechaza con sesión activa por un posible token vencido (401, o 403 sin `code` o con `accessDenied`, porque hoy el backend responde 403 a un token inválido) | Se renueva el token y se reintenta una vez. Si la renovación falla o vuelve 401, se cierra la sesión y se redirige a `/acceso?motivo=sesion-vencida&volver=…`; si vuelve 403 con el token nuevo, es falta de permiso. Un 403 con código de dominio no se reintenta | `conToken` / `conTokenDe` ✅ (también dentro de `useLecturaConToken`) + aviso en `/acceso` ✅ |
| No hay permiso para la pantalla entera | Pantalla de sin acceso, sin cambiar la URL | `ForbiddenScreen` ✅ desde `GuardRol` / `GuardPermisoProductor` ✅ |
| Hay permiso para ver pero no para la acción | El botón se ve deshabilitado y el motivo aparece **como texto debajo del botón**, no en `title`. En acciones de fila, una sola leyenda arriba de la tabla. *Deshabilitar lo hacen 10 pantallas; ocultar, 3* | `Button disabledReason` ✅; `ActionBtn` + leyenda |
| Una entrada del menú lleva a una pantalla sin permiso | Se oculta | shells ✅ |
| El backend responde 403 a una lectura | `ForbiddenScreen`, no el panel de error con "Reintentar" | `AsyncView` / `AsyncBoundary` ✅ (lo detectan solos) |
| El backend responde 403 a una lectura del panel con el establecimiento activo suspendido | "Este establecimiento está suspendido", con el motivo si vino, en lugar del "tu rol no incluye este permiso" | `SinAccesoPorSuspension` ✅ en `panel/layout.tsx`, vía `SinAccesoProvider` |
| El backend responde 403 a una escritura | `Alert` en el diálogo: "Tu rol no te permite …" | `Alert` ✅ |

## Cambios sin guardar — `useAvisoSalida(dirty)` ✅

| Cuándo | Qué pasa |
|---|---|
| Formulario de página con algo cargado (crear o editar actividad, solicitar alta, cuenta, datos, parámetros) | Se intercepta **toda** salida: los links (incluido el menú del shell), los botones propios (`salir(destino)`), el back del navegador y el cierre de pestaña (`beforeunload`). Aparece un `ConfirmDialog` "¿Salir sin guardar?" con "Seguir editando" (`neutral`) y "Salir sin guardar" (`danger`) |
| Formulario dentro de un diálogo, panel o cajón, con cambios | Escape, click afuera y "Cancelar" piden la misma confirmación (`confirmarDescarte()`). Sin cambios, cierran directo |
| Edición en línea con una sección abierta y modificada (`SectionCard` en datos) | Cuenta como cambios sin guardar: salir de la pantalla pide la misma confirmación |
| Formulario sin cambios | Sale sin preguntar |

## Páginas 404 y error genérico

| Cuándo | Qué se muestra | Implementación |
|---|---|---|
| Ruta inexistente | "No encontramos esta página" + "Ir al inicio" | `app/not-found.tsx` ✅ |
| Ruta inexistente dentro de `/admin` o `/panel/{id}` | El mismo aviso, pero dentro del shell y con "Ir al panel del sistema" / "Ir al panel". Pasa por los guards del layout: sin sesión va a `/acceso`, sin rol ve `ForbiddenScreen`, igual que en una pantalla que existe | `admin/[...resto]` y `panel/[establecimientoId]/[...resto]` llaman a `notFound()`, que pinta `admin/not-found.tsx` / `panel/[establecimientoId]/not-found.tsx` ✅ |
| Id inexistente o ajeno (cultivo, receta, reserva, solicitud…) | "No encontramos {cosa}", una línea de por qué puede pasar y "Volver a {listado}" (`primary`) | `NotFoundScreen` ✅, o el `notFound` de `AsyncView`. Reemplaza las 6 copias |
| Falla una lectura (red o 5xx) | Ícono, título, texto según la causa —sin red: "Revisá tu conexión"; servidor: "Tuvimos un problema, probá en unos minutos"— y "Reintentar". El detalle técnico va a la consola, no a la pantalla | `ErrorScreen` ✅, que usan `AsyncView` y `AsyncBoundary` |
| Error de render no capturado | El mismo panel de error, con "Reintentar" que hace `reset()` | `app/error.tsx` ✅ |

## Decisiones del equipo

Las preguntas abiertas del primer borrador quedaron resueltas así (2026-10-19):

1. **Motivo de un botón deshabilitado**: va como texto debajo del botón.
2. **Aprobar una solicitud**: la observación escrita alcanza; no lleva `ConfirmDialog`.
3. **Confirmación en dos pasos**: se mantiene para lo que mueve plata.
4. **Formularios cortos de cuenta**: quedan como excepción al patrón de `FaltanCampos`.
5. **CTA del encabezado**: `md`.
6. **`sm` con texto de 14 px**: vuelve a `sm`.
7. **`ghost`**: se elimina.
8. **Edición en línea**: cuenta como cambios sin guardar.
9. **Después del login**: se vuelve a la pantalla de origen.
10. **Reautenticación**: sólo en parámetros, implementada de verdad con Firebase.
11. **Toast de error**: también se cierra solo, a los 7 s.

Los casos de botones que quedaron dudosos al migrar se resolvieron así (2026-10-19):

12. **Acciones de fila que navegan**: `ActionBtn` acepta `href`; `CardAction` se elimina.
13. **Botones del shell**: `IconButton` de 36 px, sin tamaño especial.
14. **Volver dentro de un panel sin texto**: `IconButton plain`, no `BackLink`.
15. **Botones de un control** (buscador, contraseña, cantidad, carrusel): quedan fuera de `IconButton`.
16. **Enviar del chat**: `IconButton` con apariencia `primary`.
17. **Spinner mientras se prepara la acción** (p. ej. "Contactar" averiguando si ya hay chat): también es `loading`.
18. **"Reintentar" dentro de un flujo destructivo**: `primary`, no `danger`.
19. **Botón de texto**: nueva variante `text` de `Button`.

Los casos de feedback que quedaron dudosos al migrar se resolvieron así (2026-10-21):

20. **Quitar la portada**: no lleva Deshacer; toast de éxito simple.
21. **Baja de un establecimiento**: `ResultScreen` con "Ir a explorar" y salida automática a los 5 s.
22. **Envío de un formulario de página rechazado**: gana "Errores de formulario": `Alert danger` arriba del pie, también en `/cuenta` y `/registro`.
23. **Avisos de envío armados a mano**: pasan a `Alert` con el mismo tono.
24. **Avisos de contexto armados a mano**: pasan a `Alert` con el tono que tenían, aunque no estén arriba del contenido.
25. **Pantallas de resultado con más de un CTA**: se recortan a uno con `ResultScreen`.
26. **"Link copiado"**: queda como feedback del botón.
27. **Acción sobre datos viejos** (p. ej. un reembolso que ya no está pendiente): se cierra, se recarga y sale un toast `info`.
28. **Establecimientos suspendidos en el inicio de admin**: `Alert warning`, no `danger`. Es un estado que se queda a la vista, y `danger` lo anunciaría como urgente en cada carga.
29. **Validación del cliente en parámetros**: `FaltanCampos` debajo de "Guardar cambios", que queda deshabilitado; "Ver qué falta" marca los campos.

La forma de los diálogos se resolvió así (2026-10-24):

30. **Cruz de cerrar**: todos los diálogos la llevan arriba a la derecha, también las confirmaciones. Sólo la omiten los pasos sin salida.
31. **Scroll**: cabecera y pie fijos; scrollea sólo el cuerpo. El pie queda fijo para que la acción, su error y el "faltan N campos" estén siempre a la vista.
32. **`FaltanCampos` en un `ConfirmDialog` con motivo**: va en `note`, debajo de los botones, como en cualquier formulario.
33. **Migración de `Modal`**: pantalla por pantalla hacia `Dialog`; no se parchea `Modal`.
34. **Anchos**: tres, `sm` 468 px, `md` 560 px y `lg` 680 px, en lugar de los ocho que convivían (de 440 a 720 px).
35. **Cambios sin guardar en diálogos**: se posterga; la migración a `Dialog` no lo incluye por ahora.
36. **Unificación**: todos los diálogos centrados van a `Dialog`, también los formularios de productor y administrador. Los cajones laterales (lote de días, reembolsos, chat, calendario) son otra familia y van al `Sheet` lateral en una pasada aparte. Parámetros espera a la reautenticación real.
37. **Lectura fallida dentro de un diálogo**: el pie queda con "Cerrar", para que la salida no dependa sólo de la cruz.
38. **403 con el establecimiento suspendido**: explica la suspensión y su motivo, no la falta de permiso. El rol no cambió, y pedirle el permiso a un administrador no lo resolvería.
39. **Establecimiento suspendido en el panel**: `Alert warning` con el motivo en el inicio, el catálogo de actividades y el calendario de días, aunque no bloquee nada. La suspensión sólo lo saca del catálogo público, pero el productor no puede pasarla por alto.

## Preguntas abiertas

- **403 a una escritura con el establecimiento suspendido**: hoy sale el `Alert` "Tu rol no te permite …", que engaña igual que el de las lecturas. Queda pendiente.

---

## Componentes y APIs compartidas

Cada patrón tiene un único punto de entrada. Las pantallas existentes **todavía no se migraron**: lo marcado *deprecado* sigue funcionando hasta que se migren sus usos.

### Botones

**`Button`** · `components/ui/Button.tsx` (modificado)
- `variant`: `"primary" | "neutral" | "danger" | "danger-outline" | "text"`. `ghost` se eliminó al migrar sus usos a `neutral`.
- `size`: `"sm" | "md" | "lg"`. Con `text` sólo cambia el tamaño de la letra: la variante no tiene padding.
- `loading?: boolean`: el spinner reemplaza al primer ícono, la etiqueta queda igual, se deshabilita y marca `aria-busy`.
- `disabledReason?: string`: con `disabled`, muestra el motivo como texto debajo del botón y lo asocia con `aria-describedby`.
- `buttonClasses({ variant, size, className })`: las mismas clases, para un `<Link>`.

**`ActionBtn`** · `components/ui/ActionBtn.tsx` (modificado)
- `{ icon, label, tone?: "neutral" | "danger", disabled?, loading?, title, href?, onClick? }`. Se agregaron `loading` y `href`.
- Con `href` es un `<Link>`; deshabilitado o cargando se dibuja como botón apagado.

**`IconButton`** · `components/ui/IconButton.tsx` (nuevo)
- `{ "aria-label": string (obligatorio), appearance?: "bordered" | "plain" | "primary", loading?, ...props de <button> }`. Mide 36 px.
- `loading` reemplaza el ícono por el spinner y deshabilita el botón.

**`BackLink`** · `components/ui/BackLink.tsx` (nuevo)
- `{ href?: string, onClick?, children = "Volver" }`. Con `href` es un link; con `onClick`, un botón (para pasar por `useAvisoSalida().salir`).

### Feedback

**`notify`** · `lib/notify.ts` (nuevo), con su cola en `stores/toastStore.ts` (nuevo). Lo dibuja `components/Toaster.tsx` (nuevo), montado en `app/layout.tsx`.
- `notify.success(title)`: 4 s.
- `notify.successDetailed(title, sub)`: 4 s.
- `notify.info(title, sub?)`: 4 s.
- `notify.undoable(title, onUndo, { sub?, label = "Deshacer" })`: 6 s.
- `notify.error(title, sub?)`: 7 s.
- `notify.dismiss(id)`.
- Todas devuelven el `id`. Se apilan hasta 3; la cuenta regresiva se pausa con el mouse o el foco encima, y todos los toasts tienen botón de cerrar.

**`Toast` / `ToastCard`** · `components/ui/Toast.tsx` (modificado)
- `ToastCard` es la tarjeta sin posición: `{ tone, title, sub?, action?, onClose? }`. Se anuncia con `role="alert"` (error) o `status`.
- `Toast` es la suelta de siempre, *deprecada*.

**`Alert`** · `components/ui/Alert.tsx` (modificado)
- `tone`: `"danger" | "warning" | "success" | "info"`. Se agregó `info` y el anuncio con `role`.

### Confirmaciones

**`ConfirmDialog`** · `components/ui/confirm-dialog.tsx` (nuevo), sobre `components/ui/dialog.tsx` (nuevo, `Dialog` de Base UI)
- Props: `{ open, onCancel, onConfirm, title, description?, confirmLabel, cancelLabel = "Cancelar", tone?: "danger" | "primary", icon?, busy?, error?, confirmDisabled?, requireText?, children?, note? }`.
- Mientras `busy`, no se puede cerrar. `requireText` pide escribir una palabra para habilitar la acción; no distingue mayúsculas.
- `note` va debajo de los botones, en el pie fijo: es el lugar del `FaltanCampos` de un motivo.

**`confirm(opciones): Promise<boolean>`** · mismo archivo, con su estado en `stores/confirmStore.ts` (nuevo)
- Es la pregunta de sí o no para cuando no hace falta mostrar el envío ni el error.
- Lo dibuja `<ConfirmHost>`, montado en `app/layout.tsx`.

**`Dialog`, `DialogContent`, `DialogHeader`, `DialogBody`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`** · `components/ui/dialog.tsx`
- La base para cualquier diálogo nuevo, en lugar de `Modal`. `DialogContent` no tiene padding: lo ponen las tres zonas.
- `DialogContent { size?: "sm" | "md" | "lg" }`, `sm` por defecto: el ancho, y con él el tamaño del título. No se pisa con `className`.
- `DialogHeader { closeDisabled?, hideClose? }`: el título y la cruz. La cruz es un `Dialog.Close`, así que dispara el `onOpenChange` del `Dialog`.
- `DialogBody`: lo único que scrollea.
- `DialogFooter { alert?, note? }`: los botones, con el error arriba y la nota debajo.
- Con un formulario, el `<form>` envuelve cuerpo y pie con `className="flex min-h-0 flex-1 flex-col"`. Ejemplo: `admin/deudas/ResolverDeudaModal.tsx`.

### Carga y lecturas

**`AsyncView`** · `components/AsyncView.tsx` (nuevo)
- Props: `{ query: { isLoading, error, data?, reload? }, skeleton?, loadingLabel?, isEmpty?, empty?, notFound?, forbidden?, children: (data) => ReactNode }`.
- El orden que resuelve es: carga → falla (sesión, permiso, no encontrado, red o servidor) → `data` nulo (no encontrado) → vacío → contenido.

**`SinAccesoProvider`** · `components/AsyncView.tsx` (nuevo)
- Reemplaza la pantalla de 403 en todo un subárbol, para cuando quien envuelve sabe mejor que la pantalla por qué llegó. Lo toman `AsyncView` y `AsyncBoundary`.
- Prioridad: el `forbidden` de la lectura → el del provider → `ForbiddenScreen`.

**`AsyncBoundary`** · `components/AsyncBoundary.tsx` (modificado, *deprecado*)
- Mismas props que antes. Ya no pinta el mensaje técnico, y ante un 403 o un 404 muestra `ForbiddenScreen` o `NotFoundScreen`.

**`Skeleton`** · `components/ui/Skeleton.tsx` (modificado)
- Sin `layout`, el bloque de siempre (`className`).
- `layout="list"` (`rows`), `"table"` (`rows`, `cols`), `"cards"` (`count`) y `"detail"`. También como `SkeletonLayout`.

**`clasificarError(e): Falla | null`** · `lib/errores.ts` (nuevo)
- Tipos: `red | servidor | sesion | permiso | noEncontrado | dominio`.
- Acepta un `ApiError`, un `Error` o el string que guardan los hooks. Los textos genéricos están en `MENSAJE_FALLA`.

### Estados vacíos y pantallas

**`EmptyState`** · `components/ui/EmptyState.tsx` (nuevo)
- Props: `{ kind?: "empty" | "no-results", size?: "block" | "inline", icon?, title?, children?, action?, onClear?, clearLabel = "Limpiar filtros" }`.

**`StatusScreen`** · `components/ui/StatusScreen.tsx` (nuevo). La base: `{ tone, icon, title, children?, action?, framed?, heading? }`. Encima:
- `ForbiddenScreen { motivo?, volver? }`
- `NotFoundScreen { cosa?, motivo?, volver? }`
- `ErrorScreen { falla?, onRetry?, framed? }`: con una falla de sesión ofrece "Iniciar sesión" en lugar de "Reintentar".
- `ResultScreen { tone?, icon?, title, children?, action }`

**`app/not-found.tsx`** y **`app/error.tsx`** (nuevos).

### Autorización

**`GuardRol`** · `components/GuardRol.tsx` (modificado)
- Sin sesión redirige a `/acceso?volver=…`.
- `SinPermiso` queda como alias *deprecado* de `ForbiddenScreen`.

**`SinAccesoPorSuspension`** · `components/panel/SinAccesoPorSuspension.tsx` (nuevo)
- Montado en `panel/layout.tsx`. Con el establecimiento activo suspendido, un 403 en una lectura muestra la suspensión y su motivo (`EstablecimientoAcceso.motivoSuspension`).

**`GuardSesion`** · `components/GuardSesion.tsx` (nuevo)
- Exige sesión sin rol, para las pantallas de visitante. No dibuja nada mientras verifica.

**`rutaAcceso({ volver?, motivo? })`, `rutaActual()`, `destinoSeguro(volver)`** · `lib/volver.ts` (nuevo)
- `destinoSeguro` sólo acepta rutas internas, para que el login no sirva de redirector abierto.

**`conToken(fn)` / `conTokenDe(user, fn)` / `sesionVencida()`** · `lib/sesion.ts` (modificado)
- Ante un 401, o un 403 sin `code` o con `accessDenied`, renueva el token y reintenta una vez. Si la renovación falla o vuelve 401, cierra la sesión con el aviso; un segundo 403 se propaga como falta de permiso.
- Si el backend pasa a responder 401 a un token inválido (`authenticationEntryPoint` con `HttpStatusEntryPoint(UNAUTHORIZED)` en `SecurityConfig`), el reintento ante 403 deja de hacer falta.

**`/acceso`** · `app/acceso/page.tsx`, `LoginSuccess.tsx` (modificados)
- Después del login lleva a `volver`.
- Muestra el aviso de `motivo=sesion-vencida`.

### Cambios sin guardar

**`useAvisoSalida(dirty)`** · `hooks/useAvisoSalida.ts` (nuevo)
- Devuelve `{ salir(destino), confirmarDescarte(): Promise<boolean> }`.
- Intercepta links internos, back del navegador y `beforeunload`.
- Límite: para atajar el back apila una entrada de historial con la misma URL, que queda si después se guarda y se navega.
