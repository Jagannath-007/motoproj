const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

function computeScore(lead) {
    const daysSinceActivity = lead.last_activity_date
        ? Math.floor((Date.now() - new Date(lead.last_activity_date)) / 86400000)
        : 99;
    if (daysSinceActivity <= 1 && ['Qualified', 'Negotiation'].includes(lead.status)) return 'hot';
    if (daysSinceActivity <= 3) return 'warm';
    return 'cold';
}

function autoAssignUser() {
    const users = db.prepare(
        `SELECT u.id, COUNT(l.id) as load FROM users u
     LEFT JOIN leads l ON l.assigned_to = u.id AND l.status NOT IN ('Converted','Not Interested','Closed Won','Closed Lost')
     WHERE u.role = 'sales' GROUP BY u.id ORDER BY load ASC LIMIT 1`
    ).get();
    return users?.id || null;
}

router.get('/', (req, res) => {
    const { assignedTo, status, source, search, sort } = req.query;

    let query = `
    SELECT l.*, u.name as assigned_name
    FROM leads l
    LEFT JOIN users u ON u.id = l.assigned_to
    WHERE 1=1
  `;
    const params = [];

    if (assignedTo) { query += ' AND l.assigned_to = ?'; params.push(assignedTo); }
    if (status) { query += ' AND l.status = ?'; params.push(status); }
    if (source) { query += ' AND l.source = ?'; params.push(source); }
    if (search) {
        query += ' AND (l.name LIKE ? OR l.phone LIKE ? OR l.vehicle_interested LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
    }

    if (sort === 'hot') {
        query += ` ORDER BY CASE l.score WHEN 'hot' THEN 1 WHEN 'warm' THEN 2 ELSE 3 END, l.created_at DESC`;
    } else {
        query += ' ORDER BY l.created_at DESC';
    }

    const leads = db.prepare(query).all(...params);

    const enriched = leads.map(l => ({
        ...l,
        score: computeScore(l),
        daysSinceActivity: l.last_activity_date
            ? Math.floor((Date.now() - new Date(l.last_activity_date)) / 86400000)
            : null,
        isAging: l.last_activity_date
            ? Math.floor((Date.now() - new Date(l.last_activity_date)) / 86400000) >= 3
            : false,
    }));

    res.json(enriched);
});

router.get('/summary', (req, res) => {
    const statuses = ['New', 'Contacted', 'Qualified', 'Converted', 'Not Interested'];
    const summary = {};
    statuses.forEach(s => {
        summary[s] = db.prepare('SELECT COUNT(*) as c FROM leads WHERE status = ?').get(s).c;
    });
    res.json(summary);
});

router.get('/:id', (req, res) => {
    const lead = db.prepare(`
    SELECT l.*, u.name as assigned_name
    FROM leads l LEFT JOIN users u ON u.id = l.assigned_to
    WHERE l.id = ?
  `).get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json({ ...lead, score: computeScore(lead) });
});

router.post('/', (req, res) => {
    const { name, phone, email, source, vehicle_interested, budget, status, assigned_to, follow_up_date } = req.body;
    if (!name || !phone || !source) return res.status(400).json({ error: 'name, phone, source required' });

    const dup = db.prepare('SELECT id, name FROM leads WHERE phone = ?').get(phone);
    if (dup) return res.status(409).json({ error: 'Duplicate lead detected', existing: dup });

    const id = uuidv4();
    const assignee = assigned_to || autoAssignUser();
    const today = new Date().toISOString().split('T')[0];

    db.prepare(`
    INSERT INTO leads (id,name,phone,email,source,vehicle_interested,budget,status,assigned_to,follow_up_date,last_activity_date)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, name, phone, email || null, source, vehicle_interested || null, budget || null,
        status || 'New', assignee, follow_up_date || null, today);

    db.prepare('INSERT INTO activities (id,lead_id,type,description,performed_by) VALUES (?,?,?,?,?)')
        .run(uuidv4(), id, 'system', `Lead auto-assigned (lowest workload).`, 'System');

    const lead = db.prepare('SELECT *, (SELECT name FROM users WHERE id = assigned_to) as assigned_name FROM leads WHERE id = ?').get(id);
    res.status(201).json({ ...lead, autoAssigned: !assigned_to });
});

router.put('/:id', (req, res) => {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const fields = ['name', 'phone', 'email', 'source', 'vehicle_interested', 'budget', 'status', 'assigned_to', 'score', 'follow_up_date'];
    const updates = [];
    const params = [];

    fields.forEach(f => {
        if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }
    });
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    updates.push(`updated_at = datetime('now')`);
    params.push(req.params.id);

    db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    if (req.body.status && req.body.status !== lead.status) {
        db.prepare('INSERT INTO activities (id,lead_id,type,description,performed_by) VALUES (?,?,?,?,?)')
            .run(uuidv4(), req.params.id, 'status', `Status changed: ${lead.status} → ${req.body.status}`, req.body.updated_by || 'User');
        db.prepare(`UPDATE leads SET last_activity_date = date('now') WHERE id = ?`).run(req.params.id);
    }

    const updated = db.prepare(`SELECT l.*, u.name as assigned_name FROM leads l LEFT JOIN users u ON u.id = l.assigned_to WHERE l.id = ?`).get(req.params.id);
    res.json(updated);
});

router.delete('/:id', (req, res) => {
    const lead = db.prepare('SELECT id FROM leads WHERE id = ?').get(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

router.post('/:id/convert', (req, res) => {
    db.prepare(`UPDATE leads SET status = 'Converted', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
    db.prepare('INSERT INTO activities (id,lead_id,type,description,performed_by) VALUES (?,?,?,?,?)')
        .run(uuidv4(), req.params.id, 'status', 'Lead converted to Sale! 🎉', req.body.performed_by || 'User');
    res.json({ success: true });
});

router.post('/check-duplicate', (req, res) => {
    const { phone } = req.body;
    const dup = db.prepare('SELECT id, name, phone FROM leads WHERE phone = ?').get(phone);
    res.json({ isDuplicate: !!dup, existing: dup || null });
});

module.exports = router;
