import { StyleSheet } from 'react-native'
import { radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) => {
  const heroSize = display.touchTargetSize * 3

  return StyleSheet.create({
    hero: { alignItems: 'center', gap: display.spacing, paddingVertical: display.spacing * 2 },
    heroIcon: {
      width: heroSize,
      height: heroSize,
      borderRadius: radius.pill,
      backgroundColor: display.colors.azulClaro,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centered: { textAlign: 'center' },
    sizePicker: { gap: display.spacing / 2 },
    actions: { gap: display.spacing },
  })
}
