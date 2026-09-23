import { useSessionUser, type Role } from '../context/RoleContext'

export interface RoleDisplayTokens {
  baseFontSize: number
  cardImageSize: number
  cardMaxTextLines: number
  touchTargetSize: number
  spacing: number
}

// Tokens de densidad/tamaño por rol. Los componentes compartidos (ej. ActivityCard)
// leen estos tokens para decidir su propio layout — no existen variantes de
// componente por rol, ver AGENTS.md.
const ROLE_DISPLAY: Record<Role, RoleDisplayTokens> = {
  adulto_mayor: {
    baseFontSize: 20,
    cardImageSize: 160,
    cardMaxTextLines: 2,
    touchTargetSize: 56,
    spacing: 16,
  },
  cuidador: {
    baseFontSize: 15,
    cardImageSize: 96,
    cardMaxTextLines: 3,
    touchTargetSize: 44,
    spacing: 12,
  },
  empresa: {
    baseFontSize: 15,
    cardImageSize: 96,
    cardMaxTextLines: 3,
    touchTargetSize: 44,
    spacing: 12,
  },
}

export function getRoleDisplay(role: Role): RoleDisplayTokens {
  return ROLE_DISPLAY[role]
}

export function useRoleDisplay(): RoleDisplayTokens {
  const { user } = useSessionUser()
  // Antes de que haya sesión (ej. onboarding) se usa una densidad estándar por defecto.
  return getRoleDisplay(user?.role ?? 'cuidador')
}
