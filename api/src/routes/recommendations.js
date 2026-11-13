const express = require('express')
const prisma = require('../prisma')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()
router.use(requireAuth)

// Express 4 no captura errores de funciones async; este envoltorio los convierte en 500.
const handle = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err)
    res.status(500).json({ error: 'Error del servidor' })
  })

// Recomendar una actividad a un familiar: solo un cuidador, y solo a alguien con vínculo activo.
router.post(
  '/',
  handle(async (req, res) => {
    if (req.user.role !== 'cuidador') {
      return res.status(403).json({ error: 'Solo un familiar o cuidador puede recomendar actividades' })
    }
    const { activityId, toUserId } = req.body || {}
    if (typeof activityId !== 'string' || typeof toUserId !== 'string' || !activityId || !toUserId) {
      return res.status(400).json({ error: 'Indica la actividad y la persona' })
    }
    const me = req.user.id

    const link = await prisma.familyLink.findUnique({ where: { id: `${me}_${toUserId}` } })
    if (!link || link.status !== 'active') {
      return res.status(403).json({ error: 'Solo puedes recomendar a familiares con un vínculo activo' })
    }

    const activity = await prisma.activity.findUnique({ where: { id: activityId } })
    if (!activity) return res.status(404).json({ error: 'Actividad no encontrada' })
    if (activity.status === 'cancelada' || activity.startsAt.getTime() <= Date.now()) {
      return res.status(409).json({ error: 'Esa actividad ya no está disponible' })
    }

    if (await prisma.enrollment.findUnique({ where: { id: `${activityId}_${toUserId}` } })) {
      return res.status(409).json({ error: 'Tu familiar ya está inscrito en esa actividad' })
    }

    const id = `${activityId}_${me}_${toUserId}`
    if (await prisma.recommendation.findUnique({ where: { id } })) {
      return res.status(409).json({ error: 'Ya recomendaste esta actividad' })
    }

    let created
    try {
      created = await prisma.recommendation.create({
        data: { id, activityId, fromUserId: me, toUserId },
      })
    } catch (e) {
      if (e.code === 'P2002') return res.status(409).json({ error: 'Ya recomendaste esta actividad' })
      throw e
    }
    const from = await prisma.user.findUnique({ where: { id: me }, select: { name: true } })
    res.status(201).json({
      recommendation: {
        id: created.id,
        activityId: created.activityId,
        fromUserId: created.fromUserId,
        toUserId: created.toUserId,
        fromName: from?.name ?? '',
      },
    })
  }),
)

// Recomendaciones que el usuario envió o recibió, con el nombre de quien recomienda (sin correos).
router.get(
  '/',
  handle(async (req, res) => {
    const rows = await prisma.recommendation.findMany({
      where: { OR: [{ fromUserId: req.user.id }, { toUserId: req.user.id }] },
      orderBy: { createdAt: 'desc' },
    })
    const users = await prisma.user.findMany({
      where: { id: { in: [...new Set(rows.map((r) => r.fromUserId))] } },
      select: { id: true, name: true },
    })
    const names = Object.fromEntries(users.map((u) => [u.id, u.name]))
    res.json({
      recommendations: rows.map((r) => ({
        id: r.id,
        activityId: r.activityId,
        fromUserId: r.fromUserId,
        toUserId: r.toUserId,
        fromName: names[r.fromUserId] ?? '',
      })),
    })
  }),
)

module.exports = router