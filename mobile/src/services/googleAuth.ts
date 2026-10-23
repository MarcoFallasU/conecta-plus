import * as Crypto from 'expo-crypto'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import type { Role } from '../context/RoleContext'
import { API_BASE_URL, api } from './apiClient'

// En web, Google se abre en una ventana emergente que regresa a la app: esta llamada,
// ejecutada al cargar, la cierra y le devuelve el resultado a la ventana original.
WebBrowser.maybeCompleteAuthSession()

export interface GoogleSessionUser {
  id: string
  name: string
  email: string
  role: Role
  reputationScore: number
}

export type GoogleSignInError = 'cancelled' | 'no_account' | 'not_configured' | 'email_not_verified' | 'failed'

export type GoogleSignInResult =
  | { ok: true; token: string; user: GoogleSessionUser }
  | { ok: false; error: GoogleSignInError; message: string }

const MESSAGES: Record<GoogleSignInError, string> = {
  cancelled: 'Cancelaste el inicio de sesión. Puedes intentarlo de nuevo cuando quieras.',
  no_account: 'Esa cuenta de Google todavía no está registrada. Crea tu cuenta primero.',
  not_configured: 'El inicio de sesión con Google aún no está disponible. Avisa a quien administra la aplicación.',
  email_not_verified: 'Tu cuenta de Google no tiene el correo verificado.',
  failed: 'No pudimos iniciar sesión con Google. Intenta de nuevo.',
}

const KNOWN_ERRORS: GoogleSignInError[] = ['cancelled', 'no_account', 'not_configured', 'email_not_verified']

function fail(error: GoogleSignInError, message = MESSAGES[error]): GoogleSignInResult {
  return { ok: false, error, message }
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function toBase64Url(base64: string) {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

interface SignInOptions {
  // Solo al crear la cuenta: el rol elegido. Sin rol, solo entra quien ya tiene cuenta.
  role?: Role
  // Solo organizaciones: nombre con el que se registran (en vez del de su cuenta de Google).
  name?: string
}

// Inicia sesión con Google. La API habla con Google y devuelve a la app un código de un
// solo uso; la app lo cambia por la sesión demostrando (PKCE) que fue ella quien empezó.
export async function signInWithGoogle({ role, name }: SignInOptions = {}): Promise<GoogleSignInResult> {
  const returnUrl = Linking.createURL('auth/google')
  const verifier = toHex(await Crypto.getRandomBytesAsync(32))
  const state = toHex(await Crypto.getRandomBytesAsync(16))
  const challenge = toBase64Url(
    await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, { encoding: Crypto.CryptoEncoding.BASE64 }),
  )

  const query: Record<string, string> = { redirect_uri: returnUrl, state, code_challenge: challenge }
  if (role) query.role = role
  if (name?.trim()) query.name = name.trim()
  const queryString = Object.entries(query)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&')

  let result: WebBrowser.WebBrowserAuthSessionResult
  try {
    result = await WebBrowser.openAuthSessionAsync(`${API_BASE_URL}/auth/google/start?${queryString}`, returnUrl)
  } catch {
    return fail('failed')
  }
  if (result.type !== 'success') return fail('cancelled')

  const params = Linking.parse(result.url).queryParams ?? {}
  // El estado lo generó esta app: si no coincide, el regreso no corresponde a este intento.
  if (firstParam(params.state) !== state) return fail('failed')

  const error = firstParam(params.error)
  if (error) return fail(KNOWN_ERRORS.includes(error as GoogleSignInError) ? (error as GoogleSignInError) : 'failed')

  const code = firstParam(params.code)
  if (!code) return fail('failed')

  try {
    const { token, user } = await api.post<{ token: string; user: GoogleSessionUser }>('/auth/google/exchange', {
      code,
      code_verifier: verifier,
    })
    return { ok: true, token, user }
  } catch (e) {
    return fail('failed', e instanceof Error ? e.message : MESSAGES.failed)
  }
}
