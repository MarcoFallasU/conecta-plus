import { useSessionUser, type Role, type SessionUser } from '../context/RoleContext'

export type Permission =
  | 'view_activities'
  | 'register_self'
  | 'register_others'
  | 'link_family_member'
  | 'create_event'
  | 'manage_attendees'
  | 'feature_event'

// Capa 1: permisos que dependen únicamente del rol, sin condiciones adicionales.
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  adulto_mayor: ['view_activities', 'register_self'],
  cuidador: ['view_activities', 'register_self', 'register_others', 'link_family_member'],
  empresa: ['view_activities', 'manage_attendees', 'feature_event'],
}

// TODO: ajustar cuando el backend defina el cálculo real de reputación.
const CREATE_EVENT_REPUTATION_THRESHOLD = 50

// Capa 2: permisos que, además del rol, dependen de una condición evaluada en runtime.
// `create_event` no está en ROLE_PERMISSIONS: para "empresa" siempre es true, para el
// resto depende de la reputación del usuario (ver AGENTS.md).
const CONDITIONAL_PERMISSIONS: Partial<Record<Permission, (user: SessionUser) => boolean>> = {
  create_event: (user) => user.role === 'empresa' || user.reputationScore >= CREATE_EVENT_REPUTATION_THRESHOLD,
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
