import { View } from 'react-native'
import { ActivityCard } from '../components/ActivityCard'
import { AppText } from '../components/AppText'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Screen, TAB_EDGES } from '../components/Screen'
import { Section } from '../components/Section'
import { useAppData } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import type { Activity } from '../data/types'
import { useAppNavigation } from '../navigation/useAppNavigation'
import { useCan } from '../permissions/permissions'
import { CREATE_EVENT_REPUTATION_THRESHOLD } from '../permissions/reputation'
import { useRoleStyles } from '../theme/useRoleStyles'
import { isPast } from '../utils/dates'
import { createStyles } from './AgendaScreen.styles'

const byDate = (a: Activity, b: Activity) => a.startsAt.localeCompare(b.startsAt)

export function AgendaScreen() {
  const navigation = useAppNavigation()
  const { user } = useSessionUser()
  const { activities, enrollments } = useAppData()
  const canRegister = useCan('register_self')
  const canCreate = useCan('create_event')
  const styles = useRoleStyles(createStyles)

  if (!user) return null

  const mine = activities.filter((a) => enrollments[a.id]?.includes(user.id))
  const upcoming = mine.filter((a) => !isPast(a.startsAt)).sort(byDate)
  const history = mine.filter((a) => isPast(a.startsAt)).sort((a, b) => byDate(b, a))
  const published = activities.filter((a) => a.createdBy === user.id).sort(byDate)

  const renderCard = (activity: Activity, badge?: string) => (
    <ActivityCard
      key={activity.id}
      activity={activity}
      attendeesCount={enrollments[activity.id]?.length ?? 0}
      badge={badge}
      onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.id })}
    />
  )

  return (
    <Screen edges={TAB_EDGES}>
      <View style={styles.header}>
        <AppText variant="title">Mi agenda</AppText>
        <AppText>{canRegister ? 'Tus actividades y los eventos que publicas.' : 'Los eventos que has publicado.'}</AppText>
      </View>

      {canRegister && (
        <Section title="Próximas inscripciones">
          {upcoming.length === 0 ? (
            <>
              <EmptyState icon="calendar-outline" title="Aún no tienes inscripciones" message="Explora las actividades y reserva tu lugar." />
              <Button label="Explorar actividades" icon="search-outline" onPress={() => navigation.navigate('Home')} />
            </>
          ) : (
            upcoming.map((activity) => renderCard(activity))
          )}
        </Section>
      )}

      {canRegister && history.length > 0 && (
        <Section title="Actividades a las que asististe">{history.map((activity) => renderCard(activity, 'Asististe'))}</Section>
      )}

      {(canCreate || published.length > 0) && (
        <Section title="Mis eventos publicados">
          {canCreate && <Button label="Crear evento" icon="add-circle-outline" onPress={() => navigation.navigate('CreateEvent')} />}
          {published.length === 0 ? (
            <EmptyState icon="megaphone-outline" title="Aún no publicas eventos" message="Crea un evento para que otras personas se inscriban." />
          ) : (
            published.map((activity) => renderCard(activity, isPast(activity.startsAt) ? 'Finalizado' : undefined))
          )}
        </Section>
      )}

      {!canCreate && (
        <Banner tone="info">
          {`Para publicar eventos necesitas ${CREATE_EVENT_REPUTATION_THRESHOLD} puntos de reputación y tienes ${user.reputationScore}. Deja reseñas en actividades a las que asististe para ganar puntos.`}
        </Banner>
      )}
    </Screen>
  )
}
