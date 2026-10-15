import { Modal, View } from 'react-native'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { Button } from './Button'
import { createStyles } from './ConfirmDialog.styles'

interface ConfirmDialogProps {
  visible: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// Confirmación de acciones que no se pueden deshacer fácilmente (cancelar una
// inscripción, quitar un vínculo, llamar a emergencias). Alert.alert no existe en web,
// por eso es un modal propio.
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Volver',
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const styles = useRoleStyles(createStyles)

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <AppText variant="title" accessibilityRole="header">
            {title}
          </AppText>
          <AppText>{message}</AppText>
          <View style={styles.actions}>
            <Button label={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} />
            <Button label={cancelLabel} variant="outline" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  )
}
