const express = require('express')
const { randomUUID } = require('node:crypto')
const { v2: cloudinary } = require('cloudinary')
const prisma = require('../prisma')
const requireAuth = require('../middleware/requireAuth')
const { encode } = require('../utils/geohash')

const router = express.Router()
router.use(requireAuth)

// Cloudinary toma las credenciales de la variable CLOUDINARY_URL del archivo .env.
cloudinary.config({ secure: true })

// Deben coincidir con el frontend (data/categories.ts y permissions/reputation.ts).
const CATEGORIES = ['Baile', 'Bienestar', 'Salud', 'Juegos', 'Ejercicio', 'Cultura']
const CREATE_EVENT_REPUTATION_THRESHOLD = 50
const HISTORY_DAYS = 90
// Imagen enviada en base64: ~7 millones de caracteres ≈ 5 MB de archivo.
const MAX_IMAGE_BASE64 = 7_000_000
// Destacar un evento cuesta $1 por día (pago simulado: no se cobra nada real).
const FEATURE_PRICE_USD_PER_DAY = 1
const MAX_FEATURE_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

// Express 4 no captura errores de funciones async; este envoltorio los convierte en 500.
const handle = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  })

// Misma regla que canPublishEvents del frontend, pero con la reputación leída de la base de datos.
function canPublish(user) {
  return user.role === 'empresa' || user.reputationScore >= CREATE_EVENT_REPUTATION_THRESHOLD
}

function imageStorageConfigured() {
  return Boolean(cloudinary.config().cloud_name)
}

// Sube la imagen a Cloudinary ya recortada a 1200x750 (misma proporción que las tarjetas).
// Solo se guarda en la base de datos la URL que devuelve.
async function uploadImage(base64, activityId) {
  const hasPrefix = /^data:image\/[\w.+-]+;base64,/.test(base64)
  const content = hasPrefix ? base64.replace(/^data:image\/[\w.+-]+;base64,/, '') : base64
  if (content.length === 0 || content.length > MAX_IMAGE_BASE64) {
    const error = new Error('Imagen fuera de rango')
    error.invalidImage = true
    throw error
  }
  try {
    const result = await cloudinary.uploader.upload(hasPrefix ? base64 : `data:image/jpeg;base64,${content}`, {
      folder: 'conecta-plus/activities',
      public_id: activityId,
      resource_type: 'image',
      transformation: [{ width: 1200, height: 750, crop: 'fill', gravity: 'auto', quality: 'auto' }],
    })
    return { url: result.secure_url, publicId: result.public_id }
  } catch (err) {
    // Cloudinary responde 400 cuando el archivo no es una imagen válida.
    if (err && err.http_code === 400) err.invalidImage = true
    throw err
  }
}

// Convierte una fila de la base de datos a la forma que usa el frontend.
// El destacado vence solo: si `featuredUntil` ya pasó, el evento deja de aparecer como destacado.
function toActivity(a) {
  const featuredActive = Boolean(a.featured && a.featuredUntil && a.featuredUntil.getTime() > Date.now())
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    category: a.categoryName,
    startsAt: a.startsAt.toISOString(),
    place: a.placeName,
    placeAddress: a.placeAddress,
    lat: a.placeLat,
    lng: a.placeLng,
    imageUrl: a.imageUrl,
    createdBy: a.createdBy,
    createdByName: a.createdByName,
    capacity: a.capacity,
    attendeesCount: a.enrolledCount,
    status: a.status,
    featured: featuredActive,
    featuredUntil: featuredActive ? a.featuredUntil.toISOString() : null,
  }
}

async function hasActiveLink(caregiverId, elderId) {
  const link = await prisma.familyLink.findUnique({ where: { id: `${caregiverId}_${elderId}` } })
  return !!link && link.status === 'active'
}

// Lista de actividades. Las inscripciones devueltas son solo las que el usuario puede ver:
// las suyas y, si es cuidador, las de sus familiares vinculados. Para el resto solo hay un conteo.
router.get(
  '/',
  handle(async (req, res) => {
    const since = new Date(Date.now() - HISTORY_DAYS * DAY_MS)
    const activities = await prisma.activity.findMany({
      where: { startsAt: { gte: since }, status: { not: 'cancelada' } },
      orderBy: { startsAt: 'asc' },
    })

    let visibleUserIds = [req.user.id]
    if (req.user.role === 'cuidador') {
      const links = await prisma.familyLink.findMany({
        where: { caregiverId: req.user.id, status: 'active' },
        select: { elderId: true },
      })
      visibleUserIds = visibleUserIds.concat(links.map((l) => l.elderId))
    }

    const rows = await prisma.enrollment.findMany({
      where: { userId: { in: visibleUserIds } },
      select: { activityId: true, userId: true },
    })
    const enrollments = {}
    for (const row of rows) {
      if (!enrollments[row.activityId]) enrollments[row.activityId] = []
      enrollments[row.activityId].push(row.userId)
    }

    res.json({ activities: activities.map(toActivity), enrollments })
  }),
)

// Publicar un evento: empresas, o usuarios con la reputación mínima (se valida con el dato del servidor).
router.post(
  '/',
  handle(async (req, res) => {
    const me = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (!me || !canPublish(me)) {
      return res
        .status(403)
        .json({ error: `Necesitas ${CREATE_EVENT_REPUTATION_THRESHOLD} puntos de reputación para publicar eventos` })
    }

    const body = req.body || {}
    const title = String(body.title ?? '').trim()
    const description = String(body.description ?? '').trim().slice(0, 2000) || 'Sin descripción.'
    const category = body.category
    const startsAt = new Date(body.startsAt)
    const place = body.place || {}
    const placeName = String(place.name ?? '').trim()
    const placeAddress = String(place.address ?? '').trim().slice(0, 300) || placeName

    if (title.length < 3 || title.length > 120) {
      return res.status(400).json({ error: 'El título debe tener entre 3 y 120 caracteres' })
    }
    if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Categoría inválida' })
    if (Number.isNaN(startsAt.getTime())) return res.status(400).json({ error: 'Fecha inválida' })
    if (startsAt.getTime() <= Date.now()) return res.status(400).json({ error: 'La fecha debe ser futura' })
    if (placeName.length < 3 || placeName.length > 150) {
      return res.status(400).json({ error: 'Indica el lugar del evento' })
    }
    const validLat = typeof place.lat === 'number' && Number.isFinite(place.lat) && Math.abs(place.lat) <= 90
    const validLng = typeof place.lng === 'number' && Number.isFinite(place.lng) && Math.abs(place.lng) <= 180
    if (!validLat || !validLng) return res.status(400).json({ error: 'Elige un lugar de la lista de resultados' })

    let capacity = null
    if (body.capacity !== undefined && body.capacity !== null && body.capacity !== '') {
      capacity = Number(body.capacity)
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 10000) {
        return res.status(400).json({ error: 'El cupo debe ser un número entero entre 1 y 10000' })
      }
    }

    const id = randomUUID()

    // Imagen opcional: si no se envía, se usa una imagen de ejemplo.
    let imageUrl = `https://picsum.photos/seed/${id}/800/500`
    let uploadedPublicId = null
    if (typeof body.image === 'string' && body.image.length > 0) {
      if (!imageStorageConfigured()) {
        return res.status(503).json({ error: 'El almacenamiento de imágenes no está configurado en el servidor' })
      }
      try {
        const uploaded = await uploadImage(body.image, id)
        imageUrl = uploaded.url
        uploadedPublicId = uploaded.publicId
      } catch (err) {
        if (err && err.invalidImage) {
          return res.status(400).json({ error: 'La imagen no es válida o pesa demasiado (máximo 5 MB)' })
        }
        console.error(err)
        return res.status(502).json({ error: 'No se pudo guardar la imagen. Intenta de nuevo.' })
      }
    }

    try {
      const created = await prisma.activity.create({
        data: {
          id,
          title,
          description,
          categoryId: category,
          categoryName: category,
          startsAt,
          placeName,
          placeAddress,
          placeLat: place.lat,
          placeLng: place.lng,
          placeGeohash: encode(place.lat, place.lng, 7),
          imageUrl,
          createdBy: me.id,
          createdByName: me.name,
          capacity,
        },
      })
      res.status(201).json({ activity: toActivity(created) })
    } catch (err) {
      // Si la actividad no se pudo guardar, no se deja la imagen huérfana en Cloudinary.
      if (uploadedPublicId) await cloudinary.uploader.destroy(uploadedPublicId).catch(() => {})
      throw err
    }
  }),
)

// Destacar un evento por N días ($1 por día, pago simulado): solo la organización dueña del evento.
// Si ya estaba destacado, los días se suman a partir de la fecha en que vence el destacado actual.
router.post(
  '/:id/feature',
  handle(async (req, res) => {
    if (req.user.role !== 'empresa') {
      return res.status(403).json({ error: 'Solo una organización puede destacar eventos' })
    }
    const days = req.body?.days
    if (!Number.isInteger(days) || days < 1 || days > MAX_FEATURE_DAYS) {
      return res.status(400).json({ error: `Elige entre 1 y ${MAX_FEATURE_DAYS} días` })
    }
    const activity = await prisma.activity.findUnique({ where: { id: req.params.id } })
    if (!activity || activity.createdBy !== req.user.id) {
      return res.status(404).json({ error: 'Actividad no encontrada' })
    }
    if (activity.status === 'cancelada' || activity.startsAt.getTime() <= Date.now()) {
      return res.status(409).json({ error: 'No se puede destacar un evento que ya empezó o fue cancelado' })
    }

    const now = new Date()
    const stillFeatured = activity.featured && activity.featuredUntil && activity.featuredUntil.getTime() > now.getTime()
    const startsAt = stillFeatured ? activity.featuredUntil : now
    const endsAt = new Date(startsAt.getTime() + days * DAY_MS)

    const [purchase, updated] = await prisma.$transaction([
      prisma.featuredPurchase.create({
        data: {
          activityId: activity.id,
          orgId: req.user.id,
          days,
          amountUsd: days * FEATURE_PRICE_USD_PER_DAY,
          startsAt,
          endsAt,
          status: 'simulado',
        },
      }),
      prisma.activity.update({ where: { id: activity.id }, data: { featured: true, featuredUntil: endsAt } }),
    ])
    res.status(201).json({
      activity: toActivity(updated),
      purchase: {
        id: purchase.id,
        days: purchase.days,
        amountUsd: purchase.amountUsd,
        endsAt: purchase.endsAt.toISOString(),
        status: purchase.status,
      },
    })
  }),
)

// Lista de inscritos: solo quien publicó el evento. No incluye correos.
router.get(
  '/:id/attendees',
  handle(async (req, res) => {
    const activity = await prisma.activity.findUnique({ where: { id: req.params.id } })
    if (!activity || activity.createdBy !== req.user.id) {
      return res.status(404).json({ error: 'Actividad no encontrada' })
    }
    const rows = await prisma.enrollment.findMany({
      where: { activityId: activity.id },
      select: { userId: true },
    })
    const users = await prisma.user.findMany({
      where: { id: { in: rows.map((r) => r.userId) } },
      select: { id: true, name: true, role: true },
    })
    res.json({ attendees: users })
  }),
)

// Inscribirse (uno mismo) o inscribir a un familiar vinculado (cuidador).
router.post(
  '/:id/enrollments',
  handle(async (req, res) => {
    const activityId = req.params.id
    const me = req.user.id
    const targetId = req.body?.userId || me

    const activity = await prisma.activity.findUnique({ where: { id: activityId } })
    if (!activity) return res.status(404).json({ error: 'Actividad no encontrada' })
    if (activity.status === 'cancelada') return res.status(409).json({ error: 'La actividad fue cancelada' })
    if (activity.startsAt.getTime() <= Date.now()) {
      return res.status(409).json({ error: 'La actividad ya empezó o finalizó' })
    }

    if (targetId === me) {
      if (req.user.role === 'empresa') {
        return res.status(403).json({ error: 'Una organización no puede inscribirse a actividades' })
      }
    } else {
      const allowed = req.user.role === 'cuidador' && (await hasActiveLink(me, targetId))
      if (!allowed) {
        return res.status(403).json({ error: 'Solo puedes inscribir a familiares con un vínculo activo' })
      }
    }

    const id = `${activityId}_${targetId}`
    if (await prisma.enrollment.findUnique({ where: { id } })) {
      return res.status(409).json({ error: 'Ya está inscrito en esta actividad' })
    }

    try {
      await prisma.enrollment.create({
        data: {
          id,
          activityId,
          userId: targetId,
          enrolledBy: me,
          status: 'confirmado',
          activityStartsAt: activity.startsAt,
        },
      })
    } catch (e) {
      if (e.code === 'P2002') return res.status(409).json({ error: 'Ya está inscrito en esta actividad' })
      throw e
    }

    // El incremento es condicional: solo ocurre si todavía hay cupo, así dos inscripciones
    // simultáneas no pueden pasar del límite.
    const updated = await prisma.$executeRaw`
      UPDATE "Activity" SET "enrolledCount" = "enrolledCount" + 1
      WHERE "id" = ${activityId} AND ("capacity" IS NULL OR "enrolledCount" < "capacity")`
    if (updated === 0) {
      await prisma.enrollment.delete({ where: { id } })
      return res.status(409).json({ error: 'La actividad ya no tiene cupos' })
    }
    await prisma.$executeRaw`
      UPDATE "Activity" SET "status" = 'llena'
      WHERE "id" = ${activityId} AND "capacity" IS NOT NULL AND "enrolledCount" >= "capacity"`

    const fresh = await prisma.activity.findUnique({ where: { id: activityId } })
    res.status(201).json({ activity: toActivity(fresh), enrollment: { activityId, userId: targetId } })
  }),
)

// Cancelar una inscripción: la propia, la que hizo el cuidador, o la de un familiar vinculado.
router.delete(
  '/:id/enrollments/:userId',
  handle(async (req, res) => {
    const { id: activityId, userId } = req.params
    const me = req.user.id

    const enrollment = await prisma.enrollment.findUnique({ where: { id: `${activityId}_${userId}` } })
    if (!enrollment) return res.status(404).json({ error: 'Inscripción no encontrada' })

    const allowed =
      userId === me ||
      enrollment.enrolledBy === me ||
      (req.user.role === 'cuidador' && (await hasActiveLink(me, userId)))
    if (!allowed) return res.status(404).json({ error: 'Inscripción no encontrada' })

    const activity = await prisma.activity.findUnique({ where: { id: activityId } })
    if (activity && activity.startsAt.getTime() <= Date.now()) {
      return res.status(409).json({ error: 'No puedes cancelar una actividad que ya empezó' })
    }

    await prisma.enrollment.delete({ where: { id: enrollment.id } })
    await prisma.$executeRaw`
      UPDATE "Activity" SET "enrolledCount" = MAX("enrolledCount" - 1, 0) WHERE "id" = ${activityId}`
    await prisma.$executeRaw`
      UPDATE "Activity" SET "status" = 'disponible'
      WHERE "id" = ${activityId} AND "status" = 'llena' AND ("capacity" IS NULL OR "enrolledCount" < "capacity")`

    res.json({ ok: true })
  }),
)

module.exports = router