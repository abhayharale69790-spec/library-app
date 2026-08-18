import React, { useState } from 'react';
import { useLibrary } from '../../state/libraryStore';
import { BusinessType, SeatNamingStyle, SetupWizardData } from '../../types';
import { 
  Building2, 
  MapPin, 
  Armchair, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Trash2,
  Sparkles,
  Zap,
  Phone,
  MessageSquare,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BottomSheet } from '../common/BottomSheet';

interface SetupWizardModalProps {
  onClose: () => void;
  onComplete?: () => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({ onClose, onComplete }) => {
  const {
    businessProfile,
    currentBranch,
    completeSetupWizard,
  } = useLibrary();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // STEP 1 — BUSINESS
  const [businessName, setBusinessName] = useState(businessProfile.name || '');
  const [businessType, setBusinessType] = useState<BusinessType>(businessProfile.type || 'Study Center');
  const [shortName, setShortName] = useState(businessProfile.shortName || '');
  const [logoUrl, setLogoUrl] = useState(businessProfile.logoUrl || '');
  const [phone, setPhone] = useState(businessProfile.phone || '');
  const [whatsapp, setWhatsapp] = useState(businessProfile.whatsapp || '');
  const [address, setAddress] = useState(businessProfile.address || '');

  // STEP 2 — BRANCH
  const [branchName, setBranchName] = useState(currentBranch.name || 'Main Reading Center');

  // STEP 3 — SEATS
  const [totalSeats, setTotalSeats] = useState<number>(70);
  const [seatNamingStyle, setSeatNamingStyle] = useState<SeatNamingStyle>('ALPHA_NUMERIC');
  const [customPrefix, setCustomPrefix] = useState<string>('D-');

  // STEP 4 — SHIFTS
  const [shifts, setShifts] = useState<{ name: string; startTime: string; endTime: string; defaultPrice: number }[]>([
    { name: 'Morning Shift', startTime: '06:00', endTime: '12:00', defaultPrice: 1500 },
    { name: 'Evening Shift', startTime: '17:00', endTime: '22:00', defaultPrice: 1700 },
    { name: 'Full Day (24h)', startTime: '06:00', endTime: '23:00', defaultPrice: 2500 },
  ]);

  // STEP 5 — PLANS
  const [plans, setPlans] = useState<{ name: string; durationDays: number; basePrice: number }[]>([
    { name: 'Monthly Standard', durationDays: 30, basePrice: 1500 },
    { name: 'Quarterly Scholar', durationDays: 90, basePrice: 4000 },
    { name: 'Annual Pro Pass', durationDays: 365, basePrice: 14000 },
  ]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!businessName.trim()) {
        setErrorMsg('Please enter your business / study center name');
        return;
      }
      if (!phone.trim()) {
        setErrorMsg('Please enter your contact phone number');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!branchName.trim()) {
        setErrorMsg('Please enter your branch or center name');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (totalSeats < 1) {
        setErrorMsg('Please enter a valid seat count (at least 1)');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (shifts.length === 0) {
        setErrorMsg('Please keep at least one study shift');
        return;
      }
      setStep(5);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (step > 1) {
      setStep((step - 1) as any);
    }
  };

  const handleAddShift = () => {
    setShifts(prev => [...prev, {
      name: `Shift ${prev.length + 1}`,
      startTime: '12:00',
      endTime: '17:00',
      defaultPrice: 1500,
    }]);
  };

  const handleRemoveShift = (index: number) => {
    if (shifts.length <= 1) return;
    setShifts(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddPlan = () => {
    setPlans(prev => [...prev, {
      name: `Custom Plan ${prev.length + 1}`,
      durationDays: 60,
      basePrice: 2800,
    }]);
  };

  const handleRemovePlan = (index: number) => {
    if (plans.length <= 1) return;
    setPlans(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinish = () => {
    const wizardData: SetupWizardData = {
      businessName: businessName.trim(),
      businessType,
      shortName: shortName.trim() || businessName.slice(0, 3).toUpperCase(),
      logoUrl: logoUrl.trim() || undefined,
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      address: address.trim(),
      branchName: branchName.trim(),
      totalSeats: Number(totalSeats),
      seatNamingStyle,
      customPrefix: customPrefix.trim() || 'D-',
      shifts,
      plans,
    };

    completeSetupWizard(wizardData);

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}

    if (onComplete) onComplete();
    onClose();
  };

  return (
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      title={`Quick Setup Wizard (${step}/5)`}
      subtitle="Configure your study center in 10 minutes"
      maxWidth="600px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[1, 2, 3, 4, 5].map(s => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: s <= step ? 'var(--brand-primary)' : 'var(--border-medium)',
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
              fontWeight: 600
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* STEP 1: BUSINESS IDENTITY */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={20} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Step 1: Your Business Identity</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              This identity will appear on headers, student passes, receipts, and WhatsApp messages.
            </p>

            <div className="form-group">
              <label className="form-label">Business / Study Center Name *</label>
              <input
                type="text"
                placeholder="e.g. Harale Digital Study Point"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="form-input"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business Type</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value as BusinessType)}
                className="form-select"
              >
                <option value="Library">Library</option>
                <option value="Study Center">Study Center</option>
                <option value="Reading Room">Reading Room</option>
                <option value="Study Hall">Study Hall</option>
                <option value="Abhyasika">Abhyasika (अभ्यासिका)</option>
                <option value="Co-Learning Space">Co-Learning Space</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">Short Code (Prefix)</label>
                <input
                  type="text"
                  placeholder="e.g. HDSP"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value.toUpperCase())}
                  className="form-input"
                  maxLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone *</label>
                <input
                  type="tel"
                  placeholder="e.g. 9820024240"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp Number (For Instant Alerts)</label>
              <input
                type="tel"
                placeholder="e.g. 9820024240"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Physical Address</label>
              <input
                type="text"
                placeholder="Floor, Building, Landmark, City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        )}

        {/* STEP 2: BRANCH SETUP */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={20} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Step 2: Primary Branch / Center</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              You can add more branches later with separate seats, shifts, and prices.
            </p>

            <div className="form-group">
              <label className="form-label">Branch / Center Name *</label>
              <input
                type="text"
                placeholder="e.g. Main Branch, Dadar Center, Pune Hall"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="form-input"
                required
                autoFocus
              />
            </div>
          </div>
        )}

        {/* STEP 3: SEATS BULK GENERATOR */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Armchair size={20} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Step 3: Desk Capacity & Naming</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              We will automatically create your desks in 1 click so you don't have to add them one by one!
            </p>

            <div className="form-group">
              <label className="form-label">Total Desk Capacity *</label>
              <input
                type="number"
                min="1"
                max="500"
                value={totalSeats}
                onChange={(e) => setTotalSeats(Number(e.target.value))}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Desk Naming Format</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { id: 'ALPHA_NUMERIC', title: 'Alpha-Numeric', example: 'A-01, A-02, B-01, B-02...' },
                  { id: 'NUMERIC', title: 'Simple Numbers', example: '01, 02, 03, 04... 70' },
                  { id: 'CUSTOM', title: 'Custom Prefix', example: `${customPrefix}01, ${customPrefix}02...` },
                ].map(opt => {
                  const isSelected = seatNamingStyle === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setSeatNamingStyle(opt.id as any)}
                      className="mobile-card mobile-card-interactive"
                      style={{
                        margin: 0,
                        padding: '12px',
                        border: `1.5px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                        background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '14px', color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                          {opt.title}
                        </strong>
                        <span className="mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {opt.example}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {seatNamingStyle === 'CUSTOM' && (
              <div className="form-group">
                <label className="form-label">Custom Prefix</label>
                <input
                  type="text"
                  value={customPrefix}
                  onChange={(e) => setCustomPrefix(e.target.value)}
                  className="form-input"
                  placeholder="e.g. D-, SEAT-, CAB-"
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 4: SHIFTS */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="var(--brand-primary)" />
                <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Step 4: Operational Shifts</h3>
              </div>
              <button
                type="button"
                onClick={handleAddShift}
                className="btn-secondary"
                style={{ width: 'auto', minHeight: '32px', padding: '0 10px', fontSize: '12px' }}
              >
                <Plus size={14} /> Add Shift
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {shifts.map((sh, idx) => (
                <div key={idx} className="mobile-card" style={{ margin: 0, padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={sh.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setShifts(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                      }}
                      className="form-input"
                      style={{ minHeight: '34px', fontSize: '13px', fontWeight: '700', flex: 1, marginRight: '8px' }}
                    />
                    {shifts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveShift(idx)}
                        className="btn-ghost"
                        style={{ color: 'var(--status-danger)', width: '32px', height: '32px', padding: 0 }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Start</span>
                      <input
                        type="time"
                        value={sh.startTime}
                        onChange={(e) => {
                          const val = e.target.value;
                          setShifts(prev => prev.map((item, i) => i === idx ? { ...item, startTime: val } : item));
                        }}
                        className="form-input"
                        style={{ minHeight: '34px', fontSize: '12px', padding: '4px' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>End</span>
                      <input
                        type="time"
                        value={sh.endTime}
                        onChange={(e) => {
                          const val = e.target.value;
                          setShifts(prev => prev.map((item, i) => i === idx ? { ...item, endTime: val } : item));
                        }}
                        className="form-input"
                        style={{ minHeight: '34px', fontSize: '12px', padding: '4px' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Price (₹)</span>
                      <input
                        type="number"
                        value={sh.defaultPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setShifts(prev => prev.map((item, i) => i === idx ? { ...item, defaultPrice: val } : item));
                        }}
                        className="form-input"
                        style={{ minHeight: '34px', fontSize: '12px', padding: '4px' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: MEMBERSHIP PLANS */}
        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} color="var(--brand-primary)" />
                <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Step 5: Membership Packages</h3>
              </div>
              <button
                type="button"
                onClick={handleAddPlan}
                className="btn-secondary"
                style={{ width: 'auto', minHeight: '32px', padding: '0 10px', fontSize: '12px' }}
              >
                <Plus size={14} /> Add Plan
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {plans.map((pl, idx) => (
                <div key={idx} className="mobile-card" style={{ margin: 0, padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={pl.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPlans(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                      }}
                      className="form-input"
                      style={{ minHeight: '34px', fontSize: '13px', fontWeight: '700', flex: 1, marginRight: '8px' }}
                    />
                    {plans.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlan(idx)}
                        className="btn-ghost"
                        style={{ color: 'var(--status-danger)', width: '32px', height: '32px', padding: 0 }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Duration (Days)</span>
                      <input
                        type="number"
                        value={pl.durationDays}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPlans(prev => prev.map((item, i) => i === idx ? { ...item, durationDays: val } : item));
                        }}
                        className="form-input"
                        style={{ minHeight: '34px', fontSize: '12px' }}
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Fee (₹)</span>
                      <input
                        type="number"
                        value={pl.basePrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPlans(prev => prev.map((item, i) => i === idx ? { ...item, basePrice: val } : item));
                        }}
                        className="form-input"
                        style={{ minHeight: '34px', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="btn-secondary"
              style={{ flex: 1, minHeight: '48px' }}
            >
              <ChevronLeft size={18} /> Back
            </button>
          )}

          {step < 5 ? (
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
              type="button"
              onClick={handleFinish}
              className="btn-primary"
              style={{
                flex: 2,
                minHeight: '48px',
                fontSize: '15px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              }}
            >
              <CheckCircle2 size={18} /> Finish & Start Using App
            </button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};
