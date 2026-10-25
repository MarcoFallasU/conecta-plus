import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSessionUser, type Role, type SessionUser } from './RoleContext'
import type { Account, Activity, FamilyLink, FamilyLinkBase, Recommendation, Review } from '../data/types'
import {
  SEED_ACCOUNTS,
  SEED_ACTIVITIES,
  SEED_ENROLLMENTS,
  SEED_LINKS,
  SEED_RECOMMENDATIONS,
  SEED_REVIEWS,
} from '../data/seed'
import { can } from '../permissions/permissions'
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

interface LinkResponse {
  link: FamilyLink | null
  message?: string
}

// 'api' = sesión real con token; 'demo' = cuenta de demostración local.
type SessionSource = 'api' | 'demo' | null

interface AppDataValue {
  accounts: Account[]
  activities: Activity[]
  enrollments: Record<string, string[]>
  links: FamilyLink[]
  linksLoading: boolean
  linksError: string | null
  refreshLinks: () => Promise<void>
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
  requestLink: (caregiverId: string, elderEmail: string) => Promise<ActionResult>
  respondLink: (linkId: string, accept: boolean) => Promise<ActionResult>
  removeLink: (linkId: string) => Promise<ActionResult>
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

// Autenticación y vínculos: usan la API real (/auth/*, /links/*).
// El resto de los datos (actividades, reseñas) sigue siendo un mock
// hasta que cada módulo se migre a la API, que debe revalidar cada acción.
// Las cuentas de demostración conservan sus datos locales y no llaman al servidor.
export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, setUser } = useSessionUser()
  const [accounts, setAccounts] = useState(SEED_ACCOUNTS)
  const [activities, setActivities] = useState(SEED_ACTIVITIES)
  const [enrollments, setEnrollments] = useState(SEED_ENROLLMENTS)
  const [recommendations, setRecommendations] = useState(SEED_RECOMMENDATIONS)
  const [reviews, setReviews] = useState(SEED_REVIEWS)
  const [restoring, setRestoring] = useState(true)

  const [source, setSource] = useState<SessionSource>(null)
  const [demoLinks, setDemoLinks] = useState<FamilyLinkBase[]>(SEED_LINKS)
  const [apiLinks, setApiLinks] = useState<FamilyLink[]>([])
  const [linksLoading, setLinksLoading] = useState(false)
  const [linksError, setLinksError] = useState<string | null>(null)

  // Demo: se completan los nombres desde las cuentas. API: ya vienen del servidor.
  const links = useMemo<FamilyLink[]>(() => {
    if (source === 'api') return apiLinks
    const nameOf = (id: string) => accounts.find((a) => a.id === id)?.name ?? ''
    return demoLinks.map((l) => ({ ...l, caregiverName: nameOf(l.caregiverId), elderName: nameOf(l.elderId) }))
  }, [source, apiLinks, demoLinks, accounts])

  async function fetchLinks(): Promise<FamilyLink[]> {
    const { links: fetched } = await api.get<{ links: FamilyLink[] }>('/links')
    return fetched
  }

  // Al abrir la app, si hay un token guardado se recupera la sesión.
  useEffect(() => {
    let cancelled = false
    async function restore() {
      try {
        const token = await tokenStorage.get()
        if (!token) return
        const { user: apiUser } = await api.get<{ user: ApiUser }>('/auth/me')
        if (!cancelled) {
          setUser(apiToSession(apiUser))
          setSource('api')
        }
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

  // Carga los vínculos al iniciar sesión con la API. Las cuentas demo no llaman al servidor.
  useEffect(() => {
    if (source !== 'api' || !can(user, 'view_family')) {
      setApiLinks([])
      setLinksError(null)
      setLinksLoading(false)
      return
    }
    let cancelled = false
    setLinksLoading(true)
    setLinksError(null)
    fetchLinks()
      .then((fetched) => {
        if (!cancelled) setApiLinks(fetched)
      })
      .catch((e) => {
        if (!cancelled) setLinksError(e instanceof Error ? e.message : 'No se pudieron cargar los vínculos.')
      })
      .finally(() => {
        if (!cancelled) setLinksLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, user?.id])

  async function refreshLinks() {
    if (source !== 'api') return
    setLinksLoading(true)
    setLinksError(null)
    try {
      setApiLinks(await fetchLinks())
    } catch (e) {
      setLinksError(e instanceof Error ? e.message : 'No se pudieron cargar los vínculos.')
    } finally {
      setLinksLoading(false)
    }
  }

  async function login(email: string, password: string): Promise<ActionResult> {
    try {
      const { token, user: apiUser } = await api.post<AuthResponse>('/auth/login', { email, password })
      await tokenStorage.set(token)
      setUser(apiToSession(apiUser))
      setSource('api')
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
    setSource('demo')
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
      setSource('api')
      return { ok: true, message: '' }
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : 'No se pudo crear la cuenta.' }
    }
  }

  async function logout() {
    await tokenStorage.clear()
    setUser(null)
    setSource(null)
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

  // En modo API el caregiverId se ignora: el servidor usa el usuario del token.
  async function requestLink(caregiverId: string, elderEmail: string): Promise<ActionResult> {
    if (source === 'api') {
      try {
        const { link, message } = await api.post<LinkResponse>('/links', { elderEmail })
        if (link) setApiLinks((prev) => [link, ...prev])
        return { ok: true, message: message ?? 'Solicitud enviada.' }
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : 'No se pudo enviar la solicitud.' }
      }
    }
    const elder = accounts.find((a) => a.role === 'adulto_mayor' && sameEmail(a.email, elderEmail))
    if (!elder) return { ok: false, message: 'No encontramos a un adulto mayor con ese correo.' }
    if (demoLinks.some((l) => l.caregiverId === caregiverId && l.elderId === elder.id)) {
      return { ok: false, message: `Ya tienes un vínculo o solicitud con ${elder.name}.` }
    }
    setDemoLinks((prev) => [...prev, { id: `l-${Date.now()}`, caregiverId, elderId: elder.id, status: 'pending' }])
    return { ok: true, message: `Solicitud enviada a ${elder.name}. Debe aceptarla para vincularse.` }
  }

  async function respondLink(linkId: string, accept: boolean): Promise<ActionResult> {
    if (source === 'api') {
      try {
        const { link } = await api.post<LinkResponse>(`/links/${encodeURIComponent(linkId)}/respond`, { accept })
        setApiLinks((prev) =>
          link ? prev.map((l) => (l.id === linkId ? link : l)) : prev.filter((l) => l.id !== linkId),
        )
        return { ok: true, message: '' }
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : 'No se pudo responder la solicitud.' }
      }
    }
    setDemoLinks((prev) =>
      accept
        ? prev.map((l) => (l.id === linkId ? { ...l, status: 'active' } : l))
        : prev.filter((l) => l.id !== linkId),
    )
    return { ok: true, message: '' }
  }

  async function removeLink(linkId: string): Promise<ActionResult> {
    if (source === 'api') {
      try {
        await api.delete<{ ok: boolean }>(`/links/${encodeURIComponent(linkId)}`)
        setApiLinks((prev) => prev.filter((l) => l.id !== linkId))
        return { ok: true, message: '' }
      } catch (e) {
        return { ok: false, message: e instanceof Error ? e.message : 'No se pudo eliminar el vínculo.' }
      }
    }
    setDemoLinks((prev) => prev.filter((l) => l.id !== linkId))
    return { ok: true, message: '' }
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
        linksLoading,
        linksError,
        refreshLinks,
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