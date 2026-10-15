import { StyleSheet } from 'react-native'
import { borderWidth, fontWeight, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) => {
  const size = display.touchTargetSize
  const badgeSize = Math.round(size * 0.45)

  return StyleSheet.create({
    base: {
      width: size,
      height: size,
      borderRadius: radius.pill,
      borderWidth: borderWidth.strong,
      borderColor: display.colors.azul,
      backgroundColor: display.colors.blanco,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.5 },
    badge: {
      position: 'absolute',
      top: -badgeSize / 3,
      right: -badgeSize / 3,
      minWidth: badgeSize,
      height: badgeSize,
      paddingHorizontal: 4,
      borderRadius: radius.pill,
      backgroundColor: display.colors.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: { color: display.colors.blanco, fontWeight: fontWeight.bold, lineHeight: badgeSize },
  })
}
