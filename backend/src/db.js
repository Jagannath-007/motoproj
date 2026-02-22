const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './data/autopulse.db';
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('sales','manager')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    source TEXT NOT NULL,
    vehicle_interested TEXT,
    budget TEXT,
    status TEXT NOT NULL DEFAULT 'New',
    assigned_to TEXT,
    score TEXT DEFAULT 'warm',
    follow_up_date TEXT,
    last_activity_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(assigned_to) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    performed_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
  );
`);

const seedUsers = [
  { id: 'u1', name: 'Priya Sharma', email: 'priya@hsrmotors.in', role: 'sales' },
  { id: 'u2', name: 'Rohan Das', email: 'rohan@hsrmotors.in', role: 'sales' },
  { id: 'u3', name: 'Sneha Kapoor', email: 'sneha@hsrmotors.in', role: 'sales' },
  { id: 'u4', name: 'Arjun P.', email: 'arjun2@hsrmotors.in', role: 'sales' },
  { id: 'u5', name: 'Neha Mehta', email: 'neha@hsrmotors.in', role: 'sales' },
  { id: 'u6', name: 'Arjun Kumar', email: 'manager@hsrmotors.in', role: 'manager' },
];

const seedLeads = [
  { id: 'l1', name: 'Rahul Mehta', phone: '+91 98765 43210', email: 'rahul@gmail.com', source: 'Facebook', vehicle_interested: 'Hyundai Creta SX(O)', budget: '₹12L–₹15L', status: 'Qualified', assigned_to: 'u1', score: 'hot', follow_up_date: '2026-02-18', last_activity_date: '2026-02-18' },
  { id: 'l2', name: 'Anjali Singh', phone: '+91 87654 32109', email: 'anjali@gmail.com', source: 'Google', vehicle_interested: 'Venue S+', budget: '₹9L–₹12L', status: 'New', assigned_to: 'u2', score: 'warm', follow_up_date: '2026-02-22', last_activity_date: '2026-02-21' },
  { id: 'l3', name: 'Karan Verma', phone: '+91 76543 21098', email: 'karan@gmail.com', source: 'Website', vehicle_interested: 'Alcazar Platinum', budget: '₹19L–₹22L', status: 'Contacted', assigned_to: 'u1', score: 'hot', follow_up_date: '2026-02-19', last_activity_date: '2026-02-17' },
  { id: 'l4', name: 'Meera Nair', phone: '+91 65432 10987', email: 'meera@gmail.com', source: 'Referral', vehicle_interested: 'i20 Asta', budget: '₹10L', status: 'Converted', assigned_to: 'u3', score: 'warm', follow_up_date: null, last_activity_date: '2026-02-15' },
  { id: 'l5', name: 'Vikram Joshi', phone: '+91 54321 09876', email: 'vikram@gmail.com', source: 'Offline', vehicle_interested: 'Tucson AWD', budget: '₹30L', status: 'Not Interested', assigned_to: 'u2', score: 'cold', follow_up_date: null, last_activity_date: '2026-02-14' },
  { id: 'l6', name: 'Priya Patel', phone: '+91 43210 98765', email: 'priyap@gmail.com', source: 'Twitter', vehicle_interested: 'Exter SX', budget: '₹8L–₹10L', status: 'New', assigned_to: 'u1', score: 'warm', follow_up_date: '2026-02-22', last_activity_date: '2026-02-21' },
  { id: 'l7', name: 'Suresh Kumar', phone: '+91 32109 87654', email: 'suresh@gmail.com', source: 'Google', vehicle_interested: 'Kona Electric', budget: '₹24L–₹26L', status: 'Qualified', assigned_to: 'u3', score: 'hot', follow_up_date: '2026-02-23', last_activity_date: '2026-02-20' },
  { id: 'l8', name: 'Lakshmi Nair', phone: '+91 21098 76543', email: 'lakshmi@gmail.com', source: 'Facebook', vehicle_interested: 'Creta N Line', budget: '₹14L–₹16L', status: 'Contacted', assigned_to: 'u1', score: 'warm', follow_up_date: '2026-02-21', last_activity_date: '2026-02-18' },
  { id: 'l9', name: 'Dev Rathi', phone: '+91 11223 44556', email: 'dev@gmail.com', source: 'Website', vehicle_interested: 'Grand i10 NIOS', budget: '₹7L–₹9L', status: 'New', assigned_to: 'u3', score: 'cold', follow_up_date: '2026-02-23', last_activity_date: '2026-02-21' },
  { id: 'l10', name: 'Anita Bose', phone: '+91 22334 55667', email: 'anita@gmail.com', source: 'Referral', vehicle_interested: 'Tucson 2.0 DSL', budget: '₹28L–₹32L', status: 'Negotiation', assigned_to: 'u2', score: 'hot', follow_up_date: '2026-02-22', last_activity_date: '2026-02-19' },
  { id: 'l11', name: 'Nikhil Roy', phone: '+91 33445 66778', email: 'nikhil@gmail.com', source: 'Google', vehicle_interested: 'Creta SX', budget: '₹13L–₹15L', status: 'Negotiation', assigned_to: 'u1', score: 'warm', follow_up_date: '2026-02-22', last_activity_date: '2026-02-20' },
  { id: 'l12', name: 'Sanjay Gupta', phone: '+91 44556 77889', email: 'sanjay@gmail.com', source: 'Facebook', vehicle_interested: 'Creta E+', budget: '₹11L', status: 'Converted', assigned_to: 'u1', score: 'warm', follow_up_date: null, last_activity_date: '2026-02-14' },
  { id: 'l13', name: 'Ravi Sharma', phone: '+91 55667 88990', email: 'ravi@gmail.com', source: 'Offline', vehicle_interested: 'Venue S (D)', budget: '₹10L–₹12L', status: 'Contacted', assigned_to: 'u2', score: 'warm', follow_up_date: '2026-02-22', last_activity_date: '2026-02-20' },
  { id: 'l14', name: 'Pooja Iyer', phone: '+91 66778 99001', email: 'pooja@gmail.com', source: 'Website', vehicle_interested: 'Ioniq 5', budget: '₹44L–₹46L', status: 'New', assigned_to: 'u4', score: 'warm', follow_up_date: '2026-02-24', last_activity_date: '2026-02-21' },
  { id: 'l15', name: 'Amit Chaudhary', phone: '+91 77889 00112', email: 'amit@gmail.com', source: 'Google', vehicle_interested: 'Creta SX(O) Diesel', budget: '₹17L–₹19L', status: 'Qualified', assigned_to: 'u5', score: 'hot', follow_up_date: '2026-02-22', last_activity_date: '2026-02-21' },
];

const seedActivities = [
  { id: 'a1', lead_id: 'l1', type: 'system', description: 'Lead auto-assigned to Priya Sharma (lowest workload).', performed_by: 'System', created_at: '2026-02-18T10:28:00' },
  { id: 'a2', lead_id: 'l1', type: 'system', description: 'New lead submitted via Facebook Lead Ads campaign.', performed_by: 'System', created_at: '2026-02-18T10:30:00' },
  { id: 'a3', lead_id: 'l1', type: 'call', description: 'Initial contact. Interested in SUV under ₹15L. Prefers Titan Grey. Very positive.', performed_by: 'Priya Sharma', created_at: '2026-02-18T14:15:00' },
  { id: 'a4', lead_id: 'l1', type: 'followup', description: 'Sent brochure and EMI calculator via WhatsApp.', performed_by: 'Priya Sharma', created_at: '2026-02-19T11:00:00' },
  { id: 'a5', lead_id: 'l1', type: 'status', description: 'Status changed: Contacted → Qualified', performed_by: 'System', created_at: '2026-02-19T09:10:00' },
  { id: 'a6', lead_id: 'l1', type: 'note', description: 'Customer prefers Titan Grey color. Needs financing. Very interested.', performed_by: 'Priya Sharma', created_at: '2026-02-20T15:45:00' },
  { id: 'a7', lead_id: 'l1', type: 'call', description: 'Duration: 4 min 32 sec. Discussed Creta SX(O) trim options and timeline.', performed_by: 'Priya Sharma', created_at: '2026-02-21T10:22:00' },
];

const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  const insertUser = db.prepare('INSERT INTO users (id,name,email,role) VALUES (?,?,?,?)');
  seedUsers.forEach(u => insertUser.run(u.id, u.name, u.email, u.role));

  const insertLead = db.prepare(`
    INSERT INTO leads (id,name,phone,email,source,vehicle_interested,budget,status,assigned_to,score,follow_up_date,last_activity_date)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  seedLeads.forEach(l => insertLead.run(
    l.id, l.name, l.phone, l.email, l.source, l.vehicle_interested,
    l.budget, l.status, l.assigned_to, l.score, l.follow_up_date, l.last_activity_date
  ));

  const insertActivity = db.prepare(`
    INSERT INTO activities (id,lead_id,type,description,performed_by,created_at)
    VALUES (?,?,?,?,?,?)
  `);
  seedActivities.forEach(a => insertActivity.run(a.id, a.lead_id, a.type, a.description, a.performed_by, a.created_at));

  console.log('✅ Database seeded with sample data');
}

module.exports = db;
