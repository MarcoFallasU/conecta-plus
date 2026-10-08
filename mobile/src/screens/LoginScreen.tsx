import { useState } from 'react'
import { View } from 'react-native'
import { AppText } from '../components/AppText'
import { Banner } from '../components/Banner'
import { Button } from '../components/Button'
import { Screen } from '../components/Screen'
import { Section } from '../components/Section'
import { TextField } from '../components/TextField'
import { useAppData } from '../context/AppDataContext'
import { ROLE_INFO } from '../data/roles'
import { DEMO_LOGINS } from '../data/seed'
import { useRoleStyles } from '../theme/useRoleStyles'
import { createStyles } from './LoginScreen.styles'

export function LoginScreen() {
  const { login, loginAs } = useAppData()
  const styles = useRoleStyles(createStyles)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit() {
    if (!login(email, password)) setError('Correo o contraseña incorrectos.')
  }

  return (
    <Screen>
      <View style={styles.form}>
        <TextField
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          placeholder="nombre@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
        {error ? <Banner tone="error">{error}</Banner> : null}
        <Button label="Entrar" icon="log-in-outline" onPress={handleSubmit} />
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
