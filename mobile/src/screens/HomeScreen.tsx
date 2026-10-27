import { useState } from 'react'
import { View } from 'react-native'
import { ActionTile } from '../components/ActionTile'
import { ActivityCard } from '../components/ActivityCard'
import { AppText } from '../components/AppText'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { IconButton } from '../components/IconButton'
import { NoticeCard } from '../components/NoticeCard'
import { Screen, TAB_EDGES } from '../components/Screen'
import { Section } from '../components/Section'
import { StatCard } from '../components/StatCard'
import { useAppData, useMyProfile } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import { getZone } from '../data/zones'
import { useAppNavigation } from '../navigation/useAppNavigation'
import { useCan } from '../permissions/permissions'
import { useRoleStyles } from '../theme/useRoleStyles'
import { isOpen } from '../utils/capacity'
import { formatLongDate, greeting, isPast, timeUntil } from '../utils/dates'
import { distanceKm } from '../utils/geo'
import { openExternal, telUrl } from '../utils/links'
import { deriveNotices } from '../utils/notices'
import { greetingName } from '../utils/people'
import { suggestActivities } from '../utils/recommendations'
import { createStyles } from './HomeScreen.styles'

export function HomeScreen() {
  const navigation = useAppNavigation()
  const { user } = useSessionUser()
  const {
    accounts,
    activities,
    activitiesError,
    refreshActivities,
    enrollments,
    attendeesCount,
    attendance,
    links,
    recommendations,
    dismissedNotices,
  } = useAppData()
  const profile = useMyProfile()
  const styles = useRoleStyles(createStyles)
  const canRegister = useCan('register_self')
  const canViewFamily = useCan('view_family')
  const canViewProgress = useCan('view_progress')
  const canEmergency = useCan('manage_emergency_contacts')
  const canEditInterests = useCan('edit_interests')
  const canCreate = useCan('create_event')
  const [confirmCall, setConfirmCall] = useState(false)

  if (!user) return null

  const origin = getZone(profile.zoneId)
  const today = formatLongDate(new Date())
  const notices = deriveNotices({
    userId: user.id,
    activities,
    enrollments,
    attendance,
    links,
    recommendations,
    accounts,
    dismissed: dismissedNotices,
  })
  const urgent = notices.filter((notice) => notice.urgent).slice(0, 2)
  const pendingNotices = notices.length

  const upcomingMine = activities
    .filter((a) => isOpen(a) && !isPast(a.startsAt) && (enrollments[a.id] ?? []).includes(user.id))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const next = upcomingMine[0]

  const suggestions = canRegister
    ? suggestActivities({ userId: user.id, profile, activities, enrollments, attendeesCount, attendance, recommendations, accounts, origin })
    : []

  const suggestedIds = new Set(suggestions.map((s) => s.activity.id))
  const featured = activities
    .filter((a) => isOpen(a) && a.featured && !isPast(a.startsAt) && a.createdBy !== user.id)
    .filter((a) => !suggestedIds.has(a.id) && !(enrollments[a.id] ?? []).includes(user.id))
    .sort((a, b) => (origin ? distanceKm(origin, a) - distanceKm(origin, b) : a.startsAt.localeCompare(b.startsAt)))
    .slice(0, 3)

  const published = activities.filter((a) => a.createdBy === user.id)
  const publishedUpcoming = published.filter((a) => isOpen(a) && !isPast(a.startsAt))
  const enrolledInMine = publishedUpcoming.reduce((total, a) => total + attendeesCount(a.id), 0)

  const needsProfile = !profile.zoneId || (canEditInterests && profile.interests.length === 0)
  const emergencyContact = profile.emergencyContacts[0]

  const openActivity = (activityId: string) => navigation.navigate('ActivityDetail', { activityId })
  const distanceTo = (lat: number, lng: number) => (origin ? distanceKm(origin, { lat, lng }) : null)

  return (
    <Screen edges={TAB_EDGES}>
      <View style={styles.header}>
        <View style={styles.headerTexts}>
          {/* Una organización se saluda por su nombre completo; a una persona, por su nombre de pila. */}
          <AppText variant="title">{`${greeting()}, ${canRegister ? greetingName(user.name) : user.name}`}</AppText>
          <AppText variant="caption">{today.charAt(0).toUpperCase() + today.slice(1)}</AppText>
        </View>
        <IconButton icon="notifications-outline" label="Mis avisos" badge={pendingNotices} onPress={() => navigation.navigate('Notices')} />
      </View>

      {activitiesError ? (
        <View style={styles.block}>
          <Banner tone="error">{activitiesError}</Banner>
          <Button variant="outline" icon="refresh-outline" label="Reintentar" onPress={refreshActivities} />
        </View>
      ) : null}

      {needsProfile && (
        <View style={styles.block}>
          <Banner tone="info">
            {canEditInterests
              ? 'Cuéntanos tu zona y qué te gusta para mostrarte actividades cerca de ti y que te interesen.'
              : 'Indica tu zona para ver qué tan cerca queda cada actividad.'}
          </Banner>
          <Button variant="secondary" icon="create-outline" label="Completar mis datos" onPress={() => navigation.navigate('EditProfile')} />
        </View>
      )}

      {urgent.length > 0 && (
        <Section title="Para hacer ahora">
          {urgent.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}
          {pendingNotices > urgent.length && (
            <Button variant="outline" icon="notifications-outline" label={`Ver todos mis avisos (${pendingNotices})`} onPress={() => navigation.navigate('Notices')} />
          )}
        </Section>
      )}

      {canRegister && (
        <Section title="Tu próxima actividad">
          {next ? (
            <ActivityCard
              activity={next}
              attendeesCount={attendeesCount(next.id)}
              badge={timeUntil(next.startsAt) || undefined}
              distanceKm={distanceTo(next.lat, next.lng)}
              onPress={() => openActivity(next.id)}
            />
          ) : (
            <>
              <EmptyState icon="calendar-outline" title="Aún no tienes actividades" message="Busca algo que te guste y reserva tu lugar." />
              <Button icon="search-outline" label="Buscar actividades" onPress={() => navigation.navigate('Explore', { view: 'list', stamp: Date.now() })} />
            </>
          )}
        </Section>
      )}

      <Section title="¿Qué quieres hacer?">
        <View style={styles.tiles}>
          <ActionTile icon="search-outline" label="Buscar actividades" onPress={() => navigation.navigate('Explore', { view: 'list', stamp: Date.now() })} />
          <ActionTile icon="map-outline" label="Ver mapa" onPress={() => navigation.navigate('Explore', { view: 'map', stamp: Date.now() })} />
          <ActionTile icon="calendar-outline" label="Mi agenda" onPress={() => navigation.navigate('Agenda')} />
          {canViewFamily && <ActionTile icon="people-outline" label="Mi familia" onPress={() => navigation.navigate('Family')} />}
          {canViewProgress && <ActionTile icon="stats-chart-outline" label="Mi resumen" onPress={() => navigation.navigate('Progress')} />}
          {canCreate && <ActionTile icon="megaphone-outline" label="Publicar evento" onPress={() => navigation.navigate('CreateEvent')} />}
          {canEmergency && (
            <ActionTile
              tone="alert"
              icon="call-outline"
              label={emergencyContact ? 'Llamar a mi contacto' : 'Agregar contacto de emergencia'}
              hint={emergencyContact ? emergencyContact.name : undefined}
              onPress={() => (emergencyContact ? setConfirmCall(true) : navigation.navigate('EditProfile'))}
            />
          )}
        </View>
      </Section>

      {canRegister && suggestions.length > 0 && (
        <Section title="Para ti">
          {suggestions.map(({ activity, reasons, distanceKm: km }) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              attendeesCount={attendeesCount(activity.id)}
              badge={reasons[0]}
              distanceKm={km}
              onPress={() => openActivity(activity.id)}
            />
          ))}
        </Section>
      )}

      {!canRegister && (
        <Section title="Tus eventos">
          <View style={styles.statsRow}>
            <StatCard value={publishedUpcoming.length} label="Próximos eventos" />
            <StatCard value={enrolledInMine} label="Inscritos" />
          </View>
          <Button variant="outline" icon="calendar-outline" label="Ver mis eventos" onPress={() => navigation.navigate('Agenda')} />
        </Section>
      )}

      {featured.length > 0 && (
        <Section title="Destacadas esta semana">
          {featured.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              attendeesCount={attendeesCount(activity.id)}
              distanceKm={distanceTo(activity.lat, activity.lng)}
              onPress={() => openActivity(activity.id)}
            />
          ))}
        </Section>
      )}

      <ConfirmDialog
        visible={confirmCall}
        title="¿Llamar ahora?"
        message={emergencyContact ? `Vamos a llamar a ${emergencyContact.name} (${emergencyContact.relation}).` : ''}
        confirmLabel="Sí, llamar"
        cancelLabel="No, volver"
        onConfirm={() => {
          setConfirmCall(false)
          if (emergencyContact) openExternal(telUrl(emergencyContact.phone))
        }}
        onCancel={() => setConfirmCall(false)}
      />
    </Screen>
  )
}
