const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/users
router.get('/', (req, res) => {
    const { role } = req.query;
    let query = 'SELECT id, name, email, role FROM users WHERE 1=1';
    const params = [];
    if (role) { query += ' AND role = ?'; params.push(role); }

    const users = db.prepare(query).all(...params);

    // Enrich with lead count
    const enriched = users.map(u => {
        const activeLeads = db.prepare(
            `SELECT COUNT(*) as c FROM leads WHERE assigned_to = ? AND status NOT IN ('Converted','Not Interested','Closed Won','Closed Lost')`
        ).get(u.id).c;
        const totalLeads = db.prepare('SELECT COUNT(*) as c FROM leads WHERE assigned_to = ?').get(u.id).c;
        const converted = db.prepare(`SELECT COUNT(*) as c FROM leads WHERE assigned_to = ? AND status = 'Converted'`).get(u.id).c;
        return { ...u, activeLeads, totalLeads, converted };
    });

    res.json(enriched);
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
});

module.exports = router;
