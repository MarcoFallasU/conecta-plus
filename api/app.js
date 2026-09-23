require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const port = process.env.PORT || 4000;

sequelize
  .authenticate()
  .then(() => console.log('Base de datos conectada'))
  .catch((err) => console.error('No se pudo conectar a la base de datos:', err.message))
  .finally(() => app.listen(port, () => console.log(`API en http://localhost:${port}`)));
