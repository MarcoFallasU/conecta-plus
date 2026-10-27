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
- `src/theme/designSystem.ts` — escalas globales del design system (radios, bordes,
  pesos, escala tipográfica, sombras). Los tamaños de texto son múltiplos del
  `baseFontSize` del rol.
- `src/permissions/reputation.ts` — umbrales y puntos de reputación.
- `src/context/AppDataContext.tsx` — los datos que consumen las pantallas, solo vía
  `useAppData()`. Con sesión real (Google) las actividades, inscripciones, vínculos
  familiares y la búsqueda de lugares vienen de la API (`usesApi`); las cuentas de
  demostración usan datos locales (`data/seed.ts`). Perfil, asistencia, avisos, reseñas y
  recomendaciones siguen siendo locales hasta que se migren; cuando un dato aún no existe
  en el servidor, la pantalla no finge guardarlo (ver cancelar eventos).
- `src/components/` — componentes compartidos del design system.
- `src/screens/` — una pantalla por flujo, igual para los tres roles.
- `src/navigation/` — un único stack raíz + pestañas inferiores.
- `src/context/PreferencesContext.tsx` — preferencias de accesibilidad del dispositivo
  (tamaño de letra y alto contraste, guardadas en AsyncStorage). No cambian el flujo:
  `useRoleDisplay()` las aplica sobre los tokens del rol, y `display.colors` entrega la
  paleta activa. Los estilos leen colores **solo** de `display.colors`.
- `src/data/` — tipos, zonas (`zones.ts`), categorías con ícono y datos semilla del mock.
- `src/services/` — acceso a la API: `apiClient.ts` (peticiones y token de sesión en
  almacenamiento seguro) y `googleAuth.ts` (inicio de sesión con Google). **Entrar a la
  app es solo con Google** (`useAppData().signInWithGoogle`): no hay correo ni contraseña.
  La API habla con Google y la app recibe un código de un solo uso (PKCE); ver
  `api/README.md`. Las cuentas de demostración (`loginAs`) no usan la API.
- `src/utils/` — lógica pura sin UI y sin estado: fechas, distancia, búsqueda y filtros
  (`search.ts`), recomendaciones (`recommendations.ts`), avisos y recordatorios
  (`notices.ts`), resumen de participación (`progress.ts`), enlaces externos
  (`links.ts`) y lectura en voz alta (`speech.ts`). Al migrar a la API, estas funciones
  pasan al backend o se alimentan de sus respuestas.

### Experiencia del adulto mayor dentro del módulo compartido

No hay un módulo aparte: el adulto mayor usa las mismas pantallas, adaptadas por tokens
y permisos. Lo que lo distingue es:

- **Tokens** (`roleDisplay.ts`): letra base de 20, botones de 56, tarjetas verticales con
  imagen grande y poco texto. También es la densidad por defecto antes de iniciar sesión.
- **Permisos de capa 1** exclusivos o casi exclusivos: `confirm_attendance`,
  `view_progress`, `edit_interests`, `manage_emergency_contacts`
  (`view_family_summary` lo tiene el cuidador para ver el resumen de su familiar).
- **Flujos**: Inicio personalizado (avisos urgentes, próxima actividad, recomendadas,
  accesos grandes), Buscar con filtros por categoría/fecha/cercanía y mapa, Agenda con
  calendario, confirmación de asistencia, Mi resumen, Mis datos (zona, intereses,
  contactos de emergencia) y Avisos.
- **Confirmaciones**: toda acción que se puede hacer por error (cancelar inscripción,
  llamar a emergencias, cancelar un evento) pasa por `ConfirmDialog`.

## Convenciones de código

- **Cada pantalla y cada componente tiene su `.styles.ts`** junto al `.tsx`
  (`Foo.tsx` + `Foo.styles.ts`). Exporta `createStyles(display)` y se consume con
  `useRoleStyles(createStyles)`. No se escriben `StyleSheet.create` dentro de los `.tsx`.
- Los valores visuales salen del design system (`colors`, `designSystem`,
  `roleDisplay`); no se hardcodean colores ni tamaños sueltos en pantallas.
- Las pestañas inferiores son las mismas para todos los roles; una pestaña solo se
  oculta si el rol no tiene el permiso que la habilita (hoy: `view_family`).
- Las acciones y secciones dentro de cada pantalla se muestran/ocultan con `useCan`,
  nunca con `if (role === ...)` en la pantalla.

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
