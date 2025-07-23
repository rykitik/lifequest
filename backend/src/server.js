const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const questRoutes = require('./routes/questRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Роуты
app.use('/api/auth', authRoutes);
app.use('/api/quests', questRoutes);

module.exports = app;
