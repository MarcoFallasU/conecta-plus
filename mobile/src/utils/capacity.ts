import type { Activity } from '../data/types'

// Un evento cancelado no se ofrece; uno lleno sí se muestra, con la etiqueta "Cupo lleno".
export function isOpen(activity: Activity) {
  return activity.status !== 'cancelada'
}

// Cupos que quedan (null = sin límite). `attendees` es el total de inscritos: con la API sale
// del servidor, porque las inscripciones visibles en el teléfono son solo las propias.
export function spotsLeft(activity: Activity, attendees: number): number | null {
  return activity.capacity === null ? null : Math.max(0, activity.capacity - attendees)
}

// 'llena' la marca el servidor; en demostración se deduce del cupo.
export function isFull(activity: Activity, attendees: number) {
  return activity.status === 'llena' || spotsLeft(activity, attendees) === 0
}
