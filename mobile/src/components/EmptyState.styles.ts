import { StyleSheet } from 'react-native'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    root: { alignItems: 'center', gap: display.spacing / 2, paddingVertical: display.spacing * 2, paddingHorizontal: display.spacing },
    text: { textAlign: 'center' },
  })
