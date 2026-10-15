import { StyleSheet } from 'react-native'
import { borderWidth, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    suggestion: {
      gap: display.spacing / 2,
      padding: display.spacing,
      backgroundColor: display.colors.blanco,
      borderRadius: radius.lg,
      borderWidth: borderWidth.hairline,
      borderColor: display.colors.line,
    },
  })
