import { useState } from 'react'
import { View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppText } from '../components/AppText'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { Chip } from '../components/Chip'
import { EmptyState } from '../components/EmptyState'
import { Screen } from '../components/Screen'
import { TextField } from '../components/TextField'
import { useAppData } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import { ACTIVITY_CATEGORIES } from '../data/categories'
import type { RootStackParamList } from '../navigation/types'
import { useCan } from '../permissions/permissions'
import { CREATE_EVENT_REPUTATION_THRESHOLD } from '../permissions/reputation'
import { useRoleStyles } from '../theme/useRoleStyles'
import { daysFromNow, formatDay, formatTime } from '../utils/dates'
import { createStyles } from './CreateEventScreen.styles'

type Props = NativeStackScreenProps<RootStackParamList, 'CreateEvent'>

const DAY_OFFSETS = Array.from({ length: 14 }, (_, index) => index + 1)
const HOURS = [7, 8, 9, 10, 11, 14, 15, 16, 17, 18]

interface FormErrors {
  title?: string
  place?: string
  category?: string
  when?: string
}

export function CreateEventScreen({ navigation }: Props) {
  const { user } = useSessionUser()
  const { createActivity } = useAppData()
  const canCreate = useCan('create_event')
  const styles = useRoleStyles(createStyles)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [place, setPlace] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [dayOffset, setDayOffset] = useState<number | null>(null)
  const [hour, setHour] = useState<number | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})

  if (!user || !canCreate) {
    return (
      <Screen>
        <EmptyState
          icon="lock-closed-outline"
          title="Aún no puedes crear eventos"
          message={`Necesitas ${CREATE_EVENT_REPUTATION_THRESHOLD} puntos de reputación. Deja reseñas en actividades a las que asististe.`}
        />
      </Screen>
    )
  }

  function handleSubmit() {
    const next: FormErrors = {}
    if (title.trim().length < 3) next.title = 'Escribe un título de al menos 3 letras.'
    if (place.trim().length < 3) next.place = 'Indica dónde será el evento.'
    if (!category) next.category = 'Elige una categoría.'
    if (dayOffset === null || hour === null) next.when = 'Elige el día y la hora.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const activity = createActivity({
      title: title.trim(),
      description: description.trim() || 'Sin descripción.',
      category: category!,
      startsAt: daysFromNow(dayOffset!, hour!),
      place: place.trim(),
      createdBy: user!.id,
    })
    navigation.replace('ActivityDetail', { activityId: activity.id })
  }

  return (
    <Screen>
      <View style={styles.form}>
        <TextField label="Título del evento" value={title} onChangeText={setTitle} error={errors.title} />
        <TextField label="Descripción (opcional)" value={description} onChangeText={setDescription} multiline />
        <TextField label="Lugar" value={place} onChangeText={setPlace} error={errors.place} />

        <View style={styles.group}>
          <AppText variant="subtitle">Categoría</AppText>
          <View style={styles.chips}>
            {ACTIVITY_CATEGORIES.map((item) => (
              <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />
            ))}
          </View>
          {errors.category ? <AppText variant="caption" style={styles.error}>{errors.category}</AppText> : null}
        </View>

        <View style={styles.group}>
          <AppText variant="subtitle">Día</AppText>
          <View style={styles.chips}>
            {DAY_OFFSETS.map((offset) => (
              <Chip
                key={offset}
                label={formatDay(new Date(daysFromNow(offset)))}
                selected={dayOffset === offset}
                onPress={() => setDayOffset(offset)}
              />
            ))}
          </View>
        </View>

        <View style={styles.group}>
          <AppText variant="subtitle">Hora</AppText>
          <View style={styles.chips}>
            {HOURS.map((item) => (
              <Chip key={item} label={formatTime(new Date(2000, 0, 1, item))} selected={hour === item} onPress={() => setHour(item)} />
            ))}
          </View>
          {errors.when ? <AppText variant="caption" style={styles.error}>{errors.when}</AppText> : null}
        </View>

        {Object.keys(errors).length > 0 && <Banner tone="error">Revisa los campos marcados antes de publicar.</Banner>}
        <Button label="Publicar evento" icon="megaphone-outline" onPress={handleSubmit} />
      </View>
    </Screen>
  )
}
