import React, { useState } from 'react';
import { useLibrary } from '../../state/libraryStore';
import { 
  QrCode, 
  UserPlus, 
  LogIn, 
  LogOut, 
  Armchair, 
  AlertTriangle, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Building2,
  Grid
} from 'lucide-react';
import { getDaysRemaining } from '../../utils/dateMath';

interface StaffMobileHomeProps {
  onNavigate: (view: string) => void;
  onOpenAddMember: () => void;
  onOpenMemberDetail: (memberId: string) => void;
}

export const StaffMobileHome: React.FC<StaffMobileHomeProps> = ({
  onNavigate,
  onOpenAddMember,
  onOpenMemberDetail,
}) => {
  const {
    businessProfile,
    currentBranch,
    shifts,
    seats,
    members,
    memberships,
    attendance,
    payments,
    accessLogs,
    simulatedClockTime,
    insideAttendanceCount,
  } = useLibrary();

  // Find active shift
  const currentActiveShift = shifts.find(s => {
    if (s.branchId !== currentBranch.id) return false;
    if (s.startTime === '00:00' && s.endTime === '23:59') return false;
    const [nowH, nowM] = simulatedClockTime.split(':').map(n => parseInt(n, 10));
    const nowMin = nowH * 60 + nowM;
    const [sH, sM] = s.startTime.split(':').map(n => parseInt(n, 10));
    const [eH, eM] = s.endTime.split(':').map(n => parseInt(n, 10));
    const sMin = sH * 60 + sM;
    const eMin = eH * 60 + eM;
    if (eMin <= sMin) {
      return nowMin >= sMin || nowMin <= eMin;
    }
    return nowMin >= sMin && nowMin <= eMin;
  });

  const branchSeats = seats.filter(s => s.branchId === currentBranch.id);
  const totalSeats = branchSeats.length || 36;
  const occupiedCount = insideAttendanceCount;
  const availableSeats = Math.max(0, totalSeats - occupiedCount);

  // Financial collection for today
  const todayCollections = payments
    .filter(p => p.paymentDate.startsWith('2026-08') || p.paymentDate.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDueAmount = memberships
    .filter(m => m.branchId === currentBranch.id)
    .reduce((sum, m) => sum + m.dueAmount, 0);

  // Alerts
  const expiringMemberships = memberships.filter(m => {
    if (m.status !== 'ACTIVE' && m.status !== 'EXPIRING') return false;
    const days = getDaysRemaining(m.endDate);
    return days >= 0 && days <= 3;
  });

  const pendingPayments = memberships.filter(m => m.dueAmount > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px', margin: '0 auto' }}>
      {/* 1. Header Greeting & Business Name */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(15, 23, 42, 0.6))',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {businessProfile.name || 'Study Center'} • {currentBranch.name.split(' - ')[0]}
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginTop: '2px', color: 'var(--text-primary)' }}>
            Good day, Reception Desk 👋
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Active Shift: <strong style={{ color: 'var(--brand-primary)' }}>{currentActiveShift?.name.split(' ')[0] || 'Regular Shift'}</strong>
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--brand-primary)' }}>
            {simulatedClockTime}
          </div>
          <span className="badge badge-success" style={{ fontSize: '10px' }}>
            ● Gate Active
          </span>
        </div>
      </div>

      {/* 2. Today's 4 Operations Snapshot Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <div className="mobile-card" style={{ margin: 0, padding: '14px', borderLeft: '4px solid var(--brand-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Students Inside</span>
            <Users size={16} color="var(--brand-primary)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', marginTop: '4px' }}>
            {insideAttendanceCount}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Currently studying</span>
        </div>

        <div className="mobile-card" style={{ margin: 0, padding: '14px', borderLeft: '4px solid var(--status-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Desks</span>
            <Armchair size={16} color="var(--status-success)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--status-success)', marginTop: '4px' }}>
            {availableSeats}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Out of {totalSeats} desks</span>
        </div>

        <div className="mobile-card" style={{ margin: 0, padding: '14px', borderLeft: '4px solid var(--status-success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Today Collection</span>
            <DollarSign size={16} color="var(--status-success)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: 'var(--status-success)', marginTop: '4px' }}>
            ₹{todayCollections.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Verified receipts</span>
        </div>

        <div className="mobile-card" style={{ margin: 0, padding: '14px', borderLeft: '4px solid var(--status-danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Due Amount</span>
            <CreditCard size={16} color="var(--status-danger)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: totalDueAmount > 0 ? 'var(--status-danger)' : 'var(--status-success)', marginTop: '4px' }}>
            ₹{totalDueAmount.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{pendingPayments.length} scholars pending</span>
        </div>
      </div>

      {/* 3. Four Core Action Buttons */}
      <div>
        <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
          What Action Should I Take?
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <button
            onClick={() => onNavigate('gate')}
            className="quick-action-card"
            style={{
              margin: 0,
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), var(--bg-card))',
              border: '1.5px solid var(--brand-primary)',
              minHeight: '74px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <QrCode size={22} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>SCAN QR</span>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Optical turnstile gate</p>
            </div>
          </button>

          <button
            onClick={onOpenAddMember}
            className="quick-action-card"
            style={{
              margin: 0,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), var(--bg-card))',
              border: '1.5px solid var(--status-success)',
              minHeight: '74px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--status-success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserPlus size={22} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>ADD STUDENT</span>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>4-step quick wizard</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('payments')}
            className="quick-action-card"
            style={{
              margin: 0,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              minHeight: '74px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <DollarSign size={22} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>COLLECT FEE</span>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Issue digital receipt</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('seatmap')}
            className="quick-action-card"
            style={{
              margin: 0,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              minHeight: '74px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Grid size={22} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>VIEW SEATS</span>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Shift desk matrix</p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Actionable Alerts (What does this student need?) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Today's Urgent Tasks ({expiringMemberships.length + pendingPayments.length})
        </h3>

        {expiringMemberships.length > 0 && (
          <div 
            onClick={() => onNavigate('members')}
            className="mobile-card mobile-card-interactive"
            style={{
              margin: 0,
              padding: '12px',
              background: 'rgba(245, 158, 11, 0.08)',
              borderColor: 'rgba(245, 158, 11, 0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} color="var(--status-warning)" />
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--status-warning)' }}>
                  {expiringMemberships.length} Memberships Expiring in ≤3 Days
                </strong>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Send WhatsApp renewal reminders to keep seats reserved
                </p>
              </div>
            </div>
            <ChevronRight size={18} color="var(--status-warning)" />
          </div>
        )}

        {pendingPayments.length > 0 && (
          <div 
            onClick={() => onNavigate('payments')}
            className="mobile-card mobile-card-interactive"
            style={{
              margin: 0,
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.08)',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <DollarSign size={20} color="var(--status-danger)" />
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--status-danger)' }}>
                  {pendingPayments.length} Outstanding Due Balances (₹{totalDueAmount.toLocaleString('en-IN')})
                </strong>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Tap to record installment payments
                </p>
              </div>
            </div>
            <ChevronRight size={18} color="var(--status-danger)" />
          </div>
        )}
      </div>

      {/* 5. Recent Turnstile Entries Feed */}
      <div className="mobile-card" style={{ margin: 0, padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Live Attendance Activity
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--brand-primary)', fontWeight: '600', cursor: 'pointer' }} onClick={() => onNavigate('gate')}>
            View Gate Scanner &rarr;
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {accessLogs.slice(-3).reverse().map(log => (
            <div 
              key={log.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: log.result === 'ALLOWED' ? 'var(--status-success)' : 'var(--status-danger)' }} />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600' }}>{log.memberName || log.memberCode || 'Unknown Student'}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.reason}</p>
                </div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {log.timestamp.split('T')[1]?.slice(0, 5) || 'Just now'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
