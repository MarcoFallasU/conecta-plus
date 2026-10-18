import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useSessionUser, type Role, type SessionUser } from './RoleContext'
import type { Account, Activity, FamilyLink, Recommendation, Review } from '../data/types'
import {
  SEED_ACCOUNTS,
  SEED_ACTIVITIES,
  SEED_ENROLLMENTS,
  SEED_LINKS,
  SEED_RECOMMENDATIONS,
  SEED_REVIEWS,
} from '../data/seed'
import { REVIEW_POINTS } from '../permissions/reputation'
import { api, tokenStorage } from '../services/apiClient'

interface ActionResult {
  ok: boolean
  message: string
}

interface NewActivity {
  title: string
  description: string
  category: string
  startsAt: string
  place: string
  createdBy: string
}

interface ApiUser {
  id: string
  name: string
  email: string
  role: Role
  reputationScore: number
}

interface AuthResponse {
  token: string
  user: ApiUser
}

interface AppDataValue {
  accounts: Account[]
  activities: Activity[]
  enrollments: Record<string, string[]>
  links: FamilyLink[]
  recommendations: Recommendation[]
  reviews: Review[]
  restoring: boolean
  login: (email: string, password: string) => Promise<ActionResult>
  loginAs: (accountId: string) => void
  register: (input: { name: string; email: string; password: string; role: Role }) => Promise<ActionResult>
  logout: () => Promise<void>
  enroll: (activityId: string, userId: string) => void
  unenroll: (activityId: string, userId: string) => void
  createActivity: (input: NewActivity) => Activity
  toggleFeatured: (activityId: string) => void
  requestLink: (caregiverId: string, elderEmail: string) => ActionResult
  respondLink: (linkId: string, accept: boolean) => void
  removeLink: (linkId: string) => void
  recommend: (activityId: string, fromUserId: string, toUserId: string) => void
  addReview: (input: { activityId: string; userId: string; rating: number; comment: string }) => void
}

const AppDataContext = createContext<AppDataValue | undefined>(undefined)

function toSession(account: Account): SessionUser {
  return { id: account.id, name: account.name, email: account.email, role: account.role, reputationScore: account.reputationScore }
}

function apiToSession(u: ApiUser): SessionUser {
  return { id: u.id, name: u.name, email: u.email, role: u.role, reputationScore: u.reputationScore }
}

function sameEmail(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

// Autenticación: usa la API real (/auth/login, /auth/register, /auth/me).
// El resto de los datos (actividades, vínculos, reseñas) sigue siendo un mock
// hasta que cada módulo se migre a la API, que debe revalidar cada acción.
export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, setUser } = useSessionUser()
  const [accounts, setAccounts] = useState(SEED_ACCOUNTS)
  const [activities, setActivities] = useState(SEED_ACTIVITIES)
  const [enrollments, setEnrollments] = useState(SEED_ENROLLMENTS)
  const [links, setLinks] = useState(SEED_LINKS)
  const [recommendations, setRecommendations] = useState(SEED_RECOMMENDATIONS)
  const [reviews, setReviews] = useState(SEED_REVIEWS)
  const [restoring, setRestoring] = useState(true)

  // Al abrir la app, si hay un token guardado se recupera la sesión.
  useEffect(() => {
    let cancelled = false
    async function restore() {
      try {
        const token = await tokenStorage.get()
        if (!token) return
        const { user: apiUser } = await api.get<{ user: ApiUser }>('/auth/me')
        if (!cancelled) setUser(apiToSession(apiUser))
      } catch {
        await tokenStorage.clear()
      } finally {
        if (!cancelled) setRestoring(false)
      }
    }
    restore()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function login(email: string, password: string): Promise<ActionResult> {
    try {
      const { token, user: apiUser } = await api.post<AuthResponse>('/auth/login', { email, password })
      await tokenStorage.set(token)
      setUser(apiToSession(apiUser))
      return { ok: true, message: '' }
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'No se pudo iniciar sesión.' }
    }
  }

  function loginAs(accountId: string) {
    const account = accounts.find((a) => a.id === accountId)
    if (!account) return
    tokenStorage.clear() // las cuentas de demostración no usan token
    setUser(toSession(account))
  }

  async function register(input: {
    name: string
    email: string
    password: string
    role: Role
  }): Promise<ActionResult> {
    try {
      const { token, user: apiUser } = await api.post<AuthResponse>('/auth/register', input)
      await tokenStorage.set(token)
      setUser(apiToSession(apiUser))
      return { ok: true, message: '' }
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'No se pudo crear la cuenta.' }
    }
  }

  async function logout() {
    await tokenStorage.clear()
    setUser(null)
  }

  function enroll(activityId: string, userId: string) {
    setEnrollments((prev) => {
      const current = prev[activityId] ?? []
      return current.includes(userId) ? prev : { ...prev, [activityId]: [...current, userId] }
    })
  }

  function unenroll(activityId: string, userId: string) {
    setEnrollments((prev) => ({ ...prev, [activityId]: (prev[activityId] ?? []).filter((id) => id !== userId) }))
  }

  function createActivity(input: NewActivity) {
    const id = `a-${Date.now()}`
    const activity: Activity = { ...input, id, imageUrl: `https://picsum.photos/seed/${id}/800/500`, featured: false }
    setActivities((prev) => [...prev, activity])
    setEnrollments((prev) => ({ ...prev, [id]: [] }))
    return activity
  }

  function toggleFeatured(activityId: string) {
    setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, featured: !a.featured } : a)))
  }

  function requestLink(caregiverId: string, elderEmail: string): ActionResult {
    const elder = accounts.find((a) => a.role === 'adulto_mayor' && sameEmail(a.email, elderEmail))
    if (!elder) return { ok: false, message: 'No encontramos a un adulto mayor con ese correo.' }
    if (links.some((l) => l.caregiverId === caregiverId && l.elderId === elder.id)) {
      return { ok: false, message: `Ya tienes un vínculo o solicitud con ${elder.name}.` }
    }
    setLinks((prev) => [...prev, { id: `l-${Date.now()}`, caregiverId, elderId: elder.id, status: 'pending' }])
    return { ok: true, message: `Solicitud enviada a ${elder.name}. Debe aceptarla para vincularse.` }
  }

  function respondLink(linkId: string, accept: boolean) {
    setLinks((prev) =>
      accept
        ? prev.map((l) => (l.id === linkId ? { ...l, status: 'active' } : l))
        : prev.filter((l) => l.id !== linkId),
    )
  }

  function removeLink(linkId: string) {
    setLinks((prev) => prev.filter((l) => l.id !== linkId))
  }

  function recommend(activityId: string, fromUserId: string, toUserId: string) {
    setRecommendations((prev) =>
      prev.some((r) => r.activityId === activityId && r.fromUserId === fromUserId && r.toUserId === toUserId)
        ? prev
        : [...prev, { id: `r-${Date.now()}`, activityId, fromUserId, toUserId }],
    )
  }

  function addReview(input: { activityId: string; userId: string; rating: number; comment: string }) {
    setReviews((prev) => [{ id: `rv-${Date.now()}`, ...input, createdAt: new Date().toISOString() }, ...prev])
    setAccounts((prev) =>
      prev.map((a) => (a.id === input.userId ? { ...a, reputationScore: a.reputationScore + REVIEW_POINTS } : a)),
    )
    if (user?.id === input.userId) setUser({ ...user, reputationScore: user.reputationScore + REVIEW_POINTS })
  }

  return (
    <AppDataContext.Provider
      value={{
        accounts,
        activities,
        enrollments,
        links,
        recommendations,
        reviews,
        restoring,
        login,
        loginAs,
        register,
        logout,
        enroll,
        unenroll,
        createActivity,
        toggleFeatured,
        requestLink,
        respondLink,
        removeLink,
        recommend,
        addReview,
      }}
    >
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const context = useContext(AppDataContext)
  if (!context) throw new Error('useAppData debe usarse dentro de un AppDataProvider')
  return context
}