import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useSessionUser, type Role, type SessionUser } from './RoleContext'
import {
  attendanceKey,
  type Account,
  type Activity,
  type AttendanceStatus,
  type FamilyLink,
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
import { REVIEW_POINTS } from '../permissions/reputation'
import { api, tokenStorage } from '../services/apiClient'
import { signInWithGoogle as googleSignIn, type GoogleSignInError } from '../services/googleAuth'
import { isPast } from '../utils/dates'

interface ActionResult {
  ok: boolean
  message: string
}

interface NewActivity {
  title: string
  description: string
  category: string
  startsAt: string
  durationMinutes: number
  place: string
  zoneId: string
  capacity: number | null
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

// Resultado de intentar entrar con Google; `error` permite a la pantalla reaccionar
// (por ejemplo, ofrecer crear la cuenta cuando todavía no existe).
type GoogleOutcome = ActionResult & { error?: GoogleSignInError }

interface AppDataValue {
  accounts: Account[]
  activities: Activity[]
  enrollments: Record<string, string[]>
  attendance: Record<string, AttendanceStatus>
  links: FamilyLink[]
  recommendations: Recommendation[]
  reviews: Review[]
  dismissedNotices: string[]
  // true mientras se revisa si hay una sesión guardada al abrir la app.
  restoring: boolean
  // Única forma real de entrar: con Google. Con `role` crea la cuenta si no existe.
  signInWithGoogle: (options?: { role?: Role; name?: string }) => Promise<GoogleOutcome>
  loginAs: (accountId: string) => void
  logout: () => Promise<void>
  updateProfile: (userId: string, patch: ProfilePatch) => void
  enroll: (activityId: string, userId: string) => ActionResult
  unenroll: (activityId: string, userId: string) => void
  confirmAttendance: (activityId: string, userId: string, attended: boolean) => void
  dismissNotice: (noticeId: string) => void
  createActivity: (input: NewActivity) => Activity
  cancelActivity: (activityId: string) => void
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

function emptyProfile(): UserProfile {
  return { zoneId: null, interests: [], birthYear: null, phone: '', emergencyContacts: [] }
}

// Una persona que entra por la API todavía no tiene perfil en el servidor (zona,
// intereses, contactos): se le crea uno vacío en la copia local para que "Mis datos"
// y el resto de las pantallas funcionen mientras esos módulos se migran.
function accountFromApi(u: ApiUser): Account {
  return { ...apiToSession(u), password: '', profile: emptyProfile() }
}

// Autenticación: usa la API real (inicio de sesión con Google y /auth/me).
// El resto de los datos (actividades, vínculos, reseñas, perfil) sigue siendo un mock
// hasta que cada módulo se migre a la API, que debe revalidar cada acción.
export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, setUser } = useSessionUser()
  const [accounts, setAccounts] = useState(SEED_ACCOUNTS)
  const [activities, setActivities] = useState(SEED_ACTIVITIES)
  const [enrollments, setEnrollments] = useState(SEED_ENROLLMENTS)
  const [attendance, setAttendance] = useState(SEED_ATTENDANCE)
  const [links, setLinks] = useState(SEED_LINKS)
  const [recommendations, setRecommendations] = useState(SEED_RECOMMENDATIONS)
  const [reviews, setReviews] = useState(SEED_REVIEWS)
  const [dismissedNotices, setDismissedNotices] = useState<string[]>([])
  const [restoring, setRestoring] = useState(true)

  // Inicia la sesión con una persona que viene de la API y garantiza su copia local.
  function startSession(apiUser: ApiUser) {
    setAccounts((prev) => (prev.some((a) => a.id === apiUser.id) ? prev : [...prev, accountFromApi(apiUser)]))
    setUser(apiToSession(apiUser))
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
  }

  async function logout() {
    await tokenStorage.clear()
    setUser(null)
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

  function enroll(activityId: string, userId: string): ActionResult {
    const activity = activities.find((a) => a.id === activityId)
    if (!activity) return { ok: false, message: 'Esta actividad ya no está disponible.' }
    if (activity.status === 'cancelada') return { ok: false, message: 'Esta actividad fue cancelada.' }
    if (isPast(activity.startsAt)) return { ok: false, message: 'Esta actividad ya terminó.' }

    const current = enrollments[activityId] ?? []
    if (current.includes(userId)) return { ok: true, message: '' }
    if (activity.capacity !== null && current.length >= activity.capacity) {
      return { ok: false, message: 'El cupo de esta actividad ya está lleno.' }
    }
    setEnrollments((prev) => ({ ...prev, [activityId]: [...(prev[activityId] ?? []), userId] }))
    return { ok: true, message: '' }
  }

  function unenroll(activityId: string, userId: string) {
    setEnrollments((prev) => ({ ...prev, [activityId]: (prev[activityId] ?? []).filter((id) => id !== userId) }))
  }

  function confirmAttendance(activityId: string, userId: string, attended: boolean) {
    setAttendance((prev) => ({ ...prev, [attendanceKey(activityId, userId)]: attended ? 'asistio' : 'no_asistio' }))
  }

  function dismissNotice(noticeId: string) {
    setDismissedNotices((prev) => (prev.includes(noticeId) ? prev : [...prev, noticeId]))
  }

  function createActivity(input: NewActivity) {
    const id = `a-${Date.now()}`
    const zone = getZone(input.zoneId)
    // Pequeño desfase para que varios eventos de la misma zona no se superpongan en el mapa.
    const jitter = ((activities.length % 7) - 3) * 0.0012
    const activity: Activity = {
      ...input,
      id,
      latitude: (zone?.latitude ?? 9.3739) + jitter,
      longitude: (zone?.longitude ?? -83.7046) - jitter,
      imageUrl: `https://picsum.photos/seed/${id}/800/500`,
      featured: false,
      status: 'disponible',
    }
    setActivities((prev) => [...prev, activity])
    setEnrollments((prev) => ({ ...prev, [id]: [] }))
    return activity
  }

  function cancelActivity(activityId: string) {
    setActivities((prev) => prev.map((a) => (a.id === activityId ? { ...a, status: 'cancelada', featured: false } : a)))
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
        attendance,
        links,
        recommendations,
        reviews,
        dismissedNotices,
        restoring,
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
