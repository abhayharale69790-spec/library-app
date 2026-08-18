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
  ExternalLink
} from 'lucide-react';
import { getDaysRemaining, formatDateDisplay } from '../../utils/dateMath';

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
  } = useLibrary();

  // Branch-scoped calculations
  const branchMembers = members.filter(m => m.branchId === currentBranch.id);
  const branchSeats = seats.filter(s => s.branchId === currentBranch.id);
  
  // Expiry Buckets
  const expiring1to7Days: { member: typeof members[0]; membership: typeof memberships[0]; days: number }[] = [];
  const expiring8to15Days: { member: typeof members[0]; membership: typeof memberships[0]; days: number }[] = [];
  const expiredMembers: { member: typeof members[0]; membership: typeof memberships[0]; days: number }[] = [];

  branchMembers.forEach(member => {
    const msh = memberships.find(m => m.memberId === member.id && m.status !== 'CANCELLED');
    if (!msh) return;
    const days = getDaysRemaining(msh.endDate);

    if (days < 0 || msh.status === 'EXPIRED' || member.status === 'EXPIRED') {
      expiredMembers.push({ member, membership: msh, days });
    } else if (days >= 0 && days <= 7) {
      expiring1to7Days.push({ member, membership: msh, days });
    } else if (days >= 8 && days <= 15) {
      expiring8to15Days.push({ member, membership: msh, days });
    }
  });

  // Financials
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.filter(e => e.branchId === currentBranch.id).reduce((sum, e) => sum + e.amount, 0);
  const totalDues = memberships.filter(m => m.branchId === currentBranch.id).reduce((sum, m) => sum + m.dueAmount, 0);
  const netOperatingProfit = totalRevenue - totalExpenses;

  // Assigned seats in branch
  const activeAssignments = assignments.filter(
    a => a.branchId === currentBranch.id && a.status === 'ACTIVE'
  );

  const handleWhatsAppSend = (
    memberId: string,
    type: 'EXPIRY_REMINDER_7D' | 'EXPIRY_REMINDER_3D' | 'EXPIRY_TODAY'
  ) => {
    const { url } = sendWhatsAppNotification(memberId, type);
    window.open(url, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner Greeting */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>
            {currentBranch.name}
          </h1>
          <p style={{ fontSize: '13px', marginTop: '2px' }}>
            Real-time shift-aware seat allocation, access management & financial telemetry
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => onNavigate('seatmap')} className="btn btn-secondary btn-sm">
            <Armchair size={15} />
            <span>View Floor Map</span>
          </button>
          <button onClick={onOpenAddMember} className="btn btn-primary btn-sm">
            <span>+ Onboard Student</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {/* Total Members */}
        <div className="card card-hoverable" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL ENROLLED</span>
            <Users size={18} color="var(--brand-primary)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
            {branchMembers.length}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {branchMembers.filter(m => m.status === 'ACTIVE').length} Active Scholars
          </div>
        </div>

        {/* Live Occupancy */}
        <div className="card card-hoverable" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>LIVE OCCUPANCY</span>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--status-success)', boxShadow: '0 0 8px var(--status-success)' }} />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px', color: 'var(--status-success)' }}>
            {branchOccupancyRate}%
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {insideAttendanceCount} students inside right now
          </div>
        </div>

        {/* Expiring Soon (1-7 Days) */}
        <div 
          className="card card-hoverable" 
          style={{ 
            padding: '16px 20px', 
            borderColor: expiring1to7Days.length > 0 ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)',
            cursor: 'pointer',
          }}
          onClick={() => onNavigate('members')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-warning)' }}>EXPIRING (1–7 DAYS)</span>
            <AlertTriangle size={18} color="var(--status-warning)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px', color: 'var(--status-warning)' }}>
            {expiring1to7Days.length}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Requires renewal outreach
          </div>
        </div>

        {/* Outstanding Dues */}
        <div 
          className="card card-hoverable" 
          style={{ 
            padding: '16px 20px', 
            borderColor: totalDues > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)',
            cursor: 'pointer',
          }}
          onClick={() => onNavigate('payments')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-danger)' }}>PENDING DUES</span>
            <CreditCard size={18} color="var(--status-danger)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px', color: 'var(--status-danger)' }}>
            ₹{totalDues.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Across {memberships.filter(m => m.dueAmount > 0).length} overdue balances
          </div>
        </div>

        {/* Net Operating Profit */}
        <div className="card card-hoverable" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>REVENUE COLLECTED</span>
            <TrendingUp size={18} color="var(--status-info)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, marginTop: '8px', color: 'var(--text-primary)' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--status-success)', marginTop: '4px' }}>
            Net Margin: ₹{netOperatingProfit.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Main Grid: Expiry Action Center + Live Gate Stream */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: '20px',
      }}>
        {/* Left Column: Expiry Timeline & 1-Click WhatsApp Renewal Center */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>
                Membership Expiry Action Center
              </h2>
              <p style={{ fontSize: '12px' }}>
                Proactive student retention reminders via WhatsApp & direct phone
              </p>
            </div>
            <span className="badge badge-warning">
              {expiring1to7Days.length + expiring8to15Days.length} Expiring Soon
            </span>
          </div>

          {/* List of Expiring Members */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {expiring1to7Days.length === 0 && expiring8to15Days.length === 0 ? (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-muted)',
              }}>
                <CheckCircle2 size={32} color="var(--status-success)" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 600 }}>All Memberships are in good standing!</div>
                <div style={{ fontSize: '12px' }}>No expirations pending in the next 15 days.</div>
              </div>
            ) : (
              <>
                {expiring1to7Days.map(({ member, membership, days }) => {
                  const assignment = assignments.find(a => a.memberId === member.id && a.status === 'ACTIVE');
                  const seat = seats.find(s => s.id === assignment?.seatId);
                  const shift = shifts.find(s => s.id === membership.shiftId);

                  return (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: 'var(--bg-input)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        borderRadius: 'var(--radius-md)',
                        gap: '12px',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span 
                            onClick={() => onOpenMemberDetail(member.id)}
                            style={{ fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            {member.fullName}
                          </span>
                          <span className="badge badge-warning" style={{ fontSize: '10px' }}>
                            {days === 0 ? 'Expires TODAY' : `Expires in ${days} days`}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Seat: <strong style={{ color: 'var(--text-secondary)' }}>{seat?.label || 'Floating'}</strong> • Shift: {shift?.name.split(' (')[0]} • End: {formatDateDisplay(membership.endDate)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => handleWhatsAppSend(member.id, days <= 3 ? 'EXPIRY_REMINDER_3D' : 'EXPIRY_REMINDER_7D')}
                          className="btn btn-sm"
                          style={{
                            background: '#25D366',
                            color: '#ffffff',
                            border: 'none',
                            gap: '4px',
                            fontWeight: 600,
                          }}
                          title="Open WhatsApp with pre-filled renewal message"
                        >
                          <Send size={13} />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          onClick={() => onOpenMemberDetail(member.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          <span>Renew</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* 8-15 days */}
                {expiring8to15Days.map(({ member, membership, days }) => {
                  const assignment = assignments.find(a => a.memberId === member.id && a.status === 'ACTIVE');
                  const seat = seats.find(s => s.id === assignment?.seatId);

                  return (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'var(--bg-card-hover)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span 
                            onClick={() => onOpenMemberDetail(member.id)}
                            style={{ fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}
                          >
                            {member.fullName}
                          </span>
                          <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                            {days} days left
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Seat: {seat?.label || 'Unassigned'} • Expiry: {formatDateDisplay(membership.endDate)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleWhatsAppSend(member.id, 'EXPIRY_REMINDER_7D')}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#25D366' }}
                      >
                        <Send size={12} />
                        <span>Nudge</span>
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Right Column: Live Gate Hardware Activity Stream */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700 }}>
                Live Gate Activity Stream
              </h2>
              <p style={{ fontSize: '12px' }}>
                Recent QR turnstile scans & access validation logs
              </p>
            </div>
            <button onClick={() => onNavigate('gate')} className="btn btn-ghost btn-sm" style={{ gap: '4px' }}>
              <span>Open Gate UI</span>
              <ExternalLink size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
            {accessLogs.slice(0, 8).map((log) => {
              const isAllowed = log.result === 'ALLOWED';
              const isCheckOut = log.reason.includes('CHECK_OUT');

              return (
                <div
                  key={log.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-input)',
                    borderLeft: `4px solid ${isAllowed ? (isCheckOut ? 'var(--status-info)' : 'var(--status-success)') : 'var(--status-danger)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                        {log.memberName || log.memberCode || 'Anonymous / QR Token'}
                      </span>
                      <span className={`badge ${isAllowed ? (isCheckOut ? 'badge-info' : 'badge-success') : 'badge-danger'}`} style={{ fontSize: '9.5px' }}>
                        {isAllowed ? (isCheckOut ? 'CHECK-OUT' : 'CHECK-IN') : 'BLOCKED'}
                      </span>
                    </div>
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {log.timestamp.split(' ')[1] || log.timestamp}
                    </span>
                  </div>

                  <div style={{ fontSize: '11.5px', color: isAllowed ? 'var(--text-secondary)' : 'var(--status-danger)' }}>
                    {log.reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Shifts Breakdown Grid */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>
              Shift-Specific Seat Allocation & Pricing Matrix
            </h2>
            <p style={{ fontSize: '12px' }}>
              Time-multiplexed physical seat inventory across daily shifts
            </p>
          </div>
          <button onClick={() => onNavigate('shifts')} className="btn btn-secondary btn-sm">
            Manage Shifts
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
        }}>
          {shifts.map(shift => {
            const shiftAssignments = assignments.filter(
              a => a.branchId === currentBranch.id && a.shiftId === shift.id && a.status === 'ACTIVE'
            );
            const occupancyPct = branchSeats.length > 0 
              ? Math.round((shiftAssignments.length / branchSeats.length) * 100)
              : 0;

            return (
              <div
                key={shift.id}
                style={{
                  padding: '14px',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: shift.color,
                    }} />
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>
                      {shift.name.split(' (')[0]}
                    </span>
                  </div>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {shift.startTime} - {shift.endTime}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800 }}>
                    {shiftAssignments.length} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>/ {branchSeats.length} Seats</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: shift.color }}>
                    {occupancyPct}% Booked
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{
                  height: '6px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-surface-elevated)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${occupancyPct}%`,
                    height: '100%',
                    backgroundColor: shift.color,
                    borderRadius: 'var(--radius-full)',
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Price: ₹{shift.defaultPrice.toLocaleString('en-IN')}/mo</span>
                  <span>{branchSeats.length - shiftAssignments.length} Free</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
