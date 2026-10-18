import { View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppText } from '../components/AppText'
import { EmptyState } from '../components/EmptyState'
import { PersonRow } from '../components/PersonRow'
import { Screen } from '../components/Screen'
import { useAppData } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import { ROLE_INFO } from '../data/roles'
import type { Account } from '../data/types'
import type { RootStackParamList } from '../navigation/types'
import { useCan } from '../permissions/permissions'
import { useRoleStyles } from '../theme/useRoleStyles'
import { formatActivityDate } from '../utils/dates'
import { createStyles } from './AttendeesScreen.styles'

type Props = NativeStackScreenProps<RootStackParamList, 'Attendees'>

export function AttendeesScreen({ route }: Props) {
  const { user } = useSessionUser()
  const { accounts, activities, enrollments } = useAppData()
  const canManage = useCan('manage_attendees')
  const styles = useRoleStyles(createStyles)

  const activity = activities.find((a) => a.id === route.params.activityId)
  if (!user || !activity || !canManage || activity.createdBy !== user.id) {
    return (
      <Screen>
        <EmptyState icon="lock-closed-outline" title="Sin acceso" message="Solo quien publicó el evento puede ver sus inscritos." />
      </Screen>
    )
  }

  const attendees = (enrollments[activity.id] ?? [])
    .map((id) => accounts.find((a) => a.id === id))
    .filter((a): a is Account => !!a)

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">{activity.title}</AppText>
        <AppText>
          {formatActivityDate(activity.startsAt)} · {attendees.length} {attendees.length === 1 ? 'inscrito' : 'inscritos'}
        </AppText>
      </View>

      {attendees.length === 0 ? (
        <EmptyState icon="people-outline" title="Aún no hay inscritos" message="Cuando alguien se inscriba, aparecerá aquí." />
      ) : (
        attendees.map((person) => (
          <PersonRow key={person.id} name={person.name} subtitle={ROLE_INFO[person.role].label} badge={{ label: 'Confirmado', tone: 'success' }} />
        ))
      )}
    </Screen>
  )
}
