import React, { useContext, useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../App';
import { getLeads, updateLead } from '../api';

const COLUMNS = ['New', 'Contacted', 'Qualified', 'Negotiation', 'Closed Won', 'Closed Lost'];
const COL_COLORS = {
    'New': '#4F46E5', 'Contacted': '#0891B2', 'Qualified': '#16A34A',
    'Negotiation': '#7C3AED', 'Closed Won': '#EA580C', 'Closed Lost': '#DC2626'
};

export default function LeadManagement() {
    const { currentUser } = useContext(UserContext);
    const navigate = useNavigate();
    const [board, setBoard] = useState({});
    const [loading, setLoading] = useState(true);
    const dragRef = useRef(null);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const params = currentUser.role === 'sales' ? { assignedTo: currentUser.id } : {};
            const res = await getLeads(params);
            const grouped = {};
            COLUMNS.forEach(c => grouped[c] = []);
            res.data.forEach(l => {
                const col = COLUMNS.includes(l.status) ? l.status : 'New';
                if (grouped[col]) grouped[col].push(l);
            });
            setBoard(grouped);
        } catch { toast.error('Failed to load pipeline'); }
        setLoading(false);
    };

    useEffect(() => { fetchLeads(); }, [currentUser]);

    const onDragStart = (lead, fromCol) => { dragRef.current = { lead, fromCol }; };
    const onDragOver = e => e.preventDefault();
    const onDrop = async (toCol) => {
        if (!dragRef.current) return;
        const { lead, fromCol } = dragRef.current;
        if (fromCol === toCol) return;
        dragRef.current = null;

        // Optimistic update
        setBoard(prev => {
            const next = { ...prev };
            next[fromCol] = next[fromCol].filter(l => l.id !== lead.id);
            next[toCol] = [...next[toCol], { ...lead, status: toCol }];
            return next;
        });

        try {
            await updateLead(lead.id, { status: toCol });
            toast.success(`Moved to "${toCol}" ✅`);
        } catch {
            toast.error('Failed to update status');
            fetchLeads(); // revert
        }
    };

    const initials = n => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const daysLabel = d => {
        if (!d) return 'Today';
        const days = Math.floor((Date.now() - new Date(d)) / 86400000);
        return days === 0 ? 'Today' : `${days}d ago`;
    };
    const daysClass = d => {
        if (!d) return 'recent';
        const days = Math.floor((Date.now() - new Date(d)) / 86400000);
        return days <= 2 ? 'recent' : days <= 4 ? 'aging' : 'overdue';
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Lead Management</h1>
                    <p className="page-subtitle">
                        {currentUser.role === 'sales' ? 'Your pipeline – drag & drop to update stages' : 'Team pipeline – full visibility'}
                    </p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={fetchLeads}>🔄 Refresh</button>
                    <button className="btn btn-primary" onClick={() => navigate('/leads')}>+ Add Lead</button>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading pipeline…</div>
            ) : (
                <div>
                    {/* Pipeline summary strip */}
                    <div className="pipeline-strip">
                        <div className="pipeline-strip-stat">
                            <div className="pipeline-strip-lbl">Active Deals</div>
                            <div className="pipeline-strip-val">
                                {COLUMNS.slice(0, 4).reduce((s, c) => s + (board[c]?.length || 0), 0)}
                            </div>
                        </div>
                        <div className="pipeline-strip-divider" />
                        {COLUMNS.map(col => (
                            <div key={col} className="pipeline-strip-stat">
                                <div className="pipeline-strip-lbl">{col}</div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: COL_COLORS[col] }}>
                                    {board[col]?.length || 0}
                                </div>
                            </div>
                        ))}
                        <div style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--t3)', fontWeight: 500 }}>
                            Drag cards to update stage ← →
                        </div>
                    </div>

                    <div className="kanban-board">
                        {COLUMNS.map(col => {
                            const cards = board[col] || [];
                            return (
                                <div key={col} className="kn-col"
                                    onDragOver={onDragOver}
                                    onDrop={() => onDrop(col)}>
                                    <div className="kn-header">
                                        <div className="kn-title">
                                            <span className="kn-dot" style={{ background: COL_COLORS[col] }}></span>
                                            {col}
                                        </div>
                                        <span className="kn-count">{cards.length}</span>
                                    </div>
                                    <div className="kn-cards">
                                        {cards.map(lead => (
                                            <div key={lead.id}
                                                className={`lead-card${daysClass(lead.last_activity_date) === 'overdue' ? ' overdue-card' : ''}`}
                                                draggable
                                                style={{ '--col-color': COL_COLORS[col] }}
                                                onDragStart={() => onDragStart(lead, col)}
                                                onClick={() => navigate(`/leads/${lead.id}`)}>
                                                <span className={`card-score ${lead.score || 'warm'}`}>{(lead.score || 'warm').toUpperCase()}</span>
                                                <div className="card-name">{lead.name}</div>
                                                <div className="card-vehicle">{lead.vehicle_interested || '—'}</div>
                                                {col === 'Closed Won' && lead.budget && (
                                                    <div className="revenue-badge">₹ {lead.budget}</div>
                                                )}
                                                <div className="card-budget">{lead.budget || '—'}</div>
                                                <div className="card-footer">
                                                    <span className="card-assignee">{lead.assigned_name?.split(' ')[0] || '—'}</span>
                                                    <span className={`card-days ${daysClass(lead.last_activity_date)}`}>
                                                        {daysLabel(lead.last_activity_date)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {cards.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--t4)', fontSize: 12 }}>
                                                Drop leads here
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
