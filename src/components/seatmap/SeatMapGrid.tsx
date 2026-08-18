import React, { useState } from 'react';
import { useLibrary } from '../../state/libraryStore';
import { Seat, Shift, SeatZone } from '../../types';
import { 
  Armchair, 
  Zap, 
  Lock, 
  ShieldAlert, 
  User, 
  Filter, 
  Sparkles,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Plus
} from 'lucide-react';
import { SeatDetailModal } from './SeatDetailModal';
import { getDaysRemaining } from '../../utils/dateMath';

interface SeatMapGridProps {
  onOpenMemberDetail: (memberId: string) => void;
}

export const SeatMapGrid: React.FC<SeatMapGridProps> = ({ onOpenMemberDetail }) => {
  const {
    currentBranch,
    seats,
    shifts,
    assignments,
    members,
    selectedShiftFilter,
    setSelectedShiftFilter,
  } = useLibrary();

  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'BLOCKED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalSeat, setActiveModalSeat] = useState<Seat | null>(null);

  // Active shift object
  const activeShift = shifts.find(s => s.id === selectedShiftFilter) || shifts[0];

  // Filter seats by branch
  const branchSeats = seats.filter(s => s.branchId === currentBranch.id);

  // Calculate shift stats
  const totalShiftAssignments = assignments.filter(
    a => a.branchId === currentBranch.id && a.shiftId === activeShift.id && a.status === 'ACTIVE'
  );
  const occupiedCount = totalShiftAssignments.length;
  const blockedCount = branchSeats.filter(s => s.isBlocked).length;
  const availableCount = Math.max(0, branchSeats.length - occupiedCount - blockedCount);

  // Filtered seats list
  const filteredSeats = branchSeats.filter(seat => {
    // Zone filter
    if (selectedZone !== 'ALL' && seat.zone !== selectedZone) return false;

    // Assignment for this seat in active shift
    const assignment = totalShiftAssignments.find(a => a.seatId === seat.id);
    const isOccupied = !!assignment;
    const isBlocked = !!seat.isBlocked;

    // Status filter
    if (statusFilter === 'AVAILABLE' && (isOccupied || isBlocked)) return false;
    if (statusFilter === 'OCCUPIED' && !isOccupied) return false;
    if (statusFilter === 'BLOCKED' && !isBlocked) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLabel = seat.label.toLowerCase().includes(q);
      const member = assignment ? members.find(m => m.id === assignment.memberId) : null;
      const matchMember = member ? member.fullName.toLowerCase().includes(q) || member.memberCode.toLowerCase().includes(q) : false;
      if (!matchLabel && !matchMember) return false;
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* 1. Header & Title */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>
          Shift Seat Inventory
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          {currentBranch.name} • {availableCount} available out of {branchSeats.length} desks
        </p>
      </div>

      {/* 2. Shift Selector Pills (Horizontal Scroll on Mobile) */}
      <div className="pill-selector">
        {shifts.filter(s => s.branchId === currentBranch.id).map(shift => (
          <button
            key={shift.id}
            onClick={() => setSelectedShiftFilter(shift.id)}
            className={`pill-item ${selectedShiftFilter === shift.id ? 'active' : ''}`}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: shift.color || '#3b82f6' }} />
            <span>{shift.name.split(' ')[0]}</span>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>({shift.startTime}-{shift.endTime})</span>
          </button>
        ))}
      </div>

      {/* 3. Search & Filter Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search desk number (e.g. A-22) or student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '38px', minHeight: '44px', fontSize: '14px' }}
          />
        </div>

        {/* Status Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'ALL', label: `All (${branchSeats.length})` },
            { id: 'AVAILABLE', label: `Available (${availableCount})` },
            { id: 'OCCUPIED', label: `Occupied (${occupiedCount})` },
            { id: 'BLOCKED', label: `Blocked (${blockedCount})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              className={`pill-item ${statusFilter === f.id ? 'active' : ''}`}
              style={{ minHeight: '32px', padding: '4px 12px', fontSize: '12px' }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Compact Mobile Seat Grid (2-columns on mobile, responsive grid on desktop) */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '10px',
        }}
      >
        {filteredSeats.map(seat => {
          const assignment = totalShiftAssignments.find(a => a.seatId === seat.id);
          const member = assignment ? members.find(m => m.id === assignment.memberId) : null;
          const isOccupied = !!assignment;
          const isBlocked = !!seat.isBlocked;

          let statusColor = 'var(--status-success)';
          let statusBg = 'var(--status-success-bg)';
          let statusText = 'Available';

          if (isBlocked) {
            statusColor = 'var(--status-danger)';
            statusBg = 'var(--status-danger-bg)';
            statusText = 'Blocked';
          } else if (isOccupied) {
            statusColor = 'var(--brand-primary)';
            statusBg = 'var(--brand-primary-bg)';
            statusText = 'Occupied';
          }

          return (
            <div
              key={seat.id}
              onClick={() => setActiveModalSeat(seat)}
              className="mobile-card mobile-card-interactive"
              style={{
                margin: 0,
                padding: '12px',
                border: `1px solid ${isOccupied ? 'rgba(59, 130, 246, 0.3)' : 'var(--border-subtle)'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '120px',
                position: 'relative'
              }}
            >
              {/* Header: Label & Status Dot */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {seat.label}
                </span>
                <span 
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: statusBg,
                    color: statusColor,
                    textTransform: 'uppercase'
                  }}
                >
                  {statusText}
                </span>
              </div>

              {/* Body: Zone & Occupant Name */}
              <div style={{ margin: '8px 0' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {seat.zone}
                </p>
                {isOccupied && member ? (
                  <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.fullName}
                  </p>
                ) : (
                  <p style={{ fontSize: '12px', color: isBlocked ? 'var(--status-danger)' : 'var(--status-success)', marginTop: '2px', fontWeight: '600' }}>
                    {isBlocked ? 'Out of service' : 'Ready for assignment'}
                  </p>
                )}
              </div>

              {/* Footer: Quick Action Tag */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {seat.powerSocket ? '⚡ Socket' : 'Standard'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--brand-primary)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {isOccupied ? 'View' : 'Assign'} &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSeats.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <Armchair size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
          <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>No desks match your filter</p>
          <p style={{ fontSize: '12px', marginTop: '2px' }}>Try switching shifts or clearing the search query.</p>
        </div>
      )}

      {/* 5. Seat Action Bottom Sheet */}
      {activeModalSeat && (
        <SeatDetailModal
          seat={activeModalSeat}
          onClose={() => setActiveModalSeat(null)}
          onOpenMemberDetail={onOpenMemberDetail}
        />
      )}
    </div>
  );
};
