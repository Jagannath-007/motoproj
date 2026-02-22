const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

router.get('/:id/activities', (req, res) => {
    const activities = db.prepare(
        'SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC'
    ).all(req.params.id);
    res.json(activities);
});

router.post('/:id/activities', (req, res) => {
    const { type, description, performed_by } = req.body;
    if (!type || !description) return res.status(400).json({ error: 'type and description required' });

    const id = uuidv4();
    db.prepare('INSERT INTO activities (id,lead_id,type,description,performed_by) VALUES (?,?,?,?,?)')
        .run(id, req.params.id, type, description, performed_by || 'User');

    db.prepare(`UPDATE leads SET last_activity_date = date('now'), updated_at = datetime('now') WHERE id = ?`)
        .run(req.params.id);

    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
    res.status(201).json(activity);
});

module.exports = router;
