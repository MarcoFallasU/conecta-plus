import { StyleSheet } from 'react-native'
import { borderWidth, radius, shadow } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) => {
  const iconSize = Math.round(display.touchTargetSize * 1.1)

  return StyleSheet.create({
    tile: {
      flexGrow: 1,
      flexBasis: '45%',
      alignItems: 'center',
      gap: display.spacing / 2,
      padding: display.spacing,
      backgroundColor: display.colors.blanco,
      borderRadius: radius.lg,
      borderWidth: borderWidth.hairline,
      borderColor: display.colors.line,
      ...shadow.card,
    },
    tileAlert: { backgroundColor: display.colors.errorClaro, borderColor: display.colors.error },
    pressed: { opacity: 0.85 },
    iconWrap: {
      width: iconSize,
      height: iconSize,
      borderRadius: radius.pill,
      backgroundColor: display.colors.azulClaro,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapAlert: { backgroundColor: display.colors.blanco },
    label: { textAlign: 'center' },
    labelAlert: { color: display.colors.errorOscuro },
    hint: { textAlign: 'center' },
  })
}
