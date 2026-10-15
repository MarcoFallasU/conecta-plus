import { StyleSheet } from 'react-native'
import { borderWidth, fontWeight, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    wrapper: { gap: display.spacing / 3 },
    label: { fontWeight: fontWeight.medium, color: display.colors.azul },
    input: {
      minHeight: display.touchTargetSize,
      paddingHorizontal: display.spacing,
      paddingVertical: display.spacing / 2,
      borderRadius: radius.md,
      borderWidth: borderWidth.strong,
      borderColor: display.colors.grisMedio,
      backgroundColor: display.colors.blanco,
      fontSize: display.baseFontSize,
      color: display.colors.grisTexto,
    },
    inputMultiline: { minHeight: display.touchTargetSize * 2, textAlignVertical: 'top' },
    inputError: { borderColor: display.colors.error },
    error: { color: display.colors.error },
  })
