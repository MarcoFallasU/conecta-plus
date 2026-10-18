import { StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { fontWeight, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) => {
  const md = display.touchTargetSize
  const lg = Math.round(display.touchTargetSize * 1.6)

  return StyleSheet.create({
    base: { borderRadius: radius.pill, backgroundColor: colors.azulClaro, alignItems: 'center', justifyContent: 'center' },
    md: { width: md, height: md },
    lg: { width: lg, height: lg },
    initialsMd: { fontSize: Math.round(md * 0.38), lineHeight: Math.round(md * 0.5), fontWeight: fontWeight.bold, color: colors.azul },
    initialsLg: { fontSize: Math.round(lg * 0.38), lineHeight: Math.round(lg * 0.5), fontWeight: fontWeight.bold, color: colors.azul },
  })
}
