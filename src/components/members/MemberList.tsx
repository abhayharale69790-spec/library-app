import React, { useState } from 'react';
import { useLibrary } from '../../state/libraryStore';
import { Member } from '../../types';
import {
  Search,
  Plus,
  Users,
  AlertTriangle,
  CreditCard,
  Send,
  Armchair,
  CheckCircle2,
  Filter,
  UserCheck
} from 'lucide-react';
import { formatDateDisplay, getDaysRemaining } from '../../utils/dateMath';

interface MemberListProps {
  onOpenAddMember: () => void;
  onOpenMemberDetail: (memberId: string) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  onOpenAddMember,
  onOpenMemberDetail,
}) => {
  const {
    currentBranch,
    members,
    memberships,
    assignments,
    seats,
    shifts,
    attendance,
    sendWhatsAppNotification,
    manualCheckInOut,
  } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ACTIVE' | 'EXPIRING_1_7' | 'EXPIRING_8_15' | 'EXPIRED' | 'OVERDUE'>('ALL');

  const branchMembers = members.filter(m => m.branchId === currentBranch.id);

  // Apply Search & Badges Filter
  const filteredMembers = branchMembers.filter(member => {
    const msh = memberships.find(m => m.memberId === member.id && m.status !== 'CANCELLED');
    const daysLeft = msh ? getDaysRemaining(msh.endDate) : 0;
    const isOverdue = (msh?.dueAmount || 0) > 0;

    // Filter Type Logic
    if (filterType === 'ACTIVE' && (member.status !== 'ACTIVE' || daysLeft < 0)) return false;
    if (filterType === 'EXPIRING_1_7' && (daysLeft < 0 || daysLeft > 7)) return false;
    if (filterType === 'EXPIRING_8_15' && (daysLeft < 8 || daysLeft > 15)) return false;
    if (filterType === 'EXPIRED' && (daysLeft >= 0 && member.status !== 'EXPIRED')) return false;
    if (filterType === 'OVERDUE' && !isOverdue) return false;

    // Search Query Match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = member.fullName.toLowerCase().includes(q);
      const matchCode = member.memberCode.toLowerCase().includes(q);
      const matchPhone = member.phone.includes(q);
      const matchExam = (member.targetExam || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchPhone && !matchExam) return false;
    }

    return true;
  });

  const handleWhatsApp = (memberId: string, daysLeft: number) => {
    const { url } = sendWhatsAppNotification(memberId, daysLeft <= 3 ? 'EXPIRY_REMINDER_3D' : 'EXPIRY_REMINDER_7D');
    window.open(url, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>
            Scholar Directory
          </h1>
          <p style={{ fontSize: '13px', marginTop: '2px' }}>
            Manage student registrations, reserved seats, fees, and validity
          </p>
        </div>

        <button onClick={onOpenAddMember} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
          <Plus size={16} />
          <span>New Admission</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{
            position: 'relative',
            flex: 1,
            minWidth: '240px',
          }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by student name, phone, code (e.g. 24L-MUM), exam..."
              className="form-control"
              style={{ paddingLeft: '36px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Quick Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
            {[
              { id: 'ALL', label: 'All Scholars' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'EXPIRING_1_7', label: 'Expiring <7d' },
              { id: 'EXPIRING_8_15', label: 'Expiring 8-15d' },
              { id: 'EXPIRED', label: 'Expired' },
              { id: 'OVERDUE', label: 'Pending Dues' },
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => setFilterType(chip.id as unknown as typeof filterType)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: filterType === chip.id ? '1px solid var(--brand-primary)' : '1px solid var(--border-medium)',
                  background: filterType === chip.id ? 'var(--brand-primary)' : 'var(--bg-input)',
                  color: filterType === chip.id ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: filterType === chip.id ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{
                background: 'var(--bg-surface-elevated)',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                textAlign: 'left',
                fontSize: '11.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                <th style={{ padding: '12px 16px' }}>Scholar</th>
                <th style={{ padding: '12px 16px' }}>Shift & Desk</th>
                <th style={{ padding: '12px 16px' }}>Validity & Status</th>
                <th style={{ padding: '12px 16px' }}>Fee Balance</th>
                <th style={{ padding: '12px 16px' }}>Inside Now</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No scholars found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => {
                  const msh = memberships.find(m => m.memberId === member.id && m.status !== 'CANCELLED');
                  const asgn = assignments.find(a => a.memberId === member.id && a.status === 'ACTIVE');
                  const seat = seats.find(s => s.id === asgn?.seatId);
                  const shift = shifts.find(s => s.id === msh?.shiftId);
                  const daysLeft = msh ? getDaysRemaining(msh.endDate) : 0;
                  const isInside = attendance.some(a => a.memberId === member.id && a.status === 'INSIDE' && a.date === new Date().toISOString().split('T')[0]);

                  return (
                    <tr
                      key={member.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Scholar Info */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-medium)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--brand-primary)',
                          }}>
                            {member.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div
                              onClick={() => onOpenMemberDetail(member.id)}
                              style={{ fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                            >
                              {member.fullName}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              <span className="mono">{member.memberCode}</span> • {member.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Shift & Seat */}
                      <td style={{ padding: '14px 16px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Armchair size={13} color="var(--brand-primary)" />
                            <strong style={{ color: 'var(--text-primary)' }}>{seat?.label || 'Floating'}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({seat?.zone || 'General'})</span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: shift?.color || 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>
                            {shift?.name.split(' (')[0]}
                          </div>
                        </div>
                      </td>

                      {/* Validity */}
                      <td style={{ padding: '14px 16px' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>
                            Till {formatDateDisplay(msh?.endDate || '')}
                          </div>
                          <span className={`badge ${daysLeft <= 0 ? 'badge-danger' : daysLeft <= 7 ? 'badge-warning' : 'badge-success'}`} style={{ marginTop: '4px', fontSize: '9.5px' }}>
                            {daysLeft < 0 ? `Expired (${Math.abs(daysLeft)}d ago)` : daysLeft === 0 ? 'Expires Today' : `${daysLeft} days left`}
                          </span>
                        </div>
                      </td>

                      {/* Fee Balance */}
                      <td style={{ padding: '14px 16px' }}>
                        <div>
                          {(msh?.dueAmount || 0) > 0 ? (
                            <span style={{ fontWeight: 700, color: 'var(--status-danger)' }}>
                              ₹{msh?.dueAmount.toLocaleString('en-IN')} Due
                            </span>
                          ) : (
                            <span style={{ fontWeight: 600, color: 'var(--status-success)' }}>
                              ✓ Paid
                            </span>
                          )}
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Fee: ₹{msh?.totalFee.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </td>

                      {/* Inside Now */}
                      <td style={{ padding: '14px 16px' }}>
                        {isInside ? (
                          <span className="badge badge-success" style={{ gap: '4px' }}>
                            <UserCheck size={12} />
                            INSIDE
                          </span>
                        ) : (
                          <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                            OUTSIDE
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => handleWhatsApp(member.id, daysLeft)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: '#25D366', padding: '5px' }}
                            title="Send WhatsApp Nudge"
                          >
                            <Send size={14} />
                          </button>

                          <button
                            onClick={() => onOpenMemberDetail(member.id)}
                            className="btn btn-secondary btn-sm"
                          >
                            Profile
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
