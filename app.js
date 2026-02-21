/* ============================================================
   AutoPulse CRM – app.js
   Navigation, Data, Kanban Drag & Drop, Charts, Role Switching
   ============================================================ */

// ──────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────
let currentRole = 'sales'; // 'sales' | 'manager'
let currentScreen = 'lead-listing';
let dragCard = null;
let chartsInitialized = { sales: false, manager: false };

// ──────────────────────────────────────────────
// SAMPLE DATA
// ──────────────────────────────────────────────
const ALL_LEADS = [
  { id:1, name:'Rahul Mehta',    phone:'+91 98765 43210', source:'Facebook',  vehicle:'Hyundai Creta SX(O)',   status:'Qualified',     assigned:'Priya S.',  date:'Feb 18, 2026', aging:3, score:'hot' },
  { id:2, name:'Anjali Singh',   phone:'+91 87654 32109', source:'Google',    vehicle:'Venue S+',              status:'New',           assigned:'Rohan D.',  date:'Feb 20, 2026', aging:0, score:'warm' },
  { id:3, name:'Karan Verma',    phone:'+91 76543 21098', source:'Website',   vehicle:'Alcazar Platinum',      status:'Contacted',     assigned:'Priya S.',  date:'Feb 19, 2026', aging:4, score:'hot' },
  { id:4, name:'Meera Nair',     phone:'+91 65432 10987', source:'Referral',  vehicle:'i20 Asta',              status:'Converted',     assigned:'Sneha K.',  date:'Feb 15, 2026', aging:0, score:'warm' },
  { id:5, name:'Vikram Joshi',   phone:'+91 54321 09876', source:'Offline',   vehicle:'Tucson AWD',            status:'Not Interested',assigned:'Rohan D.',  date:'Feb 14, 2026', aging:0, score:'cold' },
  { id:6, name:'Priya Patel',    phone:'+91 43210 98765', source:'Twitter',   vehicle:'Exter SX',              status:'New',           assigned:'Priya S.',  date:'Feb 21, 2026', aging:0, score:'warm' },
  { id:7, name:'Suresh Kumar',   phone:'+91 32109 87654', source:'Google',    vehicle:'Konas Electric',        status:'Qualified',     assigned:'Sneha K.',  date:'Feb 17, 2026', aging:0, score:'hot' },
  { id:8, name:'Lakshmi Nair',   phone:'+91 21098 76543', source:'Facebook',  vehicle:'Creta N Line',          status:'Contacted',     assigned:'Priya S.',  date:'Feb 16, 2026', aging:3, score:'warm' },
];

const PRIYA_LEADS = ALL_LEADS.filter(l => l.assigned === 'Priya S.');

const KANBAN_DATA = {
  'New':         [
    { name:'Priya Patel',   vehicle:'Exter SX',      budget:'₹8L–₹10L', assigned:'Priya S.', days:1,  score:'warm' },
    { name:'Anjali Singh',  vehicle:'Venue S+',       budget:'₹9L–₹12L', assigned:'Rohan D.', days:0,  score:'warm' },
    { name:'Dev Rathi',     vehicle:'Grand i10 NIOS', budget:'₹7L–₹9L',  assigned:'Sneha K.', days:2,  score:'cold' },
  ],
  'Contacted':   [
    { name:'Lakshmi Nair',  vehicle:'Creta N Line',   budget:'₹14L–₹16L',assigned:'Priya S.', days:3,  score:'warm' },
    { name:'Ravi Sharma',   vehicle:'Venue S (D)',     budget:'₹10L–₹12L',assigned:'Rohan D.', days:1,  score:'warm' },
  ],
  'Qualified':   [
    { name:'Rahul Mehta',   vehicle:'Creta SX(O)',    budget:'₹12L–₹15L',assigned:'Priya S.', days:3,  score:'hot' },
    { name:'Suresh Kumar',  vehicle:'Kona Electric',  budget:'₹24L–₹26L',assigned:'Sneha K.', days:0,  score:'hot' },
    { name:'Karan Verma',   vehicle:'Alcazar Plat.',  budget:'₹19L–₹22L',assigned:'Priya S.', days:4,  score:'hot' },
  ],
  'Negotiation': [
    { name:'Anita Bose',    vehicle:'Tucson 2.0 DSL', budget:'₹28L–₹32L',assigned:'Rohan D.', days:2,  score:'hot' },
    { name:'Nikhil Roy',    vehicle:'Creta SX',       budget:'₹13L–₹15L',assigned:'Priya S.', days:1,  score:'warm' },
  ],
  'Closed Won':  [
    { name:'Meera Nair',    vehicle:'i20 Asta',       budget:'₹10L',      assigned:'Sneha K.', days:6,  score:'warm' },
    { name:'Sanjay Gupta',  vehicle:'Creta E+',       budget:'₹11L',      assigned:'Priya S.', days:7,  score:'warm' },
  ],
  'Closed Lost': [
    { name:'Vikram Joshi',  vehicle:'Tucson AWD',     budget:'₹30L',      assigned:'Rohan D.', days:10, score:'cold' },
  ],
};

const COL_COLORS = {
  'New':'#4f7ef8', 'Contacted':'#06b6d4', 'Qualified':'#22c55e',
  'Negotiation':'#a855f7', 'Closed Won':'#f97316', 'Closed Lost':'#ef4444'
};

// ──────────────────────────────────────────────
// NAVIGATION
// ──────────────────────────────────────────────
function navigate(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('screen-' + screen).classList.add('active');
  document.querySelector(`[data-screen="${screen}"]`).classList.add('active');
  currentScreen = screen;
  if (screen === 'dashboard') renderDashboard();
  if (screen === 'lead-management') renderKanban();
}

// ──────────────────────────────────────────────
// ROLE SWITCHING
// ──────────────────────────────────────────────
function switchRole(role) {
  currentRole = role;
  // Update lead table
  renderLeadTable();
  // Update kanban if visible
  if (currentScreen === 'lead-management') renderKanban();
  // Update dashboard if visible
  if (currentScreen === 'dashboard') renderDashboard();
  // Show notification
  const r = role === 'sales' ? 'Sales Executive' : 'Business Manager';
  showToast(`Switched to ${r} view 👤`);
}

// ──────────────────────────────────────────────
// LEAD TABLE (Screen 1)
// ──────────────────────────────────────────────
function renderLeadTable() {
  const leads = currentRole === 'sales' ? PRIYA_LEADS : ALL_LEADS;
  const tbody = document.getElementById('leads-table-body');
  const count = document.getElementById('lead-count');
  count.textContent = `Showing ${leads.length} of ${currentRole === 'sales' ? PRIYA_LEADS.length : ALL_LEADS.length} leads`;
  tbody.innerHTML = leads.map(l => {
    const aging = l.aging >= 3 ? `<span class="aging-badge">⏰ ${l.aging}d</span>` : '';
    return `
    <tr>
      <td><input type="checkbox" onchange="handleBulkCheck()" /></td>
      <td>
        <div class="lead-name-cell">
          <div class="lead-mini-avatar">${initials(l.name)}</div>
          <div>
            <div class="lead-name-text">${l.name}${aging}</div>
            <div style="font-size:10.5px;color:var(--text-muted)">#LD-2024-0${880+l.id}</div>
          </div>
        </div>
      </td>
      <td>${l.phone}</td>
      <td><span class="source-badge ${l.source.toLowerCase()}">${sourceIcon(l.source)} ${l.source}</span></td>
      <td style="color:var(--text-primary);font-size:12.5px">${l.vehicle}</td>
      <td><span class="badge badge-${statusClass(l.status)}">${statusDot(l.status)} ${l.status}</span></td>
      <td style="font-size:12.5px">${l.assigned}</td>
      <td style="color:var(--text-muted);font-size:12px">${l.date}</td>
      <td>
        <div class="action-btns">
          <button class="action-btn" title="Call" onclick="showToast('📞 Calling ${l.name}…')">📞</button>
          <button class="action-btn" title="Add Note" onclick="showToast('📝 Adding note for ${l.name}')">📝</button>
          <button class="action-btn" title="Change Status" onclick="showToast('🔄 Change status for ${l.name}')">🔄</button>
          <button class="action-btn" title="View Details" onclick="navigate('lead-details')">👁</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
function statusClass(s) {
  return s.toLowerCase().replace(/\s+/g, '-');
}
function statusDot(s) {
  const map = { 'New':'🔵','Contacted':'🩵','Qualified':'🟢','Converted':'🟠','Not Interested':'🔴' };
  return map[s] || '⚫';
}
function sourceIcon(s) {
  const map = { Website:'🌐', Facebook:'📘', Google:'🔍', Twitter:'🐦', Referral:'🤝', Offline:'🏪' };
  return map[s] || '📡';
}

function toggleSelectAll(cb) {
  document.querySelectorAll('#leads-table-body input[type="checkbox"]').forEach(c => c.checked = cb.checked);
  document.getElementById('bulk-actions').style.display = cb.checked ? 'flex' : 'none';
}
function handleBulkCheck() {
  const all = document.querySelectorAll('#leads-table-body input[type="checkbox"]');
  const checked = [...all].filter(c => c.checked).length;
  document.getElementById('bulk-actions').style.display = checked > 0 ? 'flex' : 'none';
}

// ──────────────────────────────────────────────
// KANBAN (Screen 3)
// ──────────────────────────────────────────────
function renderKanban() {
  const board = document.getElementById('kanban-board');
  board.innerHTML = '';
  const cols = Object.keys(KANBAN_DATA);

  // In sales mode, filter to only Priya's leads
  cols.forEach(colName => {
    const col = document.createElement('div');
    col.className = 'kanban-col';
    col.dataset.col = colName;

    let cards = KANBAN_DATA[colName];
    if (currentRole === 'sales') cards = cards.filter(c => c.assigned === 'Priya S.');

    col.innerHTML = `
      <div class="kanban-col-header">
        <div class="kanban-col-title">
          <span class="col-dot" style="background:${COL_COLORS[colName]}"></span>
          ${colName}
        </div>
        <span class="kanban-col-count">${cards.length}</span>
      </div>
      <div class="kanban-cards" id="col-${colName}" 
           ondragover="onDragOver(event)" ondrop="onDrop(event,'${colName}')">
        ${cards.map((c,i) => makeCard(c, colName, i)).join('')}
      </div>`;
    board.appendChild(col);
  });
}

function makeCard(c, col, idx) {
  const daysClass = c.days === 0 ? 'recent' : c.days <= 2 ? 'recent' : c.days <= 4 ? 'aging' : 'overdue';
  const daysLabel = c.days === 0 ? 'Today' : `${c.days}d ago`;
  return `
  <div class="lead-card" draggable="true" 
       ondragstart="onDragStart(event,'${col}',${idx})"
       ondragend="onDragEnd(event)"
       onclick="navigate('lead-details')">
    <span class="lead-card-score ${c.score}">${c.score.toUpperCase()}</span>
    <div class="lead-card-name">${c.name}</div>
    <div class="lead-card-vehicle">🚗 ${c.vehicle}</div>
    <div class="lead-card-budget">💰 ${c.budget}</div>
    <div class="lead-card-footer">
      <span class="lead-card-assignee">👤 ${c.assigned}</span>
      <span class="lead-card-days ${daysClass}">${daysLabel}</span>
    </div>
  </div>`;
}

function onDragStart(e, col, idx) {
  dragCard = { col, idx };
  e.currentTarget.classList.add('dragging');
}
function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.kanban-cards').forEach(c => c.classList.remove('drag-over'));
}
function onDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}
function onDrop(e, targetCol) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (!dragCard) return;
  if (dragCard.col === targetCol) return;

  const card = KANBAN_DATA[dragCard.col].splice(dragCard.idx, 1)[0];
  KANBAN_DATA[targetCol].push(card);
  dragCard = null;
  renderKanban();
  showToast(`Lead moved to "${targetCol}" ✅`);
}

// ──────────────────────────────────────────────
// DASHBOARD CHARTS
// ──────────────────────────────────────────────
const chartDefaults = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { labels: { color: '#8b9ab4', font: { family: 'Inter', size: 11 }, boxWidth: 12, padding: 12 } } },
};
const gridColor = 'rgba(42,51,71,0.8)';
function axisDefaults() {
  return {
    grid: { color: gridColor },
    ticks: { color: '#5a6a80', font: { family: 'Inter', size: 11 } }
  };
}

function renderDashboard() {
  if (currentRole === 'sales') {
    document.getElementById('dashboard-sales').style.display = 'block';
    document.getElementById('dashboard-manager').style.display = 'none';
    if (!chartsInitialized.sales) { initSalesCharts(); chartsInitialized.sales = true; }
  } else {
    document.getElementById('dashboard-sales').style.display = 'none';
    document.getElementById('dashboard-manager').style.display = 'block';
    if (!chartsInitialized.manager) { initManagerCharts(); chartsInitialized.manager = true; }
  }
}

function initSalesCharts() {
  // Pie – Status Distribution
  new Chart(document.getElementById('salesPieChart'), {
    type: 'doughnut',
    data: {
      labels: ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'],
      datasets: [{ data: [6, 8, 7, 4, 3], backgroundColor: ['#4f7ef8','#06b6d4','#22c55e','#f97316','#ef4444'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: { ...chartDefaults, cutout: '65%' }
  });

  // Bar – Leads by Source
  new Chart(document.getElementById('salesBarChart'), {
    type: 'bar',
    data: {
      labels: ['Website','Facebook','Google','Referral','Offline'],
      datasets: [{ label: 'Leads', data: [4, 8, 6, 3, 7], backgroundColor: '#4f7ef8', borderRadius: 5, borderSkipped: false }]
    },
    options: { ...chartDefaults, scales: { x: axisDefaults(), y: { ...axisDefaults(), beginAtZero: true } }, plugins: { ...chartDefaults.plugins, legend: { display: false } } }
  });

  // Line – Weekly Follow-up Activity
  new Chart(document.getElementById('salesLineChart'), {
    type: 'line',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [{
        label: 'Follow-ups',
        data: [3, 5, 4, 7, 6, 2, 1],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#22c55e',
        fill: true,
        tension: 0.4
      }]
    },
    options: { ...chartDefaults, scales: { x: axisDefaults(), y: { ...axisDefaults(), beginAtZero: true } } }
  });
}

function initManagerCharts() {
  // Bar – Leads by Source
  new Chart(document.getElementById('mgrBarChart'), {
    type: 'bar',
    data: {
      labels: ['Website','Facebook','Google','Twitter','Referral','Offline'],
      datasets: [{ label: 'Leads', data: [28, 36, 31, 12, 18, 17], backgroundColor: '#4f7ef8', borderRadius: 5, borderSkipped: false }]
    },
    options: { ...chartDefaults, scales: { x: axisDefaults(), y: { ...axisDefaults(), beginAtZero: true } }, plugins: { ...chartDefaults.plugins, legend: { display: false } } }
  });

  // Line – Monthly Lead Trend
  new Chart(document.getElementById('mgrLineChart'), {
    type: 'line',
    data: {
      labels: ['Sep','Oct','Nov','Dec','Jan','Feb'],
      datasets: [
        { label: 'Total Leads', data: [88, 97, 103, 118, 124, 142], borderColor: '#4f7ef8', backgroundColor: 'rgba(79,126,248,0.1)', fill: true, tension: 0.4, borderWidth: 2, pointBackgroundColor: '#4f7ef8' },
        { label: 'Converted', data: [22, 27, 28, 34, 35, 40],       borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.05)', fill: true, tension: 0.4, borderWidth: 2, pointBackgroundColor: '#22c55e' }
      ]
    },
    options: { ...chartDefaults, scales: { x: axisDefaults(), y: { ...axisDefaults(), beginAtZero: false } } }
  });

  // Pie – Status Distribution
  new Chart(document.getElementById('mgrPieChart'), {
    type: 'doughnut',
    data: {
      labels: ['New', 'Contacted', 'Qualified', 'Negotiation', 'Converted', 'Lost'],
      datasets: [{ data: [32, 42, 19, 10, 20, 19], backgroundColor: ['#4f7ef8','#06b6d4','#22c55e','#a855f7','#f97316','#ef4444'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: { ...chartDefaults, cutout: '60%' }
  });

  // Horizontal Bar – Sales Exec Performance
  new Chart(document.getElementById('mgrHorizBarChart'), {
    type: 'bar',
    data: {
      labels: ['Priya S.', 'Rohan D.', 'Sneha K.', 'Arjun P.', 'Neha M.'],
      datasets: [
        { label: 'Assigned', data: [28, 31, 22, 25, 18], backgroundColor: 'rgba(79,126,248,0.6)', borderRadius: 4 },
        { label: 'Converted', data: [9, 7, 5, 6, 3],     backgroundColor: 'rgba(34,197,94,0.7)', borderRadius: 4 }
      ]
    },
    options: {
      ...chartDefaults,
      indexAxis: 'y',
      scales: {
        x: { ...axisDefaults(), beginAtZero: true },
        y: axisDefaults()
      }
    }
  });
}

// ──────────────────────────────────────────────
// MODAL
// ──────────────────────────────────────────────
function openAddLeadModal() {
  document.getElementById('add-lead-modal').classList.add('open');
}
function closeAddLeadModal() {
  document.getElementById('add-lead-modal').classList.remove('open');
  document.getElementById('dup-warning').style.display = 'none';
}
function closeModal(e) {
  if (e.target === document.getElementById('add-lead-modal')) closeAddLeadModal();
}
function checkDuplicate(input) {
  // Simulate duplicate detection for demo
  const dup = '+91 98765 43210'.replace(/\s/g,'');
  if (input.value.replace(/\s/g,'') === dup) {
    document.getElementById('dup-warning').style.display = 'block';
  } else {
    document.getElementById('dup-warning').style.display = 'none';
  }
}
function submitLead() {
  closeAddLeadModal();
  showToast('✅ Lead added & auto-assigned successfully! 🤖');
}

// ──────────────────────────────────────────────
// NOTE TABS
// ──────────────────────────────────────────────
function setNoteTab(btn) {
  document.querySelectorAll('.note-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}

// ──────────────────────────────────────────────
// NOTIFICATIONS
// ──────────────────────────────────────────────
function toggleNotifications() {
  document.getElementById('notif-dropdown').classList.toggle('open');
}
document.addEventListener('click', e => {
  if (!e.target.closest('.notification-bell')) {
    document.getElementById('notif-dropdown')?.classList.remove('open');
  }
});

// ──────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────
function showToast(msg) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.4s'; setTimeout(() => toast.remove(), 400); }, 3000);
}

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  navigate('lead-listing');

  // Show initial automation toast
  setTimeout(() => showToast('🤖 3 leads auto-assigned based on workload'), 1200);
  setTimeout(() => showToast('⚠️ 2 overdue follow-ups need attention'), 2500);
});
