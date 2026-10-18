const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { randomUUID } = require('node:crypto')
const prisma = require('../prisma')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()
const ROLES = ['adulto_mayor', 'cuidador', 'empresa']

function publicUser(user) {
  const { passwordHash, ...rest } = user
  return rest
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body || {}
  if (!name || !email || !password || !ROLES.includes(role)) {
    return res.status(400).json({ error: 'Datos incompletos o rol inválido' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  }
  try {
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        passwordHash: await bcrypt.hash(password, 10),
      },
    })
    res.status(201).json({ token: signToken(user), user: publicUser(user) })
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Ese correo ya está registrado' })
    console.error(e)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Faltan datos' })
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })
  const ok = user && user.passwordHash && (await bcrypt.compare(password, user.passwordHash))
  if (!ok) return res.status(401).json({ error: 'Correo o contraseña incorrectos' })
  res.json({ token: signToken(user), user: publicUser(user) })
})

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return res.status(401).json({ error: 'Usuario no encontrado' })
  res.json({ user: publicUser(user) })
})

module.exports = router