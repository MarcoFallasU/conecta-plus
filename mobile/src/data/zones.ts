export interface Zone {
  id: string
  name: string
  latitude: number
  longitude: number
}

// Zonas del piloto (Pérez Zeledón, Región Brunca). Las coordenadas son aproximadas y
// sirven para calcular cercanía en el prototipo; la API las reemplazará con datos reales.
export const ZONES: Zone[] = [
  { id: 'san-isidro', name: 'San Isidro centro', latitude: 9.3739, longitude: -83.7046 },
  { id: 'daniel-flores', name: 'Daniel Flores', latitude: 9.3571, longitude: -83.687 },
  { id: 'cajon', name: 'Cajón', latitude: 9.3485, longitude: -83.739 },
  { id: 'san-pedro', name: 'San Pedro', latitude: 9.3905, longitude: -83.665 },
  { id: 'rivas', name: 'Rivas', latitude: 9.3065, longitude: -83.5885 },
]

export function getZone(id: string | null | undefined): Zone | undefined {
  return id ? ZONES.find((zone) => zone.id === id) : undefined
}
