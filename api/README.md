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
   En *URI de redireccionamiento autorizados* agrega **exactamente** el valor de
   `GOOGLE_REDIRECT_URI` (por ejemplo `http://localhost:4000/api/auth/google/callback`).
4. Copia el ID de cliente y el secreto al `.env` de la API (`GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`) y reinicia.

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
