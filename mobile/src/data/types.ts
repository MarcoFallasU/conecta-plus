import type { SessionUser } from '../context/RoleContext'

export interface Account extends SessionUser {
  password: string
}

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