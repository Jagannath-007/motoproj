import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserContext } from '../App';
import { getLeads, getLeadSummary, updateLead, getUsers } from '../api';
import AddLeadModal from '../components/AddLeadModal';

const STATUSES = ['New', 'Contacted', 'Qualified', 'Negotiation', 'Converted', 'Not Interested'];
const SOURCES = ['Website', 'Facebook', 'Google', 'Twitter', 'Referral', 'Offline'];
const S_CONFIGS = [
    { key: 'New', cls: 'c-new', ico: '🔵', trend: '↑ 2 today' },
    { key: 'Contacted', cls: 'c-con', ico: '🔷', trend: '3 pending' },
    { key: 'Qualified', cls: 'c-qual', ico: '🟢', trend: '↑ 1 today' },
    { key: 'Converted', cls: 'c-conv', ico: '🟠', trend: '₹24L rev' },
    { key: 'Not Interested', cls: 'c-ni', ico: '🔴', trend: 'review needed' },
];
const SRC_ICO = { Website: '🌐', Facebook: '📘', Google: '🔍', Twitter: '🐦', Referral: '🤝', Offline: '🏪' };
const initials = n => (n || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export default function LeadListing() {
    const { currentUser } = useContext(UserContext);
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', source: '', sort: '' });
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState([]);
    const [modal, setModal] = useState(false);
    const [users, setUsers] = useState([]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const params = { ...filters, search };
            if (currentUser.role === 'sales') params.assignedTo = currentUser.id;
            const [lr, sr] = await Promise.all([getLeads(params), getLeadSummary()]);
            setLeads(lr.data);
            setSummary(sr.data);
        } catch { toast.error('Failed to load leads'); }
        setLoading(false);
    };

    useEffect(() => { fetchLeads(); }, [filters, search, currentUser]);
    useEffect(() => { getUsers({ role: 'sales' }).then(r => setUsers(r.data)); }, []);

    const changeStatus = async (id, status, e) => {
        e.stopPropagation();
        try { await updateLead(id, { status }); toast.success(`→ ${status}`); fetchLeads(); }
        catch { toast.error('Update failed'); }
    };

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Lead Listing</h1>
                    <p className="page-subtitle">
                        {currentUser.role === 'sales' ? 'Your assigned leads' : 'All leads across channels'}
                    </p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary"
                        onClick={() => setFilters(f => ({ ...f, sort: f.sort === 'hot' ? '' : 'hot' }))}>
                        {filters.sort === 'hot' ? '☰ All Leads' : '🔥 Hot Leads'}
                    </button>
                    <button className="btn btn-primary" onClick={() => setModal(true)}>＋ Add Lead</button>
                </div>
            </div>

            {/* Status summary cards */}
            <div className="status-cards">
                {S_CONFIGS.map(s => (
                    <div key={s.key} className={`stat-card ${s.cls}`}
                        onClick={() => setFilters(f => ({ ...f, status: f.status === s.key ? '' : s.key }))}>
                        <div className="stat-num">{summary[s.key] ?? 0}</div>
                        <div className="stat-lbl">{s.key}</div>
                        <div className="stat-trend">{s.trend}</div>
                        <div className="stat-ico">{s.ico}</div>
                    </div>
                ))}
            </div>

            {/* Quick Insights Strip */}
            <div className="insights-strip">
                <div className="insight-chip hot-chip">
                    <span>🔥 Hot Leads</span>
                    <span className="insight-chip-val">
                        {leads.filter(l => l.score === 'hot').length}
                    </span>
                </div>
                <div className="insight-chip overdue-chip">
                    <span>⚠ Overdue</span>
                    <span className="insight-chip-val">
                        {leads.filter(l => l.isAging).length}
                    </span>
                </div>
                <div className="insight-chip auto-chip">
                    <span>🤖 Auto-assigned</span>
                    <span className="insight-chip-val">3</span>
                    <span style={{ fontSize: 10, opacity: 0.7 }}>this week</span>
                </div>
                <div className="insight-chip">
                    <span>📊 Total Pipeline</span>
                    <span className="insight-chip-val">{leads.length}</span>
                </div>
            </div>

            {/* Automation info bar */}
            <div className="alert-bar">
                <span className="auto-badge auto">🤖 Auto-Assign</span>
                <span>3 leads auto-assigned this week based on workload balancing.</span>
                <span className="auto-badge dup">🔁 Dup Detection</span>
                <span style={{ color: 'var(--t3)', marginLeft: 'auto', fontSize: 11 }}>Last sync: just now</span>
            </div>

            {/* Filter row */}
            <div className="filter-bar">
                <div className="topbar-search" style={{ minWidth: 240, flex: 1, maxWidth: 320 }}>
                    <span className="search-icon">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                    </span>
                    <input className="search-input" placeholder="Search name, vehicle…"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="filter-select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                    <option value="">All Status</option>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                <select className="filter-select" value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}>
                    <option value="">All Sources</option>
                    {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
                {(filters.status || filters.source || search) && (
                    <button className="btn btn-sm btn-secondary"
                        onClick={() => { setFilters({ status: '', source: '', sort: '' }); setSearch(''); }}>
                        ✕ Clear
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="table-card">
                <div className="table-toolbar">
                    <div className="table-tool-left">
                        <input type="checkbox"
                            onChange={e => setSelected(e.target.checked ? leads.map(l => l.id) : [])} />
                        <span style={{ fontSize: 12, color: 'var(--t3)', marginLeft: 4 }}>
                            {selected.length ? `${selected.length} selected` : 'Select all'}
                        </span>
                        {selected.length > 0 && (
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-sm btn-secondary" onClick={() => toast.success('Bulk status updated!')}>Change Status</button>
                                <button className="btn btn-sm btn-danger" onClick={() => { setSelected([]); toast.success('Deleted'); }}>Delete</button>
                            </div>
                        )}
                    </div>
                    <span className="table-count-txt">{leads.length} leads</span>
                </div>

                <div className="table-wrapper">
                    {loading ? (
                        <SkeletonTable />
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 36 }}></th>
                                    <th>Lead</th><th>Phone</th><th>Source</th>
                                    <th>Vehicle</th><th>Status</th>
                                    <th>Assigned To</th><th>Date</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.length === 0 && (
                                    <tr><td colSpan={9}>
                                        <div className="empty-state">
                                            <div className="empty-state-icon">📋</div>
                                            <div className="empty-state-title">No leads found</div>
                                            <div className="empty-state-sub">Try adjusting your filters or add a new lead to get started.</div>
                                        </div>
                                    </td></tr>
                                )}
                                {leads.map((lead, i) => {
                                    const sCls = 'badge-' + lead.status.replace(/\s+/g, '-');
                                    return (
                                        <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}
                                            style={{ animationDelay: `${i * 0.03}s`, animation: 'cardSlideUp 0.3s ease forwards', opacity: 0 }}>
                                            <td onClick={e => e.stopPropagation()}>
                                                <input type="checkbox" checked={selected.includes(lead.id)}
                                                    onChange={e => setSelected(p => e.target.checked ? [...p, lead.id] : p.filter(x => x !== lead.id))} />
                                            </td>
                                            <td>
                                                <div className="lead-cell">
                                                    <div className="avatar-sm">{initials(lead.name)}</div>
                                                    <div>
                                                        <div className="lead-name-txt">
                                                            {lead.name}
                                                            {lead.isAging && <span className="aging-badge">⏰ {lead.daysSinceActivity}d</span>}
                                                        </div>
                                                        <div className="lead-id-txt">#{lead.id.slice(0, 8)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{lead.phone}</td>
                                            <td><span className={`src-badge src-${lead.source}`}>{SRC_ICO[lead.source]} {lead.source}</span></td>
                                            <td style={{ color: 'var(--t1)', fontSize: 12.5, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.vehicle_interested || '—'}</td>
                                            <td><span className={`badge ${sCls}`}>{lead.status}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-light)', border: '1px solid rgba(79,70,229,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--accent)' }}>
                                                        {initials(lead.assigned_name)}
                                                    </div>
                                                    <span style={{ fontSize: 12.5, color: 'var(--t2)' }}>{(lead.assigned_name || '').split(' ')[0]}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: 11.5, color: 'var(--t3)' }}>
                                                {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                                            </td>
                                            <td onClick={e => e.stopPropagation()}>
                                                <div className="action-btns">
                                                    <button className="action-btn" title="Call" onClick={() => toast.success(`📞 Calling ${lead.name}`)}>📞</button>
                                                    <button className="action-btn" title="View" onClick={() => navigate(`/leads/${lead.id}`)}>→</button>
                                                    <select className="filter-select" style={{ padding: '3px 6px', fontSize: 11.5, minWidth: 90 }}
                                                        value={lead.status} onChange={e => changeStatus(lead.id, e.target.value, e)}>
                                                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {modal && (
                <AddLeadModal users={users} onClose={() => setModal(false)} onCreated={() => { setModal(false); fetchLeads(); }} />
            )}
        </div>
    );
}

function SkeletonTable() {
    return (
        <div style={{ padding: 20 }}>
            {[...Array(5)].map((_, i) => (
                <div key={i} style={{
                    display: 'flex', gap: 16, alignItems: 'center', padding: '12px 0',
                    borderBottom: '1px solid var(--border)',
                    animation: `skeletonPulse 1.5s ease-in-out ${i * 0.15}s infinite`,
                    opacity: 0.7,
                }}>
                    {[36, 200, 120, 90, 140, 80, 90, 60].map((w, j) => (
                        <div key={j} style={{ width: w, height: 14, background: 'var(--surface-2)', borderRadius: 6, flexShrink: 0 }} />
                    ))}
                </div>
            ))}
            <style>{`@keyframes skeletonPulse{0%,100%{opacity:0.5}50%{opacity:1}}`}</style>
        </div>
    );
}
