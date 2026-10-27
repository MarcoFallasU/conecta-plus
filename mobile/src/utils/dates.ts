const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const WEEKDAYS_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic']
const MONTHS_LONG = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre']

const DAY_MS = 24 * 60 * 60 * 1000

// Cuando una actividad no trae duración (las de la API), se asume esta para el calendario.
export const DEFAULT_DURATION_MINUTES = 120

export function formatTime(date: Date) {
  const hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const hours12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hours12}:${minutes} ${hours >= 12 ? 'p. m.' : 'a. m.'}`
}

export function formatDay(date: Date) {
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`
}

export function formatActivityDate(iso: string) {
  const date = new Date(iso)
  return `${formatDay(date)} · ${formatTime(date)}`
}

export function isPast(iso: string) {
  return new Date(iso).getTime() < Date.now()
}

export function daysFromNow(days: number, hour = 9, minute = 0) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

// Una hora razonable "más tarde hoy" (entre 8 a. m. y 8 p. m.); si ya es muy tarde, mañana a media tarde.
export function laterToday() {
  const now = new Date()
  const hour = now.getHours() + 3
  if (hour > 20) return daysFromNow(1, 15)
  return daysFromNow(0, Math.max(8, hour))
}

export function startOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// 'aaaa-mm-dd' en hora local; sirve de llave para agrupar actividades por día.
export function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function monthKey(date: Date) {
  return dayKey(date).slice(0, 7)
}

// Días de calendario entre hoy y la fecha (0 = hoy, 1 = mañana, -1 = ayer).
export function dayDiff(iso: string, now = new Date()) {
  return Math.round((startOfDay(new Date(iso)).getTime() - startOfDay(now).getTime()) / DAY_MS)
}

export function isToday(iso: string, now = new Date()) {
  return dayDiff(iso, now) === 0
}

export function relativeDay(iso: string, now = new Date()) {
  const diff = dayDiff(iso, now)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Mañana'
  if (diff === -1) return 'Ayer'
  return formatDay(new Date(iso))
}

// "martes 14 de octubre"
export function formatLongDate(date: Date) {
  return `${WEEKDAYS_LONG[date.getDay()]} ${date.getDate()} de ${MONTHS_LONG[date.getMonth()]}`
}

// "octubre 2026"
export function formatMonthYear(date: Date) {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`
}

export function monthName(date: Date) {
  return MONTHS_LONG[date.getMonth()]
}

export function shortMonth(date: Date) {
  return MONTHS[date.getMonth()]
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

// "Hoy, 2:00 p. m." / "Mañana, 6:30 a. m." / "Jue 16 oct · 2:00 p. m."
export function friendlyDate(iso: string, now = new Date()) {
  const date = new Date(iso)
  const diff = dayDiff(iso, now)
  if (diff === 0 || diff === 1) return `${relativeDay(iso, now)}, ${formatTime(date)}`
  return formatActivityDate(iso)
}

// "En 3 horas", "Mañana", "En 4 días"; vacío si ya pasó.
export function timeUntil(iso: string, now = new Date()) {
  const ms = new Date(iso).getTime() - now.getTime()
  if (ms <= 0) return ''
  const hours = Math.round(ms / (60 * 60 * 1000))
  if (hours < 1) return 'En menos de una hora'
  if (hours < 24 && dayDiff(iso, now) === 0) return `En ${hours} ${hours === 1 ? 'hora' : 'horas'}`
  const days = dayDiff(iso, now)
  if (days === 1) return 'Mañana'
  return `En ${days} días`
}

export function endsAt(startsAtIso: string, durationMinutes: number) {
  return new Date(new Date(startsAtIso).getTime() + durationMinutes * 60 * 1000)
}
