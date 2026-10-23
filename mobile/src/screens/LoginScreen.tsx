import { useState } from 'react'
import { View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { AppText } from '../components/AppText'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { Screen } from '../components/Screen'
import { Section } from '../components/Section'
import { useAppData } from '../context/AppDataContext'
import { ROLE_INFO } from '../data/roles'
import { DEMO_LOGINS } from '../data/seed'
import type { RootStackParamList } from '../navigation/types'
import { useRoleStyles } from '../theme/useRoleStyles'
import { createStyles } from './LoginScreen.styles'

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>

interface Notice {
  tone: 'info' | 'error'
  message: string
  offerSignUp: boolean
}

export function LoginScreen({ navigation }: Props) {
  const { signInWithGoogle, loginAs } = useAppData()
  const styles = useRoleStyles(createStyles)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  async function handleGoogle() {
    if (loading) return
    setNotice(null)
    setLoading(true)
    const result = await signInWithGoogle()
    setLoading(false)
    if (result.ok) return
    setNotice({
      tone: result.error === 'cancelled' || result.error === 'no_account' ? 'info' : 'error',
      message: result.message,
      offerSignUp: result.error === 'no_account',
    })
  }

  return (
    <Screen>
      <View style={styles.form}>
        <AppText>Entra con tu cuenta de Google. No necesitas recordar ninguna contraseña.</AppText>
        <Button
          label={loading ? 'Abriendo Google…' : 'Continuar con Google'}
          icon="logo-google"
          disabled={loading}
          onPress={handleGoogle}
        />
        {notice ? <Banner tone={notice.tone}>{notice.message}</Banner> : null}
        {notice?.offerSignUp ? (
          <Button variant="secondary" icon="person-add-outline" label="Crear mi cuenta" onPress={() => navigation.navigate('Register')} />
        ) : null}
      </View>

      <Section title="Cuentas de demostración">
        <AppText>Entra directo con una cuenta de ejemplo para ver cómo cambia la app según el rol.</AppText>
        <View style={styles.demo}>
          {DEMO_LOGINS.map(({ role, accountId }) => (
            <Button
              key={accountId}
              variant="outline"
              icon={ROLE_INFO[role].icon}
              label={`Entrar como ${ROLE_INFO[role].label.toLowerCase()}`}
              onPress={() => loginAs(accountId)}
            />
          ))}
        </View>
      </Section>
    </Screen>
  )
}
