import { StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { borderWidth, fontWeight, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    wrapper: { gap: display.spacing / 3 },
    label: { fontWeight: fontWeight.medium, color: colors.azul },
    input: {
      minHeight: display.touchTargetSize,
      paddingHorizontal: display.spacing,
      paddingVertical: display.spacing / 2,
      borderRadius: radius.md,
      borderWidth: borderWidth.strong,
      borderColor: colors.grisMedio,
      backgroundColor: colors.blanco,
      fontSize: display.baseFontSize,
      color: colors.grisTexto,
    },
    inputMultiline: { minHeight: display.touchTargetSize * 2, textAlignVertical: 'top' },
    inputError: { borderColor: colors.error },
    error: { color: colors.error },
  })
