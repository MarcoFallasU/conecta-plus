const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic']

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
