import { Linking } from 'react-native'
import type { Activity } from '../data/types'
import { DEFAULT_DURATION_MINUTES, endsAt } from './dates'
import { dialable } from './people'

// 20261015T200000Z
function calendarStamp(date: Date) {
  return date.toISOString().replace(/[-:]|\.\d{3}/g, '')
}

// Plantilla de Google Calendar: abre el evento listo para guardar (sincronización
// del Avance I sin pedir permisos de cuenta en el prototipo).
export function googleCalendarUrl(activity: Activity) {
  const start = calendarStamp(new Date(activity.startsAt))
  const end = calendarStamp(endsAt(activity.startsAt, activity.durationMinutes ?? DEFAULT_DURATION_MINUTES))
  const params = [
    'action=TEMPLATE',
    `text=${encodeURIComponent(activity.title)}`,
    `dates=${start}/${end}`,
    `details=${encodeURIComponent(`${activity.description}\n\nPublicado en Conecta+`)}`,
    `location=${encodeURIComponent(activity.place)}`,
  ]
  return `https://calendar.google.com/calendar/render?${params.join('&')}`
}

export function directionsUrl(activity: Pick<Activity, 'lat' | 'lng'>) {
  return `https://www.google.com/maps/dir/?api=1&destination=${activity.lat},${activity.lng}`
}

export function telUrl(phone: string) {
  return `tel:${dialable(phone)}`
}

// Devuelve false si el dispositivo no puede abrir el enlace (en vez de lanzar).
export async function openExternal(url: string) {
  try {
    await Linking.openURL(url)
    return true
  } catch {
    return false
  }
}
