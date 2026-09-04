# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Frontend de Mendoza AgroTours: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4, con Firebase Auth y un backend Spring propio. Los comentarios del código y los mensajes de UI van en español rioplatense.

## Comandos

```bash
npm run dev          # servidor de desarrollo (turbopack)
npm run build        # build de producción (turbopack)
npm run lint         # eslint
npm run test:e2e     # Playwright (levanta el dev server solo)
```

Antes de dar por terminado un cambio: `npx tsc --noEmit && npm run lint && npm run build`. El `build` es el que suele encontrar los errores de prerender.

Un solo test e2e: `npx playwright test e2e/registro.spec.ts`, o por nombre `npx playwright test -g "empty submit"`. `npm run test:e2e:ui` abre el runner interactivo.

`npm run test` corre Jest, pero **no hay tests unitarios**: la config es el scaffold sin tocar, el script usa `--passWithNoTests` y el paso está comentado en CI. Los únicos tests reales son los de `e2e/`. CI (`.github/workflows/github-actions.yml`) corre lint + build en cada push a `main`/`dev`, y los e2e sólo en `main`.

## Arquitectura

### Tres espacios, tres layouts

La app se divide en tres, y cada uno tiene **un solo** layout que pone su chrome y su guard. No agregues headers ni sidebars por pantalla.

| Espacio | Ruta | Layout | Shell |
|---|---|---|---|
| Público / visitante | `(sitio)` (route group, sin segmento en la URL) | `src/app/(sitio)/layout.tsx` | `SiteHeader` |
| Administración | `/admin` | `src/app/admin/layout.tsx` | `AdminShell` |
| Productor | `/panel` | `src/app/panel/layout.tsx` | `PanelShell` |

En `/admin` y `/panel` el shell **envuelve** al `GuardRol`, no al revés: así el sidebar se pinta desde el primer frame y sólo el área de contenido espera a que se verifique la sesión.

### Sesión

Firebase Auth es el dueño del ID token; nunca se persiste a mano. El perfil (`nombre`, `email`, `accesos`, `roles`) vive en `src/stores/authStore.ts`, un store de Zustand con `persist` + **`skipHydration`** y rehidratación manual en `<AuthSync>` — sin eso hay mismatch de hidratación en SSR.

`accesos` es la lista de permisos por ámbito que devuelve `GET /usuario/me`. Los helpers para leerla están en `src/lib/roles.ts` (`rolesDe`, `tienePermiso`, `tieneRol`, `nombreRol`, `establecimientosDe`) y los códigos en `src/lib/permisos.ts` (`TipoPermiso`, `PermisoAdmin`, `PermisoProductor`).

**Los permisos de productor valen por establecimiento.** Cuál está activo lo elige el switcher del shell y lo sabe recién el cliente, así que esas pantallas chequean el permiso en el cliente (con `<SinPermiso>`), no en el layout.

### Backend

`src/lib/api.ts` es el cliente HTTP. El contrato tiene dos capas y conviene tenerlo claro:

- En **2xx** el backend responde un envelope `{ ok, code, data }`. Usá `comoEnvelope<T>(res)` y ramificá sobre `env.ok` / `env.code`.
- Un status **no-2xx** tira `ApiError`, que expone `status` y el `code` del cuerpo si vino. Con `code` es un error de dominio (mostrá un mensaje propio); sin `code` es un fallo técnico (mensaje genérico).
- Un `SyntaxError` al parsear significa **2xx con cuerpo vacío**: es un éxito, no un error.

## Convenciones

Están escritas por momento de decisión, que es cuando hacen falta.

### Cuando agregues un formulario

react-hook-form + `zodResolver`, con el esquema en un **`schema.ts` al lado del cliente**. Cada control envuelto en `<FormField>` → `<FormControl>` (primitivos en `src/components/ui/form.tsx`). `mode: "onTouched"` salvo que la pantalla necesite validación cruzada en vivo, en cuyo caso `onChange` y dejá el motivo comentado.

Ejemplo: `src/app/panel/productores/{ProductoresClient.tsx,schema.ts}`.

Para leer un campo de forma reactiva usá **`useWatch`, nunca `form.watch()`**: el React Compiler se rinde con `watch()`.

**No** valides a mano ni armes tu propio manejo de errores tocados/intentados: RHF ya da `touchedFields`, `isSubmitted` y `errors`, y con zod el tipo se infiere del esquema en vez de declararse aparte.

### Cuando agregues un control a `src/components/ui/`

**Primero fijate si ya existe uno parecido y generalizalo.** `multi-select.tsx` y `searchable-select.tsx` hacen casi lo mismo por caminos distintos porque esto no se chequeó.

**shadcn va como capa base, no como librería de componentes.** La regla para decidir: bajá un primitivo de shadcn cuando aporte **comportamiento** —foco, portal, teclado, posicionamiento, semántica ARIA—; escribilo a mano cuando sea sólo **presentación**. El aspecto nunca sale de shadcn: sale del `@theme` de `globals.css`, y sus defaults neutrales hay que pisarlos enteros igual.

Por eso en `ui/` conviven dos capas, y está bien que así sea:

- `input`, `select`, `checkbox`, `popover` (sobre `@base-ui/react`), `command` (cmdk), `label` y `form` vienen de shadcn. Son los únicos.
- Los `PascalCase` (`Button`, `Card`, `Alert`, `Toast`, `Skeleton`, `EstadoBadge`…) son presentacionales de Agrotours, escritos a mano.
- Los `kebab-case` restantes (`text-field`, `date-field`, `searchable-select`, `country-select`, `file-uploader`…) son composites de Agrotours **construidos sobre** los primitivos de shadcn. Ahí va lo nuevo.

Todo control de formulario tiene que reenviar `ref`, `onBlur`, `id`, `aria-invalid` y `aria-describedby` al input o trigger real. `<FormControl>` los inyecta con `cloneElement` (no con el `Slot` de Radix), así que un control que no los reenvía no se integra con los formularios.

Ejemplos: `text-field.tsx`, `date-field.tsx`, `searchable-select.tsx`.

Deuda conocida: `Modal.tsx` está escrito a mano y no tiene trampa de foco, ni Escape, ni bloqueo de scroll — lo usan 10 pantallas y debería pasar al `Dialog` de shadcn. `date-picker.tsx`, `time-picker.tsx` y `multi-select.tsx` no reenvían el contrato de arriba.

### Cuando wirees un endpoint

Un hook `use*` en `src/hooks/`, nunca `fetch` en el componente. Patrón canónico: `src/hooks/useRoles.ts`.

- **Lectura que sale al montar la pantalla** → `onAuthStateChanged`. `auth.currentUser` todavía está vacío en ese momento y el pedido saldría sin token, fallando en silencio.
- **Escritura, o lectura disparada por el usuario** → `conToken` de `src/lib/sesion.ts`.
- Mapeá la respuesta a un tipo propio en el borde del hook, tratando todos los campos como opcionales. La pantalla no debería ver nunca el vocabulario del backend.
- Las escrituras devuelven `{ ok, code? }`, no `void`, para poder mapear códigos de dominio a mensajes.
- Para el estado de carga, derivalo de una clave (`deps + nonce`) como hacen `useRoles`/`useActividades`: llamar `setState` sincrónicamente dentro de un efecto lo rechaza el lint (`react-hooks/set-state-in-effect`).

Carga y error se muestran con `<AsyncBoundary>`; si la pantalla tiene una forma conocida (tabla, tarjetas), pasale un `skeleton` en vez de dejar el spinner.

### Cuando estilés

Tailwind, siempre. Nada de estilos inline ni bloques `<style>`. Los tokens viven en el `@theme` de `src/app/globals.css` (`green-800`, `cream-tert`, `fg-1`, `sand`, `radius-pill`…) y hay dos breakpoints propios: `shell:` (1000px) y `nav:` (861px). Usá `cn()` de `src/lib/utils.ts` para que un `className` pueda pisar la variante de un componente.

**Trampa:** `.input`, `.textarea`, `.select` y `.err-msg` están definidas en `globals.css` **fuera de capa**, así que le ganan a las utilidades de Tailwind. Un `pl-[42px]` sobre un `.input` no hace nada. En pantallas nuevas usá los primitivos de `src/components/ui/`, no esas clases.

Quedan pantallas con estilos inline heredados del diseño original; se migran de a una cuando se las toca.

### Cuando escribas un test e2e

Dos cosas rompen los selectores obvios: el `*` de campo obligatorio es `aria-hidden`, pero Playwright igual lo cuenta en `getByLabel`, así que para los inputs usá `getByPlaceholder`; y los selects propios (`country-select`, `tipo-id-select`, `searchable-select`) exponen sus opciones como `role="option"`, no como `button`. Ejemplo: `e2e/registro.spec.ts`.

### Dónde va cada cosa

| Qué | Dónde |
|---|---|
| Datos mock y catálogos estáticos | `src/data/` |
| Tipos e interfaces | `src/types/` |
| Hooks (fetch, submit, estado compartido) | `src/hooks/` |
| Lógica pura y helpers | `src/lib/` |
| Primitivos de UI reutilizables | `src/components/ui/` |
| Piezas de un espacio | `src/components/{admin,panel,…}/` |
| Cliente de una pantalla | junto a su `page.tsx`, como `XClient.tsx` |

Por default el `page.tsx` es server component y sólo arma metadata y `generateStaticParams`, con la interactividad en el `XClient.tsx`. Hay tres excepciones heredadas (`registro`, `acceso`, `acceso/recuperar`) que son `"use client"` enteras; no las tomes de modelo.

### Qué está wireado y qué no

Se distingue por el hook, no por la pantalla: si usa `apiFetch` está contra el backend real; si tiene funciones `mock*` con `setTimeout`, todavía no. Cuando wirees algo, borrá el mock que reemplazaste y dejá los `TODO backend:` marcando lo que falta del otro lado.

## Fuentes de verdad fuera de este repo

- **`../mza-agrotours-backend`** (repo hermano) manda en códigos de permiso, nombres de rol, códigos de error y forma de los DTO. Avisá antes de ir a leerlo.
- Las pantallas se portan desde un proyecto de **Claude Design** vía el MCP DesignSync. El diseño es la especificación del **aspecto y el comportamiento**, nunca de la estructura ni de las herramientas: traducilo a las convenciones de acá (Tailwind, primitivos de `ui/`, RHF+zod) en lugar de copiar su implementación. Antes de trabajar en una pantalla, pedí la URL del diseño en vez de inventarlo.

## Git

Rama principal `main`, integración en `dev`. No commitees salvo que te lo pidan: el trabajo terminado queda en el working tree para revisión.
