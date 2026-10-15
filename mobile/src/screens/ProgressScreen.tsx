import { View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ActivityCard } from '../components/ActivityCard'
import { AppText } from '../components/AppText'
import { Banner } from '../components/Banner'
import { BarChart } from '../components/BarChart'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { ProgressBar } from '../components/ProgressBar'
import { Screen } from '../components/Screen'
import { Section } from '../components/Section'
import { StatCard } from '../components/StatCard'
import { useAppData } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import { attendanceKey } from '../data/types'
import type { RootStackParamList } from '../navigation/types'
import { useCan } from '../permissions/permissions'
import { useRoleStyles } from '../theme/useRoleStyles'
import { isPast } from '../utils/dates'
import { greetingName } from '../utils/people'
import { activeMonthsStreak, attendedActivities, categoryBreakdown, monthSummary, monthlyAttendance } from '../utils/progress'
import { createStyles } from './ProgressScreen.styles'

type Props = NativeStackScreenProps<RootStackParamList, 'Progress'>

// Resumen de participación (sección 6 del Avance I): gráfica por mes, categorías más
// frecuentadas y un texto corto que el familiar también puede consultar.
export function ProgressScreen({ navigation, route }: Props) {
  const { user } = useSessionUser()
  const { accounts, activities, enrollments, attendance, links } = useAppData()
  const canViewOwn = useCan('view_progress')
  const canViewFamily = useCan('view_family_summary')
  const styles = useRoleStyles(createStyles)

  const targetId = route.params?.userId ?? user?.id
  const target = accounts.find((a) => a.id === targetId)
  const isSelf = !!user && targetId === user.id
  const linked = !!user && links.some((l) => l.caregiverId === user.id && l.elderId === targetId && l.status === 'active')
  const allowed = !!user && !!target && (isSelf ? canViewOwn : canViewFamily && linked)

  if (!user || !target || !allowed) {
    return (
      <Screen>
        <EmptyState icon="lock-closed-outline" title="Sin acceso" message="No tienes permiso para ver este resumen." />
      </Screen>
    )
  }

  const attended = attendedActivities(target.id, activities, enrollments, attendance)
  const months = monthlyAttendance(attended)
  const current = months[months.length - 1]
  const categories = categoryBreakdown(attended)
  const streak = activeMonthsStreak(months)
  const maxCategory = Math.max(1, ...categories.map((c) => c.count))
  const pending = activities.filter(
    (a) =>
      (enrollments[a.id] ?? []).includes(target.id) &&
      isPast(a.startsAt) &&
      a.status === 'disponible' &&
      attendance[attendanceKey(a.id, target.id)] === undefined,
  ).length
  const missed = Object.entries(attendance).filter(([key, value]) => key.endsWith(`:${target.id}`) && value === 'no_asistio').length
  const chartSummary = months.map((m) => `${m.fullName}: ${m.attended}`).join('. ')

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">{isSelf ? 'Tu resumen' : `Resumen de ${greetingName(target.name)}`}</AppText>
        <AppText>{monthSummary(current, categories[0]?.category, isSelf)}</AppText>
      </View>

      <View style={styles.statsRow}>
        <StatCard value={attended.length} label="Actividades en total" />
        <StatCard value={current.attended} label="Este mes" />
        <StatCard value={streak} label={streak === 1 ? 'Mes seguido' : 'Meses seguidos'} />
      </View>

      {isSelf && pending > 0 && (
        <Banner tone="info">{`Tienes ${pending} ${pending === 1 ? 'actividad' : 'actividades'} por confirmar. Respóndelas desde tus avisos.`}</Banner>
      )}
      {isSelf && pending > 0 && <Button variant="secondary" icon="notifications-outline" label="Ir a mis avisos" onPress={() => navigation.navigate('Notices')} />}

      <Section title="Asistencias por mes">
        <View style={styles.card}>
          <BarChart items={months.map((m) => ({ key: m.key, label: m.label, value: m.attended }))} summary={`Asistencias por mes. ${chartSummary}`} />
        </View>
      </Section>

      <Section title="Lo que más disfrutas">
        {categories.length === 0 ? (
          <AppText>Cuando asistas a tu primera actividad, aquí verás tus categorías favoritas.</AppText>
        ) : (
          <View style={styles.card}>
            {categories.map((item) => (
              <ProgressBar
                key={item.category}
                label={item.category}
                valueLabel={`${item.count} ${item.count === 1 ? 'vez' : 'veces'}`}
                value={item.count / maxCategory}
              />
            ))}
          </View>
        )}
      </Section>

      {missed > 0 && (
        <AppText variant="caption">
          {`${isSelf ? 'No pudiste asistir' : 'No pudo asistir'} a ${missed} ${missed === 1 ? 'actividad' : 'actividades'} en estos meses.`}
        </AppText>
      )}

      {attended.length > 0 && (
        <Section title="Últimas actividades">
          {attended.slice(0, 3).map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              attendeesCount={enrollments[activity.id]?.length ?? 0}
              badge="Asistió"
              onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.id })}
            />
          ))}
        </Section>
      )}
    </Screen>
  )
}
