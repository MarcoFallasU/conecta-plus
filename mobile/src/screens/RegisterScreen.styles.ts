import { StyleSheet } from 'react-native'
import { borderWidth, radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    form: { gap: display.spacing },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: display.spacing,
      padding: display.spacing,
      backgroundColor: display.colors.blanco,
      borderRadius: radius.lg,
      borderWidth: borderWidth.strong,
      borderColor: display.colors.line,
    },
    optionSelected: { borderColor: display.colors.azul, backgroundColor: display.colors.azulClaro },
    optionPressed: { opacity: 0.9 },
    optionText: { flex: 1, gap: display.spacing / 4 },
  })
