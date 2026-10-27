const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

// Codifica una coordenada en geohash. Precisión 7 ≈ 150 m, suficiente para agrupar actividades por zona.
function encode(lat, lng, precision = 7) {
  const latRange = [-90, 90]
  const lngRange = [-180, 180]
  let hash = ''
  let bits = 0
  let value = 0
  let useLng = true

  while (hash.length < precision) {
    const range = useLng ? lngRange : latRange
    const coordinate = useLng ? lng : lat
    const mid = (range[0] + range[1]) / 2
    if (coordinate >= mid) {
      value = (value << 1) + 1
      range[0] = mid
    } else {
      value = value << 1
      range[1] = mid
    }
    useLng = !useLng
    bits += 1
    if (bits === 5) {
      hash += BASE32[value]
      bits = 0
      value = 0
    }
  }
  return hash
}

module.exports = { encode }