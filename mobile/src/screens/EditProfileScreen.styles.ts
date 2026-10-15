import { StyleSheet } from 'react-native'
import { borderWidth, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    header: { gap: display.spacing / 2 },
    form: { gap: display.spacing },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: display.spacing / 2 },
    contactForm: {
      gap: display.spacing,
      padding: display.spacing,
      backgroundColor: display.colors.blanco,
      borderRadius: radius.lg,
      borderWidth: borderWidth.hairline,
      borderColor: display.colors.line,
    },
  })
