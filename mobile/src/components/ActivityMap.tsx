import { useMemo, useState } from 'react'
import { Pressable, View, type LayoutChangeEvent } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { IconName } from '../theme/designSystem'
import { useRoleDisplay } from '../theme/roleDisplay'
import { useRoleStyles } from '../theme/useRoleStyles'
import { AppText } from './AppText'
import { createStyles } from './ActivityMap.styles'

export interface MapPin {
  id: string
  lat: number
  lng: number
  icon: IconName
  label: string
  featured?: boolean
}

export interface MapOrigin {
  lat: number
  lng: number
  label: string
}

interface ActivityMapProps {
  pins: MapPin[]
  origin?: MapOrigin
  selectedId: string | null
  onSelect: (id: string) => void
}

interface Placed {
  x: number
  y: number
}

const ORIGIN_KEY = '__origin__'
// Comprime las distancias grandes para que lo cercano (donde está casi todo) no se amontone.
const DISTANCE_EXPONENT = 0.55
const RELAX_ITERATIONS = 60

// Ubica cada punto en píxeles dentro del mapa:
// 1) posición relativa a la zona de la persona (o al centro de las actividades),
// 2) compresión radial para ganar espacio cerca del centro,
// 3) separación de puntos que quedarían uno encima de otro.
function layoutPoints(
  pins: MapPin[],
  origin: MapOrigin | undefined,
  width: number,
  height: number,
  pinSize: number,
): Record<string, Placed> {
  const all = [
    ...pins.map((p) => ({ key: p.id, lat: p.lat, lng: p.lng })),
    ...(origin ? [{ key: ORIGIN_KEY, lat: origin.lat, lng: origin.lng }] : []),
  ]
  if (all.length === 0) return {}

  const center = origin ?? {
    lat: all.reduce((sum, p) => sum + p.lat, 0) / all.length,
    lng: all.reduce((sum, p) => sum + p.lng, 0) / all.length,
  }
  const lonScale = Math.cos((center.lat * Math.PI) / 180)

  const relative = all.map((p) => {
    const dx = (p.lng - center.lng) * lonScale
    const dy = center.lat - p.lat // hacia abajo = más al sur
    const r = Math.hypot(dx, dy)
    const scaled = r === 0 ? 0 : Math.pow(r, DISTANCE_EXPONENT)
    return { key: p.key, x: r === 0 ? 0 : (dx / r) * scaled, y: r === 0 ? 0 : (dy / r) * scaled }
  })

  const pad = pinSize / 2 + 8
  const minX = Math.min(...relative.map((p) => p.x))
  const maxX = Math.max(...relative.map((p) => p.x))
  const minY = Math.min(...relative.map((p) => p.y))
  const maxY = Math.max(...relative.map((p) => p.y))
  const spanX = maxX - minX || 1
  const spanY = maxY - minY || 1

  const placed = relative.map((p) => ({
    key: p.key,
    x: pad + ((p.x - minX) / spanX) * (width - pad * 2),
    y: pad + ((p.y - minY) / spanY) * (height - pad * 2),
  }))

  // Relajación: empuja entre sí los puntos que se tocan. La zona de la persona no se mueve.
  const minDistance = pinSize * 1.08
  for (let iteration = 0; iteration < RELAX_ITERATIONS; iteration += 1) {
    let moved = false
    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        const a = placed[i]
        const b = placed[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        let distance = Math.hypot(dx, dy)
        if (distance >= minDistance) continue
        if (distance === 0) {
          // Mismo punto exacto: se separa en una dirección distinta por pareja.
          const angle = ((i * 7 + j * 13) % 360) * (Math.PI / 180)
          dx = Math.cos(angle)
          dy = Math.sin(angle)
          distance = 1
        }
        const push = (minDistance - distance) / 2
        const ux = dx / distance
        const uy = dy / distance
        const aFixed = a.key === ORIGIN_KEY
        const bFixed = b.key === ORIGIN_KEY
        if (!aFixed) {
          a.x -= ux * push * (bFixed ? 2 : 1)
          a.y -= uy * push * (bFixed ? 2 : 1)
        }
        if (!bFixed) {
          b.x += ux * push * (aFixed ? 2 : 1)
          b.y += uy * push * (aFixed ? 2 : 1)
        }
        moved = true
      }
    }
    for (const p of placed) {
      p.x = Math.min(width - pad, Math.max(pad, p.x))
      p.y = Math.min(height - pad, Math.max(pad, p.y))
    }
    if (!moved) break
  }

  return Object.fromEntries(placed.map((p) => [p.key, { x: p.x, y: p.y }]))
}

// Mapa esquemático: ubica las actividades según su posición real respecto a la zona de
// la persona, sin depender de un servicio de mapas ni de claves de API. El mapa de
// calles real (Google Maps) se abre desde el detalle con "Cómo llegar".
export function ActivityMap({ pins, origin, selectedId, onSelect }: ActivityMapProps) {
  const display = useRoleDisplay()
  const styles = useRoleStyles(createStyles)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  const pinSize = Math.max(44, display.touchTargetSize)

  const positions = useMemo(
    () => (size ? layoutPoints(pins, origin, size.width, size.height, pinSize) : null),
    [pins, origin, size, pinSize],
  )

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }))
  }

  // El seleccionado se dibuja al final para quedar encima de los demás.
  const ordered = [...pins].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId))
  const originPosition = positions?.[ORIGIN_KEY]

  return (
    <View style={styles.wrapper}>
      <View style={styles.map} onLayout={handleLayout}>
        <View style={styles.river} />
        {[25, 50, 75].map((position) => (
          <View key={`v-${position}`} style={[styles.gridV, { left: `${position}%` }]} />
        ))}
        {[33, 66].map((position) => (
          <View key={`h-${position}`} style={[styles.gridH, { top: `${position}%` }]} />
        ))}

        {origin && originPosition && (
          <View
            style={[styles.origin, { left: originPosition.x - pinSize / 2, top: originPosition.y - pinSize / 2 }]}
            accessibilityLabel={origin.label}
          >
            <View style={[styles.originDot, { width: pinSize, height: pinSize }]}>
              <Ionicons name="home" size={Math.round(pinSize * 0.5)} color={display.colors.blanco} />
            </View>
            <AppText variant="caption" style={styles.originLabel}>
              Tú
            </AppText>
          </View>
        )}

        {positions &&
          ordered.map((pin) => {
            const position = positions[pin.id]
            if (!position) return null
            const selected = pin.id === selectedId

            return (
              <Pressable
                key={pin.id}
                accessibilityRole="button"
                accessibilityLabel={pin.label}
                aria-selected={selected}
                onPress={() => onSelect(pin.id)}
                style={[
                  styles.pin,
                  pin.featured && styles.pinFeatured,
                  selected && styles.pinSelected,
                  { width: pinSize, height: pinSize, left: position.x - pinSize / 2, top: position.y - pinSize / 2 },
                ]}
              >
                <Ionicons
                  name={pin.icon}
                  size={Math.round(pinSize * 0.5)}
                  color={selected ? display.colors.blanco : display.colors.azul}
                />
              </Pressable>
            )
          })}
      </View>
      <AppText variant="caption" style={styles.legend}>
        Mapa esquemático de tu zona · toca un punto para ver la actividad
      </AppText>
    </View>
  )
}
