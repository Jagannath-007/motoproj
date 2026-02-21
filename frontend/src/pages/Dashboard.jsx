import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
    LinearScale, BarElement, PointElement, LineElement, Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { UserContext } from '../App';
import { getSalesDashboard, getManagerDashboard } from '../api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

/* ── Clean enterprise chart defaults ── */
const TOOLTIP = {
    backgroundColor: '#1F2937',
    borderColor: '#374151',
    borderWidth: 1,
    titleColor: '#F9FAFB',
    bodyColor: '#D1D5DB',
    padding: 10,
    cornerRadius: 6,
    titleFont: { family: 'Inter', size: 12, weight: '600' },
    bodyFont: { family: 'Inter', size: 11 },
    displayColors: true,
    boxWidth: 8, boxHeight: 8,
};

const LEGEND = {
    labels: {
        color: '#6B7280',
        font: { family: 'Inter', size: 11, weight: '500' },
        boxWidth: 8, boxHeight: 8, borderRadius: 4, padding: 14,
        usePointStyle: true, pointStyle: 'circle',
    },
};

const GRID = { color: '#F1F3F7', drawBorder: false };
const TICKS = { color: '#9CA3AF', font: { family: 'Inter', size: 11 } };
const BORDER = { color: 'transparent' };
const axis = (extra = {}) => ({ grid: GRID, ticks: TICKS, border: BORDER, ...extra });

const BASE_OPTIONS = {
    responsive: true,
    maintainAspectRatio: true,
    animation: { duration: 700, easing: 'easeOutCubic' },
    plugins: { legend: LEGEND, tooltip: TOOLTIP },
};

/* Palettes — clean, distinct, soft */
const STATUS_COLORS = ['#4F46E5', '#0891B2', '#16A34A', '#7C3AED', '#EA580C', '#DC2626'];
const SOURCE_COLORS = ['#4F46E5', '#2563EB', '#D97706', '#0891B2', '#16A34A', '#9CA3AF'];

/* Safe static fill colors — avoid canvas gradient ctx (crashes on chart destroy/remount) */
const FILL_BLUE = 'rgba(79,70,229,0.10)';
const FILL_GREEN = 'rgba(22,163,74,0.10)';

export default function Dashboard() {
    const { currentUser } = useContext(UserContext);
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dataRole, setDataRole] = useState(null); // tracks which role the loaded data belongs to
    const [dateFilter, setDateFilter] = useState('This Month');

    useEffect(() => {
        let cancelled = false;
        // Wipe immediately so stale sales data is never passed to ManagerDash (or vice versa)
        setData(null);
        setDataRole(null);
        setLoading(true);
        setError(null);

        const role = currentUser.role;
        const req = role === 'sales'
            ? getSalesDashboard(currentUser.id)
            : getManagerDashboard();

        req.then(r => {
            if (!cancelled) {
                setData(r.data);
                setDataRole(role);  // stamp so renderer knows the data shape
                setLoading(false);
            }
        }).catch(err => {
            if (!cancelled) {
                console.error('Dashboard fetch error:', err);
                setError('Failed to load dashboard data. Make sure the backend is running.');
                setLoading(false);
            }
        });
        return () => { cancelled = true; };
    }, [currentUser.role, currentUser.id, dateFilter]);

    if (loading) return <div className="loading">Loading dashboard…</div>;

    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 12 }}>
            <div style={{ fontSize: 36 }}>⚠️</div>
            <div style={{ fontSize: 14, color: 'var(--t2)', fontWeight: 600 }}>{error}</div>
            <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}>Retry</button>
        </div>
    );

    // CRITICAL GUARD: only render once the data shape matches the current role.
    // Without this, switching sales→manager renders ManagerDash with sales data
    // (which lacks monthlyTrend etc.) and crashes the entire page.
    if (!data || dataRole !== currentUser.role) {
        return <div className="loading">Loading dashboard…</div>;
    }

    return currentUser.role === 'sales'
        ? <SalesDash key={`sales-${currentUser.id}`} data={data} navigate={navigate} />
        : <ManagerDash key={`manager-${dateFilter}`} data={data} navigate={navigate} dateFilter={dateFilter} setDateFilter={setDateFilter} />;
}

/* ═══════════════════════ SALES DASHBOARD ═══════════════════════ */
function SalesDash({ data, navigate }) {
    const { kpi, statusDistribution: sd, sourceDistribution: src, weeklyActivity, overdue, inactive } = data;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const doughnutData = {
        labels: Object.keys(sd),
        datasets: [{
            data: Object.values(sd),
            backgroundColor: STATUS_COLORS,
            borderWidth: 2,
            borderColor: '#FFFFFF',
            hoverOffset: 5,
        }],
    };
    const barData = {
        labels: Object.keys(src),
        datasets: [{
            label: 'Leads', data: Object.values(src),
            backgroundColor: SOURCE_COLORS, borderRadius: 5, borderSkipped: false,
            borderWidth: 0,
        }],
    };
    const lineData = {
        labels: days,
        datasets: [{
            label: 'Activities', data: weeklyActivity,
            borderColor: '#16A34A', backgroundColor: FILL_GREEN,
            borderWidth: 2, pointBackgroundColor: '#16A34A',
            pointRadius: 3.5, pointHoverRadius: 6,
            fill: true, tension: 0.4,
        }],
    };

    return (
        <div className="page-enter">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Dashboard</h1>
                    <p className="page-subtitle">Sales Executive · February 2026</p>
                </div>
                <button className="btn btn-secondary" onClick={() => toast.success('Data refreshed!')}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3" /></svg>
                    Refresh
                </button>
            </div>

            {/* KPI row */}
            <div className="kpi-grid kpi-4">
                {[
                    { lbl: 'Assigned Leads', val: kpi.assignedLeads, ico: '👤', delta: 'Active leads', up: false },
                    { lbl: 'Conversion Rate', val: `${kpi.conversionRate}%`, ico: '📈', delta: '↑ vs last month', up: true },
                    { lbl: 'Pending Follow-ups', val: kpi.pendingFollowups, ico: '📅', delta: overdue.length ? `⚠ ${overdue.length} overdue` : '✓ On track', warn: overdue.length > 0 },
                    { lbl: 'Converted This Month', val: kpi.convertedThisMonth, ico: '🏆', delta: 'This month', up: true },
                ].map((c, i) => (
                    <div key={i} className="kpi-card" style={{ animationDelay: `${i * 0.07}s` }}>
                        <div className="kpi-lbl">{c.lbl}</div>
                        <div className="kpi-val">{c.val}</div>
                        <div className={`kpi-delta ${c.warn ? 'warn' : c.up ? 'up' : ''}`}>{c.delta}</div>
                        <div className="kpi-ico">{c.ico}</div>
                    </div>
                ))}
            </div>

            {/* Alerts */}
            <div className="alert-section">
                <AlertCard title="⚠ Overdue Follow-ups" cls="overdue-card" items={overdue} emptyMsg="✓ All follow-ups on track!" navigate={navigate} keyFn={l => `${l.name} · ${l.vehicle_interested}`} />
                <AlertCard title="💤 Inactive Leads" cls="inactive-card" items={inactive} emptyMsg="✓ All leads recently active!" navigate={navigate} keyFn={l => `${l.name} — inactive ${l.daysSinceActivity}d`} />
            </div>

            {/* Charts */}
            <div className="charts-grid charts-3">
                <ChartCard title="Status Breakdown" sub="Your pipeline by stage">
                    <Doughnut data={doughnutData} options={{ ...BASE_OPTIONS, cutout: '68%' }} />
                </ChartCard>
                <ChartCard title="Leads by Source" sub="Where your leads come from">
                    <Bar data={barData} options={{ ...BASE_OPTIONS, scales: { x: axis(), y: axis({ beginAtZero: true }) }, plugins: { ...BASE_OPTIONS.plugins, legend: { display: false } } }} />
                </ChartCard>
                <ChartCard title="Weekly Activity" sub="Follow-ups logged this week">
                    <Line data={lineData} options={{ ...BASE_OPTIONS, scales: { x: axis(), y: axis({ beginAtZero: true }) } }} />
                </ChartCard>
            </div>
        </div>
    );
}

/* ═══════════════════════ MANAGER DASHBOARD ═══════════════════════ */
function ManagerDash({ data, navigate, dateFilter, setDateFilter }) {
    const { kpi, sourceDistribution: src, monthlyTrend, statusDistribution: sd, execPerformance } = data;

    const srcData = {
        labels: Object.keys(src),
        datasets: [{ label: 'Leads', data: Object.values(src), backgroundColor: SOURCE_COLORS, borderRadius: 5, borderSkipped: false, borderWidth: 0 }],
    };
    const trendData = {
        labels: monthlyTrend.months,
        datasets: [
            {
                label: 'Total Leads', data: monthlyTrend.leads,
                borderColor: '#4F46E5', backgroundColor: FILL_BLUE,
                borderWidth: 2, pointBackgroundColor: '#4F46E5',
                pointRadius: 3.5, pointHoverRadius: 6, fill: true, tension: 0.4,
            },
            {
                label: 'Converted', data: monthlyTrend.conversions,
                borderColor: '#16A34A', backgroundColor: FILL_GREEN,
                borderWidth: 2, pointBackgroundColor: '#16A34A',
                pointRadius: 3.5, pointHoverRadius: 6, fill: true, tension: 0.4,
            },
        ],
    };
    const donutData = {
        labels: Object.keys(sd),
        datasets: [{ data: Object.values(sd), backgroundColor: STATUS_COLORS, borderWidth: 2, borderColor: '#FFFFFF', hoverOffset: 5 }],
    };
    const perfData = {
        labels: execPerformance.map(e => e.name.split(' ')[0]),
        datasets: [
            { label: 'Assigned', data: execPerformance.map(e => e.assigned), backgroundColor: '#E0E7FF', borderRadius: 5, borderSkipped: false, borderWidth: 0 },
            { label: 'Converted', data: execPerformance.map(e => e.converted), backgroundColor: '#4F46E5', borderRadius: 5, borderSkipped: false, borderWidth: 0 },
        ],
    };

    const fmt = n => n >= 1e7 ? `₹${(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;

    return (
        <div className="page-enter">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Performance Dashboard</h1>
                    <p className="page-subtitle">Business Manager · HSR Motors</p>
                </div>
                <div className="page-actions">
                    <select className="filter-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                        <option>This Month</option>
                        <option>Last Month</option>
                        <option>Q4 2025</option>
                    </select>
                    <button className="btn btn-primary" onClick={() => toast.success('Report exported!')}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Auto-summary bar */}
            <div className="alert-bar" style={{ marginBottom: 22 }}>
                <span className="auto-badge auto">📊 Auto-Summary</span>
                February 2026 — 15 leads generated · 2 conversions · Best performer: {kpi.topPerformer?.name?.split(' ')[0] || 'N/A'}
            </div>

            {/* KPI row */}
            <div className="kpi-grid kpi-5">
                {[
                    { lbl: 'Total Leads', val: kpi.totalLeads, ico: '📥', delta: '↑ 18 vs last month', up: true },
                    { lbl: 'Conversion Rate', val: `${kpi.conversionRate}%`, ico: '🎯', delta: '↑ 3.1% MoM', up: true },
                    { lbl: 'Revenue Generated', val: fmt(kpi.revenueGenerated), ico: '💰', delta: '↑ ₹12L vs last month', up: true, cls: 'highlight' },
                    { lbl: 'Avg Response Time', val: '1h 24m', ico: '⚡', delta: '↓ 18 min faster', up: true },
                    { lbl: 'Top Performer', val: kpi.topPerformer?.name?.split(' ')[0] || '—', ico: '🥇', delta: `${kpi.topPerformer?.converted || 0} conversions`, cls: 'gold' },
                ].map((c, i) => (
                    <div key={i} className={`kpi-card ${c.cls || ''}`} style={{ animationDelay: `${i * 0.06}s` }}>
                        <div className="kpi-lbl">{c.lbl}</div>
                        <div className="kpi-val">{c.val}</div>
                        <div className={`kpi-delta ${c.up ? 'up' : ''}`}>{c.delta}</div>
                        <div className="kpi-ico">{c.ico}</div>
                    </div>
                ))}
            </div>

            {/* Charts row 1 */}
            <div className="charts-grid charts-2" style={{ marginBottom: 14 }}>
                <ChartCard title="Monthly Lead Trend" sub="Total leads vs conversions over 6 months">
                    <Line data={trendData} options={{ ...BASE_OPTIONS, scales: { x: axis(), y: axis({ beginAtZero: false }) } }} />
                </ChartCard>
                <ChartCard title="Leads by Source" sub="Channel attribution this period">
                    <Bar data={srcData} options={{ ...BASE_OPTIONS, scales: { x: axis(), y: axis({ beginAtZero: true }) }, plugins: { ...BASE_OPTIONS.plugins, legend: { display: false } } }} />
                </ChartCard>
            </div>

            {/* Charts row 2 */}
            <div className="charts-grid charts-2">
                <ChartCard title="Pipeline Distribution" sub="Current lead stage breakdown">
                    <Doughnut data={donutData} options={{ ...BASE_OPTIONS, cutout: '62%' }} />
                </ChartCard>
                <ChartCard title="Team Performance" sub="Assigned vs converted per executive">
                    <Bar data={perfData} options={{ ...BASE_OPTIONS, indexAxis: 'y', scales: { x: axis({ beginAtZero: true }), y: axis() } }} />
                </ChartCard>
            </div>
        </div>
    );
}

/* ── Shared components ── */
function ChartCard({ title, sub, children }) {
    return (
        <div className="chart-card">
            <div className="chart-title">{title}</div>
            {sub && <div className="chart-sub">{sub}</div>}
            {children}
        </div>
    );
}

function AlertCard({ title, cls, items, emptyMsg, navigate, keyFn }) {
    return (
        <div className={`alert-card ${cls}`}>
            <div className="alert-title">{title}</div>
            {items.length === 0
                ? <div className="alert-item" style={{ color: 'var(--green)' }}>{emptyMsg}</div>
                : items.slice(0, 4).map(l => (
                    <div key={l.id} className="alert-item" onClick={() => navigate(`/leads/${l.id}`)} style={{ cursor: 'pointer' }}>
                        {keyFn(l)}
                    </div>
                ))
            }
        </div>
    );
}
