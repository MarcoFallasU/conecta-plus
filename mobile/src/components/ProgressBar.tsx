import { View } from 'react-native'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { createStyles } from './ProgressBar.styles'

interface ProgressBarProps {
  // Entre 0 y 1.
  value: number
  label?: string
  valueLabel?: string
}

export function ProgressBar({ value, label, valueLabel }: ProgressBarProps) {
  const styles = useRoleStyles(createStyles)
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100)

  return (
    <View style={styles.root}>
      {(label || valueLabel) && (
        <View style={styles.header}>
          {label ? <AppText style={styles.label}>{label}</AppText> : <View style={styles.label} />}
          {valueLabel ? <AppText style={styles.value}>{valueLabel}</AppText> : null}
        </View>
      )}
      <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  )
}
