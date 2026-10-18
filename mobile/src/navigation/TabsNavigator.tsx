import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AgendaScreen } from '../screens/AgendaScreen'
import { FamilyScreen } from '../screens/FamilyScreen'
import { HomeScreen } from '../screens/HomeScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { useCan } from '../permissions/permissions'
import { colors } from '../theme/colors'
import { fontWeight, type IconName } from '../theme/designSystem'
import { useRoleDisplay } from '../theme/roleDisplay'
import type { TabParamList } from './types'

const Tab = createBottomTabNavigator<TabParamList>()

const TAB_ICONS: Record<keyof TabParamList, { active: IconName; inactive: IconName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Agenda: { active: 'calendar', inactive: 'calendar-outline' },
  Family: { active: 'people', inactive: 'people-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
}

export function TabsNavigator() {
  const display = useRoleDisplay()
  const insets = useSafeAreaInsets()
  const canViewFamily = useCan('view_family')

  const iconSize = Math.round(display.baseFontSize * 1.4)
  const labelSize = Math.round(display.baseFontSize * 0.8)
  const barHeight = iconSize + Math.round(labelSize * 1.5) + display.spacing + insets.bottom

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.azul,
        tabBarInactiveTintColor: colors.grisMedio,
        tabBarStyle: { backgroundColor: colors.blanco, borderTopColor: colors.line, height: barHeight },
        tabBarItemStyle: { paddingVertical: Math.round(display.spacing / 4) },
        tabBarLabelStyle: { fontSize: labelSize, fontWeight: fontWeight.medium },
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={focused ? TAB_ICONS[route.name].active : TAB_ICONS[route.name].inactive} size={iconSize} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Inicio' }} />
      <Tab.Screen name="Agenda" component={AgendaScreen} options={{ tabBarLabel: 'Agenda' }} />
      {canViewFamily && <Tab.Screen name="Family" component={FamilyScreen} options={{ tabBarLabel: 'Familia' }} />}
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  )
}
