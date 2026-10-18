import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { ActivityCard } from '../components/ActivityCard'
import { AppText } from '../components/AppText'
import { Chip } from '../components/Chip'
import { EmptyState } from '../components/EmptyState'
import { Screen, TAB_EDGES } from '../components/Screen'
import { TextField } from '../components/TextField'
import { useAppData } from '../context/AppDataContext'
import { ACTIVITY_CATEGORIES } from '../data/categories'
import { useAppNavigation } from '../navigation/useAppNavigation'
import { useRoleStyles } from '../theme/useRoleStyles'
import { isPast } from '../utils/dates'
import { createStyles } from './HomeScreen.styles'

export function HomeScreen() {
  const navigation = useAppNavigation()
  const { activities, enrollments } = useAppData()
  const styles = useRoleStyles(createStyles)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  const normalizedQuery = query.trim().toLowerCase()
  const results = activities
    .filter((a) => !isPast(a.startsAt))
    .filter((a) => !category || a.category === category)
    .filter(
      (a) =>
        !normalizedQuery ||
        [a.title, a.place, a.category, a.description].some((field) => field.toLowerCase().includes(normalizedQuery)),
    )
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.startsAt.localeCompare(b.startsAt))

  return (
    <Screen edges={TAB_EDGES}>
      <View style={styles.header}>
        <AppText variant="title">Explorar actividades</AppText>
        <AppText>Encuentra algo para hacer cerca de ti.</AppText>
      </View>

      <TextField
        label="Buscar"
        placeholder="Nombre, lugar o categoría"
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        autoCorrect={false}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
        <Chip label="Todas" selected={category === null} onPress={() => setCategory(null)} />
        {ACTIVITY_CATEGORIES.map((item) => (
          <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(category === item ? null : item)} />
        ))}
      </ScrollView>

      <AppText variant="caption">
        {results.length} {results.length === 1 ? 'actividad encontrada' : 'actividades encontradas'}
      </AppText>

      {results.length === 0 ? (
        <EmptyState icon="search-outline" title="Sin resultados" message="Prueba con otra palabra o quita el filtro de categoría." />
      ) : (
        results.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            attendeesCount={enrollments[activity.id]?.length ?? 0}
            onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.id })}
          />
        ))
      )}
    </Screen>
  )
}
