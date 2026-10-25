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

function linkId(caregiverId, elderId) {
  return `${caregiverId}_${elderId}`
}

// Une cada vínculo con el nombre de la otra persona (sin exponer correos ni datos privados).
async function withNames(links) {
  const ids = [...new Set(links.flatMap((l) => [l.caregiverId, l.elderId]))]
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  })
  const names = Object.fromEntries(users.map((u) => [u.id, u.name]))
  return links.map((l) => ({
    ...l,
    caregiverName: names[l.caregiverId] ?? '',
    elderName: names[l.elderId] ?? '',
  }))
}

// Solicitar vínculo: solo un cuidador, por correo del adulto mayor.
router.post(
  '/',
  handle(async (req, res) => {
    if (req.user.role !== 'cuidador') {
      return res.status(403).json({ error: 'Solo un familiar o cuidador puede solicitar un vínculo' })
    }
    const email = String(req.body?.elderEmail ?? '').trim().toLowerCase()
    if (!email) return res.status(400).json({ error: 'Escribe el correo del adulto mayor' })

    const elder = await prisma.user.findUnique({ where: { email } })
    if (!elder || elder.role !== 'adulto_mayor') {
      return res.status(404).json({ error: 'No encontramos a un adulto mayor con ese correo.' })
    }

    const id = linkId(req.user.id, elder.id)
    const existing = await prisma.familyLink.findUnique({ where: { id } })
    if (existing) {
      return res.status(409).json({ error: `Ya tienes un vínculo o solicitud con ${elder.name}.` })
    }

    const link = await prisma.familyLink.create({
      data: {
        id,
        caregiverId: req.user.id,
        elderId: elder.id,
        status: 'pending',
        requestedBy: req.user.id,
      },
    })
    const [withName] = await withNames([link])
    res.status(201).json({
      link: withName,
      message: `Solicitud enviada a ${elder.name}. Debe aceptarla para vincularse.`,
    })
  }),
)

// Listar los vínculos del usuario (como cuidador o como adulto mayor).
router.get(
  '/',
  handle(async (req, res) => {
    const links = await prisma.familyLink.findMany({
      where: { OR: [{ caregiverId: req.user.id }, { elderId: req.user.id }] },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ links: await withNames(links) })
  }),
)

// Aceptar o rechazar: solo el adulto mayor del vínculo y solo si está pendiente.
router.post(
  '/:id/respond',
  handle(async (req, res) => {
    if (typeof req.body?.accept !== 'boolean') {
      return res.status(400).json({ error: 'Indica si aceptas o rechazas la solicitud' })
    }
    const link = await prisma.familyLink.findUnique({ where: { id: req.params.id } })
    if (!link || link.elderId !== req.user.id) {
      return res.status(404).json({ error: 'Solicitud no encontrada' })
    }
    if (link.status !== 'pending') {
      return res.status(409).json({ error: 'Esta solicitud ya fue respondida' })
    }

    if (!req.body.accept) {
      await prisma.familyLink.delete({ where: { id: link.id } })
      return res.json({ link: null })
    }
    const updated = await prisma.familyLink.update({
      where: { id: link.id },
      data: { status: 'active', respondedAt: new Date() },
    })
    const [withName] = await withNames([updated])
    res.json({ link: withName })
  }),
)

// Eliminar un vínculo: cualquiera de las dos personas involucradas.
router.delete(
  '/:id',
  handle(async (req, res) => {
    const link = await prisma.familyLink.findUnique({ where: { id: req.params.id } })
    if (!link || (link.caregiverId !== req.user.id && link.elderId !== req.user.id)) {
      return res.status(404).json({ error: 'Vínculo no encontrado' })
    }
    await prisma.familyLink.delete({ where: { id: link.id } })
    res.json({ ok: true })
  }),
)

module.exports = router