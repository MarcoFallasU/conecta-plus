import { StyleSheet } from 'react-native'
import { borderWidth, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) => {
  const iconSize = Math.round(display.touchTargetSize * 0.95)

  return StyleSheet.create({
    card: {
      gap: display.spacing,
      padding: display.spacing,
      backgroundColor: display.colors.blanco,
      borderRadius: radius.lg,
      borderWidth: borderWidth.hairline,
      borderColor: display.colors.line,
    },
    cardUrgent: { borderWidth: borderWidth.strong, borderColor: display.colors.amarillo },
    cardCancelled: { backgroundColor: display.colors.errorClaro, borderColor: display.colors.error },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: display.spacing },
    iconWrap: {
      width: iconSize,
      height: iconSize,
      borderRadius: radius.pill,
      backgroundColor: display.colors.azulClaro,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapCancelled: { backgroundColor: display.colors.blanco },
    texts: { flex: 1, gap: display.spacing / 4 },
    actions: { gap: display.spacing / 2 },
  })
}
