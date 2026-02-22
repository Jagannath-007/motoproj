const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const leadsRouter = require('./routes/leads');
const usersRouter = require('./routes/users');
const activitiesRouter = require('./routes/activities');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.use('/api/leads', leadsRouter);
app.use('/api/users', usersRouter);
app.use('/api/leads', activitiesRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (_, res) => res.json({ status: 'ok', app: 'AutoPulse CRM', time: new Date().toISOString() }));

// Correct absolute path inside Docker
const frontendPath = path.join(__dirname, "../../frontend/dist");

app.use(express.static(frontendPath));

app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
    console.log(`🚀 AutoPulse CRM Backend running on http://localhost:${PORT}`);
});
