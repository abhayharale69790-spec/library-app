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
  Lock
} from 'lucide-react';
import { formatDateDisplay, getDaysRemaining } from '../../utils/dateMath';

interface SeatDetailModalProps {
  seat: Seat;
  activeShift: Shift;
  onClose: () => void;
  onOpenMemberDetail: (memberId: string) => void;
}

export const SeatDetailModal: React.FC<SeatDetailModalProps> = ({
  seat,
  activeShift,
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
  } = useLibrary();

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
    // Check if already assigned a seat in this shift
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
      setTimeout(onClose, 1000);
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
      setTimeout(onClose, 1000);
    }
  };

  const handleBlockToggle = () => {
    if (seat.isBlocked) {
      unblockSeat(seat.id);
      setStatusMsg({ type: 'success', text: `Seat ${seat.label} unblocked.` });
      setTimeout(onClose, 800);
    } else {
      blockSeat(seat.id, blockReason);
      setStatusMsg({ type: 'success', text: `Seat ${seat.label} blocked.` });
      setTimeout(onClose, 800);
    }
  };

  const handleSendReminder = () => {
    if (!occupant) return;
    const { url } = sendWhatsAppNotification(occupant.id, daysRemaining <= 3 ? 'EXPIRY_REMINDER_3D' : 'EXPIRY_REMINDER_7D');
    window.open(url, '_blank');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: seat.isBlocked ? 'var(--seat-blocked-bg)' : occupant ? 'var(--seat-occupied-bg)' : 'var(--seat-available-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Armchair size={20} color={seat.isBlocked ? 'var(--seat-blocked)' : occupant ? 'var(--brand-primary)' : 'var(--status-success)'} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800 }}>
                Desk {seat.label} ({seat.zone})
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Shift: <strong style={{ color: activeShift.color }}>{activeShift.name.split(' (')[0]}</strong> ({activeShift.startTime} - {activeShift.endTime})
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {statusMsg && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              background: statusMsg.type === 'error' ? 'var(--status-danger-bg)' : 'var(--status-success-bg)',
              border: `1px solid ${statusMsg.type === 'error' ? 'var(--status-danger)' : 'var(--status-success)'}`,
              color: statusMsg.type === 'error' ? 'var(--status-danger)' : 'var(--status-success)',
              fontSize: '13px',
              fontWeight: 600,
            }}>
              {statusMsg.text}
            </div>
          )}

          {/* Desk Amenities Tags */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {seat.powerSocket && (
              <span className="badge badge-neutral" style={{ gap: '4px' }}>
                <Zap size={12} color="var(--status-warning)" />
                Power Socket
              </span>
            )}
            {seat.hasLocker && (
              <span className="badge badge-neutral" style={{ gap: '4px' }}>
                <Lock size={12} color="var(--status-info)" />
                Personal Locker
              </span>
            )}
            <span className="badge badge-neutral">
              Type: {seat.type}
            </span>
          </div>

          {/* Main Content by State */}
          {modalAction === 'DETAILS' && (
            <>
              {seat.isBlocked ? (
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(100, 116, 139, 0.15)',
                  border: '1px solid var(--border-medium)',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <ShieldAlert size={18} />
                    <strong style={{ color: 'var(--text-primary)' }}>Seat Currently Blocked</strong>
                  </div>
                  <p style={{ fontSize: '13px', marginTop: '6px' }}>
                    Reason: {seat.blockReason || 'Under maintenance'}
                  </p>
                </div>
              ) : occupant ? (
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Current Occupant
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                        {occupant.fullName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {occupant.memberCode} • {occupant.phone}
                      </div>
                    </div>

                    <span className={`badge ${daysRemaining <= 3 ? 'badge-danger' : daysRemaining <= 7 ? 'badge-warning' : 'badge-success'}`}>
                      {daysRemaining < 0 ? 'EXPIRED' : `${daysRemaining} days left`}
                    </span>
                  </div>

                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Target Exam: <strong>{occupant.targetExam || 'General'}</strong></span>
                    <span>Valid Till: <strong>{formatDateDisplay(currentAssignment?.endDate || '')}</strong></span>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  background: 'var(--status-success-bg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed rgba(16, 185, 129, 0.4)',
                  marginBottom: '16px',
                }}>
                  <CheckCircle2 size={32} color="var(--status-success)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--status-success)' }}>
                    Desk is Available for {activeShift.name.split(' (')[0]}
                  </div>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>
                    Zero conflicts detected for this shift slot. Ready to allocate to any scholar.
                  </p>
                </div>
              )}

              {/* Multi-Shift Seat Sharing Table */}
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  24-Hour Shift Allocation for Desk {seat.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {shifts.map(sh => {
                    const asgn = assignments.find(a => a.seatId === seat.id && a.shiftId === sh.id && a.status === 'ACTIVE');
                    const mem = asgn ? members.find(m => m.id === asgn.memberId) : null;

                    return (
                      <div
                        key={sh.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: sh.id === activeShift.id ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-input)',
                          border: sh.id === activeShift.id ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: sh.color }} />
                          <span style={{ fontWeight: 600 }}>{sh.name.split(' (')[0]}</span>
                        </div>
                        <div>
                          {mem ? (
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                              👤 {mem.fullName}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--status-success)' }}>
                              🟢 Available
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Form: Assign Seat */}
          {modalAction === 'ASSIGN' && (
            <div className="form-group">
              <label className="form-label">Select Student for {activeShift.name.split(' (')[0]}</label>
              <select
                className="form-control"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
              >
                <option value="">-- Choose active student --</option>
                {eligibleMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.memberCode}) • {m.targetExam || 'General'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Form: Transfer Seat */}
          {modalAction === 'TRANSFER' && occupant && (
            <div className="form-group">
              <label className="form-label">Select Destination Desk for {occupant.fullName}</label>
              <select
                className="form-control"
                value={targetSeatId}
                onChange={(e) => setTargetSeatId(e.target.value)}
              >
                <option value="">-- Choose free desk in {activeShift.name.split(' (')[0]} --</option>
                {freeSeatsInShift.map(s => (
                  <option key={s.id} value={s.id}>
                    Desk {s.label} ({s.zone}) {s.hasLocker ? '• with Locker' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Form: Block Seat */}
          {modalAction === 'BLOCK' && (
            <div className="form-group">
              <label className="form-label">Maintenance / Block Reason</label>
              <input
                type="text"
                className="form-control"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g. AC Duct repair, table lamp replacement"
              />
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer">
          {modalAction === 'DETAILS' ? (
            <>
              {seat.isBlocked ? (
                <button onClick={handleBlockToggle} className="btn btn-success btn-sm">
                  Unblock Desk
                </button>
              ) : occupant ? (
                <>
                  <button onClick={handleSendReminder} className="btn btn-sm" style={{ background: '#25D366', color: '#fff', gap: '4px' }}>
                    <Send size={13} />
                    <span>WhatsApp</span>
                  </button>
                  <button onClick={() => setModalAction('TRANSFER')} className="btn btn-secondary btn-sm" style={{ gap: '4px' }}>
                    <ArrowRightLeft size={13} />
                    <span>Transfer Desk</span>
                  </button>
                  <button onClick={() => onOpenMemberDetail(occupant.id)} className="btn btn-primary btn-sm">
                    View Profile
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setModalAction('BLOCK')} className="btn btn-secondary btn-sm" style={{ gap: '4px' }}>
                    <Wrench size={13} />
                    <span>Block Desk</span>
                  </button>
                  <button onClick={() => setModalAction('ASSIGN')} className="btn btn-primary btn-sm">
                    Assign Desk
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button onClick={() => setModalAction('DETAILS')} className="btn btn-ghost btn-sm">
                Cancel
              </button>
              {modalAction === 'ASSIGN' && (
                <button onClick={handleAssign} className="btn btn-primary btn-sm">
                  Confirm Assignment
                </button>
              )}
              {modalAction === 'TRANSFER' && (
                <button onClick={handleTransfer} className="btn btn-primary btn-sm">
                  Confirm Transfer
                </button>
              )}
              {modalAction === 'BLOCK' && (
                <button onClick={handleBlockToggle} className="btn btn-danger btn-sm">
                  Confirm Block
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
