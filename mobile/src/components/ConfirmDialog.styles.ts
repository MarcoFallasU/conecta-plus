import { StyleSheet } from 'react-native'
import { borderWidth, radius, shadow } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: display.colors.scrim,
      justifyContent: 'center',
      padding: display.spacing * 1.25,
    },
    card: {
      gap: display.spacing,
      padding: display.spacing * 1.5,
      backgroundColor: display.colors.crema,
      borderRadius: radius.lg,
      borderWidth: borderWidth.hairline,
      borderColor: display.colors.line,
      ...shadow.card,
    },
    actions: { gap: display.spacing / 2 },
  })
