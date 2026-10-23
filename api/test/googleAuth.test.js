// Pruebas del inicio de sesión con Google. Google y la base de datos se simulan:
// aquí se valida la lógica propia (estado, PKCE, un solo uso, cuentas), sin red.
// Ejecutar: npm test
const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const express = require('express')
const jwt = require('jsonwebtoken')
const { createGoogleAuthRouter, createRedirectPolicy } = require('../src/routes/googleAuth')

const JWT_SECRET = 'secreto-de-prueba-con-mas-de-treinta-y-dos-caracteres'
process.env.JWT_SECRET = JWT_SECRET // signToken lo lee de aquí
const ENV = { JWT_SECRET, NODE_ENV: 'test' }
const RETURN_URL = 'exp://192.168.1.5:8081/--/auth/google'

function fakePrisma(initial = []) {
  const users = [...initial]
  return {
    users,
    user: {
      findUnique: async ({ where }) => users.find((u) => Object.entries(where).every(([k, v]) => u[k] === v)) ?? null,
      create: async ({ data }) => {
        const user = { photoUrl: null, passwordHash: '', reputationScore: 0, googleSub: null, ...data }
        users.push(user)
        return user
      },
      update: async ({ where, data }) => {
        const user = users.find((u) => u.id === where.id)
        Object.assign(user, data)
        return user
      },
    },
  }
}

function fakeGoogle({ configured = true, claims = {} } = {}) {
  const sent = []
  return {
    sent,
    isConfigured: () => configured,
    buildAuthUrl: ({ state, nonce }) => {
      sent.push({ state, nonce })
      return `https://accounts.example/auth?nonce=${nonce}`
    },
    // Google devuelve el nonce que recibió; claims.nonce permite simular uno equivocado.
    exchangeCode: async (code) => {
      if (code === 'codigo-malo') throw new Error('Google rechazó el código')
      return {
        sub: 'google-sub-1',
        email: 'Marta@Correo.com',
        email_verified: true,
        name: 'Marta Jiménez',
        picture: 'https://fotos.example/marta.png',
        nonce: sent.at(-1)?.nonce,
        ...claims,
      }
    },
  }
}

async function startApi({ prisma = fakePrisma(), google = fakeGoogle(), env = ENV } = {}) {
  const app = express()
  app.use(express.json())
  app.use('/api/auth/google', createGoogleAuthRouter({ prisma, google, env }))
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s))
  })
  return {
    prisma,
    google,
    base: `http://127.0.0.1:${server.address().port}/api/auth/google`,
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}

// Lo que genera la app: verificador secreto, su huella (PKCE) y un estado propio.
function clientSecrets() {
  const verifier = crypto.randomBytes(32).toString('hex')
  return {
    verifier,
    challenge: crypto.createHash('sha256').update(verifier).digest('base64url'),
    state: crypto.randomBytes(16).toString('hex'),
  }
}

const noFollow = { redirect: 'manual' }

async function start(api, secrets, extra = {}) {
  const params = new URLSearchParams({
    redirect_uri: RETURN_URL,
    state: secrets.state,
    code_challenge: secrets.challenge,
    ...extra,
  })
  return fetch(`${api.base}/start?${params}`, noFollow)
}

function backParams(res) {
  assert.equal(res.status, 302)
  return new URL(res.headers.get('location')).searchParams
}

// Recorre /start y /callback; devuelve lo que la app recibiría al volver.
async function signIn(api, secrets, extra = {}) {
  const started = await start(api, secrets, extra)
  assert.equal(started.status, 302)
  const { state } = api.google.sent.at(-1)
  const callback = await fetch(`${api.base}/callback?code=abc&state=${encodeURIComponent(state)}`, noFollow)
  return backParams(callback)
}

function exchange(api, code, verifier) {
  return fetch(`${api.base}/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: verifier }),
  })
}

test('/start envía a Google con el estado firmado y el nonce', async (t) => {
  const api = await startApi()
  t.after(api.close)
  const secrets = clientSecrets()

  const res = await start(api, secrets, { role: 'adulto_mayor' })
  assert.equal(res.status, 302)
  assert.match(res.headers.get('location'), /^https:\/\/accounts\.example\/auth/)

  const { state, nonce } = api.google.sent[0]
  const flow = jwt.decode(state)
  assert.equal(flow.ru, RETURN_URL)
  assert.equal(flow.st, secrets.state)
  assert.equal(flow.cc, secrets.challenge)
  assert.equal(flow.role, 'adulto_mayor')
  assert.equal(flow.nonce, nonce)
})

test('/start rechaza un destino de regreso que no está permitido', async (t) => {
  const api = await startApi()
  t.after(api.close)
  const params = new URLSearchParams({ redirect_uri: 'https://sitio-ajeno.com/robar', state: 'a'.repeat(32), code_challenge: 'b'.repeat(43) })
  const res = await fetch(`${api.base}/start?${params}`, noFollow)
  assert.equal(res.status, 400)
  assert.equal(api.google.sent.length, 0)
})

test('/start devuelve a la app el error cuando faltan datos, el rol es inválido o Google no está configurado', async (t) => {
  const api = await startApi()
  t.after(api.close)
  const secrets = clientSecrets()

  assert.equal(backParams(await start(api, { ...secrets, challenge: 'corto' })).get('error'), 'invalid_request')
  assert.equal(backParams(await start(api, secrets, { role: 'admin' })).get('error'), 'invalid_request')

  const sinConfigurar = await startApi({ google: fakeGoogle({ configured: false }) })
  t.after(sinConfigurar.close)
  const params = backParams(await start(sinConfigurar, secrets))
  assert.equal(params.get('error'), 'not_configured')
  assert.equal(params.get('state'), secrets.state)
})

test('flujo completo: una persona nueva se registra con el rol elegido y recibe su sesión', async (t) => {
  const api = await startApi()
  t.after(api.close)
  const secrets = clientSecrets()

  const params = await signIn(api, secrets, { role: 'cuidador' })
  assert.equal(params.get('state'), secrets.state)
  const code = params.get('code')
  assert.ok(code)

  const res = await exchange(api, code, secrets.verifier)
  assert.equal(res.status, 200)
  const body = await res.json()

  assert.equal(api.prisma.users.length, 1)
  const [user] = api.prisma.users
  assert.equal(user.email, 'marta@correo.com')
  assert.equal(user.role, 'cuidador')
  assert.equal(user.googleSub, 'google-sub-1')
  assert.equal(user.name, 'Marta Jiménez')
  assert.equal(jwt.verify(body.token, JWT_SECRET).sub, user.id)
  assert.equal(body.user.email, 'marta@correo.com')
  assert.equal('googleSub' in body.user, false)
  assert.equal('passwordHash' in body.user, false)
})

test('la organización se registra con el nombre que escribió, no con el de Google', async (t) => {
  const api = await startApi()
  t.after(api.close)
  const secrets = clientSecrets()
  await signIn(api, secrets, { role: 'empresa', name: 'Centro Comunitario Los Robles' })
  assert.equal(api.prisma.users[0].name, 'Centro Comunitario Los Robles')
})

test('sin cuenta y sin rol no se crea nada y se avisa a la app', async (t) => {
  const api = await startApi()
  t.after(api.close)
  const params = await signIn(api, clientSecrets())
  assert.equal(params.get('error'), 'no_account')
  assert.equal(params.get('code'), null)
  assert.equal(api.prisma.users.length, 0)
})

test('quien ya tiene cuenta entra aunque venga con otro rol (el rol no se cambia)', async (t) => {
  const prisma = fakePrisma([{ id: 'u-1', name: 'Marta', email: 'marta@correo.com', role: 'adulto_mayor', googleSub: 'google-sub-1' }])
  const api = await startApi({ prisma })
  t.after(api.close)
  const secrets = clientSecrets()

  const params = await signIn(api, secrets, { role: 'empresa' })
  const body = await (await exchange(api, params.get('code'), secrets.verifier)).json()
  assert.equal(body.user.id, 'u-1')
  assert.equal(body.user.role, 'adulto_mayor')
  assert.equal(prisma.users.length, 1)
})

test('una cuenta existente con el mismo correo se vincula a Google', async (t) => {
  const prisma = fakePrisma([{ id: 'u-1', name: 'Marta', email: 'marta@correo.com', role: 'adulto_mayor', googleSub: null }])
  const api = await startApi({ prisma })
  t.after(api.close)
  const secrets = clientSecrets()

  const params = await signIn(api, secrets)
  assert.ok(params.get('code'))
  assert.equal(prisma.users[0].googleSub, 'google-sub-1')
  assert.equal(prisma.users[0].photoUrl, 'https://fotos.example/marta.png')
})

test('/callback rechaza correos sin verificar, nonce distinto y errores de Google', async (t) => {
  const secrets = clientSecrets()

  const sinVerificar = await startApi({ google: fakeGoogle({ claims: { email_verified: false } }) })
  t.after(sinVerificar.close)
  assert.equal((await signIn(sinVerificar, secrets, { role: 'adulto_mayor' })).get('error'), 'email_not_verified')
  assert.equal(sinVerificar.prisma.users.length, 0)

  const otroNonce = await startApi({ google: fakeGoogle({ claims: { nonce: 'otro' } }) })
  t.after(otroNonce.close)
  assert.equal((await signIn(otroNonce, secrets, { role: 'adulto_mayor' })).get('error'), 'invalid_state')

  const api = await startApi()
  t.after(api.close)
  await start(api, secrets)
  const { state } = api.google.sent[0]
  const fallo = await fetch(`${api.base}/callback?code=codigo-malo&state=${encodeURIComponent(state)}`, noFollow)
  assert.equal(backParams(fallo).get('error'), 'google_error')

  const cancelado = await fetch(`${api.base}/callback?error=access_denied&state=${encodeURIComponent(state)}`, noFollow)
  const params = backParams(cancelado)
  assert.equal(params.get('error'), 'cancelled')
  assert.equal(params.get('state'), secrets.state)
})

test('/callback no confía en un estado falso ni vencido', async (t) => {
  const api = await startApi()
  t.after(api.close)

  const falso = await fetch(`${api.base}/callback?code=abc&state=cualquier-cosa`, noFollow)
  assert.equal(falso.status, 400)

  const secrets = clientSecrets()
  const key = crypto.createHmac('sha256', JWT_SECRET).update('conecta:google-oauth').digest()
  const vencido = jwt.sign({ ru: RETURN_URL, st: secrets.state, cc: secrets.challenge, nonce: 'n' }, key, {
    audience: 'google-state',
    expiresIn: -10,
  })
  assert.equal((await fetch(`${api.base}/callback?code=abc&state=${vencido}`, noFollow)).status, 400)

  // Un token de sesión de la app tampoco sirve como estado.
  const sesion = jwt.sign({ sub: 'u-1' }, JWT_SECRET)
  assert.equal((await fetch(`${api.base}/callback?code=abc&state=${sesion}`, noFollow)).status, 400)
})

test('/exchange exige el verificador correcto y el código solo sirve una vez', async (t) => {
  const api = await startApi()
  t.after(api.close)
  const secrets = clientSecrets()
  const code = (await signIn(api, secrets, { role: 'adulto_mayor' })).get('code')

  const ajeno = clientSecrets()
  assert.equal((await exchange(api, code, ajeno.verifier)).status, 400)
  assert.equal((await exchange(api, code, 'x'.repeat(10))).status, 400)

  // Los intentos fallidos no gastan el código de la persona real.
  assert.equal((await exchange(api, code, secrets.verifier)).status, 200)
  assert.equal((await exchange(api, code, secrets.verifier)).status, 400)
})

test('/exchange rechaza códigos vencidos o que no son de este flujo', async (t) => {
  const api = await startApi()
  t.after(api.close)
  const secrets = clientSecrets()
  const key = crypto.createHmac('sha256', JWT_SECRET).update('conecta:google-oauth').digest()

  const vencido = jwt.sign({ uid: 'u-1', cc: secrets.challenge }, key, { audience: 'google-exchange', expiresIn: -10, jwtid: 'j1' })
  assert.equal((await exchange(api, vencido, secrets.verifier)).status, 400)

  const sesion = jwt.sign({ sub: 'u-1', cc: secrets.challenge }, JWT_SECRET, { jwtid: 'j2' })
  assert.equal((await exchange(api, sesion, secrets.verifier)).status, 400)
})

test('destinos de regreso permitidos', () => {
  const dev = createRedirectPolicy({ NODE_ENV: 'development' })
  assert.ok(dev('conectaplus://auth/google'))
  assert.ok(dev('exp://192.168.1.5:8081/--/auth/google'))
  assert.ok(dev('http://localhost:8081/auth/google'))
  assert.ok(dev('http://127.0.0.1:19006/auth/google'))
  assert.ok(!dev('http://localhost.evil.com/auth'))
  assert.ok(!dev('https://sitio-ajeno.com/auth'))
  assert.ok(!dev('javascript:alert(1)'))
  assert.ok(!dev('conectaplus://auth/google#token'))
  assert.ok(!dev('no es una url'))

  const prod = createRedirectPolicy({ NODE_ENV: 'production' })
  assert.ok(prod('conectaplus://auth/google'))
  assert.ok(!prod('exp://192.168.1.5:8081/--/auth/google'))
  assert.ok(!prod('http://localhost:8081/auth/google'))

  const web = createRedirectPolicy({ NODE_ENV: 'production', APP_REDIRECT_ALLOWLIST: 'https://app.conecta.cr, otraapp://' })
  assert.ok(web('https://app.conecta.cr/auth/google'))
  assert.ok(!web('https://app.conecta.cr.evil.com/auth/google'))
  assert.ok(web('otraapp://auth'))
})
