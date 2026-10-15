import type { Account, Activity, AttendanceStatus, FamilyLink, Recommendation } from '../data/types'
import { attendanceKey } from '../data/types'
import { dayDiff, formatTime, friendlyDate, isPast } from './dates'
import { greetingName } from './people'

export type NoticeType = 'attendance' | 'today' | 'reminder' | 'family_request' | 'recommendation' | 'cancelled'

export interface Notice {
  id: string
  type: NoticeType
  title: string
  message: string
  activityId?: string
  linkId?: string
  // Las urgentes aparecen primero y requieren una respuesta o son para hoy.
  urgent: boolean
  // Las que no se resuelven con una acción se pueden descartar.
  dismissible: boolean
  sortKey: string
}

interface NoticesInput {
  userId: string
  activities: Activity[]
  enrollments: Record<string, string[]>
  attendance: Record<string, AttendanceStatus>
  links: FamilyLink[]
  recommendations: Recommendation[]
  accounts: Account[]
  dismissed: string[]
  now?: Date
}

const RECENT_DAYS = 14

// Avisos del usuario derivados del estado de la app: recordatorio un día antes, la
// pregunta de asistencia después de la actividad, solicitudes de la familia, etc.
// En producción los genera el backend (Firebase Cloud Messaging); aquí se calculan.
export function deriveNotices(input: NoticesInput): Notice[] {
  const { userId, activities, enrollments, attendance, links, recommendations, accounts, dismissed } = input
  const now = input.now ?? new Date()
  const notices: Notice[] = []
  const nameOf = (id: string) => greetingName(accounts.find((a) => a.id === id)?.name ?? 'Alguien')

  for (const activity of activities) {
    const enrolled = (enrollments[activity.id] ?? []).includes(userId)
    if (!enrolled) continue
    const diff = dayDiff(activity.startsAt, now)
    const past = isPast(activity.startsAt)

    if (activity.status === 'cancelada') {
      if (diff >= -3) {
        notices.push({
          id: `cancelled:${activity.id}`,
          type: 'cancelled',
          title: 'Actividad cancelada',
          message: `Lamentablemente se canceló ${activity.title} (${friendlyDate(activity.startsAt, now)}).`,
          activityId: activity.id,
          urgent: true,
          dismissible: true,
          sortKey: activity.startsAt,
        })
      }
      continue
    }

    if (past) {
      const answered = attendance[attendanceKey(activity.id, userId)] !== undefined
      if (!answered && diff >= -RECENT_DAYS) {
        notices.push({
          id: `attendance:${activity.id}`,
          type: 'attendance',
          title: `¿Asististe a ${activity.title}?`,
          message: 'Cuéntanos para guardar tu historial.',
          activityId: activity.id,
          urgent: true,
          dismissible: false,
          sortKey: activity.startsAt,
        })
      }
      continue
    }

    if (diff === 0) {
      notices.push({
        id: `today:${activity.id}`,
        type: 'today',
        title: `Hoy a las ${formatTime(new Date(activity.startsAt))}`,
        message: `${activity.title} en ${activity.place}.`,
        activityId: activity.id,
        urgent: true,
        dismissible: true,
        sortKey: activity.startsAt,
      })
    } else if (diff === 1) {
      notices.push({
        id: `reminder:${activity.id}`,
        type: 'reminder',
        title: `Mañana a las ${formatTime(new Date(activity.startsAt))}`,
        message: `Recordatorio: ${activity.title} en ${activity.place}.`,
        activityId: activity.id,
        urgent: false,
        dismissible: true,
        sortKey: activity.startsAt,
      })
    }
  }

  for (const link of links) {
    if (link.elderId === userId && link.status === 'pending') {
      notices.push({
        id: `family:${link.id}`,
        type: 'family_request',
        title: `${nameOf(link.caregiverId)} quiere acompañarte`,
        message: 'Si aceptas, podrá ver tus actividades y recomendarte nuevas.',
        linkId: link.id,
        urgent: true,
        dismissible: false,
        sortKey: '0',
      })
    }
  }

  for (const recommendation of recommendations) {
    if (recommendation.toUserId !== userId) continue
    const activity = activities.find((a) => a.id === recommendation.activityId)
    if (!activity || activity.status !== 'disponible' || isPast(activity.startsAt)) continue
    if ((enrollments[activity.id] ?? []).includes(userId)) continue
    notices.push({
      id: `rec:${recommendation.id}`,
      type: 'recommendation',
      title: `${nameOf(recommendation.fromUserId)} te recomienda una actividad`,
      message: `${activity.title} · ${friendlyDate(activity.startsAt, now)}`,
      activityId: activity.id,
      urgent: false,
      dismissible: true,
      sortKey: activity.startsAt,
    })
  }

  return notices
    .filter((notice) => !(notice.dismissible && dismissed.includes(notice.id)))
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || a.sortKey.localeCompare(b.sortKey))
}
