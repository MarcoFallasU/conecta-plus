import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../theme/colors'
import type { IconName } from '../theme/designSystem'
import { useRoleDisplay } from '../theme/roleDisplay'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { createStyles } from './MetaRow.styles'

interface MetaRowProps {
  icon: IconName
  text: string
}

export function MetaRow({ icon, text }: MetaRowProps) {
  const display = useRoleDisplay()
  const styles = useRoleStyles(createStyles)

  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={Math.round(display.baseFontSize * 1.1)} color={colors.azul} />
      <AppText style={styles.text}>{text}</AppText>
    </View>
  )
}
