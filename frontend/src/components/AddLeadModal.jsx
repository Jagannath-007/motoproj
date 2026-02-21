import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { createLead, checkDuplicate } from '../api';

const SOURCES = ['Website', 'Facebook', 'Google', 'Twitter', 'Referral', 'Offline'];
const STATUSES = ['New', 'Contacted'];

export default function AddLeadModal({ users, onClose, onCreated }) {
    const [form, setForm] = useState({
        name: '', phone: '', email: '',
        source: 'Website', vehicle_interested: '',
        budget: '', assigned_to: '', status: 'New',
    });
    const [dupWarning, setDupWarning] = useState(null);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1); // 2-step form

    const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handlePhoneChange = async (phone) => {
        update('phone', phone);
        if (phone.replace(/\D/g, '').length >= 10) {
            try {
                const res = await checkDuplicate(phone);
                setDupWarning(res.data.isDuplicate ? res.data.existing : null);
            } catch { /* ignore */ }
        } else {
            setDupWarning(null);
        }
    };

    const handleSubmit = async () => {
        if (!form.name.trim() || !form.phone.trim() || !form.source)
            return toast.error('Name, phone, and source are required');
        setSaving(true);
        try {
            const res = await createLead(form);
            toast.success(res.data.autoAssigned ? '✅ Lead added & auto-assigned!' : '✅ Lead created successfully!');
            onCreated();
        } catch (err) {
            if (err.response?.status === 409) toast.error('Duplicate phone number detected!');
            else toast.error('Failed to create lead');
        }
        setSaving(false);
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-box" style={{ width: 520 }}>
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <div className="modal-title">Add New Lead</div>
                        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>
                            Step {step} of 2 — {step === 1 ? 'Contact Info' : 'Lead Details'}
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                </div>

                {/* Step indicator */}
                <div style={{ padding: '12px 22px 0', display: 'flex', gap: 6 }}>
                    {[1, 2].map(s => (
                        <div key={s} style={{
                            flex: 1, height: 3, borderRadius: 4,
                            background: step >= s ? 'var(--accent)' : 'var(--surface-3)',
                            transition: 'background 0.2s',
                        }} />
                    ))}
                </div>

                <div className="modal-body">
                    {/* Duplicate warning */}
                    {dupWarning && (
                        <div style={{
                            background: '#FEF3C7', border: '1px solid rgba(217,119,6,0.25)',
                            borderRadius: 'var(--r)', padding: '10px 14px', marginBottom: 16,
                            fontSize: 12.5, color: '#92400E', display: 'flex', gap: 8, alignItems: 'flex-start',
                        }}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                            <span>
                                <strong>Duplicate Detected!</strong> A lead with this number already exists:
                                <strong> {dupWarning.name}</strong> ({dupWarning.phone}) — Status: {dupWarning.status}
                            </span>
                        </div>
                    )}

                    {step === 1 ? (
                        /* STEP 1: Contact Info */
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Full Name <span style={{ color: 'var(--red)' }}>*</span></label>
                                <input
                                    className="form-control" type="text"
                                    placeholder="e.g. Arjun Patel"
                                    value={form.name}
                                    onChange={e => update('name', e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone <span style={{ color: 'var(--red)' }}>*</span></label>
                                <input
                                    className="form-control" type="tel"
                                    placeholder="+91 98765 43210"
                                    value={form.phone}
                                    onChange={e => handlePhoneChange(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    className="form-control" type="email"
                                    placeholder="name@example.com"
                                    value={form.email}
                                    onChange={e => update('email', e.target.value)}
                                />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Lead Source <span style={{ color: 'var(--red)' }}>*</span></label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                                    {SOURCES.map(s => (
                                        <button key={s} type="button"
                                            onClick={() => update('source', s)}
                                            style={{
                                                padding: '6px 14px', borderRadius: 20,
                                                border: `1px solid ${form.source === s ? 'var(--accent)' : 'var(--border)'}`,
                                                background: form.source === s ? 'var(--accent-light)' : 'var(--surface)',
                                                color: form.source === s ? 'var(--accent)' : 'var(--t2)',
                                                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                                fontFamily: 'var(--font)',
                                                transition: 'all 0.15s',
                                            }}
                                        >{s}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* STEP 2: Lead Details */
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Vehicle Interested In</label>
                                <input
                                    className="form-control" type="text"
                                    placeholder="e.g. Hyundai Creta SX, Tata Nexon EV"
                                    value={form.vehicle_interested}
                                    onChange={e => update('vehicle_interested', e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Budget Range</label>
                                <input
                                    className="form-control" type="text"
                                    placeholder="e.g. ₹10L – ₹15L"
                                    value={form.budget}
                                    onChange={e => update('budget', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Initial Status</label>
                                <select className="form-control" value={form.status} onChange={e => update('status', e.target.value)}>
                                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    Assign To
                                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '1px 7px', borderRadius: 8, border: '1px solid rgba(79,70,229,0.2)' }}>🤖 Auto</span>
                                </label>
                                <select className="form-control" value={form.assigned_to} onChange={e => update('assigned_to', e.target.value)}>
                                    <option value="">Auto-assign (lowest workload)</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.activeLeads} active leads</option>)}
                                </select>
                            </div>
                            {/* AI insight banner */}
                            <div style={{
                                gridColumn: '1/-1',
                                background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)',
                                border: '1px solid rgba(79,70,229,0.15)',
                                borderRadius: 'var(--r)', padding: '10px 14px',
                                fontSize: 12, color: 'var(--t2)', display: 'flex', gap: 8, alignItems: 'center',
                            }}>
                                <span style={{ fontSize: 16 }}>💡</span>
                                <span>Best performing source this month: <strong style={{ color: 'var(--accent)' }}>Google</strong> · Priya has the highest close rate on qualified leads.</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    {step === 2 && (
                        <button className="btn btn-secondary" onClick={() => setStep(1)}>
                            ← Back
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={onClose} style={{ marginLeft: step === 1 ? 'auto' : 0 }}>
                        Cancel
                    </button>
                    {step === 1 ? (
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                if (!form.name.trim() || !form.phone.trim()) return toast.error('Name and phone are required');
                                setStep(2);
                            }}
                        >
                            Continue →
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                            {saving ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <svg style={{ animation: 'spin 0.7s linear infinite' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                    Adding…
                                </span>
                            ) : '✓ Add Lead'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
