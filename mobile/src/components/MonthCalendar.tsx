import { Pressable, View } from 'react-native'
import { useRoleStyles } from '../theme/useRoleStyles'
import { addMonths, dayKey, formatMonthYear, isSameDay, monthName } from '../utils/dates'
import { AppText } from './AppText'
import { IconButton } from './IconButton'
import { createStyles } from './MonthCalendar.styles'

interface MonthCalendarProps {
  // Cualquier fecha del mes que se muestra.
  month: Date
  onChangeMonth: (month: Date) => void
  // Cantidad de actividades por día ('aaaa-mm-dd').
  marked: Record<string, number>
  selected: string | null
  onSelect: (key: string) => void
}

const WEEKDAY_INITIALS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

function buildCells(month: Date): (Date | null)[] {
  const year = month.getFullYear()
  const index = month.getMonth()
  const offset = (new Date(year, index, 1).getDay() + 6) % 7 // la semana empieza el lunes
  const days = new Date(year, index + 1, 0).getDate()
  const cells: (Date | null)[] = Array(offset).fill(null)
  for (let day = 1; day <= days; day += 1) cells.push(new Date(year, index, day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function MonthCalendar({ month, onChangeMonth, marked, selected, onSelect }: MonthCalendarProps) {
  const styles = useRoleStyles(createStyles)
  const cells = buildCells(month)
  const today = new Date()
  const weeks = Array.from({ length: cells.length / 7 }, (_, row) => cells.slice(row * 7, row * 7 + 7))

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" label="Mes anterior" onPress={() => onChangeMonth(addMonths(month, -1))} />
        <AppText variant="subtitle" accessibilityRole="header" style={styles.title}>
          {formatMonthYear(month)}
        </AppText>
        <IconButton icon="chevron-forward" label="Mes siguiente" onPress={() => onChangeMonth(addMonths(month, 1))} />
      </View>

      <View style={styles.weekRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {WEEKDAY_INITIALS.map((initial, index) => (
          <AppText key={`${initial}-${index}`} variant="caption" style={styles.weekday}>
            {initial}
          </AppText>
        ))}
      </View>

      {weeks.map((week, row) => (
        <View key={row} style={styles.weekRow}>
          {week.map((date, column) => {
            if (!date) return <View key={column} style={styles.cell} />

            const key = dayKey(date)
            const count = marked[key] ?? 0
            const isSelected = selected === key
            const isToday = isSameDay(date, today)
            const label = `${date.getDate()} de ${monthName(date)}${isToday ? ', hoy' : ''}${
              count ? `, ${count} ${count === 1 ? 'actividad' : 'actividades'}` : ''
            }`

            return (
              <View key={column} style={styles.cell}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  aria-selected={isSelected}
                  onPress={() => onSelect(key)}
                  style={({ pressed }) => [
                    styles.day,
                    isToday && styles.dayToday,
                    isSelected && styles.daySelected,
                    pressed && styles.dayPressed,
                  ]}
                >
                  <AppText style={[styles.dayNumber, count > 0 && styles.dayNumberMarked, isSelected && styles.dayNumberSelected]}>
                    {date.getDate()}
                  </AppText>
                  <View style={styles.dots}>
                    {Array.from({ length: Math.min(count, 3) }, (_, dot) => (
                      <View key={dot} style={[styles.dot, isSelected && styles.dotSelected]} />
                    ))}
                  </View>
                </Pressable>
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )
}
