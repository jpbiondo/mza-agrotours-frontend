# Guía de UI (borrador)

Sale de [`ui-audit.md`](ui-audit.md). Cada regla dice **cuándo** se usa cada variante y qué la implementa. La API de cada pieza está en "Componentes y APIs compartidas", al final. ✅ = existe · 🆕 = falta.

## Botones — `Button` / `buttonClasses` ✅

| Cuándo | Variante |
|---|---|
| La acción principal de una zona (página, diálogo, tarjeta). Una sola por zona | `primary` |
| CTA del encabezado de página ("Agregar …") | `primary md`, igual que el resto de los botones de la página. *Decisión del equipo* |
| Acción secundaria, y "Cancelar" en el pie de un diálogo | `neutral`. *Tiene 61 usos. `ghost` se elimina: sus 13 usos pasan a `neutral`* |
| Zonas densas: filas, tarjetas, edición en línea | `sm`, tal cual, sin pisar el tamaño del texto (los `size="sm" className="text-sm"` vuelven a `sm`) |
| Confirmar una acción destructiva **dentro** del diálogo de confirmación | `danger` relleno. *Es el uso de 15 de sus 16 apariciones* |
| Disparar una acción destructiva desde la página (abre el diálogo) | `danger-outline` ✅. *Hoy hay 5 implementaciones; esta generaliza el `ActionBtn tone="danger"`, que es la más usada* |
| Acciones de fila de tabla o de tarjeta de listado | `ActionBtn` ✅ (`neutral` / `danger`). Reemplaza `CardAction`, los `Button sm` con overrides y los botones de sólo ícono |
| Volver a la pantalla anterior | `BackLink` ✅: texto verde con flecha. *Es la variante más usada (4 de 9)* |
| Botón de sólo ícono (cerrar, mes anterior/siguiente) | `IconButton` ✅, 36 px, siempre con `aria-label` |
| Mientras se envía | `Button loading` ✅: el spinner reemplaza al ícono, la etiqueta no cambia y el botón queda deshabilitado. *Es el patrón de ~15 de 29 casos* |

Las clases `.btn-*` de `globals.css` no se usan en código nuevo.

## Feedback

| Cuándo | Qué se muestra | Implementación |
|---|---|---|
| Una acción salió bien y el usuario sigue en la misma pantalla | Toast `success` de 4 s. Lleva `sub` sólo si hay un dato que leer (nombre, fecha, cupos) | `notify.success` / `notify.successDetailed` ✅. Reemplaza las 24 copias de `useState`+`setTimeout` y los 4 toasts propios |
| Una acción **reversible** salió bien (publicar o pasar a borrador, quitar portada) | Toast con botón **Deshacer**, 6 s, sin modal previo | `notify.undoable` ✅ |
| Falló una acción **lanzada desde un diálogo** | `Alert danger` dentro del diálogo. El diálogo queda abierto con lo cargado. *Es el caso de ~25 diálogos* | `Alert` ✅ (o `error` de `ConfirmDialog`) |
| Falló una acción lanzada sin diálogo (toggle, acción de fila) | Toast `danger` de 7 s, con botón de cerrar. Dura más que el de éxito porque hay que leer qué falló | `notify.error` ✅ |
| Un estado de la pantalla limita lo que se puede hacer (sólo lectura, suspendido, borrador) | `Alert` persistente arriba del contenido: `warning` si bloquea, `info` si sólo informa | `Alert` ✅, con tono `info` ✅ |
| Termina un proceso que cambia de contexto (login, alta enviada, pago, reprogramación) | Pantalla de resultado con un ícono, un título y un único CTA | `ResultScreen` ✅ |

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

## Preguntas abiertas

Ninguna por ahora.

---

## Componentes y APIs compartidas

Cada patrón tiene un único punto de entrada. Las pantallas existentes **todavía no se migraron**: lo marcado *deprecado* sigue funcionando hasta que se migren sus usos.

### Botones

**`Button`** · `components/ui/Button.tsx` (modificado)
- `variant`: `"primary" | "neutral" | "danger" | "danger-outline"`. `ghost` se eliminó al migrar sus usos a `neutral`.
- `size`: `"sm" | "md" | "lg"`.
- `loading?: boolean`: el spinner reemplaza al primer ícono, la etiqueta queda igual, se deshabilita y marca `aria-busy`.
- `disabledReason?: string`: con `disabled`, muestra el motivo como texto debajo del botón y lo asocia con `aria-describedby`.
- `buttonClasses({ variant, size, className })`: las mismas clases, para un `<Link>`.

**`ActionBtn`** · `components/ui/ActionBtn.tsx` (modificado)
- `{ icon, label, tone?: "neutral" | "danger", disabled?, loading?, title, onClick? }`. Se agregó `loading`.

**`IconButton`** · `components/ui/IconButton.tsx` (nuevo)
- `{ "aria-label": string (obligatorio), appearance?: "bordered" | "plain", ...props de <button> }`. Mide 36 px.

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
- Props: `{ open, onCancel, onConfirm, title, description?, confirmLabel, cancelLabel = "Cancelar", tone?: "danger" | "primary", icon?, busy?, error?, confirmDisabled?, requireText?, children? }`.
- Mientras `busy`, no se puede cerrar. `requireText` pide escribir una palabra para habilitar la acción.

**`confirm(opciones): Promise<boolean>`** · mismo archivo, con su estado en `stores/confirmStore.ts` (nuevo)
- Es la pregunta de sí o no para cuando no hace falta mostrar el envío ni el error.
- Lo dibuja `<ConfirmHost>`, montado en `app/layout.tsx`.

**`Dialog`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`** · `components/ui/dialog.tsx`
- La base para cualquier diálogo nuevo, en lugar de `Modal`.

### Carga y lecturas

**`AsyncView`** · `components/AsyncView.tsx` (nuevo)
- Props: `{ query: { isLoading, error, data?, reload? }, skeleton?, loadingLabel?, isEmpty?, empty?, notFound?, forbidden?, children: (data) => ReactNode }`.
- El orden que resuelve es: carga → falla (sesión, permiso, no encontrado, red o servidor) → `data` nulo (no encontrado) → vacío → contenido.

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
