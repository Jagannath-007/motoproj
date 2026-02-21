import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { UserContext } from '../App';

const NAV = [
    {
        to: '/leads', label: 'Lead Listing',
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
        )
    },
    {
        to: '/lead-management', label: 'Pipeline',
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="4" height="18" rx="1" /><rect x="10" y="8" width="4" height="13" rx="1" /><rect x="17" y="5" width="4" height="16" rx="1" /></svg>
        )
    },
    {
        to: '/dashboard', label: 'Dashboard',
        icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
        )
    },
];

const AUTOMATION = [
    { label: 'Auto-assign', dot: '', on: true },
    { label: 'Lead Scoring', dot: '', on: true },
    { label: '3 Reminders', dot: 'warn', on: true },
    { label: 'Dup Detection', dot: 'info', on: true },
];

export default function Sidebar() {
    const { currentUser } = useContext(UserContext);

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="logo-icon">AP</div>
                <div>
                    <span className="logo-title">AutoPulse</span>
                    <span className="logo-sub">HSR Motors CRM</span>
                </div>
            </div>

            {/* Nav */}
            <nav className="sidebar-nav">
                <div className="nav-section-label">Workspace</div>
                {NAV.map(n => (
                    <NavLink
                        key={n.to}
                        to={n.to}
                        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                    >
                        <span className="nav-icon">{n.icon}</span>
                        <span>{n.label}</span>
                    </NavLink>
                ))}

                {/* Quick stats mini-panel */}
                <div className="nav-section-label" style={{ marginTop: 18 }}>At a Glance</div>
                <div style={{
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r-lg)', padding: '10px 12px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
                }}>
                    {[
                        { num: '15', lbl: 'Total Leads', color: 'var(--accent)' },
                        { num: '6', lbl: 'My Leads', color: 'var(--cyan)' },
                        { num: '2', lbl: 'Hot', color: 'var(--red)' },
                        { num: '3', lbl: 'Follow-ups', color: 'var(--amber)' },
                    ].map(s => (
                        <div key={s.lbl} style={{ textAlign: 'center', padding: '6px 4px', background: 'var(--surface)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.num}</div>
                            <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 2, fontWeight: 500 }}>{s.lbl}</div>
                        </div>
                    ))}
                </div>
            </nav>

            {/* Automation status panel */}
            <div className="sidebar-footer">
                <div className="automation-panel">
                    <div className="auto-panel-title">Smart Automation</div>
                    {AUTOMATION.map((a, i) => (
                        <div key={i} className={`auto-item${a.on ? ' on' : ''}`}>
                            <span className={`auto-dot${a.dot ? ` ${a.dot}` : ''}`} />
                            {a.label}
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
}
