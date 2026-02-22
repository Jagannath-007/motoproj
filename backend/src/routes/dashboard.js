const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/sales', (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const total = db.prepare('SELECT COUNT(*) as c FROM leads WHERE assigned_to = ?').get(userId).c;
    const converted = db.prepare(`SELECT COUNT(*) as c FROM leads WHERE assigned_to = ? AND status = 'Converted'`).get(userId).c;
    const pending = db.prepare(`SELECT COUNT(*) as c FROM leads WHERE assigned_to = ? AND follow_up_date >= date('now') AND status NOT IN ('Converted','Not Interested')`).get(userId).c;
    const thisMonth = db.prepare(`SELECT COUNT(*) as c FROM leads WHERE assigned_to = ? AND status = 'Converted' AND strftime('%Y-%m', updated_at) = strftime('%Y-%m','now')`).get(userId).c;
    const overdue = db.prepare(`SELECT l.*, u.name as assigned_name FROM leads l LEFT JOIN users u ON u.id = l.assigned_to WHERE l.assigned_to = ? AND l.follow_up_date < date('now') AND l.status NOT IN ('Converted','Not Interested','Closed Won','Closed Lost')`).all(userId);
    const inactive = db.prepare(`SELECT l.*, u.name as assigned_name FROM leads l LEFT JOIN users u ON u.id = l.assigned_to WHERE l.assigned_to = ? AND julianday('now') - julianday(l.last_activity_date) >= 3 AND l.status NOT IN ('Converted','Not Interested','Closed Won','Closed Lost')`).all(userId);

    const statuses = ['New', 'Contacted', 'Qualified', 'Negotiation', 'Converted', 'Not Interested'];
    const statusDist = {};
    statuses.forEach(s => {
        statusDist[s] = db.prepare('SELECT COUNT(*) as c FROM leads WHERE assigned_to = ? AND status = ?').get(userId, s).c;
    });

    const sources = ['Website', 'Facebook', 'Google', 'Twitter', 'Referral', 'Offline'];
    const sourceDist = {};
    sources.forEach(s => {
        sourceDist[s] = db.prepare('SELECT COUNT(*) as c FROM leads WHERE assigned_to = ? AND source = ?').get(userId, s).c;
    });

    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
        const count = db.prepare(
            `SELECT COUNT(*) as c FROM activities WHERE lead_id IN (SELECT id FROM leads WHERE assigned_to = ?) AND date(created_at) = date('now','-${i} days')`
        ).get(userId).c;
        weeklyActivity.push(count);
    }

    res.json({
        kpi: {
            assignedLeads: total,
            conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
            pendingFollowups: pending,
            convertedThisMonth: thisMonth,
        },
        statusDistribution: statusDist,
        sourceDistribution: sourceDist,
        weeklyActivity,
        overdue,
        inactive,
    });
});

router.get('/manager', (req, res) => {
    const totalLeads = db.prepare(`SELECT COUNT(*) as c FROM leads WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m','now')`).get().c;
    const totalConv = db.prepare(`SELECT COUNT(*) as c FROM leads WHERE status = 'Converted'`).get().c;
    const allLeads = db.prepare('SELECT COUNT(*) as c FROM leads').get().c;

    const revenue = totalConv * 1200000;

    const sources = ['Website', 'Facebook', 'Google', 'Twitter', 'Referral', 'Offline'];
    const sourceDist = {};
    sources.forEach(s => {
        sourceDist[s] = db.prepare('SELECT COUNT(*) as c FROM leads WHERE source = ?').get(s).c;
    });

    const months = [];
    const monthlyLeads = [];
    const monthlyConversions = [];
    for (let i = 5; i >= 0; i--) {
        const lbl = new Date();
        lbl.setMonth(lbl.getMonth() - i);
        const m = lbl.toISOString().slice(0, 7);
        months.push(lbl.toLocaleString('default', { month: 'short' }));
        monthlyLeads.push(db.prepare(`SELECT COUNT(*) as c FROM leads WHERE strftime('%Y-%m', created_at) = ?`).get(m).c);
        monthlyConversions.push(db.prepare(`SELECT COUNT(*) as c FROM leads WHERE status = 'Converted' AND strftime('%Y-%m', updated_at) = ?`).get(m).c);
    }

    const statuses = ['New', 'Contacted', 'Qualified', 'Negotiation', 'Converted', 'Not Interested'];
    const statusDist = {};
    statuses.forEach(s => {
        statusDist[s] = db.prepare('SELECT COUNT(*) as c FROM leads WHERE status = ?').get(s).c;
    });

    const salesUsers = db.prepare(`SELECT u.id, u.name FROM users u WHERE u.role = 'sales'`).all();
    const execPerformance = salesUsers.map(u => ({
        name: u.name,
        assigned: db.prepare('SELECT COUNT(*) as c FROM leads WHERE assigned_to = ?').get(u.id).c,
        converted: db.prepare(`SELECT COUNT(*) as c FROM leads WHERE assigned_to = ? AND status = 'Converted'`).get(u.id).c,
    }));

    const top = [...execPerformance].sort((a, b) => b.converted - a.converted)[0];

    res.json({
        kpi: {
            totalLeads,
            conversionRate: allLeads > 0 ? Math.round((totalConv / allLeads) * 100) : 0,
            revenueGenerated: revenue,
            avgResponseTime: '1h 24m',
            topPerformer: top || null,
        },
        sourceDistribution: sourceDist,
        monthlyTrend: { months, leads: monthlyLeads, conversions: monthlyConversions },
        statusDistribution: statusDist,
        execPerformance,
    });
});

module.exports = router;
