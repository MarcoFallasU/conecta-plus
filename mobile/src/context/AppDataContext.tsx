import { createContext, useContext, useState, type ReactNode } from 'react'
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

interface AppDataValue {
  accounts: Account[]
  activities: Activity[]
  enrollments: Record<string, string[]>
  links: FamilyLink[]
  recommendations: Recommendation[]
  reviews: Review[]
  login: (email: string, password: string) => boolean
  loginAs: (accountId: string) => void
  register: (input: { name: string; email: string; password: string; role: Role }) => ActionResult
  logout: () => void
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

function sameEmail(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

// Mock del backend: en producción estos datos, la autenticación y el puntaje de
// reputación viven en la API, y cada acción se revalida allí.
export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, setUser } = useSessionUser()
  const [accounts, setAccounts] = useState(SEED_ACCOUNTS)
  const [activities, setActivities] = useState(SEED_ACTIVITIES)
  const [enrollments, setEnrollments] = useState(SEED_ENROLLMENTS)
  const [links, setLinks] = useState(SEED_LINKS)
  const [recommendations, setRecommendations] = useState(SEED_RECOMMENDATIONS)
  const [reviews, setReviews] = useState(SEED_REVIEWS)

  function login(email: string, password: string) {
    const account = accounts.find((a) => sameEmail(a.email, email) && a.password === password)
    if (!account) return false
    setUser(toSession(account))
    return true
  }

  function loginAs(accountId: string) {
    const account = accounts.find((a) => a.id === accountId)
    if (account) setUser(toSession(account))
  }

  function register(input: { name: string; email: string; password: string; role: Role }): ActionResult {
    if (accounts.some((a) => sameEmail(a.email, input.email))) {
      return { ok: false, message: 'Ya existe una cuenta con ese correo.' }
    }
    const account: Account = {
      id: `u-${Date.now()}`,
      name: input.name.trim(),
      email: input.email.trim(),
      password: input.password,
      role: input.role,
      reputationScore: 0,
    }
    setAccounts((prev) => [...prev, account])
    setUser(toSession(account))
    return { ok: true, message: '' }
  }

  function logout() {
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
