require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./src/prisma');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/links', require('./src/routes/links'));
app.use('/api/activities', require('./src/routes/activities'));
app.use('/api/geocode', require('./src/routes/geocode'));
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { order: 'asc' } });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

const port = process.env.PORT || 4000;

prisma
  .$queryRaw`SELECT 1`
  .then(() => console.log('Base de datos conectada'))
  .catch((err) => console.error('No se pudo conectar a la base de datos:', err.message))
  .finally(() => app.listen(port, () => console.log(`API en http://localhost:${port}`)));