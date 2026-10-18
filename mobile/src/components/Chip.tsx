import { Pressable } from 'react-native'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { createStyles } from './Chip.styles'

interface ChipProps {
  label: string
  selected: boolean
  onPress: () => void
}

export function Chip({ label, selected, onPress }: ChipProps) {
  const styles = useRoleStyles(createStyles)

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      <AppText style={[styles.label, selected && styles.labelSelected]}>{label}</AppText>
    </Pressable>
  )
}
