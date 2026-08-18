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
  ChevronRight,
  ChevronLeft,
  Calendar,
  Layers,
  Phone,
  Mail,
  User,
  GraduationCap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BottomSheet } from '../common/BottomSheet';

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

  // Wizard Step: 1 = Basic Info, 2 = Plan, 3 = Shift & Seat, 4 = Payment & Confirmation
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [targetExam, setTargetExam] = useState('UPSC Civil Services');
  
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

  const selectedShift = shifts.find(s => s.id === shiftId);
  const selectedSeat = seats.find(s => s.id === seatId);

  const validateStep1 = () => {
    if (!fullName.trim()) return 'Please enter student full name';
    if (!phone.trim() || phone.length < 10) return 'Please enter a valid 10-digit mobile number';
    return null;
  };

  const handleNext = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      const err = validateStep1();
      if (err) {
        setErrorMsg(err);
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as any);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const res = addMember({
      fullName,
      phone,
      email: email || `${phone}@student.24library.in`,
      emergencyContact: emergencyContact || phone,
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
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      title={`Admission Wizard (${currentStep}/4)`}
      subtitle={`Enrolling scholar in ${currentBranch.name}`}
      maxWidth="580px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Step Progress Bar */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[1, 2, 3, 4].map(step => (
            <div
              key={step}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: step <= currentStep ? 'var(--brand-primary)' : 'var(--border-medium)',
                transition: 'background var(--transition-fast)'
              }}
            />
          ))}
        </div>

        {errorMsg && (
          <div 
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--status-danger-bg)',
              color: 'var(--status-danger)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangle size={16} /> {errorMsg}
          </div>
        )}

        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Step 1: Student Information
            </h4>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number (WhatsApp) *</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Competitive Exam / Goal</label>
              <select
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value)}
                className="form-select"
              >
                <option value="UPSC Civil Services">UPSC Civil Services</option>
                <option value="MPSC / State PSC">MPSC / State PSC</option>
                <option value="CA Final / Inter">CA Final / Inter</option>
                <option value="NEET PG / Medical">NEET PG / Medical</option>
                <option value="GATE / Engineering">GATE / Engineering</option>
                <option value="Banking / SSC CGL">Banking / SSC CGL</option>
                <option value="General Study">General Reading / Study</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="student@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Membership Plan */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Step 2: Choose Membership Plan
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {plans.map(plan => {
                const isSelected = plan.id === planId;
                return (
                  <div
                    key={plan.id}
                    onClick={() => handlePlanChange(plan.id)}
                    className="mobile-card mobile-card-interactive"
                    style={{
                      margin: 0,
                      padding: '14px',
                      border: `1.5px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                          {plan.name}
                        </h4>
                        <span className="badge badge-neutral">{plan.durationDays} Days</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {plan.description}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)' }}>
                        ₹{plan.basePrice}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Shift & Seat Allocation */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Step 3: Shift & Reserved Desk
            </h4>

            <div className="form-group">
              <label className="form-label">Preferred Study Shift *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {shifts.filter(s => s.branchId === currentBranch.id).map(shift => {
                  const isSelected = shift.id === shiftId;
                  return (
                    <button
                      type="button"
                      key={shift.id}
                      onClick={() => {
                        setShiftId(shift.id);
                        setSeatId('');
                      }}
                      className="quick-action-card"
                      style={{
                        margin: 0,
                        border: `1.5px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                        background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)',
                        minHeight: '64px',
                        padding: '10px'
                      }}
                    >
                      <span style={{ fontWeight: '700', color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                        {shift.name.split(' ')[0]}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {shift.startTime} - {shift.endTime}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Desk Assignment ({availableSeats.length} Available in this Shift)
              </label>
              <select
                value={seatId}
                onChange={(e) => setSeatId(e.target.value)}
                className="form-select"
              >
                <option value="">-- Floating / Assign Later --</option>
                {availableSeats.map(s => (
                  <option key={s.id} value={s.id}>
                    Desk {s.label} ({s.zone}) {s.powerSocket ? '⚡ Socket' : ''}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {seatId ? `✓ Desk ${selectedSeat?.label} locked for ${selectedShift?.name.split(' ')[0]} shift.` : 'Scholar can sit on any available floating seat.'}
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: Fee & Payment Settlement */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Step 4: Fee Settlement & Review
            </h4>

            {/* Admission Summary Card */}
            <div className="mobile-card" style={{ margin: 0, padding: '14px', background: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Scholar</span>
                <strong style={{ color: 'var(--text-primary)' }}>{fullName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Plan & Shift</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedPlan.name} • {selectedShift?.name.split(' ')[0]}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Desk Allocated</span>
                <strong style={{ color: 'var(--brand-primary)' }}>{selectedSeat ? `Desk ${selectedSeat.label} (${selectedSeat.zone})` : 'Floating'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '14px', fontWeight: '700' }}>Plan Total Fee</span>
                <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>₹{selectedPlan.basePrice}</strong>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Initial Amount Paid (₹) *</label>
              <input
                type="number"
                min="0"
                max={selectedPlan.basePrice}
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                className="form-input"
                required
              />
              <p style={{ fontSize: '11px', color: amountPaid < selectedPlan.basePrice ? 'var(--status-danger)' : 'var(--status-success)', marginTop: '4px' }}>
                {amountPaid < selectedPlan.basePrice ? `Remaining Due: ₹${selectedPlan.basePrice - amountPaid}` : '✓ Full fee paid'}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="form-select"
              >
                <option value="UPI_GPAY">Google Pay / PhonePe UPI</option>
                <option value="UPI_PAYTM">Paytm UPI / QR</option>
                <option value="CASH">Cash Reception</option>
                <option value="CARD">Debit / Credit Card POS</option>
                <option value="NETBANKING">Direct Bank Transfer</option>
              </select>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="btn-secondary"
              style={{ flex: 1, minHeight: '48px' }}
            >
              <ChevronLeft size={18} /> Back
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary"
              style={{ flex: 2, minHeight: '48px', fontSize: '15px' }}
            >
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 2, minHeight: '48px', fontSize: '15px', background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}
            >
              <CheckCircle2 size={18} /> Confirm & Enroll Scholar
            </button>
          )}
        </div>
      </form>
    </BottomSheet>
  );
};
