import React, { useState } from 'react';
import { useLibrary } from '../../state/libraryStore';
import {
  GraduationCap,
  Armchair,
  Clock,
  QrCode,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Lock,
  Receipt,
  User,
  ExternalLink
} from 'lucide-react';
import { formatDateDisplay, getDaysRemaining } from '../../utils/dateMath';
import { generateQRMatrix } from '../../utils/qrGenerator';
import confetti from 'canvas-confetti';

export const StudentPortalView: React.FC = () => {
  const {
    currentBranch,
    members,
    memberships,
    assignments,
    seats,
    shifts,
    plans,
    payments,
    attendance,
    renewMembership,
  } = useLibrary();

  const branchMembers = members.filter(m => m.branchId === currentBranch.id);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(branchMembers[0]?.id || 'mem_1');

  // Selected Student Objects
  const member = members.find(m => m.id === selectedStudentId) || branchMembers[0];
  const membership = memberships.find(m => m.memberId === member?.id && m.status !== 'CANCELLED');
  const assignment = assignments.find(a => a.memberId === member?.id && a.status === 'ACTIVE');
  const seat = seats.find(s => s.id === assignment?.seatId);
  const shift = shifts.find(s => s.id === membership?.shiftId);
  const plan = plans.find(p => p.id === membership?.planId);

  const studentAttendance = attendance.filter(a => a.memberId === member?.id);
  const totalMinutes = studentAttendance.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
  const daysLeft = membership ? getDaysRemaining(membership.endDate) : 0;

  // Renewal Modal State
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalPlanId, setRenewalPlanId] = useState(plan?.id || plans[0]?.id || '');
  const [renewalSuccess, setRenewalSuccess] = useState(false);

  if (!member) {
    return <div style={{ padding: '24px' }}>No scholars found in this branch.</div>;
  }

  const qrMatrix = generateQRMatrix(member.qrToken);

  const handleOnlineRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    const p = plans.find(plan => plan.id === renewalPlanId) || plans[0];
    const res = renewMembership(
      member.id,
      p.id,
      shift?.id || shifts[0].id,
      p.basePrice,
      'UPI_GPAY'
    );
    if (res.success) {
      setRenewalSuccess(true);
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
      setTimeout(() => {
        setRenewalSuccess(false);
        setShowRenewalModal(false);
      }, 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Top Student Switcher (For Demo/Testing) */}
      <div className="card" style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-medium)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <GraduationCap size={20} color="var(--brand-primary)" />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>Scholar View Simulator</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Experience the mobile-first student portal as any scholar</div>
          </div>
        </div>

        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          className="form-control"
          style={{ width: 'auto', minWidth: '220px', padding: '6px 12px', fontSize: '13px', fontWeight: 600 }}
        >
          {branchMembers.map(m => (
            <option key={m.id} value={m.id}>
              {m.fullName} ({m.memberCode}) • {m.targetExam || 'Scholar'}
            </option>
          ))}
        </select>
      </div>

      {/* Main Student Hub */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
        gap: '20px',
      }}>
        {/* Left Column: Digital Pass & Live QR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card */}
          <div style={{
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            border: '1px solid var(--border-bright)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  24LIBRARY SCHOLAR PASS
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                  {member.fullName}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {member.targetExam || 'General Study'} • <span className="mono">{member.memberCode}</span>
                </div>
              </div>

              <span className={`badge ${daysLeft <= 3 ? 'badge-danger' : daysLeft <= 7 ? 'badge-warning' : 'badge-success'}`}>
                {daysLeft < 0 ? 'EXPIRED' : `${daysLeft} Days Active`}
              </span>
            </div>

            {/* Centered QR Pass */}
            <div style={{
              background: '#ffffff',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              alignSelf: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              <svg width="150" height="150" viewBox="0 0 25 25">
                {qrMatrix.map((row, r) =>
                  row.map((val, c) => (
                    <rect
                      key={`${r}-${c}`}
                      x={c}
                      y={r}
                      width="1"
                      height="1"
                      fill={val ? '#000000' : '#ffffff'}
                    />
                  ))
                )}
              </svg>
              <div style={{ fontSize: '10px', color: '#000000', fontWeight: 800, letterSpacing: '0.04em' }}>
                HOLD AGAINST TURNSTILE SCANNER
              </div>
            </div>

            {/* Desk & Shift Tags */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12.5px',
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '10.5px', display: 'block' }}>RESERVED DESK</span>
                <strong style={{ color: '#ffffff', fontSize: '15px' }}>{seat?.label || 'Floating Desk'}</strong>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>{seat?.zone || 'General Zone'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '10.5px', display: 'block' }}>SHIFT TIMING</span>
                <strong style={{ color: shift?.color || '#ffffff', fontSize: '14px' }}>{shift?.name.split(' (')[0]}</strong>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '11px' }}>{shift?.startTime} - {shift?.endTime}</span>
              </div>
            </div>

            {/* Quick Renewal CTA */}
            {daysLeft <= 7 && (
              <button
                onClick={() => setShowRenewalModal(true)}
                className="btn btn-warning"
                style={{ width: '100%', gap: '6px', fontWeight: 700 }}
              >
                <RefreshCw size={16} />
                <span>Renew Membership Online (₹{plan?.basePrice})</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Study Telemetry & Fee Receipts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Study Metrics */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>
              Study Tracker & Focus Hours
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{
                padding: '12px',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOTAL LOGGED TIME</div>
                <div style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: 'var(--brand-primary)' }}>
                  {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Across {studentAttendance.length} library sessions</div>
              </div>

              <div style={{
                padding: '12px',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>VALIDITY EXPIRY</div>
                <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '4px', color: daysLeft <= 3 ? 'var(--status-danger)' : 'var(--status-success)' }}>
                  {formatDateDisplay(membership?.endDate || '')}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>{daysLeft} days remaining</div>
              </div>
            </div>
          </div>

          {/* Fee & Payment Status */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Membership & Dues</h3>
              <span className={`badge ${(membership?.dueAmount || 0) > 0 ? 'badge-danger' : 'badge-success'}`}>
                {(membership?.dueAmount || 0) > 0 ? `₹${membership?.dueAmount} Overdue` : 'Fees Cleared'}
              </span>
            </div>

            <div style={{ fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Active Plan:</span>
                <strong>{plan?.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Plan Cost:</span>
                <span>₹{membership?.totalFee.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Paid Amount:</span>
                <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>₹{membership?.paidAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => setShowRenewalModal(true)}
              className="btn btn-primary btn-sm"
              style={{ gap: '6px', alignSelf: 'flex-start', marginTop: '6px' }}
            >
              <RefreshCw size={14} />
              <span>Renew / Upgrade Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Online Renewal Modal Simulator */}
      {showRenewalModal && (
        <div className="modal-backdrop" onClick={() => setShowRenewalModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '17px', fontWeight: 800 }}>1-Click UPI Renewal</h3>
              <button onClick={() => setShowRenewalModal(false)} className="btn btn-ghost btn-sm">
                ✕
              </button>
            </div>

            {renewalSuccess ? (
              <div className="modal-body" style={{ padding: '36px', textAlign: 'center' }}>
                <CheckCircle2 size={48} color="var(--status-success)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--status-success)' }}>
                  Renewal Successful!
                </h3>
                <p style={{ fontSize: '13px', marginTop: '6px' }}>
                  Your digital scholar pass validity has been extended. Thank you!
                </p>
              </div>
            ) : (
              <form onSubmit={handleOnlineRenewal}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Select Extension Plan</label>
                    <select
                      className="form-control"
                      value={renewalPlanId}
                      onChange={(e) => setRenewalPlanId(e.target.value)}
                    >
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.durationDays} Days) — ₹{p.basePrice.toLocaleString('en-IN')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    textAlign: 'center',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Simulated UPI Payment Gateway</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--status-success)', margin: '8px 0' }}>
                      ₹{(plans.find(p => p.id === renewalPlanId)?.basePrice || 1600).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Supports GPay, PhonePe, Paytm & UPI AutoPay
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setShowRenewalModal(false)} className="btn btn-ghost btn-sm">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
                    <Zap size={15} />
                    <span>Pay via UPI Now</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
