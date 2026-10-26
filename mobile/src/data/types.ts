import type { Role, SessionUser } from '../context/RoleContext'

export interface Account extends SessionUser {
  password: string
}

// Los campos opcionales solo los trae la API (cuentas reales); las actividades de demostración no los tienen.
export interface Activity {
  id: string
  title: string
  description: string
  category: string
  startsAt: string
  place: string
  imageUrl: string
  createdBy: string
  featured: boolean
  placeAddress?: string
  lat?: number
  lng?: number
  createdByName?: string
  capacity?: number | null
  attendeesCount?: number
  status?: 'disponible' | 'llena' | 'cancelada'
}

// Resultado de la búsqueda de lugares (viene de la API).
export interface PlaceResult {
  name: string
  address: string
  lat: number
  lng: number
}

// Persona inscrita en una actividad, tal como la ve quien publicó el evento.
export interface Attendee {
  id: string
  name: string
  role: Role
}

// Vínculo tal como lo guardan las cuentas de demostración (sin nombres).
export interface FamilyLinkBase {
  id: string
  caregiverId: string
  elderId: string
  status: 'pending' | 'active'
}

// Vínculo que consumen las pantallas: siempre trae los dos nombres.
// Con la API vienen del servidor; con cuentas demo los resuelve AppDataContext.
export interface FamilyLink extends FamilyLinkBase {
  caregiverName: string
  elderName: string
}

export interface Recommendation {
  id: string
  activityId: string
  fromUserId: string
  toUserId: string
}

export interface Review {
  id: string
  activityId: string
  userId: string
  rating: number
  comment: string
  createdAt: string
}