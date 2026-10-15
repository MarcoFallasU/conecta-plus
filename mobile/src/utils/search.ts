import type { Activity } from '../data/types'
import type { Zone } from '../data/zones'
import { addDays, dayKey, dayDiff, isPast } from './dates'
import { distanceKm } from './geo'

export type DateFilter = 'any' | 'today' | 'tomorrow' | 'weekend' | 'week' | 'month'
export type SortMode = 'relevance' | 'distance' | 'date'

export const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: 'any', label: 'Cualquier día' },
  { value: 'today', label: 'Hoy' },
  { value: 'tomorrow', label: 'Mañana' },
  { value: 'weekend', label: 'Este fin de semana' },
  { value: 'week', label: 'Próximos 7 días' },
  { value: 'month', label: 'Próximos 30 días' },
]

export const DISTANCE_FILTERS: { value: number | null; label: string }[] = [
  { value: null, label: 'Cualquiera' },
  { value: 5, label: 'Hasta 5 km' },
  { value: 15, label: 'Hasta 15 km' },
  { value: 30, label: 'Hasta 30 km' },
]

export const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'relevance', label: 'Destacadas' },
  { value: 'distance', label: 'Más cerca' },
  { value: 'date', label: 'Más pronto' },
]

export interface SearchFilters {
  query: string
  category: string | null
  date: DateFilter
  maxKm: number | null
  sort: SortMode
}

export const DEFAULT_FILTERS: SearchFilters = { query: '', category: null, date: 'any', maxKm: null, sort: 'relevance' }

export interface SearchResult {
  activity: Activity
  distanceKm: number | null
}

// Cantidad de filtros activos sin contar el texto ni el orden.
export function countActiveFilters(filters: SearchFilters) {
  return Number(filters.category !== null) + Number(filters.date !== 'any') + Number(filters.maxKm !== null)
}

function normalize(text: string) {
  const lower = text.toLowerCase()
  // Sin tildes ni mayúsculas: "musica" encuentra "Música en vivo".
  return typeof lower.normalize === 'function' ? lower.normalize('NFD').replace(/[̀-ͯ]/g, '') : lower
}

function weekendKeys(now: Date) {
  const dow = now.getDay()
  if (dow === 0) return [dayKey(now)]
  const toSaturday = 6 - dow
  return [dayKey(addDays(now, toSaturday)), dayKey(addDays(now, toSaturday + 1))]
}

export function matchesDate(iso: string, filter: DateFilter, now = new Date()) {
  if (filter === 'any') return true
  const diff = dayDiff(iso, now)
  if (filter === 'today') return diff === 0
  if (filter === 'tomorrow') return diff === 1
  if (filter === 'week') return diff >= 0 && diff <= 6
  if (filter === 'month') return diff >= 0 && diff <= 29
  return weekendKeys(now).includes(dayKey(new Date(iso)))
}

// Actividades futuras y disponibles que cumplen los filtros, ya ordenadas.
export function searchActivities(activities: Activity[], filters: SearchFilters, origin?: Zone, now = new Date()): SearchResult[] {
  const words = normalize(filters.query.trim()).split(/\s+/).filter(Boolean)

  const results = activities
    .filter((a) => a.status === 'disponible' && !isPast(a.startsAt))
    .filter((a) => !filters.category || a.category === filters.category)
    .filter((a) => matchesDate(a.startsAt, filters.date, now))
    .filter((a) => {
      if (words.length === 0) return true
      const haystack = normalize([a.title, a.place, a.category, a.description].join(' '))
      return words.every((word) => haystack.includes(word))
    })
    .map<SearchResult>((activity) => ({
      activity,
      distanceKm: origin ? distanceKm(origin, activity) : null,
    }))
    .filter((r) => filters.maxKm === null || r.distanceKm === null || r.distanceKm <= filters.maxKm)

  const byDate = (a: SearchResult, b: SearchResult) => a.activity.startsAt.localeCompare(b.activity.startsAt)

  return results.sort((a, b) => {
    if (filters.sort === 'distance' && a.distanceKm !== null && b.distanceKm !== null) {
      return a.distanceKm - b.distanceKm || byDate(a, b)
    }
    if (filters.sort === 'relevance') {
      return Number(b.activity.featured) - Number(a.activity.featured) || byDate(a, b)
    }
    return byDate(a, b)
  })
}
