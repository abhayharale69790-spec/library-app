import React from 'react';
import { useLibrary } from '../../state/libraryStore';
import { 
  QrCode, 
  CalendarCheck, 
  CreditCard, 
  Armchair, 
  Clock, 
  Sparkles, 
  BookOpen, 
  BellRing,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { getDaysRemaining } from '../../utils/dateMath';

interface StudentMobileHomeProps {
  onOpenQrPass: () => void;
  onOpenAttendance: () => void;
  onOpenPayments: () => void;
  onOpenSeatDetails: () => void;
}

export const StudentMobileHome: React.FC<StudentMobileHomeProps> = ({
  onOpenQrPass,
  onOpenAttendance,
  onOpenPayments,
  onOpenSeatDetails,
}) => {
  const {
    members,
    memberships,
    assignments,
    seats,
    shifts,
    attendance,
    currentBranch,
  } = useLibrary();

  // Primary active demo scholar (e.g. Rahul Patil or first active member)
  const currentStudent = members[0] || {
    id: 'mem-1',
    fullName: 'Rahul Patil',
    memberCode: '24L-MUM-1001',
    targetExam: 'UPSC Civil Services',
    joinedDate: '2026-08-01',
    status: 'ACTIVE',
  };

  const studentMembership = memberships.find(m => m.memberId === currentStudent.id) || {
    status: 'ACTIVE',
    endDate: '2026-09-12',
    dueAmount: 0,
    paidAmount: 2200,
    totalFee: 2200,
  };

  const studentAssignment = assignments.find(a => a.memberId === currentStudent.id && a.status === 'ACTIVE');
  const studentSeat = studentAssignment ? seats.find(s => s.id === studentAssignment.seatId) : null;
  const studentShift = studentAssignment ? shifts.find(s => s.id === studentAssignment.shiftId) : null;

  const todayAttendance = attendance.find(a => a.memberId === currentStudent.id);
  const isInside = todayAttendance?.status === 'INSIDE';

  const daysLeft = getDaysRemaining(studentMembership.endDate);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px', margin: '0 auto' }}>
      {/* 1. Header Greeting & Membership Status Card */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(15, 23, 42, 0.7))',
          border: '1px solid rgba(236, 72, 153, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 16px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--seat-my-seat)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Student Scholar Pass
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginTop: '2px', color: 'var(--text-primary)' }}>
              Good day, {currentStudent.fullName.split(' ')[0]} 📚
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              ID: <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{currentStudent.memberCode}</span> • {currentStudent.targetExam || 'Scholar'}
            </p>
          </div>
          <span className="badge badge-success" style={{ fontSize: '11px', padding: '4px 10px' }}>
            ● {studentMembership.status}
          </span>
        </div>

        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Validity: <strong style={{ color: 'var(--text-primary)' }}>{studentMembership.endDate}</strong> ({daysLeft} days left)
          </span>
          <span style={{ fontSize: '12px', color: studentMembership.dueAmount > 0 ? 'var(--status-danger)' : 'var(--status-success)', fontWeight: '700' }}>
            {studentMembership.dueAmount > 0 ? `Due: ₹${studentMembership.dueAmount}` : '✓ Fully Paid'}
          </span>
        </div>
      </div>

      {/* 2. MY SEAT Hero Card */}
      <div 
        className="mobile-card" 
        style={{ 
          margin: 0, 
          padding: '16px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), var(--bg-card))'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Armchair size={15} /> My Reserved Seat
          </span>
          <span className="badge badge-info">
            ● Active
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div 
              style={{
                width: '54px',
                height: '54px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--brand-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: '800',
                fontFamily: 'var(--font-mono)',
                boxShadow: '0 4px 14px var(--brand-glow)'
              }}
            >
              {studentSeat?.label || 'A-22'}
            </div>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '700' }}>
                {studentShift?.name || 'Morning Shift'}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Zone: <strong style={{ color: 'var(--text-primary)' }}>{studentSeat?.zone || 'AC Quiet'}</strong> • {currentBranch.name}
              </p>
            </div>
          </div>
          <button 
            className="btn-secondary"
            onClick={onOpenSeatDetails}
            style={{ fontSize: '12px', minHeight: '36px', padding: '0 12px' }}
          >
            Details
          </button>
        </div>
      </div>

      {/* 3. 3 Big Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <button
          className="quick-action-card"
          onClick={onOpenQrPass}
          style={{ background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), var(--bg-card))', borderColor: 'var(--brand-primary)' }}
        >
          <div className="quick-action-icon" style={{ background: 'var(--brand-primary)', color: '#ffffff' }}>
            <QrCode size={20} />
          </div>
          <span style={{ fontWeight: '700' }}>MY QR PASS</span>
        </button>

        <button
          className="quick-action-card"
          onClick={onOpenAttendance}
        >
          <div className="quick-action-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <CalendarCheck size={20} />
          </div>
          <span>ATTENDANCE</span>
        </button>

        <button
          className="quick-action-card"
          onClick={onOpenPayments}
        >
          <div className="quick-action-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <CreditCard size={20} />
          </div>
          <span>PAYMENT</span>
        </button>
      </div>

      {/* 4. TODAY'S STATUS */}
      <div className="mobile-card" style={{ margin: 0, padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} color="var(--brand-primary)" /> Today's Library Session
          </h3>
          <span className={`badge ${isInside ? 'badge-success' : 'badge-neutral'}`}>
            {isInside ? '● Currently Inside' : 'Outside Library'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div style={{ padding: '10px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Entry Timestamp</span>
            <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {todayAttendance?.checkInTime || '08:42 AM'}
            </p>
          </div>
          <div style={{ padding: '10px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Today Duration</span>
            <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {todayAttendance?.durationMinutes ? `${Math.floor(todayAttendance.durationMinutes / 60)}h ${todayAttendance.durationMinutes % 60}m` : '3h 15m'}
            </p>
          </div>
        </div>
      </div>

      {/* 5. ANNOUNCEMENTS */}
      <div className="mobile-card" style={{ margin: 0, padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BellRing size={16} color="var(--status-warning)" /> Notice Board
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Branch Notice</span>
        </div>
        <div style={{ padding: '10px 12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--brand-primary)' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
            🔇 Silent Hours strictly enforced in AC Quiet Zone
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            High-speed Wi-Fi 6 router upgraded on Floor 1. Please keep phone calls strictly in the terrace discussion lounge.
          </p>
        </div>
      </div>

      {/* 6. STUDY PROGRESS & COUNTDOWN */}
      <div className="mobile-card" style={{ margin: 0, padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#a855f7" /> Study Goals & Focus
          </h3>
          <span className="badge badge-info">{currentStudent.targetExam || 'UPSC'}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Monthly Study Attendance Target</span>
              <strong style={{ color: 'var(--status-success)' }}>24 / 28 Days (86%)</strong>
            </div>
            <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: 'var(--bg-surface-elevated)', overflow: 'hidden' }}>
              <div style={{ width: '86%', height: '100%', background: 'linear-gradient(90deg, #10b981, #3b82f6)', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
