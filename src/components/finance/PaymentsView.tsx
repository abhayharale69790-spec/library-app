import React, { useState } from 'react';
import { useLibrary } from '../../state/libraryStore';
import { PaymentMethod, Payment } from '../../types';
import {
  CreditCard,
  Plus,
  Receipt,
  Search,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Filter,
  DollarSign,
  Share2,
  Printer,
  ChevronRight,
  User
} from 'lucide-react';
import { formatDateDisplay } from '../../utils/dateMath';
import { BottomSheet } from '../common/BottomSheet';

export const PaymentsView: React.FC = () => {
  const {
    currentBranch,
    payments,
    members,
    memberships,
    recordPayment,
  } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  
  // Record Payment Modal State
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState<number>(1600);
  const [method, setMethod] = useState<PaymentMethod>('UPI_GPAY');
  const [refTxn, setRefTxn] = useState('');
  const [notes, setNotes] = useState('Membership fee collection');
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Completed Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<Payment | null>(null);

  // Financial calculations
  const branchMembers = members.filter(m => m.branchId === currentBranch.id);
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalDues = memberships.filter(m => m.branchId === currentBranch.id).reduce((sum, m) => sum + m.dueAmount, 0);
  const overdueMembers = memberships.filter(m => m.branchId === currentBranch.id && m.dueAmount > 0);

  // Selected member membership info
  const selectedMemberMembership = memberships.find(m => m.memberId === selectedMemberId && m.status !== 'CANCELLED');

  // Filtered Payments Table
  const filteredPayments = payments.filter(p => {
    if (methodFilter !== 'ALL' && p.method !== methodFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const mem = members.find(m => m.id === p.memberId);
      const matchName = (mem?.fullName || '').toLowerCase().includes(q);
      const matchReceipt = p.receiptNo.toLowerCase().includes(q);
      const matchRef = (p.referenceTxnId || '').toLowerCase().includes(q);
      if (!matchName && !matchReceipt && !matchRef) return false;
    }
    return true;
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setStatusNotice({ type: 'error', text: 'Please select a scholar.' });
      return;
    }

    const msh = memberships.find(m => m.memberId === selectedMemberId && m.status !== 'CANCELLED');
    if (!msh) {
      setStatusNotice({ type: 'error', text: 'Active membership not found for scholar.' });
      return;
    }

    const res = recordPayment(selectedMemberId, Number(amount), method, refTxn || undefined, notes);
    if (!res.success) {
      setStatusNotice({ type: 'error', text: res.error || 'Payment recording failed.' });
    } else {
      setStatusNotice({ type: 'success', text: `Receipt ${res.receipt?.receiptNo} recorded successfully!` });
      setShowCollectModal(false);
      if (res.receipt) {
        setActiveReceipt(res.receipt);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Fee Collections & Dues</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {currentBranch.name} • {payments.length} verified receipts recorded
          </p>
        </div>

        <button 
          onClick={() => setShowCollectModal(true)} 
          className="btn-primary" 
          style={{ width: 'auto', minHeight: '40px', padding: '0 16px', fontSize: '13px' }}
        >
          <Plus size={16} /> + Collect Fee
        </button>
      </div>

      {/* 2. KPI Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <div className="mobile-card" style={{ margin: 0, padding: '14px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Collected</span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--status-success)', marginTop: '4px' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>All time receipts</span>
        </div>

        <div className="mobile-card" style={{ margin: 0, padding: '14px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Dues</span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: totalDues > 0 ? 'var(--status-danger)' : 'var(--status-success)', marginTop: '4px' }}>
            ₹{totalDues.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{overdueMembers.length} scholars due</span>
        </div>

        <div className="mobile-card" style={{ margin: 0, padding: '14px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overdue Count</span>
          <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--status-warning)', marginTop: '4px' }}>
            {overdueMembers.length}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Follow-up needed</span>
        </div>
      </div>

      {/* 3. Big Action Button for Mobile */}
      <button
        onClick={() => setShowCollectModal(true)}
        className="btn-primary"
        style={{
          minHeight: '52px',
          fontSize: '15px',
          fontWeight: '700',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
        }}
      >
        <DollarSign size={20} /> COLLECT STUDENT PAYMENT
      </button>

      {/* 4. Search & Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search student, receipt number (e.g. RCP-2026-0081)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '38px', minHeight: '44px', fontSize: '14px' }}
          />
        </div>

        {/* Method Pills */}
        <div className="pill-selector">
          {[
            { id: 'ALL', label: 'All Modes' },
            { id: 'UPI_GPAY', label: 'Google Pay / UPI' },
            { id: 'CASH', label: 'Cash' },
            { id: 'CARD', label: 'Card POS' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setMethodFilter(f.id)}
              className={`pill-item ${methodFilter === f.id ? 'active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Mobile Cards View */}
      <div className="mobile-cards-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredPayments.map(p => {
            const member = members.find(m => m.id === p.memberId);
            return (
              <div
                key={p.id}
                onClick={() => setActiveReceipt(p)}
                className="mobile-card mobile-card-interactive"
                style={{
                  margin: 0,
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="mono" style={{ fontSize: '14px', fontWeight: '800', color: 'var(--brand-primary)' }}>
                      {p.receiptNo}
                    </span>
                    <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                      {p.method}
                    </span>
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginTop: '3px' }}>
                    {member?.fullName || 'Scholar'}
                  </h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {p.paymentDate}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--status-success)' }}>
                    ₹{p.amount.toLocaleString('en-IN')}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--brand-primary)', fontWeight: '600' }}>
                    View Receipt &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Desktop Data Table */}
      <div className="desktop-table-container">
        <div className="mobile-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Scholar</th>
                <th>Payment Date</th>
                <th>Method</th>
                <th>Amount</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(p => {
                const member = members.find(m => m.id === p.memberId);
                return (
                  <tr key={p.id}>
                    <td><span className="mono" style={{ color: 'var(--brand-primary)', fontWeight: '700' }}>{p.receiptNo}</span></td>
                    <td><strong>{member?.fullName || 'Scholar'}</strong></td>
                    <td>{p.paymentDate}</td>
                    <td><span className="badge badge-neutral">{p.method}</span></td>
                    <td><strong style={{ color: 'var(--status-success)' }}>₹{p.amount}</strong></td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => setActiveReceipt(p)} className="btn-secondary" style={{ minHeight: '32px', padding: '0 12px', fontSize: '12px' }}>
                        View Receipt
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Record Payment Bottom Sheet */}
      {showCollectModal && (
        <BottomSheet
          isOpen={true}
          onClose={() => setShowCollectModal(false)}
          title="Collect Student Payment"
          subtitle="Generate instant official digital fee receipt"
        >
          <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Select Scholar *</label>
              <select
                value={selectedMemberId}
                onChange={(e) => {
                  setSelectedMemberId(e.target.value);
                  const msh = memberships.find(m => m.memberId === e.target.value && m.status !== 'CANCELLED');
                  if (msh && msh.dueAmount > 0) {
                    setAmount(msh.dueAmount);
                  }
                }}
                className="form-select"
                required
              >
                <option value="">-- Choose student --</option>
                {branchMembers.map(m => {
                  const msh = memberships.find(x => x.memberId === m.id);
                  return (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.memberCode}) {msh && msh.dueAmount > 0 ? `- Due ₹${msh.dueAmount}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedMemberMembership && (
              <div style={{ padding: '10px 12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Plan Fee:</span>
                  <strong>₹{selectedMemberMembership.totalFee}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span>Already Paid:</span>
                  <strong>₹{selectedMemberMembership.paidAmount}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: selectedMemberMembership.dueAmount > 0 ? 'var(--status-danger)' : 'var(--status-success)' }}>
                  <span>Outstanding Due:</span>
                  <strong>₹{selectedMemberMembership.dueAmount}</strong>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Collection Amount (₹) *</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode *</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="form-select"
              >
                <option value="UPI_GPAY">Google Pay / PhonePe UPI</option>
                <option value="UPI_PAYTM">Paytm UPI</option>
                <option value="CASH">Cash Reception</option>
                <option value="CARD">Card POS</option>
                <option value="NETBANKING">Direct Bank Transfer</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Reference / UPI Txn ID (Optional)</label>
              <input
                type="text"
                placeholder="UPI / Bank Ref Number"
                value={refTxn}
                onChange={(e) => setRefTxn(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button type="button" onClick={() => setShowCollectModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 2, background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <CheckCircle2 size={18} /> Confirm & Issue Receipt
              </button>
            </div>
          </form>
        </BottomSheet>
      )}

      {/* 8. Digital Payment Receipt Bottom Sheet */}
      {activeReceipt && (
        <BottomSheet
          isOpen={true}
          onClose={() => setActiveReceipt(null)}
          title="Digital Payment Receipt"
          subtitle={activeReceipt.receiptNo}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div 
              style={{
                padding: '20px 16px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), var(--bg-card))',
                border: '1.5px solid var(--status-success)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center'
              }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--status-success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px auto' }}>
                <CheckCircle2 size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--status-success)' }}>
                ✓ PAYMENT SUCCESSFUL
              </h3>
              <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)', margin: '8px 0' }}>
                ₹{activeReceipt.amount.toLocaleString('en-IN')}
              </div>
              <span className="mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Receipt: {activeReceipt.receiptNo}
              </span>
            </div>

            <div className="mobile-card" style={{ margin: 0, padding: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Scholar:</span>
                <strong>{members.find(m => m.id === activeReceipt.memberId)?.fullName || 'Scholar'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>
                <strong>{activeReceipt.paymentDate}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Mode:</span>
                <span className="badge badge-info">{activeReceipt.method}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Branch:</span>
                <strong>{currentBranch.name}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={() => {
                  window.print();
                }}
                className="btn-secondary"
                style={{ flex: 1, minHeight: '44px' }}
              >
                <Printer size={16} /> Print Receipt
              </button>
              <button
                onClick={() => setActiveReceipt(null)}
                className="btn-primary"
                style={{ flex: 1, minHeight: '44px' }}
              >
                Done
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};
