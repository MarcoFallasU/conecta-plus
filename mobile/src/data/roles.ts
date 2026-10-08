import type { Role } from '../context/RoleContext'
import type { IconName } from '../theme/designSystem'

export interface RoleInfo {
  label: string
  title: string
  description: string
  icon: IconName
}

export const ROLES: Role[] = ['adulto_mayor', 'cuidador', 'empresa']

export const ROLE_INFO: Record<Role, RoleInfo> = {
  adulto_mayor: {
    label: 'Adulto mayor',
    title: 'Soy adulto mayor',
    description: 'Descubre e inscríbete a actividades',
    icon: 'heart-outline',
  },
  cuidador: {
    label: 'Familiar o cuidador',
    title: 'Soy familiar o cuidador',
    description: 'Acompaña y recomienda actividades',
    icon: 'people-outline',
  },
  empresa: {
    label: 'Organización',
    title: 'Soy una organización',
    description: 'Publica y administra tus eventos',
    icon: 'business-outline',
  },
}
