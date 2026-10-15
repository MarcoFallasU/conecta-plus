import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppText } from '../components/AppText'
import { Button } from '../components/Button'
import { FULL_EDGES, Screen } from '../components/Screen'
import { SegmentedControl } from '../components/SegmentedControl'
import { TEXT_SIZE_LABELS, usePreferences, type TextSize } from '../context/PreferencesContext'
import type { RootStackParamList } from '../navigation/types'
import { useRoleDisplay } from '../theme/roleDisplay'
import { useRoleStyles } from '../theme/useRoleStyles'
import { createStyles } from './WelcomeScreen.styles'

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>

const TEXT_SIZE_OPTIONS = (Object.keys(TEXT_SIZE_LABELS) as TextSize[]).map((value) => ({ value, label: TEXT_SIZE_LABELS[value] }))

export function WelcomeScreen({ navigation }: Props) {
  const display = useRoleDisplay()
  const { textSize, setTextSize } = usePreferences()
  const styles = useRoleStyles(createStyles)

  return (
    <Screen edges={FULL_EDGES}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="people-circle-outline" size={display.touchTargetSize * 2} color={display.colors.azul} />
        </View>
        <AppText variant="display">Conecta+</AppText>
        <AppText variant="subtitle" style={styles.centered}>
          Red comunitaria para adultos mayores
        </AppText>
        <AppText style={styles.centered}>
          Descubre actividades cerca de ti, inscríbete y comparte con tu familia y tu comunidad.
        </AppText>
      </View>

      <View style={styles.sizePicker}>
        <AppText variant="subtitle" style={styles.centered}>
          Tamaño de letra
        </AppText>
        <SegmentedControl options={TEXT_SIZE_OPTIONS} value={textSize} onChange={setTextSize} />
      </View>

      <View style={styles.actions}>
        <Button label="Crear cuenta" icon="person-add-outline" onPress={() => navigation.navigate('Register')} />
        <Button label="Iniciar sesión" icon="log-in-outline" variant="outline" onPress={() => navigation.navigate('Login')} />
      </View>
    </Screen>
  )
}
