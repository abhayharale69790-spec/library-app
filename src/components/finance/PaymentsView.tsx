import React, { useState } from 'react';
import { useLibrary } from '../../state/libraryStore';
import { PaymentMethod } from '../../types';
import {
  CreditCard,
  Plus,
  Receipt,
  Search,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Filter,
  DollarSign
} from 'lucide-react';
import { formatDateDisplay } from '../../utils/dateMath';

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
  
  // Record Payment Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [amount, setAmount] = useState<number>(1600);
  const [method, setMethod] = useState<PaymentMethod>('UPI_GPAY');
  const [refTxn, setRefTxn] = useState('');
  const [notes, setNotes] = useState('Membership fee collection');
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Financial calculations
  const branchMembers = members.filter(m => m.branchId === currentBranch.id);
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalDues = memberships.filter(m => m.branchId === currentBranch.id).reduce((sum, m) => sum + m.dueAmount, 0);

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

    const res = recordPayment(selectedMemberId, amount, method, refTxn || undefined, notes);
    if (!res.success) {
      setStatusNotice({ type: 'error', text: res.error || 'Payment recording failed.' });
    } else {
      setStatusNotice({ type: 'success', text: `Receipt ${res.receipt?.receiptNo} recorded successfully!` });
      setTimeout(() => {
        setStatusNotice(null);
        setShowModal(false);
      }, 1200);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Fee Collections & Dues</h1>
          <p style={{ fontSize: '13px', marginTop: '2px' }}>Audit log of membership payments, receipts, and outstanding student balances</p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
          <Plus size={16} />
          <span>Record Payment</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL REVENUE COLLECTED</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--status-success)', marginTop: '8px' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>Across {payments.length} verified receipts</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-danger)' }}>OUTSTANDING DUES BALANCE</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--status-danger)', marginTop: '8px' }}>
            ₹{totalDues.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>Across {memberships.filter(m => m.dueAmount > 0).length} scholars with pending dues</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by student name, receipt number (e.g. RCP-2026), txn ID..."
            className="form-control"
            style={{ paddingLeft: '36px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="form-control"
          style={{ width: 'auto' }}
        >
          <option value="ALL">All Payment Methods</option>
          <option value="UPI_GPAY">Google Pay (UPI)</option>
          <option value="UPI_PHONEPE">PhonePe (UPI)</option>
          <option value="UPI_PAYTM">Paytm (UPI)</option>
          <option value="CASH">Cash</option>
          <option value="CARD">Credit / Debit Card</option>
          <option value="NETBANKING">Net Banking</option>
        </select>
      </div>

      {/* Receipts Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left', fontSize: '11.5px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Receipt #</th>
                <th style={{ padding: '12px 16px' }}>Scholar</th>
                <th style={{ padding: '12px 16px' }}>Amount</th>
                <th style={{ padding: '12px 16px' }}>Method</th>
                <th style={{ padding: '12px 16px' }}>Date & Time</th>
                <th style={{ padding: '12px 16px' }}>Notes & Ref</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No payment receipts found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => {
                  const mem = members.find(m => m.id === p.memberId);

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td className="mono" style={{ padding: '12px 16px', fontWeight: 700 }}>{p.receiptNo}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700 }}>{mem?.fullName || 'Scholar'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{mem?.memberCode}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--status-success)', fontSize: '14px' }}>
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{p.method}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{p.paymentDate}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                        {p.notes || '—'} {p.referenceTxnId ? `(Ref: ${p.referenceTxnId})` : ''}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => alert(`24LIBRARY TAX INVOICE / RECEIPT\nReceipt: ${p.receiptNo}\nScholar: ${mem?.fullName}\nAmount: ₹${p.amount}\nMode: ${p.method}\nDate: ${p.paymentDate}\nStatus: Verified Cleared`)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          <Receipt size={13} />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '17px', fontWeight: 800 }}>Record Fee Collection</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {statusNotice && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: statusNotice.type === 'error' ? 'var(--status-danger-bg)' : 'var(--status-success-bg)',
                    color: statusNotice.type === 'error' ? 'var(--status-danger)' : 'var(--status-success)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}>
                    {statusNotice.text}
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Select Scholar</label>
                  <select
                    className="form-control"
                    value={selectedMemberId}
                    onChange={(e) => {
                      setSelectedMemberId(e.target.value);
                      const msh = memberships.find(m => m.memberId === e.target.value);
                      if (msh && msh.dueAmount > 0) {
                        setAmount(msh.dueAmount);
                      }
                    }}
                  >
                    <option value="">-- Choose student --</option>
                    {branchMembers.map(m => {
                      const msh = memberships.find(mem => mem.memberId === m.id);
                      return (
                        <option key={m.id} value={m.id}>
                          {m.fullName} ({m.memberCode}) {msh?.dueAmount ? `• ₹${msh.dueAmount} Due` : '• Fully Paid'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Amount Collecting (₹)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-control"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="UPI_GPAY">Google Pay (UPI)</option>
                    <option value="UPI_PHONEPE">PhonePe (UPI)</option>
                    <option value="UPI_PAYTM">Paytm (UPI)</option>
                    <option value="CASH">Cash at Desk</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="NETBANKING">Net Banking</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Transaction Reference (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI-AXIS-992817"
                    className="form-control"
                    value={refTxn}
                    onChange={(e) => setRefTxn(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save & Issue Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
