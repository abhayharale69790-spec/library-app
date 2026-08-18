import React, { useState } from 'react';
import { useLibrary } from '../../state/libraryStore';
import { PaymentMethod } from '../../types';
import {
  X,
  User,
  QrCode,
  CreditCard,
  Clock,
  Send,
  Printer,
  ArrowRightLeft,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  GraduationCap,
  Calendar,
  Building2
} from 'lucide-react';
import { formatDateDisplay, getDaysRemaining } from '../../utils/dateMath';
import { generateQRMatrix } from '../../utils/qrGenerator';

interface MemberDetailModalProps {
  memberId: string;
  onClose: () => void;
  onOpenTransferBranch?: (memberId: string) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  memberId,
  onClose,
  onOpenTransferBranch,
}) => {
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
    recordPayment,
    manualCheckInOut,
    sendWhatsAppNotification,
  } = useLibrary();

  const member = members.find(m => m.id === memberId);
  const membership = memberships.find(m => m.memberId === memberId && m.status !== 'CANCELLED');
  const assignment = assignments.find(a => a.memberId === memberId && a.status === 'ACTIVE');
  const seat = seats.find(s => s.id === assignment?.seatId);
  const shift = shifts.find(s => s.id === membership?.shiftId);
  const plan = plans.find(p => p.id === membership?.planId);

  // Filter member's payment and attendance history
  const memberPayments = payments.filter(p => p.memberId === memberId);
  const memberAttendance = attendance.filter(a => a.memberId === memberId);
  const totalStudyMinutes = memberAttendance.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);

  // Tab State
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PAYMENTS' | 'ATTENDANCE' | 'RENEW'>('OVERVIEW');

  // Renewal Form
  const [renewalPlanId, setRenewalPlanId] = useState(plan?.id || plans[0]?.id || '');
  const [renewalShiftId, setRenewalShiftId] = useState(shift?.id || shifts[0]?.id || '');
  const selectedRenewalPlan = plans.find(p => p.id === renewalPlanId) || plans[0];
  const [renewalAmount, setRenewalAmount] = useState<number>(selectedRenewalPlan?.basePrice || 1600);
  const [renewalMethod, setRenewalMethod] = useState<PaymentMethod>('UPI_GPAY');

  // Due Collection Form
  const [payDueAmount, setPayDueAmount] = useState<number>(membership?.dueAmount || 0);
  const [payDueMethod, setPayDueMethod] = useState<PaymentMethod>('UPI_GPAY');
  const [showCollectDueModal, setShowCollectDueModal] = useState(false);

  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!member) return null;

  const daysRemaining = membership ? getDaysRemaining(membership.endDate) : 0;
  const qrMatrix = generateQRMatrix(member.qrToken);

  // Execute Renewal
  const handleRenewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = renewMembership(
      member.id,
      renewalPlanId,
      renewalShiftId,
      renewalAmount,
      renewalMethod
    );
    if (res.success) {
      setActionNotice({ type: 'success', text: 'Membership renewed successfully with extended validity!' });
      setTimeout(() => setActionNotice(null), 3000);
      setActiveTab('OVERVIEW');
    } else {
      setActionNotice({ type: 'error', text: res.error || 'Renewal failed.' });
    }
  };

  // Execute Due Payment
  const handlePayDueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = recordPayment(member.id, payDueAmount, payDueMethod, undefined, 'Outstanding due payment');
    if (res.success) {
      setActionNotice({ type: 'success', text: `Payment of ₹${payDueAmount} recorded successfully!` });
      setShowCollectDueModal(false);
      setTimeout(() => setActionNotice(null), 3000);
    } else {
      setActionNotice({ type: 'error', text: res.error || 'Payment failed.' });
    }
  };

  // WhatsApp Nudge
  const handleWhatsApp = () => {
    const { url } = sendWhatsAppNotification(member.id, daysRemaining <= 3 ? 'EXPIRY_REMINDER_3D' : 'EXPIRY_REMINDER_7D');
    window.open(url, '_blank');
  };

  // Manual Gate Override
  const handleGateOverride = () => {
    const res = manualCheckInOut(member.id);
    if (res.allowed) {
      setActionNotice({ type: 'success', text: `Gate Override: ${res.reason}` });
    } else {
      setActionNotice({ type: 'error', text: `Gate Override Rejected: ${res.reason}` });
    }
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 800,
              color: '#ffffff',
            }}>
              {member.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{member.fullName}</h3>
                <span className="mono badge badge-neutral" style={{ fontSize: '10.5px' }}>
                  {member.memberCode}
                </span>
                <span className={`badge ${daysRemaining <= 3 ? 'badge-danger' : daysRemaining <= 7 ? 'badge-warning' : 'badge-success'}`}>
                  {daysRemaining < 0 ? 'EXPIRED' : `${daysRemaining}d left`}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {member.targetExam || 'Scholar'} • {member.phone}
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          background: 'rgba(0, 0, 0, 0.1)',
        }}>
          {[
            { id: 'OVERVIEW', label: 'Scholar Profile & Pass' },
            { id: 'PAYMENTS', label: `Payments & Dues (${memberPayments.length})` },
            { id: 'ATTENDANCE', label: `Study Log (${memberAttendance.length})` },
            { id: 'RENEW', label: 'Renew Membership' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as unknown as typeof activeTab)}
              style={{
                padding: '12px 16px',
                fontSize: '13px',
                fontWeight: activeTab === t.id ? 700 : 500,
                border: 'none',
                borderBottom: activeTab === t.id ? '2px solid var(--brand-primary)' : '2px solid transparent',
                background: 'transparent',
                color: activeTab === t.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {actionNotice && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              background: actionNotice.type === 'error' ? 'var(--status-danger-bg)' : 'var(--status-success-bg)',
              border: `1px solid ${actionNotice.type === 'error' ? 'var(--status-danger)' : 'var(--status-success)'}`,
              color: actionNotice.type === 'error' ? 'var(--status-danger)' : 'var(--status-success)',
              fontSize: '13px',
              fontWeight: 600,
            }}>
              {actionNotice.text}
            </div>
          )}

          {/* TAB 1: OVERVIEW & DIGITAL ID CARD */}
          {activeTab === 'OVERVIEW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Digital Pass Card (Printable) */}
              <div className="printable-card" style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                border: '1px solid var(--border-bright)',
                boxShadow: 'var(--shadow-md)',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) auto',
                gap: '16px',
                alignItems: 'center',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                    <span>24LIBRARY DIGITAL SCHOLAR PASS</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                    {member.fullName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    ID: <span className="mono" style={{ color: '#ffffff' }}>{member.memberCode}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>DESK RESERVED</span>
                      <strong style={{ color: '#ffffff', fontSize: '14px' }}>{seat?.label || 'Floating'}</strong> ({seat?.zone || 'General'})
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>SHIFT SLOT</span>
                      <strong style={{ color: shift?.color || '#ffffff' }}>{shift?.name.split(' (')[0]}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>ACTIVE PLAN</span>
                      <span style={{ color: '#ffffff' }}>{plan?.name || 'Standard'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px' }}>VALID UNTIL</span>
                      <span style={{ color: daysRemaining <= 3 ? 'var(--status-danger)' : 'var(--status-success)', fontWeight: 700 }}>
                        {formatDateDisplay(membership?.endDate || '')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* SVG QR Code */}
                <div style={{
                  background: '#ffffff',
                  padding: '8px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <svg width="110" height="110" viewBox="0 0 25 25">
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
                  <span className="mono" style={{ fontSize: '9px', color: '#000000', fontWeight: 700 }}>
                    SCAN AT TURNSTILE
                  </span>
                </div>
              </div>

              {/* Quick Details & Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div className="card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TOTAL STUDY HOURS</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px' }}>
                    {Math.floor(totalStudyMinutes / 60)}h {totalStudyMinutes % 60}m
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Across {memberAttendance.length} sessions</div>
                </div>

                <div className="card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>FEES PAID</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', color: 'var(--status-success)' }}>
                    ₹{membership?.paidAmount.toLocaleString('en-IN') || 0}
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>Plan Total: ₹{membership?.totalFee.toLocaleString('en-IN') || 0}</div>
                </div>

                <div className="card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PENDING DUES</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '4px', color: (membership?.dueAmount || 0) > 0 ? 'var(--status-danger)' : 'var(--text-muted)' }}>
                    ₹{membership?.dueAmount.toLocaleString('en-IN') || 0}
                  </div>
                  <div style={{ fontSize: '10.5px', color: (membership?.dueAmount || 0) > 0 ? 'var(--status-danger)' : 'var(--status-success)' }}>
                    {(membership?.dueAmount || 0) > 0 ? 'Overdue' : 'Fully Cleared'}
                  </div>
                </div>
              </div>

              {/* Emergency Contact & Additional Info */}
              <div className="card" style={{ padding: '14px', fontSize: '12.5px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div><strong>Email:</strong> {member.email || 'N/A'}</div>
                <div><strong>Emergency Contact:</strong> {member.emergencyContact || 'N/A'}</div>
                <div><strong>Joined On:</strong> {formatDateDisplay(member.joinedDate)}</div>
                <div><strong>Branch:</strong> {currentBranch.name}</div>
              </div>
            </div>
          )}

          {/* TAB 2: PAYMENTS & DUES */}
          {activeTab === 'PAYMENTS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Payment & Fee Statement</h4>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>All fee transactions and invoices</div>
                </div>
                {(membership?.dueAmount || 0) > 0 && (
                  <button
                    onClick={() => {
                      setPayDueAmount(membership?.dueAmount || 0);
                      setShowCollectDueModal(true);
                    }}
                    className="btn btn-danger btn-sm"
                  >
                    + Collect ₹{membership?.dueAmount} Due
                  </button>
                )}
              </div>

              {/* Payments Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px' }}>Receipt #</th>
                      <th style={{ padding: '8px' }}>Date</th>
                      <th style={{ padding: '8px' }}>Amount</th>
                      <th style={{ padding: '8px' }}>Method</th>
                      <th style={{ padding: '8px' }}>Notes</th>
                      <th style={{ padding: '8px' }}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberPayments.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td className="mono" style={{ padding: '8px', fontWeight: 600 }}>{p.receiptNo}</td>
                        <td style={{ padding: '8px' }}>{p.paymentDate}</td>
                        <td style={{ padding: '8px', fontWeight: 700, color: 'var(--status-success)' }}>
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '8px' }}>
                          <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{p.method}</span>
                        </td>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>{p.notes || '—'}</td>
                        <td style={{ padding: '8px' }}>
                          <button
                            onClick={() => {
                              alert(`Official 24Library Receipt\nReceipt No: ${p.receiptNo}\nMember: ${member.fullName}\nAmount: ₹${p.amount}\nDate: ${p.paymentDate}\nMethod: ${p.method}\nStatus: Cleared`);
                            }}
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '2px 6px', fontSize: '11px' }}
                          >
                            <Receipt size={12} />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ATTENDANCE LOG */}
          {activeTab === 'ATTENDANCE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Study Session History</h4>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Total Time Logged: <strong>{Math.floor(totalStudyMinutes / 60)}h {totalStudyMinutes % 60}m</strong>
                  </div>
                </div>
                <button onClick={handleGateOverride} className="btn btn-secondary btn-sm">
                  Simulate Gate Check-In/Out
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {memberAttendance.map(att => (
                  <div
                    key={att.id}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--bg-input)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12.5px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{formatDateDisplay(att.date)}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        Check In: {att.checkInTime} • {att.checkOutTime ? `Check Out: ${att.checkOutTime}` : 'Currently Inside'}
                      </div>
                    </div>
                    <div>
                      {att.status === 'INSIDE' ? (
                        <span className="badge badge-success">ACTIVE SESSION</span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                          {att.durationMinutes ? `${Math.floor(att.durationMinutes / 60)}h ${att.durationMinutes % 60}m` : 'Completed'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: RENEW MEMBERSHIP */}
          {activeTab === 'RENEW' && (
            <form onSubmit={handleRenewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '12px 16px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 'var(--radius-md)',
                fontSize: '12.5px',
              }}>
                <strong>Renewal Date Arithmetic:</strong>{' '}
                {daysRemaining >= 0 ? (
                  <span>Currently active: Validity will seamlessly extend starting from current expiry ({formatDateDisplay(membership?.endDate || '')}).</span>
                ) : (
                  <span>Currently expired: Membership will restart effective today.</span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Choose Renewal Plan</label>
                  <select
                    className="form-control"
                    value={renewalPlanId}
                    onChange={(e) => {
                      setRenewalPlanId(e.target.value);
                      const p = plans.find(plan => plan.id === e.target.value);
                      if (p) setRenewalAmount(p.basePrice);
                    }}
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.durationDays} Days) — ₹{p.basePrice.toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Shift Slot</label>
                  <select
                    className="form-control"
                    value={renewalShiftId}
                    onChange={(e) => setRenewalShiftId(e.target.value)}
                  >
                    {shifts.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name.split(' (')[0]} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Renewal Fee (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={renewalAmount}
                    onChange={(e) => setRenewalAmount(Number(e.target.value))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-control"
                    value={renewalMethod}
                    onChange={(e) => setRenewalMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="UPI_GPAY">Google Pay (UPI)</option>
                    <option value="UPI_PHONEPE">PhonePe (UPI)</option>
                    <option value="UPI_PAYTM">Paytm (UPI)</option>
                    <option value="CASH">Cash at Desk</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="NETBANKING">Net Banking</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ gap: '6px' }}>
                <RefreshCw size={16} />
                <span>Confirm Renewal & Extend Pass</span>
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            onClick={handleWhatsApp}
            className="btn btn-sm"
            style={{ background: '#25D366', color: '#ffffff', gap: '6px' }}
          >
            <Send size={14} />
            <span>WhatsApp Reminder</span>
          </button>

          <button onClick={handlePrint} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
            <Printer size={14} />
            <span>Print Pass / Badge</span>
          </button>

          {onOpenTransferBranch && (
            <button onClick={() => onOpenTransferBranch(member.id)} className="btn btn-secondary btn-sm" style={{ gap: '6px' }}>
              <Building2 size={14} />
              <span>Transfer Branch</span>
            </button>
          )}

          <button onClick={onClose} className="btn btn-ghost btn-sm">
            Close
          </button>
        </div>
      </div>

      {/* Collect Due Nested Modal */}
      {showCollectDueModal && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={() => setShowCollectDueModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h4 style={{ fontSize: '16px', fontWeight: 800 }}>Collect Outstanding Due</h4>
              <button onClick={() => setShowCollectDueModal(false)} className="btn btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handlePayDueSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Payment Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    max={membership?.dueAmount}
                    className="form-control"
                    value={payDueAmount}
                    onChange={(e) => setPayDueAmount(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-control"
                    value={payDueMethod}
                    onChange={(e) => setPayDueMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="UPI_GPAY">Google Pay (UPI)</option>
                    <option value="UPI_PHONEPE">PhonePe (UPI)</option>
                    <option value="CASH">Cash at Desk</option>
                    <option value="CARD">Card Swipe</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCollectDueModal(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" className="btn btn-success btn-sm">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
