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
  Building2,
  Phone,
  Mail,
  Armchair,
  MessageSquare
} from 'lucide-react';
import { formatDateDisplay, getDaysRemaining } from '../../utils/dateMath';
import { generateQRMatrix } from '../../utils/qrGenerator';
import { BottomSheet } from '../common/BottomSheet';

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
  const [showCollectDue, setShowCollectDue] = useState(false);

  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!member) return null;

  const daysRemaining = membership ? getDaysRemaining(membership.endDate) : 0;
  const isInside = memberAttendance.some(a => a.status === 'INSIDE');
  const qrMatrix = generateQRMatrix(member.qrToken);

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

  const handleCollectDueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!membership) return;
    const res = recordPayment(member.id, Number(payDueAmount), payDueMethod);
    if (res.success) {
      setActionNotice({ type: 'success', text: `Receipt ${res.receipt?.receiptNo} generated!` });
      setShowCollectDue(false);
      setTimeout(() => setActionNotice(null), 3000);
    } else {
      setActionNotice({ type: 'error', text: res.error || 'Payment failed.' });
    }
  };

  const handleWhatsAppClick = (type: 'EXPIRY_REMINDER_7D' | 'EXPIRY_REMINDER_3D' | 'EXPIRY_TODAY' | 'SEAT_ASSIGNED') => {
    const { url } = sendWhatsAppNotification(member.id, type);
    window.open(url, '_blank');
  };

  return (
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      title={member.fullName}
      subtitle={`ID: ${member.memberCode} • ${member.targetExam || 'General'}`}
      maxWidth="620px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Status Notice Banner */}
        {actionNotice && (
          <div 
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: actionNotice.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
              color: actionNotice.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={16} /> {actionNotice.text}
          </div>
        )}

        {/* Member Profile Header Card */}
        <div 
          style={{
            padding: '14px',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--brand-primary), #1d4ed8)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '800'
              }}
            >
              {member.fullName.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800' }}>{member.fullName}</h3>
                {isInside && (
                  <span className="badge badge-success" style={{ fontSize: '9px', padding: '2px 6px' }}>● Inside</span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {member.phone} • {currentBranch.name}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => handleWhatsAppClick('EXPIRY_REMINDER_3D')}
              className="btn-secondary"
              style={{ minHeight: '36px', padding: '0 10px', color: '#25D366' }}
              title="Send WhatsApp"
            >
              <MessageSquare size={16} />
            </button>
            <button
              onClick={() => manualCheckInOut(member.id)}
              className={isInside ? 'btn-danger' : 'btn-primary'}
              style={{ minHeight: '36px', padding: '0 12px', fontSize: '12px' }}
            >
              {isInside ? 'Check Out' : 'Check In'}
            </button>
          </div>
        </div>

        {/* Tab Selector Pills */}
        <div className="pill-selector">
          {[
            { id: 'OVERVIEW', label: 'Overview' },
            { id: 'PAYMENTS', label: `Payments (${memberPayments.length})` },
            { id: 'ATTENDANCE', label: `Attendance (${memberAttendance.length})` },
            { id: 'RENEW', label: '⚡ Renew' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pill-item ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'OVERVIEW' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Membership & Seat Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div className="mobile-card" style={{ margin: 0, padding: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Plan & Validity</span>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginTop: '2px' }}>{plan?.name || 'Standard Plan'}</h4>
                <p style={{ fontSize: '12px', color: daysRemaining <= 3 ? 'var(--status-danger)' : 'var(--status-success)', fontWeight: '600', marginTop: '4px' }}>
                  {membership ? `${membership.endDate} (${daysRemaining}d left)` : 'No active plan'}
                </p>
              </div>

              <div className="mobile-card" style={{ margin: 0, padding: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Desk</span>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginTop: '2px', color: 'var(--brand-primary)' }}>
                  {seat ? `Desk ${seat.label} (${seat.zone})` : 'Floating Seat'}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {shift?.name || 'General Shift'}
                </p>
              </div>
            </div>

            {/* Contact & Exam Information */}
            <div className="mobile-card" style={{ margin: 0, padding: '14px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Scholar Profile
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Target Exam:</span>
                  <strong>{member.targetExam || 'General'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Phone (WhatsApp):</span>
                  <strong>{member.phone}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Emergency Contact:</span>
                  <strong>{member.emergencyContact || member.phone}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Enrollment Date:</span>
                  <strong>{member.joinedDate}</strong>
                </div>
              </div>
            </div>

            {/* Actions: Transfer Branch or Renew */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={() => setActiveTab('RENEW')}
                className="btn-primary"
                style={{ flex: 1, minHeight: '44px', fontSize: '14px' }}
              >
                <RefreshCw size={16} /> Renew Membership
              </button>

              {onOpenTransferBranch && (
                <button
                  onClick={() => onOpenTransferBranch(member.id)}
                  className="btn-secondary"
                  style={{ flex: 1, minHeight: '44px', fontSize: '13px' }}
                >
                  <ArrowRightLeft size={16} /> Transfer Branch
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PAYMENTS */}
        {activeTab === 'PAYMENTS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Fee Status Summary */}
            <div 
              style={{
                padding: '14px',
                background: membership && membership.dueAmount > 0 ? 'var(--status-danger-bg)' : 'var(--status-success-bg)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Fee Balance</span>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: membership && membership.dueAmount > 0 ? 'var(--status-danger)' : 'var(--status-success)' }}>
                  {membership && membership.dueAmount > 0 ? `Pending: ₹${membership.dueAmount}` : '✓ Fully Settled'}
                </h3>
              </div>

              {membership && membership.dueAmount > 0 && (
                <button
                  onClick={() => setShowCollectDue(true)}
                  className="btn-primary"
                  style={{ minHeight: '36px', padding: '0 14px', fontSize: '13px', width: 'auto' }}
                >
                  Collect Due
                </button>
              )}
            </div>

            {/* Collect Due Bottom Sheet Form */}
            {showCollectDue && (
              <form onSubmit={handleCollectDueSubmit} className="mobile-card" style={{ margin: 0, padding: '14px', border: '1px solid var(--brand-primary)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>Collect Outstanding Dues</h4>
                <div className="form-group">
                  <label className="form-label">Amount (₹)</label>
                  <input
                    type="number"
                    max={membership?.dueAmount}
                    value={payDueAmount}
                    onChange={(e) => setPayDueAmount(Number(e.target.value))}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Mode</label>
                  <select
                    value={payDueMethod}
                    onChange={(e) => setPayDueMethod(e.target.value as PaymentMethod)}
                    className="form-select"
                  >
                    <option value="UPI_GPAY">Google Pay / PhonePe UPI</option>
                    <option value="CASH">Cash Reception</option>
                    <option value="CARD">Card POS</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setShowCollectDue(false)} className="btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    Confirm Payment
                  </button>
                </div>
              </form>
            )}

            {/* Payment Receipts List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Payment Receipts ({memberPayments.length})
              </h4>
              {memberPayments.map(p => (
                <div 
                  key={p.id}
                  style={{
                    padding: '10px 12px',
                    background: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <span className="mono" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--brand-primary)' }}>
                      {p.receiptNo}
                    </span>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {p.paymentDate} • {p.method}
                    </p>
                  </div>
                  <strong style={{ fontSize: '15px', color: 'var(--status-success)' }}>
                    ₹{p.amount}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ATTENDANCE */}
        {activeTab === 'ATTENDANCE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div 
              style={{
                padding: '14px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Library Study Time</span>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--brand-primary)' }}>
                  {Math.floor(totalStudyMinutes / 60)}h {totalStudyMinutes % 60}m
                </h3>
              </div>
              <span className="badge badge-info">{memberAttendance.length} Sessions</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Attendance Sessions
              </h4>
              {memberAttendance.slice(-6).reverse().map(att => (
                <div 
                  key={att.id}
                  style={{
                    padding: '10px 12px',
                    background: 'var(--bg-surface-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{att.date}</span>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      In: {att.checkInTime} {att.checkOutTime ? `• Out: ${att.checkOutTime}` : '(Inside)'}
                    </p>
                  </div>
                  <span className={`badge ${att.status === 'INSIDE' ? 'badge-success' : 'badge-neutral'}`}>
                    {att.status === 'INSIDE' ? '● Inside' : `${att.durationMinutes || 0}m`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RENEW */}
        {activeTab === 'RENEW' && (
          <form onSubmit={handleRenewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Renew Subscription for {member.fullName}
            </h4>

            <div className="form-group">
              <label className="form-label">Select Renewal Plan</label>
              <select
                value={renewalPlanId}
                onChange={(e) => {
                  setRenewalPlanId(e.target.value);
                  const p = plans.find(x => x.id === e.target.value);
                  if (p) setRenewalAmount(p.basePrice);
                }}
                className="form-select"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.durationDays} Days) - ₹{p.basePrice}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Shift</label>
              <select
                value={renewalShiftId}
                onChange={(e) => setRenewalShiftId(e.target.value)}
                className="form-select"
              >
                {shifts.filter(s => s.branchId === currentBranch.id).map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startTime} - {s.endTime})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount Paid (₹)</label>
              <input
                type="number"
                value={renewalAmount}
                onChange={(e) => setRenewalAmount(Number(e.target.value))}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select
                value={renewalMethod}
                onChange={(e) => setRenewalMethod(e.target.value as PaymentMethod)}
                className="form-select"
              >
                <option value="UPI_GPAY">Google Pay / PhonePe UPI</option>
                <option value="CASH">Cash Reception</option>
                <option value="CARD">Card POS</option>
              </select>
            </div>

            <button type="submit" className="btn-primary" style={{ minHeight: '48px', marginTop: '6px', fontSize: '15px' }}>
              <RefreshCw size={18} /> Confirm Renewal & Extend Validity
            </button>
          </form>
        )}
      </div>
    </BottomSheet>
  );
};
