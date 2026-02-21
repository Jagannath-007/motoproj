import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { USERS } from '../users';

const NOTIFS = [
    { icon: '⚠️', text: 'Follow-up overdue: Rahul Mehta — 3 days ago', type: 'warn' },
    { icon: '🤖', text: 'Lead auto-assigned → Sneha Kapoor', type: 'auto' },
    { icon: '🔁', text: 'Duplicate detected: +91-9876543210', type: 'dup' },
    { icon: '📊', text: 'Monthly summary ready — Feb 2026', type: 'info' },
];

const NOTIF_STYLES = {
    warn: { bg: '#FEF3C7', color: '#D97706', dot: '#D97706' },
    auto: { bg: '#EEF2FF', color: '#4F46E5', dot: '#4F46E5' },
    dup: { bg: '#FEE2E2', color: '#DC2626', dot: '#DC2626' },
    info: { bg: '#CFFAFE', color: '#0891B2', dot: '#0891B2' },
};

export default function Topbar() {
    const { currentUser, setCurrentUser } = useContext(UserContext);
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const navigate = useNavigate();
    const profileRef = useRef(null);
    const notifRef = useRef(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const initials = (name) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return (
        <header className="topbar">
            {/* Left: Search + breadcrumb */}
            <div className="topbar-left">
                <div className="topbar-search">
                    <span className="search-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                    </span>
                    <input
                        className="search-input"
                        placeholder="Search leads, vehicles, contacts…"
                        onKeyDown={e => e.key === 'Enter' && navigate('/leads')}
                    />
                    <kbd style={{ fontSize: 10, color: 'var(--t4)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', flexShrink: 0, fontFamily: 'inherit' }}>⌘K</kbd>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--t4)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    <span>HSR Motors</span>
                    <span style={{ opacity: 0.5 }}>/</span>
                    <span style={{ color: 'var(--t2)', fontWeight: 500 }}>CRM</span>
                </div>
            </div>

            {/* Right: status, notifs, profile */}
            <div className="topbar-right">
                {/* Live status */}
                <div className="live-chip">
                    <span className="live-dot" />
                    Live
                </div>

                {/* Notifications */}
                <div style={{ position: 'relative' }} ref={notifRef}>
                    <div className="notif-bell" onClick={() => setNotifOpen(p => !p)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <span className="notif-count">{NOTIFS.length}</span>
                    </div>

                    {notifOpen && (
                        <div style={{
                            position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                            width: 340, zIndex: 400,
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)',
                            overflow: 'hidden', animation: 'dropdownIn 0.15s ease',
                        }}>
                            <div style={{ padding: '12px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--t1)' }}>Notifications</span>
                                <span style={{ fontSize: 11, color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}>Mark all read</span>
                            </div>
                            {NOTIFS.map((n, i) => {
                                const s = NOTIF_STYLES[n.type] || {};
                                return (
                                    <div key={i} style={{
                                        padding: '11px 16px', fontSize: 12.5,
                                        display: 'flex', gap: 10, alignItems: 'flex-start',
                                        borderBottom: i < NOTIFS.length - 1 ? '1px solid var(--border)' : 'none',
                                        cursor: 'pointer', transition: 'background 0.12s',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ width: 28, height: 28, borderRadius: 'var(--r-sm)', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>{n.icon}</div>
                                        <span style={{ color: 'var(--t2)', lineHeight: 1.45, paddingTop: 4 }}>{n.text}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="topbar-divider" />

                {/* Profile Switcher */}
                <div className="profile-switcher" ref={profileRef}>
                    <div className="profile-trigger" onClick={() => setProfileOpen(p => !p)}>
                        <div className={`profile-avatar${currentUser.role === 'manager' ? ' mgr' : ''}`} style={currentUser.role === 'manager' ? { background: 'linear-gradient(135deg, #EA580C, #D97706)' } : {}}>
                            {initials(currentUser.fullName)}
                        </div>
                        <div>
                            <div className="profile-name">{currentUser.name}</div>
                            <div className="profile-role-lbl">{currentUser.label}</div>
                        </div>
                        <span className="profile-chevron">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </span>
                    </div>

                    {profileOpen && (
                        <div className="profile-dropdown">
                            <div className="dropdown-header">Switch account</div>
                            {Object.values(USERS).map(u => (
                                <div
                                    key={u.role}
                                    className={`dropdown-user${currentUser.role === u.role ? ' active-user' : ''}`}
                                    onClick={() => { setCurrentUser(u); setProfileOpen(false); }}
                                >
                                    <div className={`dropdown-user-avatar${u.role === 'manager' ? ' mgr' : ''}`}>
                                        {initials(u.fullName)}
                                    </div>
                                    <div>
                                        <div className="dropdown-user-name">{u.fullName}</div>
                                        <div className="dropdown-user-role">{u.label}</div>
                                    </div>
                                    {currentUser.role === u.role && (
                                        <span className="dropdown-check">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
