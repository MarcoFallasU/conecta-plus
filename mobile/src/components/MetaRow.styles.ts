import { StyleSheet } from 'react-native'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: display.spacing / 2 },
    text: { flex: 1 },
  })
