import { StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { borderWidth, radius, shadow } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.blanco,
      borderRadius: radius.lg,
      ...shadow.card,
    },
    pressed: { opacity: 0.9 },
    inner: {
      borderRadius: radius.lg,
      borderWidth: borderWidth.hairline,
      borderColor: colors.line,
      overflow: 'hidden',
    },
    innerHorizontal: { flexDirection: 'row' },
    image: { backgroundColor: colors.azulClaro },
    imageVertical: { width: '100%', height: display.cardImageSize },
    imageHorizontal: { width: display.cardImageSize, height: '100%' },
    body: { flex: 1, padding: display.spacing, gap: display.spacing / 2 },
    badges: { flexDirection: 'row', flexWrap: 'wrap', gap: display.spacing / 2 },
  })
