import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

// Incluye el prefijo /api, por ejemplo: http://localhost:4000/api
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api'
const TOKEN_KEY = 'auth_token'

// En web se usa localStorage; en celular, almacenamiento seguro del sistema.
export const tokenStorage = {
  async get(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') return localStorage.getItem(TOKEN_KEY)
      return await SecureStore.getItemAsync(TOKEN_KEY)
    } catch {
      return null
    }
  },
  async set(token: string): Promise<void> {
    if (Platform.OS === 'web') localStorage.setItem(TOKEN_KEY, token)
    else await SecureStore.setItemAsync(TOKEN_KEY, token)
  },
  async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') localStorage.removeItem(TOKEN_KEY)
      else await SecureStore.deleteItemAsync(TOKEN_KEY)
    } catch {
      // no hay nada que limpiar
    }
  },
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await tokenStorage.get()

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión.')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? 'Ocurrió un error. Intenta de nuevo.')
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
}