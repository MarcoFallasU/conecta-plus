import { useSessionUser, type Role, type SessionUser } from '../context/RoleContext'
import { canPublishEvents } from './reputation'

export type Permission =
  | 'view_activities'
  | 'register_self'
  | 'register_others'
  | 'view_family'
  | 'link_family_member'
  | 'recommend_activity'
  | 'respond_family_requests'
  | 'leave_review'
  | 'create_event'
  | 'manage_attendees'
  | 'feature_event'

// Capa 1: permisos que dependen únicamente del rol, sin condiciones adicionales.
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  adulto_mayor: ['view_activities', 'register_self', 'view_family', 'respond_family_requests', 'leave_review'],
  cuidador: [
    'view_activities',
    'register_self',
    'register_others',
    'view_family',
    'link_family_member',
    'recommend_activity',
    'leave_review',
  ],
  empresa: ['view_activities', 'feature_event'],
}

// Capa 2: permisos que, además del rol, dependen de una condición evaluada en runtime.
// Publicar eventos y gestionar sus inscritos: siempre para "empresa"; para el resto,
// solo al alcanzar la reputación mínima (ver AGENTS.md). La propiedad del evento se
// valida en la pantalla.
const CONDITIONAL_PERMISSIONS: Partial<Record<Permission, (user: SessionUser) => boolean>> = {
  create_event: canPublishEvents,
  manage_attendees: canPublishEvents,
}

export function can(user: SessionUser | null, permission: Permission): boolean {
  if (!user) return false
  if (ROLE_PERMISSIONS[user.role].includes(permission)) return true

  const evaluateCondition = CONDITIONAL_PERMISSIONS[permission]
  return evaluateCondition ? evaluateCondition(user) : false
}

export function useCan(permission: Permission): boolean {
  const { user } = useSessionUser()
  return can(user, permission)
}
