import { StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { borderWidth, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    card: {
      gap: display.spacing,
      padding: display.spacing,
      backgroundColor: colors.blanco,
      borderRadius: radius.lg,
      borderWidth: borderWidth.hairline,
      borderColor: colors.line,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: display.spacing },
    texts: { flex: 1, gap: display.spacing / 4 },
    actions: { gap: display.spacing / 2 },
  })
