import { StyleSheet } from 'react-native'
import { borderWidth, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    header: { gap: display.spacing / 2 },
    filters: {
      gap: display.spacing * 1.25,
      padding: display.spacing,
      backgroundColor: display.colors.blanco,
      borderRadius: radius.lg,
      borderWidth: borderWidth.hairline,
      borderColor: display.colors.line,
    },
    group: { gap: display.spacing / 2 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: display.spacing / 2 },
  })
