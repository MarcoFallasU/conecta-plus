import type { Activity, AttendanceStatus } from '../data/types'
import { attendanceKey } from '../data/types'
import { addMonths, monthKey, monthName, shortMonth } from './dates'

export interface MonthStat {
  key: string
  label: string
  fullName: string
  attended: number
}

export interface CategoryStat {
  category: string
  count: number
}

// Actividades a las que el usuario confirmó que asistió, de la más reciente a la más antigua.
export function attendedActivities(
  userId: string,
  activities: Activity[],
  enrollments: Record<string, string[]>,
  attendance: Record<string, AttendanceStatus>,
) {
  return activities
    .filter((a) => (enrollments[a.id] ?? []).includes(userId) && attendance[attendanceKey(a.id, userId)] === 'asistio')
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
}

// Cantidad de asistencias por mes en los últimos `months` meses (el actual al final).
export function monthlyAttendance(attended: Activity[], months = 6, now = new Date()): MonthStat[] {
  const counts = new Map<string, number>()
  for (const activity of attended) {
    const key = monthKey(new Date(activity.startsAt))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return Array.from({ length: months }, (_, index) => {
    const date = addMonths(now, index - (months - 1))
    const key = monthKey(date)
    const label = shortMonth(date)
    return { key, label: label.charAt(0).toUpperCase() + label.slice(1), fullName: monthName(date), attended: counts.get(key) ?? 0 }
  })
}

export function categoryBreakdown(attended: Activity[]): CategoryStat[] {
  const counts = new Map<string, number>()
  for (const activity of attended) counts.set(activity.category, (counts.get(activity.category) ?? 0) + 1)
  return Array.from(counts, ([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count)
}

// Racha: meses consecutivos (hasta el actual) con al menos una asistencia.
export function activeMonthsStreak(stats: MonthStat[]) {
  let streak = 0
  for (let index = stats.length - 1; index >= 0; index -= 1) {
    if (stats[index].attended === 0) {
      // El mes en curso todavía puede sumar: no corta la racha si es el último.
      if (index === stats.length - 1) continue
      break
    }
    streak += 1
  }
  return streak
}

// `self` = lo lee la propia persona ("asististe"); si no, un familiar ("asistió").
export function monthSummary(stat: MonthStat, favorite: string | undefined, self: boolean) {
  const attended = self ? 'asististe' : 'asistió'
  if (stat.attended === 0) {
    return self
      ? `En ${stat.fullName} todavía no has asistido a ninguna actividad.`
      : `En ${stat.fullName} todavía no ha asistido a ninguna actividad.`
  }
  const times = stat.attended === 1 ? 'una actividad' : `${stat.attended} actividades`
  const closing = favorite ? ` ${self ? 'Tu' : 'Su'} categoría favorita es ${favorite.toLowerCase()}.` : ''
  return `En ${stat.fullName} ${attended} a ${times}.${closing}`
}
