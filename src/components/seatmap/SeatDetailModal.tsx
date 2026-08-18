import React, { useState } from 'react';
import { useLibrary } from '../../state/libraryStore';
import { Seat, Shift, Member, SeatAssignment } from '../../types';
import { 
  X, 
  Armchair, 
  User, 
  Clock, 
  ShieldAlert, 
  ArrowRightLeft, 
  Wrench, 
  Send, 
  CheckCircle2, 
  Calendar,
  Zap,
  Lock,
  MessageSquare
} from 'lucide-react';
import { formatDateDisplay, getDaysRemaining } from '../../utils/dateMath';
import { BottomSheet } from '../common/BottomSheet';

interface SeatDetailModalProps {
  seat: Seat;
  onClose: () => void;
  onOpenMemberDetail: (memberId: string) => void;
}

export const SeatDetailModal: React.FC<SeatDetailModalProps> = ({
  seat,
  onClose,
  onOpenMemberDetail,
}) => {
  const {
    members,
    assignments,
    shifts,
    seats,
    assignSeat,
    transferSeat,
    blockSeat,
    unblockSeat,
    sendWhatsAppNotification,
    selectedShiftFilter,
  } = useLibrary();

  const activeShift = shifts.find(s => s.id === selectedShiftFilter) || shifts[0];

  // Find active assignment for this specific seat AND this shift
  const currentAssignment = assignments.find(
    a => a.seatId === seat.id && a.shiftId === activeShift.id && a.status === 'ACTIVE'
  );

  const occupant = currentAssignment ? members.find(m => m.id === currentAssignment.memberId) : undefined;
  const daysRemaining = currentAssignment ? getDaysRemaining(currentAssignment.endDate) : 0;

  // View States for modal actions
  const [modalAction, setModalAction] = useState<'DETAILS' | 'ASSIGN' | 'TRANSFER' | 'BLOCK'>('DETAILS');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [targetSeatId, setTargetSeatId] = useState<string>('');
  const [blockReason, setBlockReason] = useState<string>('Lighting & Electrical Maintenance');
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Available members without a seat in this shift
  const eligibleMembers = members.filter(m => {
    if (m.status !== 'ACTIVE' && m.status !== 'EXPIRING') return false;
    const hasSeatInShift = assignments.some(a => a.memberId === m.id && a.shiftId === activeShift.id && a.status === 'ACTIVE');
    return !hasSeatInShift;
  });

  // Free seats in this shift for transfer
  const freeSeatsInShift = seats.filter(s => {
    if (s.id === seat.id) return false;
    if (s.isBlocked) return false;
    const isOccupied = assignments.some(a => a.seatId === s.id && a.shiftId === activeShift.id && a.status === 'ACTIVE');
    return !isOccupied;
  });

  const handleAssign = () => {
    if (!selectedMemberId) {
      setStatusMsg({ type: 'error', text: 'Please select a student.' });
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const res = assignSeat(selectedMemberId, seat.id, activeShift.id, today, currentAssignment?.endDate || '2026-12-31');
    if (!res.success) {
      setStatusMsg({ type: 'error', text: res.error || 'Assignment failed.' });
    } else {
      setStatusMsg({ type: 'success', text: `Seat ${seat.label} assigned successfully!` });
      setTimeout(onClose, 800);
    }
  };

  const handleTransfer = () => {
    if (!targetSeatId || !occupant) {
      setStatusMsg({ type: 'error', text: 'Please choose a destination seat.' });
      return;
    }
    const res = transferSeat(occupant.id, targetSeatId, activeShift.id);
    if (!res.success) {
      setStatusMsg({ type: 'error', text: res.error || 'Transfer failed.' });
    } else {
      setStatusMsg({ type: 'success', text: `Transferred to ${seats.find(s => s.id === targetSeatId)?.label}!` });
      setTimeout(onClose, 800);
    }
  };

  const handleToggleBlock = () => {
    if (seat.isBlocked) {
      unblockSeat(seat.id);
      setStatusMsg({ type: 'success', text: `Seat ${seat.label} unblocked.` });
    } else {
      blockSeat(seat.id, blockReason);
      setStatusMsg({ type: 'success', text: `Seat ${seat.label} marked under maintenance.` });
    }
    setTimeout(onClose, 800);
  };

  const isOccupied = !!occupant;

  return (
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      title={`Desk ${seat.label}`}
      subtitle={`${activeShift.name.split(' ')[0]} Shift • ${seat.zone}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {statusMsg && (
          <div 
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: statusMsg.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
              color: statusMsg.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            {statusMsg.text}
          </div>
        )}

        {/* 1. Main Overview Mode */}
        {modalAction === 'DETAILS' && (
          <>
            {/* Status & Amenities Banner */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</span>
                <p style={{ fontSize: '14px', fontWeight: '700', color: isOccupied ? 'var(--brand-primary)' : seat.isBlocked ? 'var(--status-danger)' : 'var(--status-success)' }}>
                  {isOccupied ? '● Occupied' : seat.isBlocked ? '⚠️ Maintenance Blocked' : '✓ Available'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge badge-neutral">{seat.powerSocket ? '⚡ Socket' : 'No Socket'}</span>
                <span className="badge badge-neutral">{seat.hasLocker ? '🔒 Locker' : 'No Locker'}</span>
              </div>
            </div>

            {/* Occupant Info Card (if occupied) */}
            {isOccupied && occupant && (
              <div className="mobile-card" style={{ margin: 0, padding: '14px', background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--brand-primary)', textTransform: 'uppercase' }}>Assigned Scholar</span>
                    <h4 style={{ fontSize: '16px', fontWeight: '800', marginTop: '2px' }}>{occupant.fullName}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {occupant.memberCode} • {occupant.targetExam || 'General'}</p>
                  </div>
                  <span className={`badge ${daysRemaining <= 3 ? 'badge-warning' : 'badge-success'}`}>
                    {daysRemaining}d left
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenMemberDetail(occupant.id);
                    }}
                    className="btn-secondary"
                    style={{ flex: 1, minHeight: '38px', fontSize: '12px' }}
                  >
                    <User size={14} /> Full Profile
                  </button>
                  <button
                    onClick={() => {
                      const { url } = sendWhatsAppNotification(occupant.id, 'SEAT_ASSIGNED');
                      window.open(url, '_blank');
                    }}
                    className="btn-secondary"
                    style={{ minHeight: '38px', padding: '0 12px', color: '#25D366' }}
                    title="Send WhatsApp"
                  >
                    <MessageSquare size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: isOccupied ? 'repeat(2, 1fr)' : '1fr', gap: '10px', marginTop: '6px' }}>
              {!isOccupied && !seat.isBlocked && (
                <button
                  onClick={() => setModalAction('ASSIGN')}
                  className="btn-primary"
                  style={{ minHeight: '48px', fontSize: '15px' }}
                >
                  <Armchair size={18} /> Assign Student to Desk
                </button>
              )}

              {isOccupied && (
                <>
                  <button
                    onClick={() => setModalAction('TRANSFER')}
                    className="btn-secondary"
                    style={{ minHeight: '48px', fontSize: '14px' }}
                  >
                    <ArrowRightLeft size={16} /> Transfer Seat
                  </button>
                  <button
                    onClick={() => {
                      if (occupant) {
                        unblockSeat(seat.id);
                        setStatusMsg({ type: 'success', text: 'Seat freed!' });
                        setTimeout(onClose, 800);
                      }
                    }}
                    className="btn-danger"
                    style={{ minHeight: '48px', fontSize: '14px' }}
                  >
                    Vacate Desk
                  </button>
                </>
              )}
            </div>

            {/* Maintenance Toggle */}
            <button
              onClick={() => setModalAction('BLOCK')}
              className="btn-ghost"
              style={{ width: '100%', minHeight: '40px', fontSize: '13px', color: 'var(--text-muted)' }}
            >
              <Wrench size={14} /> {seat.isBlocked ? 'Remove Maintenance Block' : 'Mark for Maintenance / Block'}
            </button>
          </>
        )}

        {/* 2. Assign Student Mode */}
        {modalAction === 'ASSIGN' && (
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>Select Student for Desk {seat.label}</h4>
            <div className="form-group">
              <label className="form-label">Available Scholars ({eligibleMembers.length})</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="form-select"
              >
                <option value="">-- Choose active member --</option>
                {eligibleMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.memberCode}) - {m.targetExam || 'General'}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button onClick={() => setModalAction('DETAILS')} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleAssign} className="btn-primary" style={{ flex: 1 }}>
                Confirm Assignment
              </button>
            </div>
          </div>
        )}

        {/* 3. Transfer Seat Mode */}
        {modalAction === 'TRANSFER' && (
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>Transfer {occupant?.fullName} to Another Desk</h4>
            <div className="form-group">
              <label className="form-label">Available Desks in {activeShift.name.split(' ')[0]} Shift</label>
              <select
                value={targetSeatId}
                onChange={(e) => setTargetSeatId(e.target.value)}
                className="form-select"
              >
                <option value="">-- Select Destination Desk --</option>
                {freeSeatsInShift.map(s => (
                  <option key={s.id} value={s.id}>
                    Desk {s.label} ({s.zone}) {s.powerSocket ? '⚡' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button onClick={() => setModalAction('DETAILS')} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleTransfer} className="btn-primary" style={{ flex: 1 }}>
                Execute Transfer
              </button>
            </div>
          </div>
        )}

        {/* 4. Block / Maintenance Mode */}
        {modalAction === 'BLOCK' && (
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>
              {seat.isBlocked ? 'Unblock Desk' : 'Place Desk Under Maintenance'}
            </h4>
            {!seat.isBlocked && (
              <div className="form-group">
                <label className="form-label">Reason for blocking</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="form-input"
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button onClick={() => setModalAction('DETAILS')} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button 
                onClick={handleToggleBlock} 
                className={seat.isBlocked ? 'btn-primary' : 'btn-danger'} 
                style={{ flex: 1 }}
              >
                {seat.isBlocked ? 'Confirm Unblock' : 'Confirm Block'}
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
