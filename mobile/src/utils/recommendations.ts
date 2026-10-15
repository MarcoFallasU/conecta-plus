import type { Account, Activity, AttendanceStatus, Recommendation, UserProfile } from '../data/types'
import { attendanceKey } from '../data/types'
import type { Zone } from '../data/zones'
import { dayDiff, isPast } from './dates'
import { distanceKm, distanceWords } from './geo'
import { greetingName } from './people'

export interface Suggestion {
  activity: Activity
  score: number
  reasons: string[]
  distanceKm: number | null
}

interface SuggestInput {
  userId: string
  profile: UserProfile
  activities: Activity[]
  enrollments: Record<string, string[]>
  attendance: Record<string, AttendanceStatus>
  recommendations: Recommendation[]
  accounts: Account[]
  origin?: Zone
  now?: Date
  limit?: number
}

// Recomendaciones personalizadas (sección 7 del Avance I): combina los intereses
// declarados, las categorías a las que ya asistió, lo que le recomendó su familia y la
// cercanía. Es una heurística de prototipo; la API la reemplazará con datos reales.
export function suggestActivities(input: SuggestInput): Suggestion[] {
  const { userId, profile, activities, enrollments, attendance, recommendations, accounts, origin, limit = 3 } = input
  const now = input.now ?? new Date()

  const attendedCategories = new Map<string, number>()
  for (const activity of activities) {
    if (attendance[attendanceKey(activity.id, userId)] === 'asistio') {
      attendedCategories.set(activity.category, (attendedCategories.get(activity.category) ?? 0) + 1)
    }
  }

  const suggestions: Suggestion[] = []

  for (const activity of activities) {
    if (activity.status !== 'disponible' || isPast(activity.startsAt)) continue
    const attendees = enrollments[activity.id] ?? []
    if (attendees.includes(userId)) continue
    if (activity.capacity !== null && attendees.length >= activity.capacity) continue

    let score = 0
    const reasons: string[] = []

    const fromFamily = recommendations.find((r) => r.activityId === activity.id && r.toUserId === userId)
    if (fromFamily) {
      const sender = accounts.find((a) => a.id === fromFamily.fromUserId)
      score += 5
      reasons.push(`Te la recomendó ${sender ? greetingName(sender.name) : 'tu familia'}`)
    }

    if (profile.interests.includes(activity.category)) {
      score += 3
      reasons.push(`Porque te gusta ${activity.category.toLowerCase()}`)
    } else if (attendedCategories.has(activity.category)) {
      score += Math.min(2, attendedCategories.get(activity.category) ?? 0)
      reasons.push('Parecida a las que ya disfrutaste')
    }

    const km = origin ? distanceKm(origin, activity) : null
    if (km !== null && km <= 5) {
      score += 2
      reasons.push(`Queda ${distanceWords(km)}`)
    } else if (km !== null && km <= 15) {
      score += 1
    }

    if (activity.featured) score += 0.5
    if (dayDiff(activity.startsAt, now) <= 3) score += 0.5

    if (score >= 2 && reasons.length > 0) suggestions.push({ activity, score, reasons, distanceKm: km })
  }

  return suggestions
    .sort((a, b) => b.score - a.score || a.activity.startsAt.localeCompare(b.activity.startsAt))
    .slice(0, limit)
}
