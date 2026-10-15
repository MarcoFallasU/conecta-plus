interface Point {
  latitude: number
  longitude: number
}

const EARTH_RADIUS_KM = 6371

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180
}

// Distancia en línea recta (fórmula de Haversine).
export function distanceKm(a: Point, b: Point) {
  const dLat = toRadians(b.latitude - a.latitude)
  const dLon = toRadians(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

// "A 600 m", "A 2,4 km"
export function formatDistance(km: number) {
  if (km < 1) return `A ${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`
  return `A ${km.toFixed(1).replace('.', ',')} km`
}

export function distanceWords(km: number) {
  if (km < 1) return 'muy cerca'
  if (km <= 5) return 'cerca de ti'
  if (km <= 15) return 'a pocos minutos'
  return 'más lejos'
}
