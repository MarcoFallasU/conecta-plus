import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../theme/colors'
import type { IconName } from '../theme/designSystem'
import { useRoleDisplay } from '../theme/roleDisplay'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { createStyles } from './EmptyState.styles'

interface EmptyStateProps {
  icon: IconName
  title: string
  message: string
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  const display = useRoleDisplay()
  const styles = useRoleStyles(createStyles)

  return (
    <View style={styles.root}>
      <Ionicons name={icon} size={Math.round(display.baseFontSize * 2.4)} color={colors.grisMedio} />
      <AppText variant="subtitle" style={styles.text}>
        {title}
      </AppText>
      <AppText style={styles.text}>{message}</AppText>
    </View>
  )
}
