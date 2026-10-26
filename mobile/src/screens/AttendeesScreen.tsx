import { useEffect, useState } from 'react'
import { View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppText } from '../components/AppText'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { PersonRow } from '../components/PersonRow'
import { Screen } from '../components/Screen'
import { useAppData } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import { ROLE_INFO } from '../data/roles'
import type { Attendee } from '../data/types'
import type { RootStackParamList } from '../navigation/types'
import { useCan } from '../permissions/permissions'
import { useRoleStyles } from '../theme/useRoleStyles'
import { formatActivityDate } from '../utils/dates'
import { createStyles } from './AttendeesScreen.styles'

type Props = NativeStackScreenProps<RootStackParamList, 'Attendees'>

export function AttendeesScreen({ route }: Props) {
  const { user } = useSessionUser()
  const { activities, loadAttendees } = useAppData()
  const canManage = useCan('manage_attendees')
  const styles = useRoleStyles(createStyles)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const activityId = route.params.activityId
  const activity = activities.find((a) => a.id === activityId)
  const allowed = !!user && !!activity && canManage && activity.createdBy === user.id

  // Los inscritos con nombre solo los entrega el servidor a quien publicó el evento.
  useEffect(() => {
    if (!allowed) return
    let cancelled = false
    setLoading(true)
    setError('')
    loadAttendees(activityId)
      .then((list) => {
        if (!cancelled) setAttendees(list)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'No se pudieron cargar los inscritos.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, allowed, reloadKey])

  if (!allowed || !activity) {
    return (
      <Screen>
        <EmptyState icon="lock-closed-outline" title="Sin acceso" message="Solo quien publicó el evento puede ver sus inscritos." />
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">{activity.title}</AppText>
        <AppText>
          {formatActivityDate(activity.startsAt)} · {attendees.length} {attendees.length === 1 ? 'inscrito' : 'inscritos'}
        </AppText>
      </View>

      {error ? (
        <>
          <Banner tone="error">{error}</Banner>
          <Button variant="outline" icon="refresh-outline" label="Reintentar" onPress={() => setReloadKey((key) => key + 1)} />
        </>
      ) : null}

      {loading && attendees.length === 0 ? <AppText>Cargando inscritos…</AppText> : null}

      {!loading && !error && attendees.length === 0 ? (
        <EmptyState icon="people-outline" title="Aún no hay inscritos" message="Cuando alguien se inscriba, aparecerá aquí." />
      ) : (
        attendees.map((person) => (
          <PersonRow key={person.id} name={person.name} subtitle={ROLE_INFO[person.role].label} badge={{ label: 'Confirmado', tone: 'success' }} />
        ))
      )}
    </Screen>
  )
}