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
  TrendingUp
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

  // Alerts
  const expiringMemberships = memberships.filter(m => {
    if (m.status !== 'ACTIVE' && m.status !== 'EXPIRING') return false;
    const days = getDaysRemaining(m.endDate);
    return days >= 0 && days <= 3;
  });

  const pendingPayments = memberships.filter(m => m.dueAmount > 0);
  const unassignedMembers = members.filter(m => m.branchId === currentBranch.id && m.status === 'ACTIVE').slice(0, 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px', margin: '0 auto' }}>
      {/* 1. Header Greeting & Current Shift */}
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
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Staff On Duty • {currentBranch.name}
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginTop: '2px', color: 'var(--text-primary)' }}>
            Good day, Reception Kiosk 👋
          </h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="badge badge-info" style={{ fontSize: '11px', padding: '4px 10px' }}>
            <Clock size={12} /> {currentActiveShift ? currentActiveShift.name.split(' ')[0] : 'General'} Shift
          </span>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            {simulatedClockTime} (Live)
          </p>
        </div>
      </div>

      {/* 2. Live Status KPI Grid (4 Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <div className="mobile-card" style={{ margin: 0, padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Inside Now</span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-success)', boxShadow: '0 0 6px var(--status-success)' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {occupiedCount}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--status-success)', fontWeight: '600' }}>
            Active in Hall
          </span>
        </div>

        <div className="mobile-card" style={{ margin: 0, padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Available</span>
            <Armchair size={15} color="var(--brand-primary)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {availableSeats}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            of {totalSeats} Desks
          </span>
        </div>

        <div className="mobile-card" style={{ margin: 0, padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Occupancy</span>
            <TrendingUp size={15} color="var(--status-warning)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {Math.round((occupiedCount / totalSeats) * 100)}%
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {occupiedCount} / {totalSeats} filled
          </span>
        </div>

        <div className="mobile-card" style={{ margin: 0, padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Collections</span>
            <DollarSign size={15} color="var(--status-success)" />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>
            ₹{todayCollections.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--status-success)', fontWeight: '600' }}>
            Settled Dues
          </span>
        </div>
      </div>

      {/* 3. Big Mobile Quick Actions (Grid of 5 Large Buttons) */}
      <div>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '10px' }}>
          Quick Actions
        </h3>
        
        {/* Main Big Action: Scan QR */}
        <button
          onClick={() => onNavigate('gate')}
          className="btn-primary"
          style={{
            minHeight: '56px',
            fontSize: '16px',
            fontWeight: '700',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '10px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
          }}
        >
          <QrCode size={22} /> SCAN STUDENT QR PASS
        </button>

        {/* 4 Secondary Quick Actions Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <button
            className="quick-action-card"
            onClick={() => onNavigate('gate')}
          >
            <div className="quick-action-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <LogIn size={20} />
            </div>
            <span>Manual Check-In</span>
          </button>

          <button
            className="quick-action-card"
            onClick={() => onNavigate('gate')}
          >
            <div className="quick-action-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <LogOut size={20} />
            </div>
            <span>Manual Check-Out</span>
          </button>

          <button
            className="quick-action-card"
            onClick={() => onNavigate('seatmap')}
          >
            <div className="quick-action-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <Armchair size={20} />
            </div>
            <span>Assign / Free Seat</span>
          </button>

          <button
            className="quick-action-card"
            onClick={onOpenAddMember}
            style={{ border: '1px dashed var(--brand-primary)' }}
          >
            <div className="quick-action-icon" style={{ background: 'var(--brand-primary)', color: '#ffffff' }}>
              <UserPlus size={20} />
            </div>
            <span style={{ color: 'var(--brand-primary)' }}>+ Add New Member</span>
          </button>
        </div>
      </div>

      {/* 4. Today's Urgent Alerts */}
      <div className="mobile-card" style={{ margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} color="var(--status-warning)" /> Today's Alerts
          </h3>
          <span className="badge badge-warning">{expiringMemberships.length + pendingPayments.length} Action Items</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {expiringMemberships.length > 0 && (
            <div 
              onClick={() => onNavigate('members')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: 'var(--status-warning-bg)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--status-warning)' }}>
                  ⚠️ {expiringMemberships.length} memberships expiring in &le; 3 days
                </span>
              </div>
              <ChevronRight size={16} color="var(--status-warning)" />
            </div>
          )}

          {pendingPayments.length > 0 && (
            <div 
              onClick={() => onNavigate('payments')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: 'var(--status-danger-bg)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--status-danger)' }}>
                  💳 {pendingPayments.length} pending fee settlements
                </span>
              </div>
              <ChevronRight size={16} color="var(--status-danger)" />
            </div>
          )}

          {expiringMemberships.length === 0 && pendingPayments.length === 0 && (
            <p style={{ fontSize: '13px', color: 'var(--status-success)', textAlign: 'center', padding: '10px' }}>
              ✓ All memberships and fees are up to date!
            </p>
          )}
        </div>
      </div>

      {/* 5. Recent Turnstile Activity Feed */}
      <div className="mobile-card" style={{ margin: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} color="var(--brand-primary)" /> Recent Activity
          </h3>
          <button 
            className="btn-ghost" 
            onClick={() => onNavigate('gate')}
            style={{ fontSize: '12px', padding: '4px 8px', minHeight: '30px' }}
          >
            Gate Logs &rarr;
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {accessLogs.slice(-4).reverse().map((log) => (
            <div 
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span 
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: log.result === 'ALLOWED' ? 'var(--status-success)' : 'var(--status-danger)'
                  }} 
                />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {log.memberName || log.memberCode || 'Visitor'}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {log.reason}
                  </p>
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
