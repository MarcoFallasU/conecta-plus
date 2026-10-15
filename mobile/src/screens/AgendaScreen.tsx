import { useState } from 'react'
import { View } from 'react-native'
import { ActivityCard } from '../components/ActivityCard'
import { AppText } from '../components/AppText'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { MonthCalendar } from '../components/MonthCalendar'
import { Screen, TAB_EDGES } from '../components/Screen'
import { SegmentedControl } from '../components/SegmentedControl'
import { Section } from '../components/Section'
import { useAppData } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import { attendanceKey, type Activity } from '../data/types'
import { useAppNavigation } from '../navigation/useAppNavigation'
import { useCan } from '../permissions/permissions'
import { CREATE_EVENT_REPUTATION_THRESHOLD } from '../permissions/reputation'
import { useRoleStyles } from '../theme/useRoleStyles'
import { dayKey, formatLongDate, isPast } from '../utils/dates'
import { createStyles } from './AgendaScreen.styles'

type AgendaView = 'list' | 'calendar'

const byDate = (a: Activity, b: Activity) => a.startsAt.localeCompare(b.startsAt)
// El historial puede ser largo: se muestran las más recientes y el resto bajo demanda.
const HISTORY_PREVIEW = 4

export function AgendaScreen() {
  const navigation = useAppNavigation()
  const { user } = useSessionUser()
  const { activities, enrollments, attendance, confirmAttendance } = useAppData()
  const canRegister = useCan('register_self')
  const canCreate = useCan('create_event')
  const canConfirm = useCan('confirm_attendance')
  const styles = useRoleStyles(createStyles)
  const [view, setView] = useState<AgendaView>('list')
  const [month, setMonth] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(() => dayKey(new Date()))
  const [showAllHistory, setShowAllHistory] = useState(false)

  if (!user) return null

  const mine = activities.filter((a) => enrollments[a.id]?.includes(user.id))
  const upcoming = mine.filter((a) => !isPast(a.startsAt)).sort(byDate)
  const past = mine.filter((a) => isPast(a.startsAt) && a.status === 'disponible')
  const toConfirm = past.filter((a) => attendance[attendanceKey(a.id, user.id)] === undefined).sort((a, b) => byDate(b, a))
  const history = past.filter((a) => attendance[attendanceKey(a.id, user.id)] !== undefined).sort((a, b) => byDate(b, a))
  // Primero lo que viene (de la más cercana a la más lejana) y después lo ya finalizado.
  const published = activities
    .filter((a) => a.createdBy === user.id)
    .sort((a, b) => Number(isPast(a.startsAt)) - Number(isPast(b.startsAt)) || (isPast(a.startsAt) ? byDate(b, a) : byDate(a, b)))

  // Todo lo que aparece en el calendario: inscripciones y eventos propios.
  const calendarItems = Array.from(new Map([...mine, ...published].map((a) => [a.id, a])).values())
  const marked: Record<string, number> = {}
  for (const activity of calendarItems) {
    const key = dayKey(new Date(activity.startsAt))
    marked[key] = (marked[key] ?? 0) + 1
  }
  const dayItems = selectedDay ? calendarItems.filter((a) => dayKey(new Date(a.startsAt)) === selectedDay).sort(byDate) : []
  const hasAnything = calendarItems.length > 0

  const renderCard = (activity: Activity, badge?: string) => (
    <ActivityCard
      key={activity.id}
      activity={activity}
      attendeesCount={enrollments[activity.id]?.length ?? 0}
      badge={badge}
      onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.id })}
    />
  )

  const historyBadge = (activity: Activity) =>
    attendance[attendanceKey(activity.id, user.id)] === 'asistio' ? 'Asististe' : 'No asististe'

  return (
    <Screen edges={TAB_EDGES}>
      <View style={styles.header}>
        <AppText variant="title">Mi agenda</AppText>
        <AppText>{canRegister ? 'Tus actividades y los eventos que publicas.' : 'Los eventos que has publicado.'}</AppText>
      </View>

      <SegmentedControl
        options={[
          { value: 'list', label: 'Lista', icon: 'list-outline' },
          { value: 'calendar', label: 'Calendario', icon: 'calendar-outline' },
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'calendar' ? (
        <>
          <MonthCalendar month={month} onChangeMonth={setMonth} marked={marked} selected={selectedDay} onSelect={setSelectedDay} />
          <Section title={selectedDay ? formatDay(selectedDay) : 'Elige un día'}>
            {dayItems.length === 0 ? (
              <AppText>{hasAnything ? 'No tienes actividades este día.' : 'Aún no tienes actividades en tu calendario.'}</AppText>
            ) : (
              dayItems.map((activity) => renderCard(activity, activity.createdBy === user.id ? 'Tu evento' : undefined))
            )}
          </Section>
        </>
      ) : (
        <>
          {canRegister && canConfirm && toConfirm.length > 0 && (
            <Section title="Cuéntanos cómo te fue">
              {toConfirm.map((activity) => (
                <View key={activity.id} style={styles.confirmBlock}>
                  {renderCard(activity)}
                  <AppText variant="subtitle">¿Asististe?</AppText>
                  <Button label="Sí, asistí" icon="checkmark-circle-outline" onPress={() => confirmAttendance(activity.id, user.id, true)} />
                  <Button label="No pude ir" variant="outline" onPress={() => confirmAttendance(activity.id, user.id, false)} />
                </View>
              ))}
            </Section>
          )}

          {canRegister && (
            <Section title="Próximas inscripciones">
              {upcoming.length === 0 ? (
                <>
                  <EmptyState icon="calendar-outline" title="Aún no tienes inscripciones" message="Explora las actividades y reserva tu lugar." />
                  <Button label="Buscar actividades" icon="search-outline" onPress={() => navigation.navigate('Explore')} />
                </>
              ) : (
                upcoming.map((activity) => renderCard(activity))
              )}
            </Section>
          )}

          {canRegister && history.length > 0 && (
            <Section title="Mi historial">
              {(showAllHistory ? history : history.slice(0, HISTORY_PREVIEW)).map((activity) => renderCard(activity, historyBadge(activity)))}
              {history.length > HISTORY_PREVIEW && (
                <Button
                  variant="outline"
                  icon={showAllHistory ? 'chevron-up' : 'chevron-down'}
                  label={showAllHistory ? 'Ver menos' : `Ver todo mi historial (${history.length})`}
                  onPress={() => setShowAllHistory((value) => !value)}
                />
              )}
            </Section>
          )}

          {(canCreate || published.length > 0) && (
            <Section title="Mis eventos publicados">
              {canCreate && <Button label="Crear evento" icon="add-circle-outline" onPress={() => navigation.navigate('CreateEvent')} />}
              {published.length === 0 ? (
                <EmptyState icon="megaphone-outline" title="Aún no publicas eventos" message="Crea un evento para que otras personas se inscriban." />
              ) : (
                published.map((activity) =>
                  renderCard(activity, activity.status === 'cancelada' ? undefined : isPast(activity.startsAt) ? 'Finalizado' : undefined),
                )
              )}
            </Section>
          )}

          {!canCreate && (
            <Banner tone="info">
              {`Para publicar eventos necesitas ${CREATE_EVENT_REPUTATION_THRESHOLD} puntos de reputación y tienes ${user.reputationScore}. Deja reseñas en actividades a las que asististe para ganar puntos.`}
            </Banner>
          )}
        </>
      )}
    </Screen>
  )
}

// '2026-10-14' -> "Miércoles 14 de octubre"
function formatDay(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  const text = formatLongDate(new Date(year, month - 1, day))
  return text.charAt(0).toUpperCase() + text.slice(1)
}
