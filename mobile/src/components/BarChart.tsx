import { View } from 'react-native'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { createStyles } from './BarChart.styles'

export interface BarChartItem {
  key: string
  label: string
  value: number
}

interface BarChartProps {
  items: BarChartItem[]
  // Descripción para el lector de pantalla (el gráfico es visual).
  summary: string
}

// Barras verticales simples (ej. asistencias por mes). Sin librería: el valor va
// escrito encima de cada barra para no depender de leer la altura.
export function BarChart({ items, summary }: BarChartProps) {
  const styles = useRoleStyles(createStyles)
  const max = Math.max(1, ...items.map((item) => item.value))
  const lastIndex = items.length - 1

  return (
    <View style={styles.root} accessible accessibilityLabel={summary}>
      {items.map((item, index) => (
        <View key={item.key} style={styles.column}>
          <AppText variant="caption" style={styles.value}>
            {item.value}
          </AppText>
          <View style={styles.barArea}>
            <View
              style={[
                styles.bar,
                index === lastIndex && styles.barCurrent,
                item.value === 0 && styles.barEmpty,
                { height: `${Math.max(4, (item.value / max) * 100)}%` },
              ]}
            />
          </View>
          <AppText variant="caption" style={styles.label}>
            {item.label}
          </AppText>
        </View>
      ))}
    </View>
  )
}
