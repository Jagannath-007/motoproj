const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Routers
const leadsRouter = require('./routes/leads');
const usersRouter = require('./routes/users');
const activitiesRouter = require('./routes/activities');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// ── Routes ──
app.use('/api/leads', leadsRouter);
app.use('/api/users', usersRouter);
app.use('/api/leads', activitiesRouter);   // /api/leads/:id/activities
app.use('/api/dashboard', dashboardRouter);

// ── Health ──
app.get('/api/health', (_, res) => res.json({ status: 'ok', app: 'AutoPulse CRM', time: new Date().toISOString() }));

// ── Error handler ──
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
    console.log(`🚀 AutoPulse CRM Backend running on http://localhost:${PORT}`);
});
