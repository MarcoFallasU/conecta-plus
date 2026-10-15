import type { SessionUser } from '../context/RoleContext'

export interface EmergencyContact {
  id: string
  name: string
  phone: string
  relation: string
}

// Datos de perfil que alimentan la búsqueda cercana, las recomendaciones y la
// seguridad del adulto mayor (ver sección 4 del Avance I).
export interface UserProfile {
  zoneId: string | null
  interests: string[]
  birthYear: number | null
  phone: string
  emergencyContacts: EmergencyContact[]
}

export interface Account extends SessionUser {
  password: string
  profile: UserProfile
}

export type ActivityStatus = 'disponible' | 'cancelada'

export interface Activity {
  id: string
  title: string
  description: string
  category: string
  startsAt: string
  durationMinutes: number
  place: string
  zoneId: string
  latitude: number
  longitude: number
  imageUrl: string
  createdBy: string
  featured: boolean
  // null = sin límite de cupo.
  capacity: number | null
  status: ActivityStatus
}

export interface FamilyLink {
  id: string
  caregiverId: string
  elderId: string
  status: 'pending' | 'active'
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

// Respuesta a "¿asististe?" después de la actividad. Sin respuesta = pendiente.
export type AttendanceStatus = 'asistio' | 'no_asistio'

export function attendanceKey(activityId: string, userId: string) {
  return `${activityId}:${userId}`
}
