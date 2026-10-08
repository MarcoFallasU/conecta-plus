import { StyleSheet } from 'react-native'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center' },
    star: { minWidth: display.touchTargetSize * 0.8, minHeight: display.touchTargetSize * 0.8, alignItems: 'center', justifyContent: 'center' },
    starReadOnly: { paddingRight: display.spacing / 4 },
  })
