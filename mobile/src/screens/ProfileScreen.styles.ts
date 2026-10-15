import { StyleSheet } from 'react-native'
import { borderWidth, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    header: { alignItems: 'center', gap: display.spacing / 2 },
    centered: { textAlign: 'center' },
    badgeWrap: { alignSelf: 'center' },
    statsRow: { flexDirection: 'row', gap: display.spacing },
    card: {
      gap: display.spacing,
      padding: display.spacing,
      backgroundColor: display.colors.blanco,
      borderRadius: radius.lg,
      borderWidth: borderWidth.hairline,
      borderColor: display.colors.line,
    },
    links: { gap: display.spacing },
  })
