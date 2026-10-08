import { StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { borderWidth, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    suggestion: {
      gap: display.spacing / 2,
      padding: display.spacing,
      backgroundColor: colors.blanco,
      borderRadius: radius.lg,
      borderWidth: borderWidth.hairline,
      borderColor: colors.line,
    },
  })
