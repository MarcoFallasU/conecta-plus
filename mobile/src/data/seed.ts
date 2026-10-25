import type { Role } from '../context/RoleContext'
import { daysFromNow } from '../utils/dates'
import type { Account, Activity, FamilyLinkBase, Recommendation, Review } from './types'

// Datos de ejemplo del prototipo (mock del backend); se reemplazan por la API.
const PASSWORD = 'demo1234'
const image = (seed: string) => `https://picsum.photos/seed/${seed}/800/500`

export const SEED_ACCOUNTS: Account[] = [
  { id: 'u-marta', name: 'Doña Marta Jiménez', email: 'marta.jimenez@correo.com', password: PASSWORD, role: 'adulto_mayor', reputationScore: 20 },
  { id: 'u-carlos', name: 'Don Carlos Solano', email: 'carlos.solano@correo.com', password: PASSWORD, role: 'adulto_mayor', reputationScore: 5 },
  { id: 'u-ana', name: 'Ana Vargas Rojas', email: 'ana.vargas@correo.com', password: PASSWORD, role: 'adulto_mayor', reputationScore: 40 },
  { id: 'u-luis', name: 'Luis Fernández Castro', email: 'luis.fernandez@correo.com', password: PASSWORD, role: 'adulto_mayor', reputationScore: 10 },
  { id: 'u-rodrigo', name: 'Rodrigo Jiménez', email: 'rodrigo.jimenez@correo.com', password: PASSWORD, role: 'cuidador', reputationScore: 80 },
  { id: 'u-robles', name: 'Centro Comunitario Los Robles', email: 'contacto@losrobles.cr', password: PASSWORD, role: 'empresa', reputationScore: 0 },
]

export const DEMO_LOGINS: { role: Role; accountId: string }[] = [
  { role: 'adulto_mayor', accountId: 'u-marta' },
  { role: 'cuidador', accountId: 'u-rodrigo' },
  { role: 'empresa', accountId: 'u-robles' },
]

export const SEED_ACTIVITIES: Activity[] = [
  {
    id: 'a-baile',
    title: 'Tarde de baile',
    description: 'Música en vivo y baile para todas las edades, con refrigerio incluido.',
    category: 'Baile',
    startsAt: daysFromNow(3, 14),
    place: 'Centro Comunitario Los Robles',
    imageUrl: image('tarde-de-baile'),
    createdBy: 'u-robles',
    featured: true,
  },
  {
    id: 'a-taichi',
    title: 'Taller de Tai Chi',
    description: 'Movimientos suaves para mejorar el equilibrio y la movilidad.',
    category: 'Bienestar',
    startsAt: daysFromNow(5, 9),
    place: 'Parque Central',
    imageUrl: image('taller-tai-chi'),
    createdBy: 'u-robles',
    featured: false,
  },
  {
    id: 'a-feria',
    title: 'Feria de Salud Comunitaria',
    description: 'Chequeos de presión, glucosa y charlas con profesionales de salud.',
    category: 'Salud',
    startsAt: daysFromNow(2, 8),
    place: 'Salón Municipal',
    imageUrl: image('feria-de-salud'),
    createdBy: 'u-robles',
    featured: false,
  },
  {
    id: 'a-bingo',
    title: 'Noche de Bingo Solidario',
    description: 'Una noche de juegos y premios a beneficio del hogar de ancianos.',
    category: 'Juegos',
    startsAt: daysFromNow(7, 18),
    place: 'Salón Parroquial',
    imageUrl: image('bingo-solidario'),
    createdBy: 'u-robles',
    featured: false,
  },
  {
    id: 'a-caminata',
    title: 'Grupo de Caminata Matutina',
    description: 'Caminata guiada de 40 minutos por senderos planos y seguros.',
    category: 'Ejercicio',
    startsAt: daysFromNow(1, 6, 30),
    place: 'Sendero del Río',
    imageUrl: image('caminata-matutina'),
    createdBy: 'u-robles',
    featured: false,
  },
  {
    id: 'a-cine',
    title: 'Cine foro: Memorias en pantalla',
    description: 'Proyección de una película clásica y conversación abierta con café.',
    category: 'Cultura',
    startsAt: daysFromNow(9, 16),
    place: 'Biblioteca Municipal',
    imageUrl: image('cine-foro'),
    createdBy: 'u-rodrigo',
    featured: false,
  },
  {
    id: 'a-coro',
    title: 'Encuentro de coro comunitario',
    description: 'Tarde de canto en grupo con repertorio de boleros y música popular.',
    category: 'Cultura',
    startsAt: daysFromNow(-6, 15),
    place: 'Iglesia San José',
    imageUrl: image('coro-comunitario'),
    createdBy: 'u-robles',
    featured: false,
  },
  {
    id: 'a-yoga',
    title: 'Yoga suave en el parque',
    description: 'Estiramientos y respiración al aire libre, apto para todos los niveles.',
    category: 'Bienestar',
    startsAt: daysFromNow(-10, 8),
    place: 'Parque Central',
    imageUrl: image('yoga-suave'),
    createdBy: 'u-robles',
    featured: false,
  },
]

export const SEED_ENROLLMENTS: Record<string, string[]> = {
  'a-baile': ['u-marta', 'u-ana', 'u-luis'],
  'a-taichi': ['u-carlos', 'u-ana'],
  'a-feria': ['u-luis', 'u-ana', 'u-carlos'],
  'a-bingo': ['u-ana'],
  'a-caminata': ['u-luis'],
  'a-cine': ['u-ana'],
  'a-coro': ['u-marta', 'u-ana', 'u-luis'],
  'a-yoga': ['u-marta', 'u-luis'],
}

export const SEED_RECOMMENDATIONS: Recommendation[] = [
  { id: 'r-1', activityId: 'a-taichi', fromUserId: 'u-rodrigo', toUserId: 'u-marta' },
]

export const SEED_REVIEWS: Review[] = [
  { id: 'rv-1', activityId: 'a-coro', userId: 'u-ana', rating: 5, comment: 'Muy lindo ambiente, volveré el próximo mes.', createdAt: daysFromNow(-5) },
  { id: 'rv-2', activityId: 'a-yoga', userId: 'u-luis', rating: 4, comment: 'La instructora fue muy paciente con todos.', createdAt: daysFromNow(-9) },
]

export const SEED_LINKS: FamilyLinkBase[] = [
  { id: 'l-1', caregiverId: 'u-rodrigo', elderId: 'u-marta', status: 'active' },
  { id: 'l-2', caregiverId: 'u-rodrigo', elderId: 'u-carlos', status: 'pending' },
]