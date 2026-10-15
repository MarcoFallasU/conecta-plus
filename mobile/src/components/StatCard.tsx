import { View } from 'react-native'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { createStyles } from './StatCard.styles'

interface StatCardProps {
  value: number | string
  label: string
}

export function StatCard({ value, label }: StatCardProps) {
  const styles = useRoleStyles(createStyles)

  return (
    <View style={styles.card} accessible accessibilityLabel={`${label}: ${value}`}>
      <AppText variant="title">{value}</AppText>
      <AppText variant="caption" style={styles.label}>
        {label}
      </AppText>
    </View>
  )
}
