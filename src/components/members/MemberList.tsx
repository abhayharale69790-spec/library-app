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
  UserCheck,
  ChevronRight,
  Phone,
  MessageSquare
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
  const [filterType, setFilterType] = useState<'ALL' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'OVERDUE'>('ALL');

  const branchMembers = members.filter(m => m.branchId === currentBranch.id);

  // Apply Search & Badges Filter
  const filteredMembers = branchMembers.filter(member => {
    const msh = memberships.find(m => m.memberId === member.id && m.status !== 'CANCELLED');
    const daysLeft = msh ? getDaysRemaining(msh.endDate) : 0;
    const isOverdue = (msh?.dueAmount || 0) > 0;

    // Filter Type Logic
    if (filterType === 'ACTIVE' && (member.status !== 'ACTIVE' || daysLeft < 0)) return false;
    if (filterType === 'EXPIRING' && (daysLeft < 0 || daysLeft > 7)) return false;
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

  // Calculate quick stats
  const activeCount = branchMembers.filter(m => m.status === 'ACTIVE').length;
  const expiringCount = branchMembers.filter(m => {
    const msh = memberships.find(x => x.memberId === m.id);
    const d = msh ? getDaysRemaining(msh.endDate) : -1;
    return d >= 0 && d <= 7;
  }).length;
  const overdueCount = branchMembers.filter(m => {
    const msh = memberships.find(x => x.memberId === m.id);
    return (msh?.dueAmount || 0) > 0;
  }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* 1. Header & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800 }}>
            Scholar Directory
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {branchMembers.length} scholars enrolled in {currentBranch.name}
          </p>
        </div>

        <button 
          onClick={onOpenAddMember} 
          className="btn-primary"
          style={{ width: 'auto', minHeight: '40px', padding: '0 16px', fontSize: '13px' }}
        >
          <Plus size={16} /> + New Member
        </button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search student name, ID, phone, or exam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '38px', minHeight: '44px', fontSize: '14px' }}
          />
        </div>

        {/* Filter Pills */}
        <div className="pill-selector">
          {[
            { id: 'ALL', label: `All (${branchMembers.length})` },
            { id: 'ACTIVE', label: `Active (${activeCount})` },
            { id: 'EXPIRING', label: `Expiring (${expiringCount})` },
            { id: 'OVERDUE', label: `Due (${overdueCount})` },
            { id: 'EXPIRED', label: 'Expired' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`pill-item ${filterType === f.id ? 'active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Mobile Card List (Transformed from table on mobile) */}
      <div className="mobile-cards-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredMembers.map(member => {
            const msh = memberships.find(m => m.memberId === member.id && m.status !== 'CANCELLED');
            const assignment = assignments.find(a => a.memberId === member.id && a.status === 'ACTIVE');
            const seat = assignment ? seats.find(s => s.id === assignment.seatId) : undefined;
            const shift = assignment ? shifts.find(s => s.id === assignment.shiftId) : undefined;
            const daysLeft = msh ? getDaysRemaining(msh.endDate) : 0;
            const isInside = attendance.some(a => a.memberId === member.id && a.status === 'INSIDE');

            return (
              <div
                key={member.id}
                onClick={() => onOpenMemberDetail(member.id)}
                className="mobile-card mobile-card-interactive"
                style={{
                  margin: 0,
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* Top Row: Avatar + Name + Expiry Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div 
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--brand-primary), #1d4ed8)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '15px',
                        flexShrink: 0
                      }}
                    >
                      {member.fullName.charAt(0)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {member.fullName}
                        </h4>
                        {isInside && (
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--status-success)', boxShadow: '0 0 6px var(--status-success)' }} title="Inside Library" />
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span className="mono" style={{ color: 'var(--text-secondary)' }}>{member.memberCode}</span> • {member.targetExam || 'General'}
                      </p>
                    </div>
                  </div>

                  <span className={`badge ${daysLeft <= 3 ? 'badge-warning' : daysLeft < 0 ? 'badge-danger' : 'badge-success'}`}>
                    {daysLeft < 0 ? 'Expired' : `${daysLeft}d left`}
                  </span>
                </div>

                {/* Middle Info Badges: Seat & Shift & Payment */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  {seat ? (
                    <span className="badge badge-info">
                      Desk {seat.label} ({shift?.name.split(' ')[0] || 'Shift'})
                    </span>
                  ) : (
                    <span className="badge badge-neutral">No Seat</span>
                  )}

                  {msh && msh.dueAmount > 0 ? (
                    <span className="badge badge-danger">
                      Due: ₹{msh.dueAmount}
                    </span>
                  ) : (
                    <span className="badge badge-success">
                      ✓ Paid
                    </span>
                  )}

                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={11} /> {member.phone}
                  </span>
                </div>

                {/* Bottom Row Action Tag */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Joined: {member.joinedDate}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--brand-primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    View Profile <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Desktop Data Table */}
      <div className="desktop-table-container">
        <div className="mobile-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Scholar</th>
                <th>Member Code</th>
                <th>Seat & Shift</th>
                <th>Validity & Status</th>
                <th>Payment State</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(member => {
                const msh = memberships.find(m => m.memberId === member.id && m.status !== 'CANCELLED');
                const assignment = assignments.find(a => a.memberId === member.id && a.status === 'ACTIVE');
                const seat = assignment ? seats.find(s => s.id === assignment.seatId) : undefined;
                const shift = assignment ? shifts.find(s => s.id === assignment.shiftId) : undefined;
                const daysLeft = msh ? getDaysRemaining(msh.endDate) : 0;
                const isInside = attendance.some(a => a.memberId === member.id && a.status === 'INSIDE');

                return (
                  <tr key={member.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                          {member.fullName.charAt(0)}
                        </div>
                        <div>
                          <strong>{member.fullName}</strong>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{member.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="mono">{member.memberCode}</span></td>
                    <td>{seat ? `Desk ${seat.label} (${shift?.name.split(' ')[0]})` : 'Floating'}</td>
                    <td>
                      <span className={`badge ${daysLeft <= 3 ? 'badge-warning' : daysLeft < 0 ? 'badge-danger' : 'badge-success'}`}>
                        {daysLeft < 0 ? 'Expired' : `${daysLeft}d left`}
                      </span>
                    </td>
                    <td>
                      {msh && msh.dueAmount > 0 ? (
                        <span className="badge badge-danger">Due ₹{msh.dueAmount}</span>
                      ) : (
                        <span className="badge badge-success">Paid</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => onOpenMemberDetail(member.id)} className="btn-secondary" style={{ minHeight: '32px', padding: '0 12px', fontSize: '12px' }}>
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredMembers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <Users size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
          <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>No members found</p>
          <p style={{ fontSize: '12px', marginTop: '2px' }}>Try adjusting your search query or status filter.</p>
        </div>
      )}
    </div>
  );
};
