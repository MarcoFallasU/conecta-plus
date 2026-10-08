import { StyleSheet } from 'react-native'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    header: { gap: display.spacing / 2 },
    chipsScroll: { flexGrow: 0 },
    chips: { gap: display.spacing / 2, paddingVertical: 2 },
  })
