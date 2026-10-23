const jwt = require('jsonwebtoken')

// Lo que la app recibe de un usuario: nunca campos de acceso.
function publicUser(user) {
  const { passwordHash, googleSub, ...rest } = user
  return rest
}

// Token de sesión de la app (el mismo para cualquier forma de iniciar sesión).
function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

module.exports = { publicUser, signToken }
