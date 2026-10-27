const express = require('express')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()
router.use(requireAuth)

// Búsqueda de direcciones con Nominatim (OpenStreetMap), limitada a Costa Rica.
// Su política de uso pide: máximo 1 petición por segundo y un User-Agent que identifique la app.
const USER_AGENT = process.env.GEOCODER_USER_AGENT || 'ConectaPlus/1.0 (proyecto universitario)'
const MIN_GAP_MS = 1100
const CACHE_MS = 10 * 60 * 1000

const cache = new Map() // consulta -> { at, results }
let lastCall = 0
let queue = Promise.resolve()

// Encola las llamadas para que nunca pasen de 1 por segundo, sin importar cuántos usuarios busquen.
function throttled(task) {
  const run = queue.then(async () => {
    const wait = Math.max(0, lastCall + MIN_GAP_MS - Date.now())
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait))
    lastCall = Date.now()
    return task()
  })
  queue = run.catch(() => {})
  return run
}

router.get('/', async (req, res) => {
  const q = String(req.query.q ?? '').trim()
  if (q.length < 3 || q.length > 120) {
    return res.status(400).json({ error: 'Escribe al menos 3 letras para buscar un lugar' })
  }

  const key = q.toLowerCase()
  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < CACHE_MS) return res.json({ results: cached.results })

  try {
    const results = await throttled(async () => {
      const url =
        'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=cr&accept-language=es&q=' +
        encodeURIComponent(q)
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
      if (!response.ok) throw new Error(`Nominatim respondió ${response.status}`)
      const data = await response.json()
      return data.map((item) => ({
        name: item.name || String(item.display_name).split(',')[0].trim(),
        address: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon),
      }))
    })
    cache.set(key, { at: Date.now(), results })
    res.json({ results })
  } catch (err) {
    console.error(err)
    res.status(502).json({ error: 'No se pudo buscar el lugar. Intenta de nuevo en un momento.' })
  }
})

module.exports = router