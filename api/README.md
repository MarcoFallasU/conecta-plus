# API de Conecta+

Express + Prisma sobre Turso (SQLite/libSQL). Requiere **Node 20.19+, 22.12+ o 24+**
(Prisma 7 no instala en otras versiones, por ejemplo Node 23).

## Puesta en marcha

```bash
cd api
cp .env.example .env        # y completa los valores
npm install
npm run db:generate         # genera el cliente de Prisma
npm run dev
```

Base de datos nueva: `node apply.mjs` (crea las tablas) y luego cada migración, una vez:

```bash
node apply-migration.mjs migrations/001_add_password_hash.sql
node apply-migration.mjs migrations/002_add_google_sub.sql
```

Pruebas del inicio de sesión: `npm test` (no necesitan base de datos ni internet).

## Base de datos con Turso

`TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` del `.env` salen de la CLI de Turso. Para probar sin
Turso sirve una base local: `TURSO_DATABASE_URL=file:./dev.db` con el token vacío, y las
tablas con `apply.mjs` y las migraciones de arriba.

En Windows la CLI solo corre dentro de WSL (Ubuntu); los comandos de esta sección van en esa
terminal, no en PowerShell:

```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login --headless
```

`--headless` solo imprime un enlace y termina: ábrelo en el navegador, inicia sesión y la
página muestra un *access token*. Ese token es el de **tu cuenta** (dura unos 7 días) y se le
entrega a la CLI, no a la API:

```bash
turso config set token "<access token>"
```

Con la sesión abierta salen los dos valores del `.env`. Si la base está dentro de una
organización, antes corre `turso org list` y `turso org switch <organización>`:

```bash
turso db show <base> --url       # TURSO_DATABASE_URL (empieza con libsql://)
turso db tokens create <base>    # TURSO_AUTH_TOKEN
```

`TURSO_AUTH_TOKEN` tiene que ser el token de la **base** (`tokens create`). Con el de la
cuenta Turso responde HTTP 401. Nodemon no vigila el `.env`: después de editarlo, escribe
`rs` en la terminal de la API para que lo recargue.

Si la base es compartida con otra persona del equipo, avísale antes de aplicar una
migración, y aplícala antes de arrancar la API contra esa base (Prisma pide todas las
columnas de cada tabla). El error `duplicate column name` significa que esa migración ya
estaba aplicada o que `TURSO_DATABASE_URL` sigue apuntando al archivo local.

## Inicio de sesión con Google

Es la única forma de entrar. La app abre `/api/auth/google/start` en el navegador, Google
devuelve a `/api/auth/google/callback`, y la app cambia un código de un solo uso por la
sesión en `/api/auth/google/exchange` (PKCE). El secreto de Google solo vive en la API.

### Crear las credenciales (una vez)

1. [Google Cloud Console](https://console.cloud.google.com/) → crea un proyecto.
2. **APIs y servicios → Pantalla de consentimiento de OAuth**: tipo *Externo*, nombre
   "Conecta+", tu correo de contacto. En *Usuarios de prueba* agrega los correos que
   van a probar la app mientras esté en modo "Prueba".
3. **Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación web**.
   En **URIs de redireccionamiento autorizados** agrega **exactamente** el valor de
   `GOOGLE_REDIRECT_URI` (por ejemplo `http://localhost:4000/api/auth/google/callback`).
   Es la dirección de la **API**, que es la que llama Google; la app web
   (`http://localhost:8081`) solo es el destino al que la API devuelve a la persona al final.
   No lo pongas en *Orígenes autorizados de JavaScript*: esa sección solo acepta orígenes sin
   ruta y marca "Los URI no deben contener una ruta".
4. Copia el ID de cliente y el secreto al `.env` de la API (`GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`) y reinicia. El JSON que baja la consola (`client_secret_*.json`)
   trae esos mismos valores: la API solo lee el `.env`, así que guárdalo fuera del repositorio
   (el `.gitignore` lo ignora, pero no dejes el secreto dentro de la carpeta). Google puede
   tardar unos minutos en aplicar los cambios.

### Probar en el celular (Expo Go)

Google solo acepta `http://localhost` o `https://` como redirección, y el celular no ve el
`localhost` de tu computadora. Expón la API con una dirección HTTPS, por ejemplo:

```bash
cloudflared tunnel --url http://localhost:4000
```

Usa esa dirección `https://…` en tres lugares: `GOOGLE_REDIRECT_URI` (terminada en
`/api/auth/google/callback`, y también agregada en Google Cloud), y en la app
`EXPO_PUBLIC_API_URL` (terminada en `/api`).

### Producción

Con `NODE_ENV=production` solo se aceptan los destinos `conectaplus://` y los de
`APP_REDIRECT_ALLOWLIST`. El código de intercambio usado se recuerda en memoria: con más
de una instancia de la API hay que guardarlo en la base de datos o en Redis.

## Despliegue en Render (plan gratis)

El archivo `render.yaml`, en la raíz del repositorio, describe el servicio. Para crearlo:

1. Sube la rama a GitHub y entra a [Render](https://render.com) con tu cuenta de GitHub.
2. **New → Blueprint**, elige este repositorio y la rama (por ejemplo `develop`).
3. Render pide los valores secretos una sola vez, al crear el Blueprint: `TURSO_DATABASE_URL`,
   `TURSO_AUTH_TOKEN` (conviene un token propio para producción: `turso db tokens create <base>`),
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_REDIRECT_URI`
   (`https://<servicio>.onrender.com/api/auth/google/callback`). `JWT_SECRET` lo genera Render.
4. Cuando termine el deploy, abre `https://<servicio>.onrender.com/api/health`: debe responder
   `{"status":"ok"}`. Si Render asignó una dirección distinta a la que pusiste en
   `GOOGLE_REDIRECT_URI`, corrígela en *Environment* del servicio.
5. Registra ese mismo callback en Google Cloud, en **URIs de redireccionamiento autorizados**.
6. En la app, la API se indica con `EXPO_PUBLIC_API_URL=https://<servicio>.onrender.com/api`
   (en `mobile/eas.json` para los builds).

Con `NODE_ENV=production` la API solo acepta devolver a `conectaplus://`, así que la versión web
en `localhost` no puede entrar con Google contra la API desplegada. El plan gratis se duerme tras
15 minutos sin tráfico y despertarlo tarda alrededor de un minuto: abre `/api/health` antes de una
demostración. Ese plan no tiene disco persistente, pero no importa: los datos viven en Turso.

## Problemas frecuentes

| Lo que ves | Causa más probable |
| --- | --- |
| La app dice "El inicio de sesión con Google aún no está disponible" (`not_configured`) | La API no tiene `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` o `GOOGLE_REDIRECT_URI`, o no se reinició después de editar el `.env`. |
| Google muestra `Error 400: redirect_uri_mismatch` | `GOOGLE_REDIRECT_URI` no coincide **exacto** con uno de los "URIs de redireccionamiento autorizados" del cliente, o el cambio aún no se aplicó. |
| Google muestra `Error 403: access_denied` | La pantalla de consentimiento está en modo "Prueba" y ese correo no figura en *Usuarios de prueba*. |
| La app dice "Esa cuenta de Google todavía no está registrada" (`no_account`) | Es la primera vez de ese correo: debe usar **Crear mi cuenta**, elegir el rol y "Registrarme con Google". |
| La API imprime "No se pudo conectar a la base de datos" o Turso responde HTTP 401 | `TURSO_DATABASE_URL` o `TURSO_AUTH_TOKEN` incorrectos: el token tiene que ser el de la **base** (ver "Base de datos con Turso"). |
| Fallan las consultas de usuarios por una columna `googleSub` inexistente | Falta aplicar `migrations/002_add_google_sub.sql` en esa base. |
