import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import { ActivityCard } from '../components/ActivityCard'
import { ActivityMap, type MapPin } from '../components/ActivityMap'
import { AppText } from '../components/AppText'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { Chip } from '../components/Chip'
import { EmptyState } from '../components/EmptyState'
import { Screen, TAB_EDGES } from '../components/Screen'
import { SegmentedControl } from '../components/SegmentedControl'
import { TextField } from '../components/TextField'
import { useAppData, useMyProfile } from '../context/AppDataContext'
import { ACTIVITY_CATEGORIES, categoryIcon } from '../data/categories'
import { getZone } from '../data/zones'
import { useAppNavigation } from '../navigation/useAppNavigation'
import type { TabParamList } from '../navigation/types'
import { useRoleStyles } from '../theme/useRoleStyles'
import { friendlyDate } from '../utils/dates'
import {
  DATE_FILTERS,
  DEFAULT_FILTERS,
  DISTANCE_FILTERS,
  SORT_OPTIONS,
  countActiveFilters,
  searchActivities,
  type SearchFilters,
} from '../utils/search'
import { createStyles } from './ExploreScreen.styles'

type Props = BottomTabScreenProps<TabParamList, 'Explore'>
type ExploreView = 'list' | 'map'

export function ExploreScreen({ route }: Props) {
  const navigation = useAppNavigation()
  const { activities, activitiesLoading, activitiesError, refreshActivities, attendeesCount } = useAppData()
  const profile = useMyProfile()
  const styles = useRoleStyles(createStyles)
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [view, setView] = useState<ExploreView>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Inicio abre esta pestaña directo en el mapa ("Ver mapa").
  const requestedView = route.params?.view
  const requestStamp = route.params?.stamp
  useEffect(() => {
    if (requestedView) setView(requestedView)
  }, [requestedView, requestStamp])

  const origin = getZone(profile.zoneId)
  const results = useMemo(() => searchActivities(activities, filters, origin), [activities, filters, origin])
  const activeFilters = countActiveFilters(filters)
  const update = (patch: Partial<SearchFilters>) => setFilters((prev) => ({ ...prev, ...patch }))
  const sortOptions = origin ? SORT_OPTIONS : SORT_OPTIONS.filter((option) => option.value !== 'distance')

  const selected = results.find((r) => r.activity.id === selectedId) ?? results[0]
  const pins: MapPin[] = results.map(({ activity }) => ({
    id: activity.id,
    lat: activity.lat,
    lng: activity.lng,
    icon: categoryIcon(activity.category),
    label: `${activity.title}, ${friendlyDate(activity.startsAt)}`,
    featured: activity.featured,
  }))

  const openActivity = (activityId: string) => navigation.navigate('ActivityDetail', { activityId })

  return (
    <Screen edges={TAB_EDGES}>
      <View style={styles.header}>
        <AppText variant="title">Buscar actividades</AppText>
        <AppText>{origin ? `Cerca de ${origin.name}.` : 'Encuentra algo para hacer cerca de ti.'}</AppText>
      </View>

      <TextField
        label="¿Qué buscas?"
        placeholder="Baile, caminata, charla..."
        value={filters.query}
        onChangeText={(query) => update({ query })}
        returnKeyType="search"
        autoCorrect={false}
      />

      <SegmentedControl
        options={[
          { value: 'list', label: 'Lista', icon: 'list-outline' },
          { value: 'map', label: 'Mapa', icon: 'map-outline' },
        ]}
        value={view}
        onChange={setView}
      />

      <Button
        variant="outline"
        icon={showFilters ? 'chevron-up' : 'options-outline'}
        label={`${showFilters ? 'Ocultar filtros' : 'Filtros'}${activeFilters > 0 ? ` (${activeFilters})` : ''}`}
        onPress={() => setShowFilters((value) => !value)}
      />

      {showFilters && (
        <View style={styles.filters}>
          <View style={styles.group}>
            <AppText variant="subtitle">Categoría</AppText>
            <View style={styles.chips}>
              <Chip label="Todas" selected={filters.category === null} onPress={() => update({ category: null })} />
              {ACTIVITY_CATEGORIES.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={filters.category === item}
                  onPress={() => update({ category: filters.category === item ? null : item })}
                />
              ))}
            </View>
          </View>

          <View style={styles.group}>
            <AppText variant="subtitle">Cuándo</AppText>
            <View style={styles.chips}>
              {DATE_FILTERS.map((option) => (
                <Chip key={option.value} label={option.label} selected={filters.date === option.value} onPress={() => update({ date: option.value })} />
              ))}
            </View>
          </View>

          <View style={styles.group}>
            <AppText variant="subtitle">Qué tan cerca</AppText>
            {origin ? (
              <View style={styles.chips}>
                {DISTANCE_FILTERS.map((option) => (
                  <Chip
                    key={String(option.value)}
                    label={option.label}
                    selected={filters.maxKm === option.value}
                    onPress={() => update({ maxKm: option.value })}
                  />
                ))}
              </View>
            ) : (
              <Banner tone="info">Elige tu zona en “Mis datos” para filtrar por cercanía.</Banner>
            )}
          </View>

          <View style={styles.group}>
            <AppText variant="subtitle">Ordenar por</AppText>
            <View style={styles.chips}>
              {sortOptions.map((option) => (
                <Chip key={option.value} label={option.label} selected={filters.sort === option.value} onPress={() => update({ sort: option.value })} />
              ))}
            </View>
          </View>

          {(activeFilters > 0 || filters.sort !== 'relevance') && (
            <Button variant="outline" icon="close-circle-outline" label="Quitar filtros" onPress={() => setFilters({ ...DEFAULT_FILTERS, query: filters.query })} />
          )}
        </View>
      )}

      {!origin && !showFilters && (
        <Banner tone="info">Indica tu zona en “Mis datos” para ver qué tan cerca queda cada actividad.</Banner>
      )}
      {!origin && !showFilters && <Button variant="secondary" icon="person-outline" label="Completar mis datos" onPress={() => navigation.navigate('EditProfile')} />}

      {activitiesError ? (
        <>
          <Banner tone="error">{activitiesError}</Banner>
          <Button variant="outline" icon="refresh-outline" label="Reintentar" onPress={refreshActivities} />
        </>
      ) : null}

      {activitiesLoading && activities.length === 0 ? (
        <AppText accessibilityLiveRegion="polite">Cargando actividades…</AppText>
      ) : (
        <AppText variant="caption" accessibilityLiveRegion="polite">
          {results.length} {results.length === 1 ? 'actividad encontrada' : 'actividades encontradas'}
        </AppText>
      )}

      {results.length === 0 && (activitiesLoading || activitiesError) ? null : results.length === 0 ? (
        <EmptyState icon="search-outline" title="Sin resultados" message="Prueba con otra palabra o quita algún filtro." />
      ) : view === 'map' ? (
        <>
          <ActivityMap
            pins={pins}
            origin={origin ? { lat: origin.lat, lng: origin.lng, label: `Tu zona: ${origin.name}` } : undefined}
            selectedId={selected?.activity.id ?? null}
            onSelect={setSelectedId}
          />
          {selected && (
            <ActivityCard
              activity={selected.activity}
              attendeesCount={attendeesCount(selected.activity.id)}
              distanceKm={selected.distanceKm}
              onPress={() => openActivity(selected.activity.id)}
            />
          )}
        </>
      ) : (
        results.map(({ activity, distanceKm }) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            attendeesCount={attendeesCount(activity.id)}
            distanceKm={distanceKm}
            onPress={() => openActivity(activity.id)}
          />
        ))
      )}
    </Screen>
  )
}
