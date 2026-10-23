const { OAuth2Client } = require('google-auth-library')

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

// Integración real con Google (OAuth 2.0 + OpenID Connect, flujo de código).
// El secreto del cliente vive solo aquí, en el servidor: la app móvil nunca lo ve.
// El router recibe este objeto por parámetro, así las pruebas lo reemplazan sin red.
function createGoogle(env = process.env) {
  const clientId = env.GOOGLE_CLIENT_ID
  const clientSecret = env.GOOGLE_CLIENT_SECRET
  const redirectUri = env.GOOGLE_REDIRECT_URI
  const idTokenVerifier = new OAuth2Client(clientId)

  return {
    isConfigured() {
      return Boolean(clientId && clientSecret && redirectUri)
    },

    buildAuthUrl({ state, nonce }) {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        nonce,
        prompt: 'select_account',
      })
      return `${AUTH_ENDPOINT}?${params}`
    },

    // Cambia el código por la identidad de la persona y devuelve sus datos ya verificados
    // (firma, emisor, audiencia y vencimiento los comprueba google-auth-library).
    async exchangeCode(code) {
      const res = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.id_token) {
        throw new Error(`Google respondió ${res.status}: ${data.error_description || data.error || 'sin id_token'}`)
      }
      const ticket = await idTokenVerifier.verifyIdToken({ idToken: data.id_token, audience: clientId })
      return ticket.getPayload()
    },
  }
}

module.exports = { createGoogle }
