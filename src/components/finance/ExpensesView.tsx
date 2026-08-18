import React, { useState } from 'react';
import { useLibrary } from '../../state/libraryStore';
import { ExpenseCategory } from '../../types';
import {
  Receipt,
  Plus,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Trash2,
  Calendar,
  Building2,
  PieChart
} from 'lucide-react';
import { formatDateDisplay, getTodayString } from '../../utils/dateMath';

export const ExpensesView: React.FC = () => {
  const {
    currentBranch,
    expenses,
    payments,
    addExpense,
    deleteExpense,
  } = useLibrary();

  const branchExpenses = expenses.filter(e => e.branchId === currentBranch.id);
  const totalExpenses = branchExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const netMargin = totalRevenue - totalExpenses;

  // Add Expense Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('ELECTRICITY');
  const [amount, setAmount] = useState<number>(5000);
  const [method, setMethod] = useState('UPI_GPAY');
  const [date, setDate] = useState(getTodayString());
  const [receiptRef, setReceiptRef] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addExpense({
      branchId: currentBranch.id,
      title: title.trim(),
      category,
      amount: Number(amount),
      date,
      paymentMethod: method,
      recordedBy: 'Admin Desk',
      receiptRef: receiptRef.trim() || undefined,
    });

    setShowModal(false);
    setTitle('');
  };

  const categories: ExpenseCategory[] = [
    'RENT',
    'ELECTRICITY',
    'WIFI_INTERNET',
    'CLEANING',
    'MAINTENANCE',
    'SALARY',
    'TEA_COFFEE',
    'OTHER',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Operating Expenses & P&L</h1>
          <p style={{ fontSize: '13px', marginTop: '2px' }}>Track overheads, utility bills, maintenance and net operating margin</p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm" style={{ gap: '6px' }}>
          <Plus size={16} />
          <span>Record Expense</span>
        </button>
      </div>

      {/* P&L Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL REVENUE</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--status-success)', marginTop: '8px' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>Gross collections</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-danger)' }}>TOTAL OPERATING EXPENSES</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--status-danger)', marginTop: '8px' }}>
            ₹{totalExpenses.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>Rent, utilities & overheads</div>
        </div>

        <div className="card">
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>NET OPERATING PROFIT / LOSS</div>
          <div style={{
            fontSize: '26px',
            fontWeight: 800,
            color: netMargin >= 0 ? 'var(--status-success)' : 'var(--status-danger)',
            marginTop: '8px',
          }}>
            ₹{netMargin.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11.5px', color: netMargin >= 0 ? 'var(--status-success)' : 'var(--status-danger)', marginTop: '4px' }}>
            {netMargin >= 0 ? 'Profitable operation' : 'Overhead deficit'}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left', fontSize: '11.5px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Expense Item</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Amount</th>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>Payment Mode</th>
                <th style={{ padding: '12px 16px' }}>Recorded By</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {branchExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No operating expenses recorded yet.
                  </td>
                </tr>
              ) : (
                branchExpenses.map(exp => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{exp.title}</strong>
                      {exp.receiptRef && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ref: {exp.receiptRef}</div>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{exp.category}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--status-danger)', fontSize: '14px' }}>
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{formatDateDisplay(exp.date)}</td>
                    <td style={{ padding: '12px 16px' }}>{exp.paymentMethod}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{exp.recordedBy}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--status-danger)', padding: '4px 6px' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '17px', fontWeight: 800 }}>Record Operational Expense</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Expense Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Monthly Power & Split AC Bill"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Category</label>
                  <select
                    className="form-control"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Amount (₹) *</label>
                    <input
                      type="number"
                      required
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
                      onChange={(e) => setMethod(e.target.value)}
                    >
                      <option value="UPI_GPAY">Google Pay (UPI)</option>
                      <option value="UPI_PHONEPE">PhonePe (UPI)</option>
                      <option value="NETBANKING">Net Banking</option>
                      <option value="CASH">Cash Voucher</option>
                      <option value="CARD">Credit Card</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Bill / Receipt Ref</label>
                    <input
                      type="text"
                      placeholder="e.g. ADANI-PWR-8812"
                      className="form-control"
                      value={receiptRef}
                      onChange={(e) => setReceiptRef(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">Cancel</button>
                <button type="submit" className="btn btn-danger btn-sm">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
