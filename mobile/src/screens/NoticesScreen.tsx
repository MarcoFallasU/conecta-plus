import { View } from 'react-native'
import { AppText } from '../components/AppText'
import { Banner } from '../components/Banner'
import { EmptyState } from '../components/EmptyState'
import { MetaRow } from '../components/MetaRow'
import { NoticeCard } from '../components/NoticeCard'
import { Screen } from '../components/Screen'
import { Section } from '../components/Section'
import { useAppData } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import { useRoleStyles } from '../theme/useRoleStyles'
import { addDays, dayDiff, formatActivityDate, formatLongDate, isPast } from '../utils/dates'
import { deriveNotices } from '../utils/notices'
import { createStyles } from './NoticesScreen.styles'

export function NoticesScreen() {
  const { user } = useSessionUser()
  const { accounts, activities, enrollments, attendance, links, recommendations, dismissedNotices } = useAppData()
  const styles = useRoleStyles(createStyles)

  if (!user) return null

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

  // Recordatorios que ya están programados: un día antes de cada actividad inscrita.
  const scheduled = activities
    .filter((a) => a.status === 'disponible' && !isPast(a.startsAt) && (enrollments[a.id] ?? []).includes(user.id))
    .filter((a) => dayDiff(a.startsAt) >= 2)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Mis avisos</AppText>
        <AppText>Recordatorios, respuestas pendientes y mensajes de tu familia.</AppText>
      </View>

      <Section title="Pendientes">
        {notices.length === 0 ? (
          <EmptyState icon="checkmark-done-outline" title="Estás al día" message="No tienes avisos pendientes por ahora." />
        ) : (
          notices.map((notice) => <NoticeCard key={notice.id} notice={notice} />)
        )}
      </Section>

      <Section title="Recordatorios programados">
        {scheduled.length === 0 ? (
          <AppText>Cuando te inscribas a una actividad, te avisaremos un día antes.</AppText>
        ) : (
          <>
            <Banner tone="info">Te avisaremos un día antes de cada actividad a la que estés inscrito.</Banner>
            {scheduled.map((activity) => (
              <View key={activity.id} style={styles.scheduled}>
                <AppText variant="subtitle">{activity.title}</AppText>
                <MetaRow icon="calendar-outline" text={formatActivityDate(activity.startsAt)} />
                <MetaRow icon="notifications-outline" text={`Aviso el ${formatLongDate(addDays(new Date(activity.startsAt), -1))}`} />
              </View>
            ))}
          </>
        )}
      </Section>
    </Screen>
  )
}
