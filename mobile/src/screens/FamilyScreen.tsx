import { useState } from 'react'
import { View } from 'react-native'
import { AppText } from '../components/AppText'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { PersonRow } from '../components/PersonRow'
import { Screen, TAB_EDGES } from '../components/Screen'
import { Section } from '../components/Section'
import { TextField } from '../components/TextField'
import { useAppData } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import { useAppNavigation } from '../navigation/useAppNavigation'
import { useCan } from '../permissions/permissions'
import { useRoleStyles } from '../theme/useRoleStyles'
import { formatActivityDate, isPast } from '../utils/dates'
import { createStyles } from './FamilyScreen.styles'

export function FamilyScreen() {
  const navigation = useAppNavigation()
  const { user } = useSessionUser()
  const { accounts, activities, links, recommendations, requestLink, respondLink, removeLink } = useAppData()
  const canLink = useCan('link_family_member')
  const canRespond = useCan('respond_family_requests')
  const styles = useRoleStyles(createStyles)
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)

  if (!user) return null

  const nameOf = (id: string) => accounts.find((a) => a.id === id)?.name ?? 'Usuario'
  const accompanied = links.filter((l) => l.caregiverId === user.id)
  const requests = links.filter((l) => l.elderId === user.id && l.status === 'pending')
  const family = links.filter((l) => l.elderId === user.id && l.status === 'active')
  const received = recommendations.flatMap((recommendation) => {
    const activity = activities.find((a) => a.id === recommendation.activityId)
    return recommendation.toUserId === user.id && activity && !isPast(activity.startsAt) ? [{ recommendation, activity }] : []
  })

  function handleSendRequest() {
    const result = requestLink(user!.id, email)
    setFeedback(result)
    if (result.ok) setEmail('')
  }

  return (
    <Screen edges={TAB_EDGES}>
      <View style={styles.header}>
        <AppText variant="title">Mi familia</AppText>
        <AppText>
          {canLink ? 'Acompaña a tus familiares y recomiéndales actividades.' : 'Las personas que te acompañan y sus recomendaciones.'}
        </AppText>
      </View>

      {canLink && (
        <>
          <Section title="Vincular familiar">
            <View style={styles.form}>
              <TextField
                label="Correo del adulto mayor"
                value={email}
                onChangeText={setEmail}
                placeholder="nombre@correo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {feedback ? <Banner tone={feedback.ok ? 'success' : 'error'}>{feedback.message}</Banner> : null}
              <Button label="Enviar solicitud" icon="paper-plane-outline" onPress={handleSendRequest} />
            </View>
          </Section>

          <Section title="Personas que acompaño">
            {accompanied.length === 0 ? (
              <EmptyState icon="people-outline" title="Aún no acompañas a nadie" message="Envía una solicitud con el correo de tu familiar." />
            ) : (
              accompanied.map((link) => (
                <PersonRow
                  key={link.id}
                  name={nameOf(link.elderId)}
                  badge={link.status === 'active' ? { label: 'Vinculado', tone: 'success' } : { label: 'Pendiente de aceptar' }}
                >
                  {link.status === 'active' ? (
                    <Button
                      icon="calendar-outline"
                      label="Ver actividades y recomendar"
                      onPress={() => navigation.navigate('FamilyMember', { elderId: link.elderId })}
                    />
                  ) : (
                    <Button variant="outline" label="Cancelar solicitud" onPress={() => removeLink(link.id)} />
                  )}
                </PersonRow>
              ))
            )}
          </Section>
        </>
      )}

      {canRespond && (
        <>
          {requests.length > 0 && (
            <Section title="Solicitudes de vínculo">
              {requests.map((link) => (
                <PersonRow key={link.id} name={nameOf(link.caregiverId)} subtitle="Quiere acompañarte en la app">
                  <View style={styles.actionRow}>
                    <View style={styles.actionCell}>
                      <Button label="Aceptar" onPress={() => respondLink(link.id, true)} />
                    </View>
                    <View style={styles.actionCell}>
                      <Button label="Rechazar" variant="outline" onPress={() => respondLink(link.id, false)} />
                    </View>
                  </View>
                </PersonRow>
              ))}
            </Section>
          )}

          <Section title="Mis familiares y cuidadores">
            {family.length === 0 ? (
              <EmptyState icon="people-outline" title="Aún no tienes vínculos" message="Cuando un familiar te envíe una solicitud, aparecerá aquí." />
            ) : (
              family.map((link) => (
                <PersonRow key={link.id} name={nameOf(link.caregiverId)} badge={{ label: 'Vinculado', tone: 'success' }}>
                  <Button variant="outline" label="Quitar vínculo" onPress={() => removeLink(link.id)} />
                </PersonRow>
              ))
            )}
          </Section>

          {received.length > 0 && (
            <Section title="Recomendaciones para ti">
              {received.map(({ recommendation, activity }) => (
                <PersonRow
                  key={recommendation.id}
                  name={nameOf(recommendation.fromUserId)}
                  subtitle={`Te recomendó ${activity.title} · ${formatActivityDate(activity.startsAt)}`}
                >
                  <Button
                    variant="secondary"
                    icon="eye-outline"
                    label="Ver actividad"
                    onPress={() => navigation.navigate('ActivityDetail', { activityId: activity.id })}
                  />
                </PersonRow>
              ))}
            </Section>
          )}
        </>
      )}
    </Screen>
  )
}
