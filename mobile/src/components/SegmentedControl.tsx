import { Pressable, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { IconName } from '../theme/designSystem'
import { useRoleDisplay } from '../theme/roleDisplay'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { createStyles } from './SegmentedControl.styles'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: IconName
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
}

// Opciones excluyentes en una sola fila (ej. Lista | Mapa). Todas visibles a la vez:
// para el adulto mayor es más claro que un menú desplegable.
export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const display = useRoleDisplay()
  const styles = useRoleStyles(createStyles)

  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {options.map((option, index) => {
        const selected = option.value === value

        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              index > 0 && styles.optionDivider,
              selected && styles.optionSelected,
              pressed && styles.pressed,
            ]}
          >
            {option.icon && (
              <Ionicons
                name={option.icon}
                size={Math.round(display.baseFontSize * 1.1)}
                color={selected ? display.colors.blanco : display.colors.azul}
              />
            )}
            <AppText style={[styles.label, selected && styles.labelSelected]}>{option.label}</AppText>
          </Pressable>
        )
      })}
    </View>
  )
}
