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
  ExternalLink,
  CalendarCheck,
  ArrowRightLeft,
  Share2,
  Sparkles
} from 'lucide-react';
import { formatDateDisplay, getDaysRemaining } from '../../utils/dateMath';
import { generateQRMatrix } from '../../utils/qrGenerator';
import confetti from 'canvas-confetti';
import { BottomSheet } from '../common/BottomSheet';
import { StudentMobileHome } from './StudentMobileHome';

export const StudentPortalView: React.FC = () => {
  const {
    businessProfile,
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
    transferSeat,
  } = useLibrary();

  const branchMembers = members.filter(m => m.branchId === currentBranch.id);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(branchMembers[0]?.id || 'mem_1');
  const [portalTab, setPortalTab] = useState<'HOME' | 'PASS' | 'SEAT' | 'ATTENDANCE' | 'PAYMENTS'>('HOME');

  // Selected Student Objects
  const member = members.find(m => m.id === selectedStudentId) || branchMembers[0];
  const membership = memberships.find(m => m.memberId === member?.id && m.status !== 'CANCELLED');
  const assignment = assignments.find(a => a.memberId === member?.id && a.status === 'ACTIVE');
  const seat = seats.find(s => s.id === assignment?.seatId);
  const shift = shifts.find(s => s.id === membership?.shiftId);
  const plan = plans.find(p => p.id === membership?.planId);

  const studentAttendance = attendance.filter(a => a.memberId === member?.id);
  const totalMinutes = studentAttendance.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
  const studentPayments = payments.filter(p => p.memberId === member?.id);
  const daysLeft = membership ? getDaysRemaining(membership.endDate) : 0;

  // Modals
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetSeatId, setTargetSeatId] = useState('');
  const [renewalPlanId, setRenewalPlanId] = useState(plan?.id || plans[0]?.id || '');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      setNotice({ type: 'success', text: 'Membership renewed successfully!' });
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
      setTimeout(() => {
        setNotice(null);
        setShowRenewalModal(false);
      }, 1500);
    }
  };

  const handleSeatTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSeatId || !shift) return;
    const res = transferSeat(member.id, targetSeatId, shift.id);
    if (!res.success) {
      setNotice({ type: 'error', text: res.error || 'Seat transfer failed.' });
    } else {
      setNotice({ type: 'success', text: `Seat transferred to Desk ${seats.find(s => s.id === targetSeatId)?.label}!` });
      setTimeout(() => {
        setNotice(null);
        setShowTransferModal(false);
      }, 1500);
    }
  };

  // Free seats in this shift
  const freeSeatsInShift = seats.filter(s => {
    if (s.branchId !== currentBranch.id || s.isBlocked) return false;
    if (s.id === seat?.id) return false;
    const isOccupied = assignments.some(a => a.seatId === s.id && a.shiftId === shift?.id && a.status === 'ACTIVE');
    return !isOccupied;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px', margin: '0 auto' }}>
      {/* Student Switcher Bar (Demo persona switcher) */}
      <div 
        style={{
          padding: '10px 14px',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GraduationCap size={18} color="var(--seat-my-seat)" />
          <span style={{ fontSize: '13px', fontWeight: '700' }}>Student Portal</span>
        </div>

        <select
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontWeight: 600,
            maxWidth: '180px'
          }}
        >
          {branchMembers.map(m => (
            <option key={m.id} value={m.id}>
              {m.fullName} ({m.memberCode})
            </option>
          ))}
        </select>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="pill-selector">
        {[
          { id: 'HOME', label: '🏠 Home' },
          { id: 'PASS', label: '📱 Digital Pass' },
          { id: 'SEAT', label: '🪑 My Seat' },
          { id: 'ATTENDANCE', label: '📊 Attendance' },
          { id: 'PAYMENTS', label: '💳 Fee & Receipts' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setPortalTab(tab.id as any)}
            className={`pill-item ${portalTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {notice && (
        <div 
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: notice.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
            color: notice.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          {notice.text}
        </div>
      )}

      {/* TAB 1: HOME */}
      {portalTab === 'HOME' && (
        <StudentMobileHome
          onOpenQrPass={() => setPortalTab('PASS')}
          onOpenAttendance={() => setPortalTab('ATTENDANCE')}
          onOpenPayments={() => setPortalTab('PAYMENTS')}
          onOpenSeatDetails={() => setPortalTab('SEAT')}
        />
      )}

      {/* TAB 2: DIGITAL QR PASS */}
      {portalTab === 'PASS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div 
            className="mobile-card"
            style={{
              margin: 0,
              padding: '24px 16px',
              textAlign: 'center',
              background: 'linear-gradient(180deg, #131d33, #0b0f19)',
              border: '1.5px solid var(--seat-my-seat)',
              boxShadow: '0 0 24px rgba(236, 72, 153, 0.15)'
            }}
          >
            <span className="badge" style={{ background: 'rgba(236, 72, 153, 0.2)', color: 'var(--seat-my-seat)', marginBottom: '12px' }}>
              {businessProfile.name ? `${businessProfile.name.toUpperCase()} • DIGITAL PASS` : 'OFFICIAL DIGITAL SCHOLAR PASS'}
            </span>

            <h3 style={{ fontSize: '20px', fontWeight: '800' }}>{member.fullName}</h3>
            <p className="mono" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              ID: {member.memberCode}
            </p>

            {/* High-Resolution QR Code Matrix */}
            <div 
              style={{
                width: '180px',
                height: '180px',
                margin: '18px auto',
                background: '#ffffff',
                padding: '10px',
                borderRadius: 'var(--radius-lg)',
                display: 'grid',
                gridTemplateColumns: `repeat(${qrMatrix.length}, 1fr)`,
                gap: '1px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
              }}
            >
              {qrMatrix.map((row, rIdx) =>
                row.map((cell, cIdx) => (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    style={{
                      backgroundColor: cell ? '#0f172a' : '#ffffff',
                    }}
                  />
                ))
              )}
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Scan at Optical Turnstile to unlock gate
            </p>

            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Desk:</span>
                <p style={{ fontWeight: '700', color: 'var(--brand-primary)' }}>{seat ? `Desk ${seat.label}` : 'Floating'}</p>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Valid Until:</span>
                <p style={{ fontWeight: '700', color: 'var(--status-success)' }}>{membership?.endDate}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowRenewalModal(true)}
            className="btn-primary"
            style={{ minHeight: '48px', fontSize: '15px' }}
          >
            <RefreshCw size={18} /> Renew Subscription Online
          </button>
        </div>
      )}

      {/* TAB 3: MY SEAT */}
      {portalTab === 'SEAT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="mobile-card" style={{ margin: 0, padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Desk Reservation</h3>
              <span className="badge badge-success">● Reserved</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-md)', background: 'var(--brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                {seat?.label || 'A-22'}
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '700' }}>{shift?.name || 'Morning Shift'}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Zone: {seat?.zone || 'AC Quiet'} • Floor 1</p>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{seat?.powerSocket ? '⚡ Socket' : 'Standard'}</span>
                  <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{seat?.hasLocker ? '🔒 Locker' : 'No Locker'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowTransferModal(true)}
              className="btn-secondary"
              style={{ width: '100%', minHeight: '44px', marginTop: '14px', fontSize: '14px' }}
            >
              <ArrowRightLeft size={16} /> Request Seat Transfer
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: ATTENDANCE */}
      {portalTab === 'ATTENDANCE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="mobile-card" style={{ margin: 0, padding: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>Monthly Attendance Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
              <div style={{ padding: '10px', background: 'var(--status-success-bg)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '11px', color: 'var(--status-success)', fontWeight: '600' }}>Present</span>
                <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--status-success)' }}>18</p>
              </div>
              <div style={{ padding: '10px', background: 'var(--status-danger-bg)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '11px', color: 'var(--status-danger)', fontWeight: '600' }}>Absent</span>
                <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--status-danger)' }}>2</p>
              </div>
              <div style={{ padding: '10px', background: 'var(--status-warning-bg)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '11px', color: 'var(--status-warning)', fontWeight: '600' }}>Late</span>
                <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--status-warning)' }}>1</p>
              </div>
            </div>
          </div>

          <div className="mobile-card" style={{ margin: 0, padding: '14px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Recent Check-Ins
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {studentAttendance.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>{a.date}</span>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Entry: {a.checkInTime}</p>
                  </div>
                  <span className="badge badge-success">{a.durationMinutes || 180}m</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PAYMENTS */}
      {portalTab === 'PAYMENTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div 
            style={{
              padding: '16px',
              background: membership && membership.dueAmount > 0 ? 'var(--status-danger-bg)' : 'var(--status-success-bg)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Membership Balance</span>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: membership && membership.dueAmount > 0 ? 'var(--status-danger)' : 'var(--status-success)' }}>
                {membership && membership.dueAmount > 0 ? `Pending: ₹${membership.dueAmount}` : '✓ Fully Paid'}
              </h3>
            </div>
            {membership && membership.dueAmount > 0 && (
              <button onClick={() => setShowRenewalModal(true)} className="btn-primary" style={{ width: 'auto', minHeight: '38px', padding: '0 14px' }}>
                Pay Dues
              </button>
            )}
          </div>

          <div className="mobile-card" style={{ margin: 0, padding: '14px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Past Payment Receipts ({studentPayments.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {studentPayments.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <span className="mono" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--brand-primary)' }}>{p.receiptNo}</span>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.paymentDate} • {p.method}</p>
                  </div>
                  <strong style={{ fontSize: '15px', color: 'var(--status-success)' }}>₹{p.amount}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Renewal Modal */}
      {showRenewalModal && (
        <BottomSheet
          isOpen={true}
          onClose={() => setShowRenewalModal(false)}
          title="Online Subscription Renewal"
          subtitle="Instant validity extension with UPI/GPay"
        >
          <form onSubmit={handleOnlineRenewal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Choose Plan</label>
              <select
                value={renewalPlanId}
                onChange={(e) => setRenewalPlanId(e.target.value)}
                className="form-select"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.durationDays} Days) - ₹{p.basePrice}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn-primary" style={{ minHeight: '48px', fontSize: '15px', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <CreditCard size={18} /> Pay & Extend Validity
            </button>
          </form>
        </BottomSheet>
      )}

      {/* Seat Transfer Modal */}
      {showTransferModal && (
        <BottomSheet
          isOpen={true}
          onClose={() => setShowTransferModal(false)}
          title="Request Seat Change"
          subtitle={`Current: Desk ${seat?.label || 'A-22'}`}
        >
          <form onSubmit={handleSeatTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Select Available Desk in {shift?.name.split(' ')[0]} Shift</label>
              <select
                value={targetSeatId}
                onChange={(e) => setTargetSeatId(e.target.value)}
                className="form-select"
                required
              >
                <option value="">-- Choose available desk --</option>
                {freeSeatsInShift.map(s => (
                  <option key={s.id} value={s.id}>
                    Desk {s.label} ({s.zone}) {s.powerSocket ? '⚡' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn-primary" style={{ minHeight: '48px', fontSize: '15px' }}>
              Confirm Seat Change
            </button>
          </form>
        </BottomSheet>
      )}
    </div>
  );
};
