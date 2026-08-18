import React from 'react';
import { useLibrary } from '../../state/libraryStore';
import {
  Users,
  Armchair,
  CreditCard,
  AlertTriangle,
  Send,
  CheckCircle2,
  Clock,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  Plus,
  QrCode,
  DollarSign,
  Grid
} from 'lucide-react';
import { getDaysRemaining, formatDateDisplay } from '../../utils/dateMath';
import { StaffMobileHome } from './StaffMobileHome';
import { StudentMobileHome } from '../memberportal/StudentMobileHome';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
  onOpenMemberDetail: (memberId: string) => void;
  onOpenAddMember: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  onOpenMemberDetail,
  onOpenAddMember,
}) => {
  const {
    businessProfile,
    currentBranch,
    members,
    memberships,
    assignments,
    seats,
    shifts,
    payments,
    expenses,
    attendance,
    accessLogs,
    insideAttendanceCount,
    branchOccupancyRate,
    sendWhatsAppNotification,
    activeRole,
  } = useLibrary();

  // Role-Specific Mobile-First Experiences
  if (activeRole === 'STAFF') {
    return (
      <StaffMobileHome
        onNavigate={onNavigate}
        onOpenAddMember={onOpenAddMember}
        onOpenMemberDetail={onOpenMemberDetail}
      />
    );
  }

  if (activeRole === 'STUDENT') {
    return (
      <StudentMobileHome
        onOpenQrPass={() => onNavigate('gate')}
        onOpenAttendance={() => onNavigate('studentportal')}
        onOpenPayments={() => onNavigate('payments')}
        onOpenSeatDetails={() => onNavigate('seatmap')}
      />
    );
  }

  // Branch-scoped calculations
  const branchMembers = members.filter(m => m.branchId === currentBranch.id);
  const branchSeats = seats.filter(s => s.branchId === currentBranch.id);
  
  // Expiry Buckets
  const expiring1to7Days: { member: typeof members[0]; membership: typeof memberships[0]; days: number }[] = [];
  const expiredMembers: { member: typeof members[0]; membership: typeof memberships[0]; days: number }[] = [];

  branchMembers.forEach(member => {
    const msh = memberships.find(m => m.memberId === member.id && m.status !== 'CANCELLED');
    if (!msh) return;
    const days = getDaysRemaining(msh.endDate);

    if (days < 0 || msh.status === 'EXPIRED' || member.status === 'EXPIRED') {
      expiredMembers.push({ member, membership: msh, days });
    } else if (days >= 0 && days <= 7) {
      expiring1to7Days.push({ member, membership: msh, days });
    }
  });

  // Financials
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.filter(e => e.branchId === currentBranch.id).reduce((sum, e) => sum + e.amount, 0);
  const totalDues = memberships.filter(m => m.branchId === currentBranch.id).reduce((sum, m) => sum + m.dueAmount, 0);
  const netOperatingProfit = totalRevenue - totalExpenses;

  const handleWhatsApp = (memberId: string, type: 'EXPIRY_REMINDER_7D' | 'EXPIRY_REMINDER_3D' | 'EXPIRY_TODAY') => {
    const { url } = sendWhatsAppNotification(memberId, type);
    window.open(url, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* 1. Mobile-First Home view on small screens */}
      <div className="mobile-only-block">
        <StaffMobileHome
          onNavigate={onNavigate}
          onOpenAddMember={onOpenAddMember}
          onOpenMemberDetail={onOpenMemberDetail}
        />
      </div>

      {/* 2. Desktop-Enhanced Operations Dashboard (>=1024px) */}
      <div className="desktop-only-block" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Top Header Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800 }}>
              {businessProfile.name || 'Executive Operations Dashboard'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {currentBranch.name} • {branchMembers.length} Scholars Enrolled • {branchSeats.length} Physical Desks
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => onNavigate('gate')} className="btn-secondary" style={{ width: 'auto', minHeight: '38px', padding: '0 14px' }}>
              <QrCode size={16} /> Gate Scanner
            </button>
            <button onClick={onOpenAddMember} className="btn-primary" style={{ width: 'auto', minHeight: '38px', padding: '0 14px' }}>
              <Plus size={16} /> New Admission
            </button>
          </div>
        </div>

        {/* Top 4 Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          <div className="mobile-card" style={{ margin: 0, padding: '16px', borderLeft: '4px solid var(--brand-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Students Inside</span>
              <Users size={18} color="var(--brand-primary)" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: 'var(--text-primary)', marginTop: '6px' }}>
              {insideAttendanceCount}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{branchOccupancyRate}% current occupancy</span>
          </div>

          <div className="mobile-card" style={{ margin: 0, padding: '16px', borderLeft: '4px solid var(--status-success)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Available Desks</span>
              <Armchair size={18} color="var(--status-success)" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: 'var(--status-success)', marginTop: '6px' }}>
              {Math.max(0, branchSeats.length - insideAttendanceCount)}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Out of {branchSeats.length} total seats</span>
          </div>

          <div className="mobile-card" style={{ margin: 0, padding: '16px', borderLeft: '4px solid var(--status-success)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Collections</span>
              <DollarSign size={18} color="var(--status-success)" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: 'var(--status-success)', marginTop: '6px' }}>
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{payments.length} verified receipts</span>
          </div>

          <div className="mobile-card" style={{ margin: 0, padding: '16px', borderLeft: '4px solid var(--status-danger)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Outstanding Dues</span>
              <CreditCard size={18} color="var(--status-danger)" />
            </div>
            <div style={{ fontSize: '26px', fontWeight: '900', color: totalDues > 0 ? 'var(--status-danger)' : 'var(--status-success)', marginTop: '6px' }}>
              ₹{totalDues.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Follow-up required</span>
          </div>
        </div>

        {/* Active Shifts Table */}
        <div className="mobile-card" style={{ margin: 0, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Active Shift Utilization</h3>
            <button onClick={() => onNavigate('shifts')} className="btn-secondary" style={{ width: 'auto', minHeight: '30px', fontSize: '12px', padding: '0 10px' }}>
              Configure Shifts
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${shifts.filter(s => s.branchId === currentBranch.id).length || 1}, 1fr)`, gap: '12px' }}>
            {shifts.filter(s => s.branchId === currentBranch.id).map(shift => {
              const shiftAssignments = assignments.filter(a => a.shiftId === shift.id && a.status === 'ACTIVE');
              const shiftOccupancy = Math.min(100, Math.round((shiftAssignments.length / (branchSeats.length || 1)) * 100));

              return (
                <div key={shift.id} style={{ padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{shift.name}</strong>
                    <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{shift.startTime} - {shift.endTime}</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '800', marginTop: '6px', color: 'var(--brand-primary)' }}>
                    {shiftAssignments.length} / {branchSeats.length} Desks
                  </div>
                  <div style={{ height: '4px', background: 'var(--border-medium)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${shiftOccupancy}%`, background: 'var(--brand-primary)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
