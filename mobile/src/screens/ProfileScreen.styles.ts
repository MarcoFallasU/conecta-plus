import { StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { borderWidth, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    header: { alignItems: 'center', gap: display.spacing / 2 },
    centered: { textAlign: 'center' },
    statsRow: { flexDirection: 'row', gap: display.spacing },
    statCard: {
      flex: 1,
      alignItems: 'center',
      gap: display.spacing / 4,
      padding: display.spacing,
      backgroundColor: colors.blanco,
      borderRadius: radius.lg,
      borderWidth: borderWidth.hairline,
      borderColor: colors.line,
    },
    card: {
      gap: display.spacing,
      padding: display.spacing,
      backgroundColor: colors.blanco,
      borderRadius: radius.lg,
      borderWidth: borderWidth.hairline,
      borderColor: colors.line,
    },
    progressTrack: { height: Math.round(display.spacing * 0.75), borderRadius: radius.pill, backgroundColor: colors.azulClaro, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: colors.azul, borderRadius: radius.pill },
  })
