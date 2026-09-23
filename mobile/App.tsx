import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from './src/theme/colors'
import { RoleProvider } from './src/context/RoleContext'

export default function App() {
  return (
    <RoleProvider>
      <View style={styles.container}>
        <Text style={styles.title}>Conecta+</Text>
        <Text style={styles.subtitle}>Actividades y bienestar para adultos mayores</Text>
        <StatusBar style="dark" />
      </View>
    </RoleProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.crema,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { fontSize: 36, fontWeight: '800', color: colors.azul },
  subtitle: { marginTop: 8, fontSize: 16, color: colors.grisTexto, textAlign: 'center' },
})
