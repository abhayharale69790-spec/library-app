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
  Layers
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
  const [activeModalSeat, setActiveModalSeat] = useState<Seat | null>(null);

  // Active shift object
  const activeShift = shifts.find(s => s.id === selectedShiftFilter) || shifts[0];

  // Filter seats by branch and zone
  const branchSeats = seats.filter(s => s.branchId === currentBranch.id);
  const displayedSeats = branchSeats.filter(s => {
    if (selectedZone !== 'ALL' && s.zone !== selectedZone) return false;
    return true;
  });

  // Calculate shift stats
  const totalShiftAssignments = assignments.filter(
    a => a.branchId === currentBranch.id && a.shiftId === activeShift.id && a.status === 'ACTIVE'
  );
  const occupiedCount = totalShiftAssignments.length;
  const blockedCount = branchSeats.filter(s => s.isBlocked).length;
  const availableCount = Math.max(0, branchSeats.length - occupiedCount - blockedCount);

  // Group seats by Zone for organized floor visualizer
  const zones: SeatZone[] = ['AC Quiet', 'Deluxe Cubicle', 'Standard', 'Discussion'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header & Shift Switcher */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>
            Dynamic Shift Seat Matrix
          </h1>
          <p style={{ fontSize: '13px', marginTop: '2px' }}>
            Visual floor layout reflecting time-multiplexed physical space inventory
          </p>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: '12px',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--status-success)' }} />
            <span>Available ({availableCount})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--brand-primary)' }} />
            <span>Occupied ({occupiedCount})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--status-warning)' }} />
            <span>Expiring &lt;7d</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--seat-blocked)' }} />
            <span>Blocked ({blockedCount})</span>
          </div>
        </div>
      </div>

      {/* Shift Switcher Bar */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', flex: 1 }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
            Shift Filter:
          </span>
          {shifts.map(shift => {
            const isSelected = selectedShiftFilter === shift.id;
            return (
              <button
                key={shift.id}
                onClick={() => setSelectedShiftFilter(shift.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? `2px solid ${shift.color}` : '1px solid var(--border-medium)',
                  background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-input)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '13px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: shift.color,
                }} />
                <span>{shift.name.split(' (')[0]}</span>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  ({shift.startTime} - {shift.endTime})
                </span>
              </button>
            );
          })}
        </div>

        {/* Zone Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={14} color="var(--text-muted)" />
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="form-control"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
          >
            <option value="ALL">All Zones (4 Zones)</option>
            {zones.map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual Floor Plan Grouped by Zone */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {zones.map(zone => {
          const zoneSeats = displayedSeats.filter(s => s.zone === zone);
          if (zoneSeats.length === 0) return null;

          return (
            <div key={zone} className="card" style={{ padding: '20px' }}>
              {/* Zone Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 800 }}>
                    {zone === 'AC Quiet' && '❄️ '}
                    {zone === 'Deluxe Cubicle' && '👑 '}
                    {zone === 'Standard' && '📖 '}
                    {zone === 'Discussion' && '☕ '}
                    {zone}
                  </h3>
                  <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                    {zoneSeats.length} Desks
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Active Shift: <strong style={{ color: activeShift.color }}>{activeShift.name.split(' (')[0]}</strong>
                </div>
              </div>

              {/* Grid of Desks */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '12px',
              }}>
                {zoneSeats.map(seat => {
                  const assignment = assignments.find(
                    a => a.seatId === seat.id && a.shiftId === activeShift.id && a.status === 'ACTIVE'
                  );
                  const occupant = assignment ? members.find(m => m.id === assignment.memberId) : undefined;
                  const daysLeft = assignment ? getDaysRemaining(assignment.endDate) : 0;
                  const isExpiringSoon = assignment && daysLeft >= 0 && daysLeft <= 7;
                  const isBlocked = seat.isBlocked || seat.status === 'BLOCKED';

                  // Desk Color Theme
                  let cardBg = 'rgba(16, 185, 129, 0.08)';
                  let cardBorder = 'rgba(16, 185, 129, 0.3)';
                  let iconColor = 'var(--status-success)';

                  if (isBlocked) {
                    cardBg = 'rgba(100, 116, 139, 0.1)';
                    cardBorder = 'rgba(100, 116, 139, 0.3)';
                    iconColor = 'var(--seat-blocked)';
                  } else if (occupant) {
                    if (isExpiringSoon) {
                      cardBg = 'rgba(245, 158, 11, 0.12)';
                      cardBorder = 'rgba(245, 158, 11, 0.4)';
                      iconColor = 'var(--status-warning)';
                    } else {
                      cardBg = 'rgba(59, 130, 246, 0.12)';
                      cardBorder = 'rgba(59, 130, 246, 0.4)';
                      iconColor = 'var(--brand-primary)';
                    }
                  }

                  return (
                    <div
                      key={seat.id}
                      onClick={() => setActiveModalSeat(seat)}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        background: cardBg,
                        border: `1px solid ${cardBorder}`,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '105px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {/* Top: Desk Label & Amenities */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Armchair size={15} color={iconColor} />
                          <span style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)' }}>
                            {seat.label}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          {seat.powerSocket && <span title="Power Socket"><Zap size={11} color="var(--status-warning)" /></span>}
                          {seat.hasLocker && <span title="Personal Locker"><Lock size={11} color="var(--status-info)" /></span>}
                        </div>
                      </div>

                      {/* Middle: Occupant / Status */}
                      <div style={{ margin: '6px 0' }}>
                        {isBlocked ? (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            🚫 Blocked
                          </div>
                        ) : occupant ? (
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {occupant.fullName.split(' ')[0]}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {occupant.memberCode.split('-')[2]}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: 'var(--status-success)', fontWeight: 600 }}>
                            🟢 Available
                          </div>
                        )}
                      </div>

                      {/* Bottom Status Tag */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '9.5px' }}>
                        {occupant ? (
                          <span style={{
                            fontWeight: 700,
                            color: isExpiringSoon ? 'var(--status-warning)' : 'var(--text-secondary)',
                          }}>
                            {daysLeft < 0 ? 'Expired' : `${daysLeft}d left`}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Click to assign</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Seat Detail / Assign / Transfer Modal */}
      {activeModalSeat && (
        <SeatDetailModal
          seat={activeModalSeat}
          activeShift={activeShift}
          onClose={() => setActiveModalSeat(null)}
          onOpenMemberDetail={onOpenMemberDetail}
        />
      )}
    </div>
  );
};
