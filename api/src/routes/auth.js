const express = require('express')
const prisma = require('../prisma')
const requireAuth = require('../middleware/requireAuth')
const { publicUser } = require('../services/session')

// Iniciar sesión y registrarse se hace solo con Google: ver routes/googleAuth.js.
const router = express.Router()

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return res.status(401).json({ error: 'Usuario no encontrado' })
  res.json({ user: publicUser(user) })
})

module.exports = router
