import React, { useState } from 'react';
import { useLibrary } from '../../state/libraryStore';
import { PaymentMethod } from '../../types';
import { 
  X, 
  UserPlus, 
  CheckCircle2, 
  AlertTriangle, 
  Armchair, 
  CreditCard, 
  Sparkles,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddMemberModalProps {
  onClose: () => void;
  onSuccess: (memberId: string) => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ onClose, onSuccess }) => {
  const {
    currentBranch,
    plans,
    shifts,
    seats,
    assignments,
    addMember,
  } = useLibrary();

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [targetExam, setTargetExam] = useState('UPSC Civil Services 2027');
  
  const [planId, setPlanId] = useState(plans[0]?.id || '');
  const [shiftId, setShiftId] = useState(shifts[0]?.id || '');
  const [seatId, setSeatId] = useState('');
  
  const selectedPlan = plans.find(p => p.id === planId) || plans[0];
  const [amountPaid, setAmountPaid] = useState<number>(selectedPlan?.basePrice || 1600);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI_GPAY');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Update default amount when plan changes
  const handlePlanChange = (newPlanId: string) => {
    setPlanId(newPlanId);
    const p = plans.find(plan => plan.id === newPlanId);
    if (p) setAmountPaid(p.basePrice);
  };

  // Find available seats in this branch for selected shift
  const branchSeats = seats.filter(s => s.branchId === currentBranch.id && !s.isBlocked);
  const availableSeats = branchSeats.filter(s => {
    const isOccupied = assignments.some(
      a => a.seatId === s.id && a.shiftId === shiftId && a.status === 'ACTIVE'
    );
    return !isOccupied;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = addMember({
      fullName,
      phone,
      email,
      emergencyContact,
      targetExam,
      planId,
      shiftId,
      seatId: seatId || undefined,
      amountPaid: Number(amountPaid),
      paymentMethod,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to register student.');
    } else {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}
      onSuccess(res.member!.id);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <UserPlus size={20} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800 }}>
                Onboard New Scholar
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Branch: <strong>{currentBranch.name}</strong>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {errorMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--status-danger-bg)',
                border: '1px solid var(--status-danger)',
                color: 'var(--status-danger)',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertTriangle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Personal Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aditi Deshmukh"
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98201 55667"
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. aditi@example.com"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Emergency Contact Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98201 99887 (Parent)"
                  className="form-control"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Target Exam / Study Purpose</label>
              <select
                className="form-control"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
              >
                <option value="UPSC Civil Services 2027">UPSC Civil Services (IAS/IPS)</option>
                <option value="CA Final Nov 2026">CA Final / Inter (ICAI)</option>
                <option value="NEET PG Medical Prep">NEET PG / Super Speciality</option>
                <option value="GATE Computer Science / Engg">GATE CSE / ECE</option>
                <option value="State PSC Exam">State Public Service Commission (MPSC/TNPSC/UPPSC)</option>
                <option value="IIT JEE / NEET UG Scholar">IIT JEE / NEET UG</option>
                <option value="Judiciary & Judicial Services">Judiciary / CLAT PG</option>
                <option value="General Self-Study">General Academic / Tech Prep</option>
              </select>
            </div>

            {/* Plan & Shift Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Membership Plan</label>
                <select
                  className="form-control"
                  value={planId}
                  onChange={(e) => handlePlanChange(e.target.value)}
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.durationDays} Days) — ₹{p.basePrice.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Study Shift Slot</label>
                <select
                  className="form-control"
                  value={shiftId}
                  onChange={(e) => {
                    setShiftId(e.target.value);
                    setSeatId(''); // Reset seat when shift changes
                  }}
                >
                  {shifts.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name.split(' (')[0]} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Seat Selection */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <span>Select Reserved Desk ({availableSeats.length} Available in this Shift)</span>
                {seatId && <span style={{ color: 'var(--status-success)' }}>Desk {seats.find(s => s.id === seatId)?.label} Selected</span>}
              </label>
              <select
                className="form-control"
                value={seatId}
                onChange={(e) => setSeatId(e.target.value)}
              >
                <option value="">-- Leave as Floating / Unassigned Desk --</option>
                {availableSeats.map(s => (
                  <option key={s.id} value={s.id}>
                    Desk {s.label} ({s.zone}) {s.hasLocker ? '• Deluxe with Locker' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Fee Collection & Payment */}
            <div style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Fee Collection & Admission Payment
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--brand-primary)' }}>
                  Plan Total: ₹{selectedPlan.basePrice.toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Amount Collecting Now (₹)</label>
                  <input
                    type="number"
                    min="0"
                    max={selectedPlan.basePrice}
                    className="form-control"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Payment Mode</label>
                  <select
                    className="form-control"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="UPI_GPAY">Google Pay (UPI)</option>
                    <option value="UPI_PHONEPE">PhonePe (UPI)</option>
                    <option value="UPI_PAYTM">Paytm (UPI)</option>
                    <option value="CASH">Cash at Desk</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="NETBANKING">Net Banking / NEFT</option>
                  </select>
                </div>
              </div>

              {selectedPlan.basePrice > amountPaid && (
                <div style={{ fontSize: '11.5px', color: 'var(--status-warning)', fontWeight: 600 }}>
                  ⚠️ Outstanding balance of ₹{(selectedPlan.basePrice - amountPaid).toLocaleString('en-IN')} will be recorded as pending due.
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
              <CheckCircle2 size={16} />
              <span>Complete Admission</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
