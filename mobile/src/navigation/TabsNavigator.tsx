import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AgendaScreen } from '../screens/AgendaScreen'
import { ExploreScreen } from '../screens/ExploreScreen'
import { FamilyScreen } from '../screens/FamilyScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { useCan } from '../permissions/permissions'
import { fontWeight, type IconName } from '../theme/designSystem'
import { useRoleDisplay } from '../theme/roleDisplay'
import type { TabParamList } from './types'

const Tab = createBottomTabNavigator<TabParamList>()

const TAB_ICONS: Record<keyof TabParamList, { active: IconName; inactive: IconName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Explore: { active: 'search', inactive: 'search-outline' },
  Agenda: { active: 'calendar', inactive: 'calendar-outline' },
  Family: { active: 'people', inactive: 'people-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
}

export function TabsNavigator() {
  const display = useRoleDisplay()
  const insets = useSafeAreaInsets()
  const canViewFamily = useCan('view_family')

  // Con 5 pestañas en un teléfono angosto, la letra "muy grande" no cabe: se limita el tamaño
  // de la etiqueta y del ícono (siguen siendo mayores que los de una app estándar).
  const iconSize = Math.min(Math.round(display.baseFontSize * 1.4), 30)
  const labelSize = Math.min(Math.round(display.baseFontSize * 0.8), 16)
  const barHeight = iconSize + Math.round(labelSize * 1.5) + display.spacing + insets.bottom

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: display.colors.azul,
        tabBarInactiveTintColor: display.colors.grisMedio,
        tabBarStyle: { backgroundColor: display.colors.blanco, borderTopColor: display.colors.line, height: barHeight },
        tabBarItemStyle: { paddingVertical: Math.round(display.spacing / 4) },
        tabBarLabelStyle: { fontSize: labelSize, fontWeight: fontWeight.medium },
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? TAB_ICONS[route.name].active : TAB_ICONS[route.name].inactive} size={iconSize} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Inicio' }} />
      <Tab.Screen name="Explore" component={ExploreScreen} options={{ tabBarLabel: 'Buscar' }} />
      <Tab.Screen name="Agenda" component={AgendaScreen} options={{ tabBarLabel: 'Agenda' }} />
      {canViewFamily && <Tab.Screen name="Family" component={FamilyScreen} options={{ tabBarLabel: 'Familia' }} />}
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  )
}
