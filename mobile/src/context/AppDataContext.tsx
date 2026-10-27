import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSessionUser, type Role, type SessionUser } from './RoleContext'
import {
  attendanceKey,
  type Account,
  type Activity,
  type AttendanceStatus,
  type Attendee,
  type FamilyLink,
  type FamilyLinkBase,
  type PlaceResult,
  type Recommendation,
  type Review,
  type UserProfile,
} from '../data/types'
import {
  SEED_ACCOUNTS,
  SEED_ACTIVITIES,
  SEED_ATTENDANCE,
  SEED_ENROLLMENTS,
  SEED_LINKS,
  SEED_RECOMMENDATIONS,
  SEED_REVIEWS,
} from '../data/seed'
import { getZone } from '../data/zones'
import { can } from '../permissions/permissions'
import { REVIEW_POINTS } from '../permissions/reputation'
import { API_ORIGIN, api, tokenStorage } from '../services/apiClient'
import { signInWithGoogle as googleSignIn, type GoogleSignInError } from '../services/googleAuth'
import { isPast } from '../utils/dates'

interface ActionResult {
  ok: boolean
  message: string
}

interface CreateResult extends ActionResult {
  activity?: Activity
}

// Resultado de intentar entrar con Google; `error` permite a la pantalla reaccionar
// (por ejemplo, ofrecer crear la cuenta cuando todavía no existe).
type GoogleOutcome = ActionResult & { error?: GoogleSignInError }

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

type ProfilePatch = Partial<UserProfile> & { name?: string }

interface ApiUser {
  id: string
  name: string
  email: string
  role: Role
  reputationScore: number
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
  // Total de inscritos: con la API sale del servidor (las inscripciones visibles son solo las propias).
  attendeesCount: (activityId: string) => number
  attendance: Record<string, AttendanceStatus>
  links: FamilyLink[]
  linksLoading: boolean
  linksError: string | null
  refreshLinks: () => Promise<void>
  recommendations: Recommendation[]
  reviews: Review[]
  dismissedNotices: string[]
  // true mientras se revisa si hay una sesión guardada al abrir la app.
  restoring: boolean
  // true cuando la sesión es real (datos del servidor) y no una cuenta de demostración.
  usesApi: boolean
  // Única forma real de entrar: con Google. Con `role` crea la cuenta si no existe.
  signInWithGoogle: (options?: { role?: Role; name?: string }) => Promise<GoogleOutcome>
  loginAs: (accountId: string) => void
  logout: () => Promise<void>
  updateProfile: (userId: string, patch: ProfilePatch) => void
  enroll: (activityId: string, userId: string) => Promise<ActionResult>
  unenroll: (activityId: string, userId: string) => Promise<ActionResult>
  confirmAttendance: (activityId: string, userId: string, attended: boolean) => void
  dismissNotice: (noticeId: string) => void
  createActivity: (input: NewActivity) => Promise<CreateResult>
  cancelActivity: (activityId: string) => Promise<ActionResult>
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

function emptyProfile(): UserProfile {
  return { zoneId: null, interests: [], birthYear: null, phone: '', emergencyContacts: [] }
}

// Una persona que entra por la API todavía no tiene perfil en el servidor (zona,
// intereses, contactos): se le crea uno vacío en la copia local para que "Mis datos"
// y el resto de las pantallas funcionen mientras esos módulos se migran.
function accountFromApi(u: ApiUser): Account {
  return { ...apiToSession(u), password: '', profile: emptyProfile() }
}

// Las imágenes que sube un organizador las sirve la API y pueden llegar como ruta relativa ("/api/activities/…/image").
function normalizeActivity(activity: Activity): Activity {
  return activity.imageUrl.startsWith('/') ? { ...activity, imageUrl: `${API_ORIGIN}${activity.imageUrl}` } : activity
}

// Autenticación (Google), vínculos y actividades usan la API real (/auth/*, /links/*, /activities/*, /geocode).
// Perfil, asistencia, avisos, reseñas y recomendaciones siguen siendo locales (en memoria)
// hasta que se migren a la API, que debe revalidar cada acción.
// Las cuentas de demostración conservan todos sus datos locales y no llaman al servidor.
export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, setUser } = useSessionUser()
  const [accounts, setAccounts] = useState(SEED_ACCOUNTS)
  const [recommendations, setRecommendations] = useState(SEED_RECOMMENDATIONS)
  const [reviews, setReviews] = useState(SEED_REVIEWS)
  const [attendance, setAttendance] = useState(SEED_ATTENDANCE)
  const [dismissedNotices, setDismissedNotices] = useState<string[]>([])
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

  // Inicia la sesión con una persona que viene de la API y garantiza su copia local.
  function startSession(apiUser: ApiUser) {
    setAccounts((prev) => (prev.some((a) => a.id === apiUser.id) ? prev : [...prev, accountFromApi(apiUser)]))
    setUser(apiToSession(apiUser))
    setSource('api')
  }

  // Al abrir la app, si hay un token guardado se recupera la sesión.
  useEffect(() => {
    let cancelled = false
    async function restore() {
      try {
        const token = await tokenStorage.get()
        if (!token) return
        const { user: apiUser } = await api.get<{ user: ApiUser }>('/auth/me')
        if (!cancelled) startSession(apiUser)
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

  async function signInWithGoogle(options?: { role?: Role; name?: string }): Promise<GoogleOutcome> {
    const result = await googleSignIn(options)
    if (!result.ok) return { ok: false, message: result.message, error: result.error }
    await tokenStorage.set(result.token)
    startSession(result.user)
    return { ok: true, message: '' }
  }

  function loginAs(accountId: string) {
    const account = accounts.find((a) => a.id === accountId)
    if (!account) return
    tokenStorage.clear() // las cuentas de demostración no usan token
    setUser(toSession(account))
    setSource('demo')
  }

  async function logout() {
    await tokenStorage.clear()
    setUser(null)
    setSource(null)
  }

  function updateProfile(userId: string, patch: ProfilePatch) {
    const { name, ...profilePatch } = patch
    const cleanName = name?.trim()
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === userId ? { ...a, name: cleanName || a.name, profile: { ...a.profile, ...profilePatch } } : a,
      ),
    )
    if (user?.id === userId && cleanName) setUser({ ...user, name: cleanName })
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

    const activity = demoActivities.find((a) => a.id === activityId)
    if (!activity) return { ok: false, message: 'Esta actividad ya no está disponible.' }
    if (activity.status === 'cancelada') return { ok: false, message: 'Esta actividad fue cancelada.' }
    if (isPast(activity.startsAt)) return { ok: false, message: 'Esta actividad ya terminó.' }

    const current = demoEnrollments[activityId] ?? []
    if (current.includes(userId)) return { ok: true, message: '' }
    if (activity.capacity !== null && current.length >= activity.capacity) {
      return { ok: false, message: 'El cupo de esta actividad ya está lleno.' }
    }
    setDemoEnrollments((prev) => ({ ...prev, [activityId]: [...(prev[activityId] ?? []), userId] }))
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

  function confirmAttendance(activityId: string, userId: string, attended: boolean) {
    setAttendance((prev) => ({ ...prev, [attendanceKey(activityId, userId)]: attended ? 'asistio' : 'no_asistio' }))
  }

  function dismissNotice(noticeId: string) {
    setDismissedNotices((prev) => (prev.includes(noticeId) ? prev : [...prev, noticeId]))
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
    // En demostración el lugar es solo un nombre: se ubica cerca de la zona de quien lo publica,
    // con un pequeño desfase para que varios eventos no se superpongan en el mapa.
    const creatorZone = getZone(accounts.find((a) => a.id === input.createdBy)?.profile.zoneId) ?? getZone('san-isidro')
    const jitter = ((demoActivities.length % 7) - 3) * 0.0012
    const activity: Activity = {
      id,
      title: input.title,
      description: input.description,
      category: input.category,
      startsAt: input.startsAt,
      durationMinutes: 120,
      place: input.place.name,
      placeAddress: input.place.address,
      lat: input.place.lat ?? (creatorZone?.lat ?? 9.3739) + jitter,
      lng: input.place.lng ?? (creatorZone?.lng ?? -83.7046) - jitter,
      createdBy: input.createdBy,
      createdByName: accounts.find((a) => a.id === input.createdBy)?.name,
      imageUrl: input.imageUri ?? `https://picsum.photos/seed/${id}/800/500`,
      featured: false,
      capacity: input.capacity ?? null,
      status: 'disponible',
    }
    setDemoActivities((prev) => [...prev, activity])
    setDemoEnrollments((prev) => ({ ...prev, [id]: [] }))
    return { ok: true, message: '', activity }
  }

  // La API todavía no tiene cómo cancelar un evento (y su lista ya no devuelve los cancelados):
  // con cuentas reales no se finge hacerlo solo en el teléfono. La pantalla oculta el botón con `usesApi`.
  async function cancelActivity(activityId: string): Promise<ActionResult> {
    if (source === 'api') {
      return { ok: false, message: 'Cancelar eventos con una cuenta real todavía no está disponible.' }
    }
    setDemoActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, status: 'cancelada', featured: false } : a)))
    return { ok: true, message: '' }
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
        attendance,
        links,
        linksLoading,
        linksError,
        refreshLinks,
        recommendations,
        reviews,
        dismissedNotices,
        restoring,
        usesApi: source === 'api',
        signInWithGoogle,
        loginAs,
        logout,
        updateProfile,
        enroll,
        unenroll,
        confirmAttendance,
        dismissNotice,
        createActivity,
        cancelActivity,
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

// Perfil (zona, intereses, contactos de emergencia) de quien tiene la sesión abierta.
export function useMyProfile(): UserProfile {
  const { user } = useSessionUser()
  const { accounts } = useAppData()
  return accounts.find((a) => a.id === user?.id)?.profile ?? emptyProfile()
}
