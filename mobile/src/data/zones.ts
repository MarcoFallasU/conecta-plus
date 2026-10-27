export interface Zone {
  id: string
  name: string
  lat: number
  lng: number
}

// Zonas del piloto (Pérez Zeledón, Región Brunca). Las coordenadas son aproximadas y
// sirven para calcular cercanía en el prototipo; la API las reemplazará con datos reales.
export const ZONES: Zone[] = [
  { id: 'san-isidro', name: 'San Isidro centro', lat: 9.3739, lng: -83.7046 },
  { id: 'daniel-flores', name: 'Daniel Flores', lat: 9.3571, lng: -83.687 },
  { id: 'cajon', name: 'Cajón', lat: 9.3485, lng: -83.739 },
  { id: 'san-pedro', name: 'San Pedro', lat: 9.3905, lng: -83.665 },
  { id: 'rivas', name: 'Rivas', lat: 9.3065, lng: -83.5885 },
]

export function getZone(id: string | null | undefined): Zone | undefined {
  return id ? ZONES.find((zone) => zone.id === id) : undefined
}
