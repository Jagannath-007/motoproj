import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getLead, getActivities, addActivity, updateLead, convertLead } from '../api';

const ACT_ICONS = { call: '📞', note: '📝', status: '🔄', followup: '📅', system: '🤖' };
const ACT_LABELS = { call: 'Call Logged', note: 'Note Added', status: 'Status Change', followup: 'Follow-up Scheduled', system: 'Auto Event' };
const STATUSES = ['New', 'Contacted', 'Qualified', 'Negotiation', 'Converted', 'Not Interested'];
const JOURNEY = ['New', 'Contacted', 'Qualified', 'Negotiation', 'Converted'];
const initials = n => (n || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const fmtDate = d => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const SCORE_META = {
    hot: { val: 82, label: '🔥 Hot Lead', color: 'var(--red)', light: 'var(--red-light)' },
    warm: { val: 55, label: '☀️ Warm Lead', color: 'var(--amber)', light: 'var(--amber-light)' },
    cold: { val: 28, label: '❄️ Cold Lead', color: 'var(--cyan)', light: 'var(--cyan-light)' },
};

export default function LeadDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lead, setLead] = useState(null);
    const [activities, setActs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [noteType, setNoteType] = useState('note');
    const [noteText, setNoteText] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [followUp, setFollowUp] = useState('');
    const [scoreEdit, setScoreEdit] = useState(false);

    const fetch = async () => {
        try {
            const [lr, ar] = await Promise.all([getLead(id), getActivities(id)]);
            setLead(lr.data); setActs(ar.data); setNewStatus(lr.data.status);
        } catch { toast.error('Lead not found'); navigate('/leads'); }
        setLoading(false);
    };
    useEffect(() => { fetch(); }, [id]);

    const saveActivity = async () => {
        if (!noteText.trim()) return toast.error('Enter a note or description');
        try {
            await addActivity(id, { type: noteType, description: noteText, performed_by: 'Priya Sharma' });
            toast.success('Activity logged'); setNoteText(''); fetch();
        } catch { toast.error('Failed to save'); }
    };

    const doStatusUpdate = async () => {
        try { await updateLead(id, { status: newStatus, updated_by: 'User' }); toast.success(`Status updated to ${newStatus}`); fetch(); }
        catch { toast.error('Update failed'); }
    };

    const doConvert = async () => {
        try { await convertLead(id, { performed_by: 'User' }); toast.success('Lead converted to sale! 🎉'); fetch(); }
        catch { toast.error('Conversion failed'); }
    };

    const doFollowUp = async () => {
        if (!followUp) return toast.error('Pick a date and time');
        try {
            await updateLead(id, { follow_up_date: followUp });
            await addActivity(id, { type: 'followup', description: `Follow-up scheduled: ${new Date(followUp).toLocaleString('en-IN')}`, performed_by: 'User' });
            toast.success('Follow-up scheduled'); setFollowUp(''); fetch();
        } catch { toast.error('Failed'); }
    };

    const doScoreChange = async (score) => {
        try { await updateLead(id, { score }); toast.success(`Score set to ${score}`); setScoreEdit(false); fetch(); }
        catch { toast.error('Update failed'); }
    };

    if (loading) return <div className="loading">Loading lead details</div>;
    if (!lead) return null;

    const sm = SCORE_META[lead.score] || SCORE_META.warm;
    const isOverdue = lead.follow_up_date && new Date(lead.follow_up_date) < new Date();
    const journeyIdx = JOURNEY.indexOf(lead.status);
    // Estimated value from budget string
    const budgetNum = lead.budget ? parseInt(lead.budget.replace(/[^\d]/g, '')) || 0 : 0;

    return (
        <div className="page-enter">
            {/* Header */}
            <div className="page-header">
                <div>
                    <div className="breadcrumb">
                        <Link to="/leads">Lead Listing</Link>
                        <span style={{ margin: '0 6px', opacity: 0.4 }}>/</span>
                        <span>{lead.name}</span>
                    </div>
                    <h1 className="page-title" style={{ marginTop: 4 }}>{lead.name}</h1>
                    <p className="page-subtitle">{lead.vehicle_interested || 'Vehicle not specified'} {lead.budget ? `· Budget: ${lead.budget}` : ''}</p>
                </div>
                <div className="page-actions">
                    <span className="score-badge" style={{ background: sm.light, color: sm.color, cursor: 'pointer' }} onClick={() => setScoreEdit(v => !v)}>
                        {sm.label}
                        <svg style={{ marginLeft: 4 }} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </span>
                    {scoreEdit && (
                        <div style={{
                            position: 'absolute', top: 50, right: 0, background: 'var(--surface)',
                            border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
                            boxShadow: 'var(--shadow-lg)', padding: 8, display: 'flex', gap: 6, zIndex: 200,
                            animation: 'dropdownIn 0.15s ease',
                        }}>
                            {['hot', 'warm', 'cold'].map(s => (
                                <button key={s} onClick={() => doScoreChange(s)} style={{
                                    padding: '5px 12px', borderRadius: 20, border: `1px solid ${SCORE_META[s].light}`,
                                    background: SCORE_META[s].light, color: SCORE_META[s].color,
                                    fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
                                }}>
                                    {SCORE_META[s].label}
                                </button>
                            ))}
                        </div>
                    )}
                    {lead.status !== 'Converted' && (
                        <button className="btn btn-success" onClick={doConvert}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                            Convert to Sale
                        </button>
                    )}
                </div>
            </div>

            {/* Overdue banner */}
            {isOverdue && (
                <div style={{
                    background: 'var(--red-light)', border: '1px solid rgba(220,38,38,0.2)',
                    borderRadius: 'var(--r)', padding: '10px 16px', marginBottom: 20,
                    fontSize: 13, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    <span><strong>Overdue follow-up!</strong> Was due {new Date(lead.follow_up_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long' })} — take action now.</span>
                </div>
            )}

            {/* Lead Journey Bar */}
            <div className="panel" style={{ marginBottom: 20, padding: '16px 22px', animationDelay: '0s' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12 }}>Lead Journey</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    {JOURNEY.map((stage, i) => {
                        const done = i <= journeyIdx;
                        const active = i === journeyIdx;
                        return (
                            <React.Fragment key={stage}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: done ? 'var(--accent)' : 'var(--surface-2)',
                                        border: `2px solid ${done ? 'var(--accent)' : 'var(--border)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: active ? '0 0 0 4px rgba(79,70,229,0.15)' : 'none',
                                        transition: 'all 0.3s',
                                        zIndex: 1, position: 'relative',
                                    }}>
                                        {done
                                            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                            : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' }} />
                                        }
                                    </div>
                                    <div style={{ marginTop: 6, fontSize: 10.5, fontWeight: done ? 600 : 400, color: done ? 'var(--accent)' : 'var(--t4)', whiteSpace: 'nowrap' }}>{stage}</div>
                                </div>
                                {i < JOURNEY.length - 1 && (
                                    <div style={{ flex: 2, height: 2, background: i < journeyIdx ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s', marginBottom: 20 }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <div className="details-grid">
                {/* ── LEFT COLUMN ── */}
                <div className="details-left">

                    {/* Contact Info */}
                    <div className="panel" style={{ animationDelay: '0.05s' }}>
                        <div className="info-card-header">
                            <div className="avatar-lg">{initials(lead.name)}</div>
                            <div>
                                <div className="lead-fullname">{lead.name}</div>
                                <div className="lead-meta">#{lead.id.slice(0, 8)} · Added {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                            </div>
                        </div>

                        <div className="info-grid">
                            {[
                                ['Phone', lead.phone, null],
                                ['Email', lead.email || '—', null],
                                ['Budget', lead.budget || '—', null],
                                ['Vehicle', lead.vehicle_interested || '—', null],
                                ['Source', null, <span key="src" className={`src-badge src-${lead.source}`}>{lead.source}</span>],
                                ['Assigned', lead.assigned_name || '—', null],
                            ].map(([label, val, node]) => (
                                <div key={label} className="info-item">
                                    <div className="info-label">{label}</div>
                                    <div className="info-value">{node || val}</div>
                                </div>
                            ))}
                            <div className="info-item full">
                                <div className="info-label">Status</div>
                                <div className="info-value"><span className={`badge badge-${lead.status.replace(/\s+/g, '-')}`}>{lead.status}</span></div>
                            </div>
                            {lead.follow_up_date && (
                                <div className="info-item full">
                                    <div className="info-label">Follow-up Date</div>
                                    <div className="info-value" style={{ color: isOverdue ? 'var(--red)' : 'var(--t1)' }}>
                                        {fmtDate(lead.follow_up_date)} {isOverdue && '⚠ Overdue'}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Lead Score */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                                <span className="info-label" style={{ margin: 0 }}>Lead Score</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: sm.color }}>{sm.val}/100</span>
                            </div>
                            <div className="score-bar-wrap">
                                <div className={`score-bar ${lead.score}`} style={{ width: `${sm.val}%` }} />
                            </div>
                            <div className="score-lbl-row" style={{ marginTop: 4 }}>
                                <span>Cold</span><span>Warm</span><span>Hot</span>
                            </div>
                        </div>

                        {/* Estimated value */}
                        {budgetNum > 0 && (
                            <div style={{
                                marginTop: 16, padding: '12px 14px',
                                background: 'var(--green-light)', border: '1px solid rgba(22,163,74,0.15)',
                                borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                <div>
                                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Est. Lead Value</div>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--green)' }}>₹{budgetNum.toLocaleString('en-IN')}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="panel" style={{ animationDelay: '0.1s' }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--t1)' }}>Quick Actions</h3>
                        <button className="btn btn-call" onClick={() => toast.success(`Dialing ${lead.phone}…`)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.37 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.72a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16c.17.001.22.001.19 0z" /></svg>
                            Call Now
                        </button>

                        <div style={{ height: 14 }} />

                        <div className="form-group">
                            <label className="form-label">Update Status</label>
                            <div className="form-row">
                                <select className="form-control" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                                </select>
                                <button className="btn btn-secondary" onClick={doStatusUpdate}>Apply</button>
                            </div>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Schedule Follow-up</label>
                            <input type="datetime-local" className="form-control" value={followUp} onChange={e => setFollowUp(e.target.value)} style={{ marginBottom: 8 }} />
                            <button className="btn btn-primary btn-full" onClick={doFollowUp}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                Schedule
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN: Timeline ── */}
                <div className="panel" style={{ display: 'flex', flexDirection: 'column', animationDelay: '0.12s' }}>
                    <div className="timeline-header">
                        <h3>Activity Timeline</h3>
                        <span className="tl-count">{activities.length} activities</span>
                    </div>

                    {/* Log activity */}
                    <div style={{ marginBottom: 18, padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', marginBottom: 10 }}>Log Activity</div>
                        <div className="note-tabs">
                            {['note', 'call', 'followup'].map(t => (
                                <button key={t} className={`note-tab${noteType === t ? ' active' : ''}`} onClick={() => setNoteType(t)}>
                                    {ACT_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                        <textarea
                            className="note-textarea" value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            placeholder={`Add a ${noteType} about this lead…`}
                            style={{ height: 72 }}
                        />
                        <div className="note-actions">
                            <span style={{ fontSize: 11, color: 'var(--t4)' }}>{noteText.length}/280</span>
                            <button className="btn btn-primary btn-sm" onClick={saveActivity}>Save</button>
                        </div>
                    </div>

                    {/* Timeline items */}
                    <div className="timeline" style={{ flex: 1, overflowY: 'auto', maxHeight: 500, paddingRight: 4 }}>
                        {activities.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--t3)' }}>
                                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>No activities yet</div>
                                <div style={{ fontSize: 12, color: 'var(--t4)', marginTop: 4 }}>Log a call or note above to get started</div>
                            </div>
                        ) : (
                            activities.map((a, i) => (
                                <div key={a.id} className={`tl-item tl-${a.type}`} style={{ animationDelay: `${i * 0.04}s` }}>
                                    <div className="tl-icon">{ACT_ICONS[a.type] || '📌'}</div>
                                    <div className="tl-body">
                                        <div className="tl-title">
                                            {ACT_LABELS[a.type] || 'Activity'}
                                            {a.type === 'system' && <span className="auto-badge auto" style={{ fontSize: 9 }}>Auto</span>}
                                        </div>
                                        <div className="tl-detail">{a.description}</div>
                                        <div className="tl-meta">{a.performed_by} · {fmtDate(a.created_at)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
