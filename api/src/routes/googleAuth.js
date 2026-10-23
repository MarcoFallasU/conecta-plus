const express = require('express')
const crypto = require('node:crypto')
const jwt = require('jsonwebtoken')
const { publicUser, signToken } = require('../services/session')

// Inicio de sesión con Google, mediado por esta API (única forma de entrar a la app).
//
//   app ──(1) /start ──────────────► API ──302──► Google (pantalla de cuenta)
//   app ◄─(3) enlace con ?code ───── API ◄─(2) /callback?code ── Google
//   app ──(4) /exchange {code, code_verifier} ──► API ──► token de sesión
//
// Por qué así: Google no permite redirigir a Expo Go ni guardar el secreto en el celular.
// La API es quien habla con Google (con el secreto) y a la app solo le devuelve un
// código de un solo uso, atado por PKCE al dispositivo que inició el proceso.

const ROLES = ['adulto_mayor', 'cuidador', 'empresa']
const STATE_AUDIENCE = 'google-state'
const EXCHANGE_AUDIENCE = 'google-exchange'
const CLIENT_STATE = /^[A-Za-z0-9_-]{16,128}$/
const CODE_CHALLENGE = /^[A-Za-z0-9_-]{43}$/
const CODE_VERIFIER = /^[A-Za-z0-9._~-]{43,128}$/
const MAX_NAME_LENGTH = 80

// Clave derivada de JWT_SECRET: un token de este flujo no sirve como token de sesión
// ni al revés, aunque compartan el secreto base.
function oauthSecret(env) {
  if (!env.JWT_SECRET) throw new Error('JWT_SECRET no está definido')
  return crypto.createHmac('sha256', env.JWT_SECRET).update('conecta:google-oauth').digest()
}

function sha256Base64Url(value) {
  return crypto.createHash('sha256').update(value).digest('base64url')
}

// A dónde se puede devolver a la persona al terminar. Evita que alguien use /start para
// mandar el código a un sitio ajeno (open redirect).
function createRedirectPolicy(env) {
  const production = env.NODE_ENV === 'production'
  const extra = (env.APP_REDIRECT_ALLOWLIST || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)

  return function isAllowedRedirect(raw) {
    let url
    try {
      url = new URL(raw)
    } catch {
      return false
    }
    if (url.username || url.password || url.hash) return false

    if (url.protocol === 'conectaplus:') return true
    if (!production) {
      // Expo Go (desarrollo) y la versión web local.
      if (url.protocol === 'exp:' || url.protocol === 'exps:') return true
      const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
      if (local && (url.protocol === 'http:' || url.protocol === 'https:')) return true
    }
    // Entradas extra: "esquema://" (cualquier ruta) o un origen exacto "https://app.ejemplo.com".
    return extra.some((entry) =>
      entry.endsWith('://') ? url.protocol === entry.slice(0, -2) : entry.replace(/\/$/, '') === url.origin,
    )
  }
}

function redirectToApp(res, target, params) {
  const url = new URL(target)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value)
  }
  res.redirect(302, url.toString())
}

// Solo se usa cuando no hay a dónde devolver a la persona de forma segura. Texto fijo.
function errorPage(res, status, message) {
  res
    .status(status)
    .type('html')
    .send(
      `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Conecta+</title></head>` +
        `<body style="font-family:sans-serif;padding:24px;max-width:480px;margin:auto"><h1>Conecta+</h1><p>${message}</p><p>Cierra esta ventana y vuelve a la aplicación.</p></body></html>`,
    )
}

function createGoogleAuthRouter({ prisma, google, env = process.env }) {
  const router = express.Router()
  const isAllowedRedirect = createRedirectPolicy(env)

  // Códigos de intercambio ya usados (jti -> vencimiento en segundos). En memoria: vale
  // para una sola instancia de la API; con varias, pasar a una tabla o a Redis.
  const usedCodes = new Map()
  function markUsed(jti, exp) {
    const nowSeconds = Math.floor(Date.now() / 1000)
    for (const [id, expiresAt] of usedCodes) if (expiresAt <= nowSeconds) usedCodes.delete(id)
    if (usedCodes.has(jti)) return false
    usedCodes.set(jti, exp)
    return true
  }

  // (1) La app abre esta dirección en el navegador.
  router.get('/start', (req, res) => {
    const { redirect_uri: redirectUri, state, code_challenge: codeChallenge, role, name } = req.query
    if (typeof redirectUri !== 'string' || !isAllowedRedirect(redirectUri)) {
      return errorPage(res, 400, 'La solicitud no es válida.')
    }

    const validState = typeof state === 'string' && CLIENT_STATE.test(state)
    const back = (params) => redirectToApp(res, redirectUri, { state: validState ? state : undefined, ...params })

    if (!validState || typeof codeChallenge !== 'string' || !CODE_CHALLENGE.test(codeChallenge)) {
      return back({ error: 'invalid_request' })
    }
    if (role !== undefined && !ROLES.includes(role)) return back({ error: 'invalid_request' })
    if (!google.isConfigured()) return back({ error: 'not_configured' })

    let secret
    try {
      secret = oauthSecret(env)
    } catch {
      return back({ error: 'not_configured' })
    }

    const cleanName = typeof name === 'string' ? name.trim().slice(0, MAX_NAME_LENGTH) : ''
    const nonce = crypto.randomBytes(16).toString('hex')
    const signedState = jwt.sign(
      { ru: redirectUri, st: state, cc: codeChallenge, role, name: cleanName || undefined, nonce },
      secret,
      { audience: STATE_AUDIENCE, expiresIn: '10m' },
    )
    res.redirect(302, google.buildAuthUrl({ state: signedState, nonce }))
  })

  // (2) Google devuelve a la persona aquí, con un código.
  router.get('/callback', async (req, res) => {
    let secret
    try {
      secret = oauthSecret(env)
    } catch {
      return errorPage(res, 503, 'El inicio de sesión no está disponible por ahora.')
    }

    let flow
    try {
      flow = jwt.verify(String(req.query.state ?? ''), secret, { audience: STATE_AUDIENCE })
    } catch {
      return errorPage(res, 400, 'La solicitud venció o no es válida.')
    }
    if (!isAllowedRedirect(flow.ru)) return errorPage(res, 400, 'La solicitud no es válida.')

    const back = (params) => redirectToApp(res, flow.ru, { state: flow.st, ...params })

    if (req.query.error) return back({ error: req.query.error === 'access_denied' ? 'cancelled' : 'google_error' })
    if (typeof req.query.code !== 'string' || !req.query.code) return back({ error: 'invalid_request' })

    let claims
    try {
      claims = await google.exchangeCode(req.query.code)
    } catch (error) {
      console.error('[google] no se pudo validar el código:', error.message)
      return back({ error: 'google_error' })
    }

    if (claims.nonce !== flow.nonce) return back({ error: 'invalid_state' })
    if (!claims.sub || !claims.email || claims.email_verified !== true) return back({ error: 'email_not_verified' })

    try {
      const user = await findOrCreateUser(prisma, claims, flow)
      if (!user) return back({ error: 'no_account' })

      const code = jwt.sign({ uid: user.id, cc: flow.cc }, secret, {
        audience: EXCHANGE_AUDIENCE,
        expiresIn: '2m',
        jwtid: crypto.randomUUID(),
      })
      return back({ code })
    } catch (error) {
      console.error('[google] no se pudo guardar la cuenta:', error.message)
      return back({ error: 'server_error' })
    }
  })

  // (4) La app cambia el código por el token de sesión, demostrando que es quien inició.
  router.post('/exchange', async (req, res) => {
    const { code, code_verifier: codeVerifier } = req.body || {}
    if (typeof code !== 'string' || typeof codeVerifier !== 'string' || !CODE_VERIFIER.test(codeVerifier)) {
      return res.status(400).json({ error: 'Solicitud inválida' })
    }

    let payload
    try {
      payload = jwt.verify(code, oauthSecret(env), { audience: EXCHANGE_AUDIENCE })
    } catch {
      return res.status(400).json({ error: 'El código venció o no es válido. Intenta de nuevo.' })
    }

    const expected = Buffer.from(payload.cc)
    const actual = Buffer.from(sha256Base64Url(codeVerifier))
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      return res.status(400).json({ error: 'El código venció o no es válido. Intenta de nuevo.' })
    }
    // Se marca como usado solo después de comprobar PKCE: quien intercepte el código sin
    // el verificador no puede "quemarlo" para dejar fuera a la persona real.
    if (!markUsed(payload.jti, payload.exp)) {
      return res.status(400).json({ error: 'El código venció o no es válido. Intenta de nuevo.' })
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: payload.uid } })
      if (!user) return res.status(401).json({ error: 'Usuario no encontrado' })
      res.json({ token: signToken(user), user: publicUser(user) })
    } catch (error) {
      console.error('[google] no se pudo crear la sesión:', error.message)
      res.status(500).json({ error: 'Error del servidor' })
    }
  })

  return router
}

// Entra quien ya tiene cuenta (por Google o por su correo) y se crea una cuenta nueva
// solo si la persona eligió un rol al registrarse. Devuelve null si no hay cuenta.
async function findOrCreateUser(prisma, claims, flow) {
  const email = claims.email.trim().toLowerCase()

  let user = await prisma.user.findUnique({ where: { googleSub: claims.sub } })
  if (user) return user

  // Mismo correo ya registrado: Google verificó que es de esta persona, se vincula.
  user = await prisma.user.findUnique({ where: { email } })
  if (user) {
    return prisma.user.update({
      where: { id: user.id },
      data: { googleSub: claims.sub, photoUrl: user.photoUrl ?? claims.picture ?? null },
    })
  }

  if (!flow.role) return null

  const name = (flow.name || claims.name || email.split('@')[0]).trim().slice(0, MAX_NAME_LENGTH)
  return prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      name,
      email,
      role: flow.role,
      googleSub: claims.sub,
      photoUrl: claims.picture ?? null,
    },
  })
}

module.exports = { createGoogleAuthRouter, createRedirectPolicy, ROLES }
