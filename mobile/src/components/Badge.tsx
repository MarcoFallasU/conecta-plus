import { View } from 'react-native'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { createStyles } from './Badge.styles'

export type BadgeTone = 'accent' | 'success' | 'neutral'

interface BadgeProps {
  label: string
  tone?: BadgeTone
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const styles = useRoleStyles(createStyles)

  return (
    <View style={[styles.badge, styles[tone]]}>
      <AppText variant="caption" style={styles.label}>
        {label}
      </AppText>
    </View>
  )
}
