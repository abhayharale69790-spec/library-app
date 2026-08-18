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

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'BLOCKED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalSeat, setActiveModalSeat] = useState<Seat | null>(null);

  // Filter shifts by current branch
  const branchShifts = shifts.filter(s => s.branchId === currentBranch.id);
  const activeShift = branchShifts.find(s => s.id === selectedShiftFilter) || branchShifts[0] || shifts[0];

  // Filter seats by branch
  const branchSeats = seats.filter(s => s.branchId === currentBranch.id);

  // Calculate shift stats
  const totalShiftAssignments = assignments.filter(
    a => branchSeats.some(s => s.id === a.seatId) && a.shiftId === activeShift?.id && a.status === 'ACTIVE'
  );
  const occupiedCount = totalShiftAssignments.length;
  const blockedCount = branchSeats.filter(s => s.isBlocked).length;
  const availableCount = Math.max(0, branchSeats.length - occupiedCount - blockedCount);

  // Filtered seats list
  const filteredSeats = branchSeats.filter(seat => {
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
      {/* 1. Top Title Strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Desk Inventory & Shifts</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {currentBranch.name} • {branchSeats.length} Desks ({availableCount} Available, {occupiedCount} Occupied)
          </p>
        </div>
      </div>

      {/* 2. Shift Selector Pills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Select Operational Shift:
        </span>
        <div className="pill-selector">
          {branchShifts.map(shift => {
            const isSelected = shift.id === activeShift?.id;
            const shiftOccupants = assignments.filter(a => branchSeats.some(s => s.id === a.seatId) && a.shiftId === shift.id && a.status === 'ACTIVE').length;

            return (
              <button
                key={shift.id}
                onClick={() => setSelectedShiftFilter(shift.id)}
                className={`pill-item ${isSelected ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>{shift.name.split(' ')[0]}</span>
                <span className="badge badge-neutral" style={{ fontSize: '10px', padding: '1px 5px' }}>
                  {shiftOccupants}/{branchSeats.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Search & Status Filter Chips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search desk number (e.g. A-01) or student name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '38px', minHeight: '44px', fontSize: '14px' }}
          />
        </div>

        <div className="pill-selector">
          {[
            { id: 'ALL', label: `All Desks (${branchSeats.length})` },
            { id: 'AVAILABLE', label: `Available (${availableCount})` },
            { id: 'OCCUPIED', label: `Occupied (${occupiedCount})` },
            { id: 'BLOCKED', label: `Maintenance (${blockedCount})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              className={`pill-item ${statusFilter === f.id ? 'active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Responsive Desk Matrix Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
        {filteredSeats.map(seat => {
          const assignment = totalShiftAssignments.find(a => a.seatId === seat.id);
          const isOccupied = !!assignment;
          const occupant = assignment ? members.find(m => m.id === assignment.memberId) : undefined;
          const isBlocked = !!seat.isBlocked;

          let cardBg = 'var(--bg-card)';
          let borderColor = 'var(--border-subtle)';
          let statusText = 'Available';
          let statusColor = 'var(--status-success)';

          if (isBlocked) {
            cardBg = 'rgba(239, 68, 68, 0.05)';
            borderColor = 'rgba(239, 68, 68, 0.4)';
            statusText = 'Maintenance';
            statusColor = 'var(--status-danger)';
          } else if (isOccupied) {
            cardBg = 'rgba(59, 130, 246, 0.08)';
            borderColor = 'rgba(59, 130, 246, 0.4)';
            statusText = 'Occupied';
            statusColor = 'var(--brand-primary)';
          }

          return (
            <div
              key={seat.id}
              onClick={() => setActiveModalSeat(seat)}
              className="mobile-card mobile-card-interactive"
              style={{
                margin: 0,
                padding: '12px 10px',
                background: cardBg,
                borderColor: borderColor,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '100px',
                textAlign: 'center',
                boxShadow: isOccupied ? '0 2px 8px rgba(59, 130, 246, 0.15)' : 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '15px', fontWeight: '900', color: isOccupied ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                  {seat.label}
                </span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor }} />
              </div>

              <div style={{ margin: '6px 0' }}>
                {isOccupied && occupant ? (
                  <div>
                    <h4 style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {occupant.fullName.split(' ')[0]}
                    </h4>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {occupant.memberCode}
                    </p>
                  </div>
                ) : isBlocked ? (
                  <span style={{ fontSize: '11px', color: 'var(--status-danger)', fontWeight: '600' }}>
                    ⚠️ Blocked
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--status-success)', fontWeight: '600' }}>
                    ✓ Available
                  </span>
                )}
              </div>

              <span style={{ fontSize: '10px', color: 'var(--text-muted)', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
                {isOccupied ? 'Tap to view' : 'Tap to assign'}
              </span>
            </div>
          );
        })}
      </div>

      {filteredSeats.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <Armchair size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
          <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>No desks match your filter</p>
        </div>
      )}

      {/* Desk Detail Bottom Sheet Modal */}
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