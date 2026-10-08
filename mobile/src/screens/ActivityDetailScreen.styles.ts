import { StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { borderWidth, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    image: {
      width: '100%',
      height: Math.round(display.cardImageSize * 1.5),
      borderRadius: radius.lg,
      backgroundColor: colors.azulClaro,
    },
    info: { gap: display.spacing / 2 },
    badges: { flexDirection: 'row', flexWrap: 'wrap', gap: display.spacing / 2 },
    actions: { gap: display.spacing },
    reviewCard: {
      gap: display.spacing / 2,
      padding: display.spacing,
      backgroundColor: colors.blanco,
      borderRadius: radius.lg,
      borderWidth: borderWidth.hairline,
      borderColor: colors.line,
    },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: display.spacing / 2 },
    reviewName: { flex: 1 },
  })
