import type { Role, SessionUser } from '../context/RoleContext'

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

// 'llena' la marca el servidor al alcanzar el cupo; la app también la deduce del cupo y los inscritos.
export type ActivityStatus = 'disponible' | 'llena' | 'cancelada'

// La misma forma sirve para las actividades de la API y las de demostración. Los campos
// opcionales solo los trae uno de los dos orígenes (ver comentarios).
export interface Activity {
  id: string
  title: string
  description: string
  category: string
  startsAt: string
  // Solo las de demostración: la API todavía no guarda la duración.
  durationMinutes?: number
  place: string
  placeAddress?: string
  lat: number
  lng: number
  imageUrl: string
  createdBy: string
  createdByName?: string
  featured: boolean
  // null = sin límite de cupo.
  capacity: number | null
  // Solo la API trae el total de inscritos (las inscripciones visibles son solo las propias
  // y las de los familiares); en demostración se cuenta desde las inscripciones.
  attendeesCount?: number
  status: ActivityStatus
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

// Respuesta a "¿asististe?" después de la actividad. Sin respuesta = pendiente.
export type AttendanceStatus = 'asistio' | 'no_asistio'

export function attendanceKey(activityId: string, userId: string) {
  return `${activityId}:${userId}`
}
