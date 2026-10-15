import type { IconName } from '../theme/designSystem'

export const ACTIVITY_CATEGORIES = ['Baile', 'Bienestar', 'Salud', 'Juegos', 'Ejercicio', 'Cultura']

const CATEGORY_ICONS: Record<string, IconName> = {
  Baile: 'musical-notes-outline',
  Bienestar: 'leaf-outline',
  Salud: 'medkit-outline',
  Juegos: 'game-controller-outline',
  Ejercicio: 'walk-outline',
  Cultura: 'color-palette-outline',
}

export function categoryIcon(category: string): IconName {
  return CATEGORY_ICONS[category] ?? 'calendar-outline'
}
