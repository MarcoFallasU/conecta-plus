import { StyleSheet } from 'react-native'
import { radius } from '../theme/designSystem'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    form: { gap: display.spacing },
    group: { gap: display.spacing / 2 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: display.spacing / 2 },
    error: { color: display.colors.error },
    imagePreview: { width: '100%', aspectRatio: 1.6, borderRadius: radius.md },
  })
