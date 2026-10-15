import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAppData } from '../context/AppDataContext'
import { useSessionUser } from '../context/RoleContext'
import { useAppNavigation } from '../navigation/useAppNavigation'
import type { IconName } from '../theme/designSystem'
import { useRoleDisplay } from '../theme/roleDisplay'
import { useRoleStyles } from '../theme/useRoleStyles'
import type { Notice, NoticeType } from '../utils/notices'
import { AppText } from './AppText'
import { Button } from './Button'
import { createStyles } from './NoticeCard.styles'

const ICONS: Record<NoticeType, IconName> = {
  attendance: 'help-circle-outline',
  today: 'today-outline',
  reminder: 'notifications-outline',
  family_request: 'people-outline',
  recommendation: 'heart-outline',
  cancelled: 'close-circle-outline',
}

interface NoticeCardProps {
  notice: Notice
}

// Un aviso con sus acciones. Se usa en Inicio (los urgentes) y en la pantalla de Avisos:
// la misma respuesta ("¿asististe?", aceptar vínculo) funciona desde ambos lugares.
export function NoticeCard({ notice }: NoticeCardProps) {
  const display = useRoleDisplay()
  const styles = useRoleStyles(createStyles)
  const navigation = useAppNavigation()
  const { user } = useSessionUser()
  const { confirmAttendance, respondLink, dismissNotice } = useAppData()
  const cancelled = notice.type === 'cancelled'

  if (!user) return null

  const openActivity = () => {
    if (notice.activityId) navigation.navigate('ActivityDetail', { activityId: notice.activityId })
  }

  return (
    <View style={[styles.card, notice.urgent && styles.cardUrgent, cancelled && styles.cardCancelled]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, cancelled && styles.iconWrapCancelled]}>
          <Ionicons
            name={ICONS[notice.type]}
            size={Math.round(display.baseFontSize * 1.5)}
            color={cancelled ? display.colors.errorOscuro : display.colors.azul}
          />
        </View>
        <View style={styles.texts}>
          <AppText variant="subtitle">{notice.title}</AppText>
          <AppText>{notice.message}</AppText>
        </View>
      </View>

      <View style={styles.actions}>
        {notice.type === 'attendance' && notice.activityId && (
          <>
            <Button label="Sí, asistí" icon="checkmark-circle-outline" onPress={() => confirmAttendance(notice.activityId!, user.id, true)} />
            <Button label="No pude ir" variant="outline" onPress={() => confirmAttendance(notice.activityId!, user.id, false)} />
          </>
        )}

        {notice.type === 'family_request' && notice.linkId && (
          <>
            <Button label="Aceptar" icon="checkmark-outline" onPress={() => respondLink(notice.linkId!, true)} />
            <Button label="Rechazar" variant="outline" onPress={() => respondLink(notice.linkId!, false)} />
          </>
        )}

        {(notice.type === 'today' || notice.type === 'reminder') && (
          <>
            <Button label="Ver actividad" icon="eye-outline" onPress={openActivity} />
            <Button label="Entendido" variant="outline" onPress={() => dismissNotice(notice.id)} />
          </>
        )}

        {notice.type === 'recommendation' && (
          <>
            <Button label="Ver actividad" icon="eye-outline" onPress={openActivity} />
            <Button label="Ahora no" variant="outline" onPress={() => dismissNotice(notice.id)} />
          </>
        )}

        {cancelled && <Button label="Entendido" variant="outline" onPress={() => dismissNotice(notice.id)} />}
      </View>
    </View>
  )
}
