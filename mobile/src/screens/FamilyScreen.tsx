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

interface ActionResult {
  ok: boolean
  message: string
}

export function FamilyScreen() {
  const navigation = useAppNavigation()
  const { user } = useSessionUser()
  const {
    accounts,
    activities,
    links,
    linksLoading,
    linksError,
    refreshLinks,
    recommendations,
    requestLink,
    respondLink,
    removeLink,
  } = useAppData()
  const canLink = useCan('link_family_member')
  const canRespond = useCan('respond_family_requests')
  const styles = useRoleStyles(createStyles)
  const [email, setEmail] = useState('')
  const [feedback, setFeedback] = useState<ActionResult | null>(null)
  const [actionError, setActionError] = useState('')
  const [sending, setSending] = useState(false)

  if (!user) return null

  // Los nombres de las personas vinculadas vienen del servidor (cuentas reales) o de la demo.
  // Las recomendaciones siguen siendo de ejemplo, así que ahí se busca en las cuentas del seed.
  const nameOfAccount = (id: string) => accounts.find((a) => a.id === id)?.name ?? 'Usuario'
  const accompanied = links.filter((l) => l.caregiverId === user.id)
  const requests = links.filter((l) => l.elderId === user.id && l.status === 'pending')
  const family = links.filter((l) => l.elderId === user.id && l.status === 'active')
  const received = recommendations.flatMap((recommendation) => {
    const activity = activities.find((a) => a.id === recommendation.activityId)
    return recommendation.toUserId === user.id && activity && !isPast(activity.startsAt) ? [{ recommendation, activity }] : []
  })

  async function handleSendRequest() {
    if (sending) return
    setSending(true)
    setFeedback(null)
    setActionError('')
    const result = await requestLink(user!.id, email)
    setSending(false)
    setFeedback(result)
    if (result.ok) setEmail('')
  }

  // Ejecuta una acción sobre un vínculo y muestra el error del servidor si falla.
  async function runAction(action: () => Promise<ActionResult>) {
    setActionError('')
    const result = await action()
    if (!result.ok) setActionError(result.message)
  }

  return (
    <Screen edges={TAB_EDGES}>
      <View style={styles.header}>
        <AppText variant="title">Mi familia</AppText>
        <AppText>
          {canLink ? 'Acompaña a tus familiares y recomiéndales actividades.' : 'Las personas que te acompañan y sus recomendaciones.'}
        </AppText>
      </View>

      {linksError ? (
        <View style={styles.form}>
          <Banner tone="error">{linksError}</Banner>
          <Button variant="outline" icon="refresh-outline" label="Reintentar" onPress={refreshLinks} />
        </View>
      ) : null}
      {actionError ? <Banner tone="error">{actionError}</Banner> : null}
      {linksLoading && links.length === 0 && !linksError ? <AppText>Cargando vínculos…</AppText> : null}

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
              <Button
                label={sending ? 'Enviando…' : 'Enviar solicitud'}
                icon="paper-plane-outline"
                onPress={handleSendRequest}
              />
            </View>
          </Section>

          <Section title="Personas que acompaño">
            {accompanied.length === 0 ? (
              <EmptyState icon="people-outline" title="Aún no acompañas a nadie" message="Envía una solicitud con el correo de tu familiar." />
            ) : (
              accompanied.map((link) => (
                <PersonRow
                  key={link.id}
                  name={link.elderName}
                  badge={link.status === 'active' ? { label: 'Vinculado', tone: 'success' } : { label: 'Pendiente de aceptar' }}
                >
                  {link.status === 'active' ? (
                    <Button
                      icon="calendar-outline"
                      label="Ver actividades y recomendar"
                      onPress={() => navigation.navigate('FamilyMember', { elderId: link.elderId })}
                    />
                  ) : (
                    <Button variant="outline" label="Cancelar solicitud" onPress={() => runAction(() => removeLink(link.id))} />
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
                <PersonRow key={link.id} name={link.caregiverName} subtitle="Quiere acompañarte en la app">
                  <View style={styles.actionRow}>
                    <View style={styles.actionCell}>
                      <Button label="Aceptar" onPress={() => runAction(() => respondLink(link.id, true))} />
                    </View>
                    <View style={styles.actionCell}>
                      <Button label="Rechazar" variant="outline" onPress={() => runAction(() => respondLink(link.id, false))} />
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
                <PersonRow key={link.id} name={link.caregiverName} badge={{ label: 'Vinculado', tone: 'success' }}>
                  <Button variant="outline" label="Quitar vínculo" onPress={() => runAction(() => removeLink(link.id))} />
                </PersonRow>
              ))
            )}
          </Section>

          {received.length > 0 && (
            <Section title="Recomendaciones para ti">
              {received.map(({ recommendation, activity }) => (
                <PersonRow
                  key={recommendation.id}
                  name={nameOfAccount(recommendation.fromUserId)}
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