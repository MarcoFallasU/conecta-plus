import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSessionUser, type Role, type SessionUser } from './RoleContext'
import type {
  Account,
  Activity,
  Attendee,
  FamilyLink,
  FamilyLinkBase,
  PlaceResult,
  Recommendation,
  Review,
} from '../data/types'
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
import { API_ORIGIN, api, tokenStorage } from '../services/apiClient'

interface ActionResult {
  ok: boolean
  message: string
}

interface CreateResult extends ActionResult {
  activity?: Activity
}

// En modo API el lugar debe traer coordenadas (se eligen de la búsqueda); en demo basta el nombre.
interface NewActivityPlace {
  name: string
  address?: string
  lat?: number
  lng?: number
}

interface NewActivity {
  title: string
  description: string
  category: string
  startsAt: string
  place: NewActivityPlace
  capacity?: number
  // Imagen elegida: `image` (base64) viaja a la API; `imageUri` se usa solo en las cuentas demo.
  image?: string
  imageUri?: string
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

interface ActivitiesResponse {
  activities: Activity[]
  enrollments: Record<string, string[]>
}

// 'api' = sesión real con token; 'demo' = cuenta de demostración local.
type SessionSource = 'api' | 'demo' | null

interface AppDataValue {
  accounts: Account[]
  activities: Activity[]
  activitiesLoading: boolean
  activitiesError: string | null
  refreshActivities: () => Promise<void>
  enrollments: Record<string, string[]>
  attendeesCount: (activityId: string) => number
  links: FamilyLink[]
  linksLoading: boolean
  linksError: string | null
  refreshLinks: () => Promise<void>
  recommendations: Recommendation[]
  reviews: Review[]
  restoring: boolean
  usesApi: boolean
  login: (email: string, password: string) => Promise<ActionResult>
  loginAs: (accountId: string) => void
  register: (input: { name: string; email: string; password: string; role: Role }) => Promise<ActionResult>
  logout: () => Promise<void>
  enroll: (activityId: string, userId: string) => Promise<ActionResult>
  unenroll: (activityId: string, userId: string) => Promise<ActionResult>
  createActivity: (input: NewActivity) => Promise<CreateResult>
  toggleFeatured: (activityId: string) => Promise<ActionResult>
  searchPlaces: (query: string) => Promise<PlaceResult[]>
  loadAttendees: (activityId: string) => Promise<Attendee[]>
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

function errorMessage(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback
}

// Las imágenes que sube un organizador las sirve la API y llegan como ruta relativa ("/api/activities/…/image").
function normalizeActivity(activity: Activity): Activity {
  return activity.imageUrl.startsWith('/') ? { ...activity, imageUrl: `${API_ORIGIN}${activity.imageUrl}` } : activity
}

// Autenticación, vínculos y actividades: usan la API real (/auth/*, /links/*, /activities/*, /geocode).
// Las reseñas y recomendaciones siguen siendo un mock hasta que se migren a la API.
// Las cuentas de demostración conservan sus datos locales y no llaman al servidor.
export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, setUser } = useSessionUser()
  const [accounts, setAccounts] = useState(SEED_ACCOUNTS)
  const [recommendations, setRecommendations] = useState(SEED_RECOMMENDATIONS)
  const [reviews, setReviews] = useState(SEED_REVIEWS)
  const [restoring, setRestoring] = useState(true)

  const [source, setSource] = useState<SessionSource>(null)

  const [demoLinks, setDemoLinks] = useState<FamilyLinkBase[]>(SEED_LINKS)
  const [apiLinks, setApiLinks] = useState<FamilyLink[]>([])
  const [linksLoading, setLinksLoading] = useState(false)
  const [linksError, setLinksError] = useState<string | null>(null)

  const [demoActivities, setDemoActivities] = useState<Activity[]>(SEED_ACTIVITIES)
  const [demoEnrollments, setDemoEnrollments] = useState(SEED_ENROLLMENTS)
  const [apiActivities, setApiActivities] = useState<Activity[]>([])
  const [apiEnrollments, setApiEnrollments] = useState<Record<string, string[]>>({})
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [activitiesError, setActivitiesError] = useState<string | null>(null)

  const activities = source === 'api' ? apiActivities : demoActivities
  const enrollments = source === 'api' ? apiEnrollments : demoEnrollments

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

  async function fetchActivities(): Promise<ActivitiesResponse> {
    const data = await api.get<ActivitiesResponse>('/activities')
    return { activities: data.activities.map(normalizeActivity), enrollments: data.enrollments }
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
        if (!cancelled) setLinksError(errorMessage(e, 'No se pudieron cargar los vínculos.'))
      })
      .finally(() => {
        if (!cancelled) setLinksLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, user?.id])

  // Carga las actividades (y las inscripciones visibles para este usuario) al iniciar sesión con la API.
  useEffect(() => {
    if (source !== 'api') {
      setApiActivities([])
      setApiEnrollments({})
      setActivitiesError(null)
      setActivitiesLoading(false)
      return
    }
    let cancelled = false
    setActivitiesLoading(true)
    setActivitiesError(null)
    fetchActivities()
      .then((data) => {
        if (cancelled) return
        setApiActivities(data.activities)
        setApiEnrollments(data.enrollments)
      })
      .catch((e) => {
        if (!cancelled) setActivitiesError(errorMessage(e, 'No se pudieron cargar las actividades.'))
      })
      .finally(() => {
        if (!cancelled) setActivitiesLoading(false)
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
      setLinksError(errorMessage(e, 'No se pudieron cargar los vínculos.'))
    } finally {
      setLinksLoading(false)
    }
  }

  async function refreshActivities() {
    if (source !== 'api') return
    setActivitiesLoading(true)
    setActivitiesError(null)
    try {
      const data = await fetchActivities()
      setApiActivities(data.activities)
      setApiEnrollments(data.enrollments)
    } catch (e) {
      setActivitiesError(errorMessage(e, 'No se pudieron cargar las actividades.'))
    } finally {
      setActivitiesLoading(false)
    }
  }

  // Actualiza la lista sin mostrar "cargando"; se usa cuando una acción falla por datos desactualizados
  // (por ejemplo, otro usuario tomó el último cupo).
  function quietRefreshActivities() {
    fetchActivities()
      .then((data) => {
        setApiActivities(data.activities)
        setApiEnrollments(data.enrollments)
      })
      .catch(() => {})
  }

  async function login(email: string, password: string): Promise<ActionResult> {
    try {
      const { token, user: apiUser } = await api.post<AuthResponse>('/auth/login', { email, password })
      await tokenStorage.set(token)
      setUser(apiToSession(apiUser))
      setSource('api')
      return { ok: true, message: '' }
    } catch (e) {
      return { ok: false, message: errorMessage(e, 'No se pudo iniciar sesión.') }
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
      return { ok: false, message: errorMessage(e, 'No se pudo crear la cuenta.') }
    }
  }

  async function logout() {
    await tokenStorage.clear()
    setUser(null)
    setSource(null)
  }

  function attendeesCount(activityId: string) {
    if (source === 'api') return apiActivities.find((a) => a.id === activityId)?.attendeesCount ?? 0
    return demoEnrollments[activityId]?.length ?? 0
  }

  // En modo API, si userId es el propio usuario se inscribe él mismo; si es un familiar, el servidor
  // comprueba que el vínculo esté activo.
  async function enroll(activityId: string, userId: string): Promise<ActionResult> {
    if (source === 'api') {
      try {
        const body = userId === user?.id ? {} : { userId }
        const { activity } = await api.post<{ activity: Activity }>(
          `/activities/${encodeURIComponent(activityId)}/enrollments`,
          body,
        )
        const updated = normalizeActivity(activity)
        setApiActivities((prev) => prev.map((a) => (a.id === activityId ? updated : a)))
        setApiEnrollments((prev) => {
          const current = prev[activityId] ?? []
          return current.includes(userId) ? prev : { ...prev, [activityId]: [...current, userId] }
        })
        return { ok: true, message: '' }
      } catch (e) {
        quietRefreshActivities()
        return { ok: false, message: errorMessage(e, 'No se pudo completar la inscripción.') }
      }
    }
    setDemoEnrollments((prev) => {
      const current = prev[activityId] ?? []
      return current.includes(userId) ? prev : { ...prev, [activityId]: [...current, userId] }
    })
    return { ok: true, message: '' }
  }

  async function unenroll(activityId: string, userId: string): Promise<ActionResult> {
    if (source === 'api') {
      try {
        await api.delete<{ ok: boolean }>(
          `/activities/${encodeURIComponent(activityId)}/enrollments/${encodeURIComponent(userId)}`,
        )
        setApiEnrollments((prev) => ({ ...prev, [activityId]: (prev[activityId] ?? []).filter((id) => id !== userId) }))
        setApiActivities((prev) =>
          prev.map((a) =>
            a.id === activityId
              ? {
                  ...a,
                  attendeesCount: Math.max(0, (a.attendeesCount ?? 0) - 1),
                  status: a.status === 'llena' ? 'disponible' : a.status,
                }
              : a,
          ),
        )
        return { ok: true, message: '' }
      } catch (e) {
        quietRefreshActivities()
        return { ok: false, message: errorMessage(e, 'No se pudo cancelar la inscripción.') }
      }
    }
    setDemoEnrollments((prev) => ({ ...prev, [activityId]: (prev[activityId] ?? []).filter((id) => id !== userId) }))
    return { ok: true, message: '' }
  }

  async function createActivity(input: NewActivity): Promise<CreateResult> {
    if (source === 'api') {
      try {
        const { activity } = await api.post<{ activity: Activity }>('/activities', {
          title: input.title,
          description: input.description,
          category: input.category,
          startsAt: input.startsAt,
          place: input.place,
          capacity: input.capacity,
          image: input.image,
        })
        const created = normalizeActivity(activity)
        setApiActivities((prev) => [...prev, created].sort((a, b) => a.startsAt.localeCompare(b.startsAt)))
        return { ok: true, message: '', activity: created }
      } catch (e) {
        return { ok: false, message: errorMessage(e, 'No se pudo publicar el evento.') }
      }
    }
    const id = `a-${Date.now()}`
    const activity: Activity = {
      id,
      title: input.title,
      description: input.description,
      category: input.category,
      startsAt: input.startsAt,
      place: input.place.name,
      createdBy: input.createdBy,
      imageUrl: input.imageUri ?? `https://picsum.photos/seed/${id}/800/500`,
      featured: false,
    }
    setDemoActivities((prev) => [...prev, activity])
    setDemoEnrollments((prev) => ({ ...prev, [id]: [] }))
    return { ok: true, message: '', activity }
  }

  async function toggleFeatured(activityId: string): Promise<ActionResult> {
    if (source === 'api') {
      const current = apiActivities.find((a) => a.id === activityId)
      if (!current) return { ok: false, message: 'Actividad no encontrada.' }
      try {
        const { activity } = await api.post<{ activity: Activity }>(
          `/activities/${encodeURIComponent(activityId)}/featured`,
          { featured: !current.featured },
        )
        const updated = normalizeActivity(activity)
        setApiActivities((prev) => prev.map((a) => (a.id === activityId ? updated : a)))
        return { ok: true, message: '' }
      } catch (e) {
        return { ok: false, message: errorMessage(e, 'No se pudo cambiar el destacado.') }
      }
    }
    setDemoActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, featured: !a.featured } : a)))
    return { ok: true, message: '' }
  }

  // La búsqueda de lugares solo existe con sesión real; las cuentas demo escriben el lugar como texto.
  async function searchPlaces(query: string): Promise<PlaceResult[]> {
    if (source !== 'api') return []
    const { results } = await api.get<{ results: PlaceResult[] }>(`/geocode?q=${encodeURIComponent(query)}`)
    return results
  }

  async function loadAttendees(activityId: string): Promise<Attendee[]> {
    if (source === 'api') {
      const { attendees } = await api.get<{ attendees: Attendee[] }>(
        `/activities/${encodeURIComponent(activityId)}/attendees`,
      )
      return attendees
    }
    return (demoEnrollments[activityId] ?? []).flatMap((id) => {
      const account = accounts.find((a) => a.id === id)
      return account ? [{ id: account.id, name: account.name, role: account.role }] : []
    })
  }

  // En modo API el caregiverId se ignora: el servidor usa el usuario del token.
  async function requestLink(caregiverId: string, elderEmail: string): Promise<ActionResult> {
    if (source === 'api') {
      try {
        const { link, message } = await api.post<LinkResponse>('/links', { elderEmail })
        if (link) setApiLinks((prev) => [link, ...prev])
        return { ok: true, message: message ?? 'Solicitud enviada.' }
      } catch (e) {
        return { ok: false, message: errorMessage(e, 'No se pudo enviar la solicitud.') }
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
        return { ok: false, message: errorMessage(e, 'No se pudo responder la solicitud.') }
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
        return { ok: false, message: errorMessage(e, 'No se pudo eliminar el vínculo.') }
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
        activitiesLoading,
        activitiesError,
        refreshActivities,
        enrollments,
        attendeesCount,
        links,
        linksLoading,
        linksError,
        refreshLinks,
        recommendations,
        reviews,
        restoring,
        usesApi: source === 'api',
        login,
        loginAs,
        register,
        logout,
        enroll,
        unenroll,
        createActivity,
        toggleFeatured,
        searchPlaces,
        loadAttendees,
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