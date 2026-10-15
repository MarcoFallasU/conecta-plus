import { useMemo } from 'react'
import { usePreferences, TEXT_SIZE_SCALE } from '../context/PreferencesContext'
import { useSessionUser, type Role } from '../context/RoleContext'
import { colors, highContrastColors, type Palette } from './colors'

export interface RoleDisplayTokens {
  baseFontSize: number
  cardImageSize: number
  cardMaxTextLines: number
  cardLayout: 'vertical' | 'horizontal'
  showCardDetails: boolean
  touchTargetSize: number
  spacing: number
  // Paleta activa (normal o alto contraste); todo color visual sale de aquí.
  colors: Palette
}

type RoleBaseTokens = Omit<RoleDisplayTokens, 'colors'>

// Tokens de densidad/tamaño por rol. Los componentes compartidos (ej. ActivityCard)
// leen estos tokens para decidir su propio layout — no existen variantes de
// componente por rol, ver AGENTS.md.
const ROLE_DISPLAY: Record<Role, RoleBaseTokens> = {
  adulto_mayor: {
    baseFontSize: 20,
    cardImageSize: 160,
    cardMaxTextLines: 2,
    cardLayout: 'vertical',
    showCardDetails: false,
    touchTargetSize: 56,
    spacing: 16,
  },
  cuidador: {
    baseFontSize: 15,
    cardImageSize: 96,
    cardMaxTextLines: 3,
    cardLayout: 'horizontal',
    showCardDetails: true,
    touchTargetSize: 44,
    spacing: 12,
  },
  empresa: {
    baseFontSize: 15,
    cardImageSize: 96,
    cardMaxTextLines: 3,
    cardLayout: 'horizontal',
    showCardDetails: true,
    touchTargetSize: 44,
    spacing: 12,
  },
}

export function getRoleDisplay(role: Role, textScale = 1, highContrast = false): RoleDisplayTokens {
  const base = ROLE_DISPLAY[role]
  return {
    ...base,
    baseFontSize: Math.round(base.baseFontSize * textScale),
    // Los botones y campos crecen a la mitad del ritmo que la letra para no ocupar toda la pantalla.
    touchTargetSize: Math.round(base.touchTargetSize * (1 + (textScale - 1) / 2)),
    colors: highContrast ? highContrastColors : colors,
  }
}

export function useRoleDisplay(): RoleDisplayTokens {
  const { user } = useSessionUser()
  const { textSize, highContrast } = usePreferences()
  // Antes de que haya sesión (bienvenida, registro) se usa la densidad del adulto mayor:
  // es el público principal de la app y quien más necesita letra y botones grandes.
  const role = user?.role ?? 'adulto_mayor'

  // Identidad estable: los `.styles.ts` se memoizan por este objeto.
  return useMemo(() => getRoleDisplay(role, TEXT_SIZE_SCALE[textSize], highContrast), [role, textSize, highContrast])
}
