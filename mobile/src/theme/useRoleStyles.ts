import { useMemo } from 'react'
import { useRoleDisplay, type RoleDisplayTokens } from './roleDisplay'

// Cada `.styles.ts` exporta `createStyles(display)`; este hook lo evalúa con los
// tokens del rol activo y memoiza el resultado.
export function useRoleStyles<T>(createStyles: (display: RoleDisplayTokens) => T): T {
  const display = useRoleDisplay()
  return useMemo(() => createStyles(display), [createStyles, display])
}
