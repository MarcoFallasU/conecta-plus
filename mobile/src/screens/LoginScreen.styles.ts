import { StyleSheet } from 'react-native'
import type { RoleDisplayTokens } from '../theme/roleDisplay'

export const createStyles = (display: RoleDisplayTokens) =>
  StyleSheet.create({
    form: { gap: display.spacing },
    demo: { gap: display.spacing / 2 },
  })
