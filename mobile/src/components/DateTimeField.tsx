import { createElement, useState } from 'react'
import { Platform, View } from 'react-native'
import { AppText } from './AppText'
import { Button } from './Button'
import { colors } from '../theme/colors'
import { useRoleDisplay } from '../theme/roleDisplay'
import { formatDay, formatTime } from '../utils/dates'

// El selector nativo solo existe en celular; se carga únicamente ahí para no romper la versión web.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Native: any = Platform.OS === 'web' ? null : require('@react-native-community/datetimepicker')

type Mode = 'date' | 'time'

interface Props {
  label: string
  mode: Mode
  value: Date | null
  onChange: (value: Date) => void
  minimumDate?: Date
}

const pad = (n: number) => String(n).padStart(2, '0')

function toInputValue(date: Date | null, mode: Mode) {
  if (!date) return ''
  return mode === 'date'
    ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    : `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromInputValue(text: string, mode: Mode): Date | null {
  if (!text) return null
  if (mode === 'date') {
    const [year, month, day] = text.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const [hours, minutes] = text.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

// Selector de fecha u hora: calendario y reloj del sistema, con cualquier hora y minuto.
// En web usa el selector del navegador; en celular, el selector nativo de Android o iOS.
export function DateTimeField({ label, mode, value, onChange, minimumDate }: Props) {
  const display = useRoleDisplay()
  const [showIosPicker, setShowIosPicker] = useState(false)

  if (Platform.OS === 'web') {
    return (
      <View style={{ gap: 8 }}>
        <AppText variant="subtitle">{label}</AppText>
        {createElement('input', {
          type: mode,
          value: toInputValue(value, mode),
          min: mode === 'date' && minimumDate ? toInputValue(minimumDate, 'date') : undefined,
          'aria-label': label,
          onChange: (event: { target: { value: string } }) => {
            const next = fromInputValue(event.target.value, mode)
            if (next) onChange(next)
          },
          style: {
            fontSize: display.baseFontSize,
            padding: Math.round(display.baseFontSize * 0.7),
            minHeight: 48,
            borderRadius: 12,
            border: `2px solid ${colors.azul}`,
            backgroundColor: 'transparent',
            color: 'inherit',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            width: '100%',
          },
        })}
      </View>
    )
  }

  const text = value
    ? mode === 'date'
      ? formatDay(value)
      : formatTime(value)
    : mode === 'date'
      ? 'Elegir fecha'
      : 'Elegir hora'

  function open() {
    const current = value ?? new Date()
    if (Platform.OS === 'android') {
      Native.DateTimePickerAndroid.open({
        value: current,
        mode,
        minimumDate,
        is24Hour: false,
        onChange: (event: { type: string }, selected?: Date) => {
          if (event.type === 'set' && selected) onChange(selected)
        },
      })
    } else {
      setShowIosPicker((visible) => !visible)
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <AppText variant="subtitle">{label}</AppText>
      <Button
        variant="outline"
        icon={mode === 'date' ? 'calendar-outline' : 'time-outline'}
        label={text}
        onPress={open}
      />
      {Platform.OS === 'ios' && showIosPicker ? (
        <Native.default
          value={value ?? new Date()}
          mode={mode}
          display={mode === 'date' ? 'inline' : 'spinner'}
          minimumDate={minimumDate}
          onChange={(_event: unknown, selected?: Date) => {
            if (selected) onChange(selected)
          }}
        />
      ) : null}
    </View>
  )
}