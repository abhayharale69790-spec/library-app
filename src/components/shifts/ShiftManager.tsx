import React, { useState } from 'react';
import { useLibrary } from '../../state/libraryStore';
import { Shift } from '../../types';
import {
  Clock,
  Plus,
  Edit2,
  CheckCircle2,
  Armchair,
  Sparkles,
  Users,
  DollarSign
} from 'lucide-react';

export const ShiftManager: React.FC = () => {
  const {
    currentBranch,
    shifts,
    seats,
    assignments,
    addShift,
    updateShift,
  } = useLibrary();

  const branchSeats = seats.filter(s => s.branchId === currentBranch.id);

  // New Shift Modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('12:00');
  const [defaultPrice, setDefaultPrice] = useState<number>(1500);
  const [color, setColor] = useState('#3b82f6');

  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addShift({
      branchId: currentBranch.id,
      name: name.trim(),
      startTime,
      endTime,
      defaultPrice: Number(defaultPrice),
      color,
      active: true,
    });

    setShowModal(false);
    setName('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Shift Inventory & Pricing Config</h1>
          <p style={{ fontSize: '13px', marginTop: '2px' }}>
            Configure daily study time slots, capacity thresholds and dynamic shift pricing
          </p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
          <Plus size={16} />
          <span>Add New Shift Slot</span>
        </button>
      </div>

      {/* Shifts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {shifts.map(shift => {
          const shiftAssignments = assignments.filter(
            a => branchSeats.some(s => s.id === a.seatId) && a.shiftId === shift.id && a.status === 'ACTIVE'
          );
          const occupancyRate = branchSeats.length > 0 
            ? Math.round((shiftAssignments.length / branchSeats.length) * 100) 
            : 0;

          return (
            <div
              key={shift.id}
              className="card card-hoverable"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                borderLeft: `5px solid ${shift.color}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: shift.color }} />
                  <h3 style={{ fontSize: '16px', fontWeight: 800 }}>{shift.name.split(' (')[0]}</h3>
                </div>
                <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                  Slot #{shift.order || 1}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="var(--text-muted)" />
                  <span className="mono" style={{ fontWeight: 600 }}>{shift.startTime} - {shift.endTime}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--status-success)' }}>₹{shift.defaultPrice.toLocaleString('en-IN')} / mo</span>
                </div>
              </div>

              {/* Occupancy bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Booked Desks:</span>
                  <strong>{shiftAssignments.length} / {branchSeats.length} ({occupancyRate}%)</strong>
                </div>
                <div style={{ height: '6px', borderRadius: 'var(--radius-full)', background: 'var(--bg-input)', overflow: 'hidden' }}>
                  <div style={{ width: `${occupancyRate}%`, height: '100%', backgroundColor: shift.color, borderRadius: 'var(--radius-full)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{branchSeats.length - shiftAssignments.length} Desks Available</span>
                <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>Active in Gate Turnstiles</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Shift Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '17px', fontWeight: 800 }}>Add New Study Shift</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <form onSubmit={handleAddShift}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Shift Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Early Bird Morning Shift"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Start Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">End Time</label>
                    <input
                      type="time"
                      className="form-control"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Monthly Price (₹)</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={defaultPrice}
                      onChange={(e) => setDefaultPrice(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Theme Color</label>
                    <input
                      type="color"
                      className="form-control"
                      style={{ height: '40px', padding: '2px' }}
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Shift Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
