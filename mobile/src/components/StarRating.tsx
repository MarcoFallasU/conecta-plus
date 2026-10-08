import { Pressable, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../theme/colors'
import { useRoleDisplay } from '../theme/roleDisplay'
import { useRoleStyles } from '../theme/useRoleStyles'
import { createStyles } from './StarRating.styles'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
}

const STARS = [1, 2, 3, 4, 5]

export function StarRating({ value, onChange }: StarRatingProps) {
  const display = useRoleDisplay()
  const styles = useRoleStyles(createStyles)
  const size = Math.round(display.baseFontSize * (onChange ? 1.8 : 1.2))

  return (
    <View style={styles.row} accessibilityLabel={`Calificación: ${value} de 5`}>
      {STARS.map((star) => {
        const icon = <Ionicons name={star <= value ? 'star' : 'star-outline'} size={size} color={colors.amarillo} />

        return onChange ? (
          <Pressable
            key={star}
            accessibilityRole="button"
            accessibilityLabel={`${star} de 5 estrellas`}
            onPress={() => onChange(star)}
            style={styles.star}
          >
            {icon}
          </Pressable>
        ) : (
          <View key={star} style={styles.starReadOnly}>
            {icon}
          </View>
        )
      })}
    </View>
  )
}
