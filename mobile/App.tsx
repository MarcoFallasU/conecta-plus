import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppDataProvider } from './src/context/AppDataContext'
import { PreferencesProvider } from './src/context/PreferencesContext'
import { RoleProvider } from './src/context/RoleContext'
import { RootNavigator } from './src/navigation/RootNavigator'

export default function App() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <RoleProvider>
          <AppDataProvider>
            <RootNavigator />
            <StatusBar style="dark" />
          </AppDataProvider>
        </RoleProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  )
}
