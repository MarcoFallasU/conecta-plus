import { Text, View } from 'react-native'
import { useRoleStyles } from '../theme/useRoleStyles'
import { createStyles } from './Avatar.styles'

interface AvatarProps {
  name: string
  size?: 'md' | 'lg'
}

const HONORIFICS = ['doña', 'don', 'dña']

function initials(name: string) {
  return name
    .split(' ')
    .filter((word) => word && !HONORIFICS.includes(word.toLowerCase()))
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const styles = useRoleStyles(createStyles)

  return (
    <View style={[styles.base, styles[size]]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text style={size === 'lg' ? styles.initialsLg : styles.initialsMd}>{initials(name)}</Text>
    </View>
  )
}
