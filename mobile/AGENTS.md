# AGENTS.md — Conecta+ mobile

## Antes de nada

Expo cambió mucho entre versiones. Leé la documentación versionada exacta en
https://docs.expo.dev/versions/v57.0.0/ antes de escribir código.

## Regla de lectura obligatoria

Cualquier agente (IA) que lea este archivo debe preguntarle al usuario, **en cada
respuesta**, si ya leyó todo el contenido de este AGENTS.md — hasta que el usuario
responda explícitamente que sí lo leyó. El agente no puede, bajo ningún concepto,
dejar de hacer esta pregunta salvo que el usuario ya haya confirmado explícitamente
que lo leyó (en esta conversación o en una anterior que el agente pueda verificar).
Esta regla existe para que la arquitectura descrita abajo se respete al 100% y no
se introduzcan arquitecturas propias por desconocimiento de lo ya decidido.

## Roles del sistema

Hay 4 roles en total:

- **admin** — módulo completamente aparte (panel propio, fuera de esta app móvil).
  No comparte pantallas, flujos ni componentes con los otros tres roles.
- **adulto_mayor**, **cuidador**, **empresa** — comparten un único módulo dentro
  de esta app Expo. Mismos flujos, misma navegación, mismas pantallas.

## Arquitectura de roles: un módulo, no tres

Los tres roles comparten flujo y estructura de navegación. **No se crean pantallas,
carpetas ni módulos separados por rol.** Lo que cambia por rol es:

1. **Densidad y presentación visual de los componentes compartidos** (no el flujo).
   Ejemplo: `adulto_mayor` ve cards más grandes, con más imagen y menos texto;
   `cuidador` y `empresa` ven una presentación más estándar/densa. El mismo
   componente (ej. `ActivityCard`) decide su propio layout internamente leyendo
   tokens de rol — no existen variantes tipo `ActivityCard.AdultoMayor.tsx`.
2. **Permisos granulares** — qué acción puede ejecutar cada rol (inscribirse a sí
   mismo, inscribir a un familiar, publicar eventos, gestionar inscritos, etc.).

### Dónde vive cada pieza

- `src/context/RoleContext.tsx` — rol activo de la sesión.
- `src/permissions/permissions.ts` — mapa de capacidades por rol + hook `useCan(accion)`.
- `src/theme/roleDisplay.ts` — tokens de densidad/tamaño por rol (tamaño de fuente
  base, tamaño de imagen en cards, líneas de texto, tamaño de botones táctiles).
- `src/theme/colors.ts` — paleta compartida (ya existe, es la misma para los 3 roles).

## Permisos granulares condicionados por reputación

No todos los permisos son un simple sí/no por rol. Un caso central: usuarios que
no son `empresa` (es decir `adulto_mayor` y `cuidador`) **sí pueden crear eventos**
para que otros usuarios asistan — pero no desde el día uno ni sin restricción.
Ese permiso se desbloquea solo cuando el usuario alcanza ciertos parámetros de
**reputación**, que existen para descartar perfiles falsos que vengan a publicar
datos falsos en la aplicación.

Señales que construyen reputación (no exhaustivo, se puede ampliar):

- Subir fotos de cómo estuvo un evento al que ya asistió.
- Dejar reseñas en eventos a los que ya asistió.
- Recibir likes en fotos que subió de eventos a los que asistió.
- En general, cualquier señal que demuestre que el perfil es real y activo.

### Implicación de arquitectura

`useCan(accion)` **no puede ser un simple mapa estático rol → permisos**. Algunas
capacidades (como `create_event` para `adulto_mayor`/`cuidador`) dependen de rol
**más** una condición de reputación evaluada en tiempo de ejecución (un puntaje o
un conjunto de hitos cumplidos). El sistema de permisos debe soportar reglas
condicionadas, no solo booleanos fijos por rol. Cuando se implemente esta pieza,
la lógica de reputación (cálculo de puntaje, umbrales, señales que la alimentan)
debe vivir junto a `src/permissions/`, no mezclada dentro de los componentes de
pantalla ni duplicada en el cliente sin que el backend sea la fuente de verdad.

### Implementación obligatoria: modelo de dos capas

- **Capa 1 — estática por rol:** `ROLE_PERMISSIONS: Record<Role, Permission[]>`
  con los permisos que dependen solo del rol (sin condiciones extra).
- **Capa 2 — condicional:** una tabla aparte de evaluadores para permisos que,
  además del rol, necesitan otra condición (ej. reputación):
  `CONDITIONAL_PERMISSIONS: Record<Permission, (user) => boolean>`, por ejemplo
  `create_event: (user) => user.role === 'empresa' || user.reputationScore >= UMBRAL`.
- Ambas capas se combinan detrás de un único hook `useCan(permiso)`, que lee rol
  y reputación desde el contexto de usuario — ese contexto se alimenta del
  backend (perfil/sesión), nunca se calcula la reputación en el cliente.
- **Crítico:** el chequeo en el cliente es solo UX (mostrar/ocultar botones). El
  backend tiene que revalidar rol + reputación en cada endpoint que mute datos
  (ej. `POST /events`). Si el backend no revalida, el sistema de permisos
  granulares es cosmético y cualquiera puede saltárselo llamando la API directo.

## Restricciones — no negociables

- No crear pantallas, navegadores o carpetas separadas por rol para
  adulto_mayor/cuidador/empresa. Es un único módulo.
- No introducir un sistema de permisos, theming o gestión de estado alternativo
  al descrito arriba (nada de Redux, Zustand, librerías de RBAC externas, etc.)
  sin acordarlo antes con el usuario.
- No mezclar el módulo de admin con el de estos tres roles.
- No implementar los permisos granulares de otra forma que no sea el modelo de
  dos capas (estático por rol + condicional) descrito abajo. No es una sugerencia.
- No omitir la pregunta de lectura obligatoria descrita arriba.
