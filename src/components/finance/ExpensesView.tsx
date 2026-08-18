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
import { BottomSheet } from '../common/BottomSheet';

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

  // Add Expense Modal State
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Operating Expenses & P&L</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {currentBranch.name} • Overhead ledger & net operating margin
          </p>
        </div>

        <button 
          onClick={() => setShowModal(true)} 
          className="btn-primary"
          style={{ width: 'auto', minHeight: '40px', padding: '0 16px', fontSize: '13px' }}
        >
          <Plus size={16} /> + Log Expense
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <div className="mobile-card" style={{ margin: 0, padding: '14px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gross Revenue</span>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--status-success)', marginTop: '4px' }}>
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="mobile-card" style={{ margin: 0, padding: '14px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Expenses</span>
          <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--status-danger)', marginTop: '4px' }}>
            ₹{totalExpenses.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="mobile-card" style={{ margin: 0, padding: '14px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Net Margin</span>
          <div style={{ fontSize: '18px', fontWeight: '800', color: netMargin >= 0 ? 'var(--brand-primary)' : 'var(--status-danger)', marginTop: '4px' }}>
            ₹{netMargin.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Mobile Card List */}
      <div className="mobile-cards-container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {branchExpenses.map(exp => (
            <div 
              key={exp.id}
              className="mobile-card"
              style={{ margin: 0, padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{exp.title}</h4>
                  <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{exp.category}</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {exp.date} • {exp.paymentMethod}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <strong style={{ fontSize: '16px', color: 'var(--status-danger)' }}>
                  ₹{exp.amount.toLocaleString('en-IN')}
                </strong>
                <button
                  onClick={() => deleteExpense(exp.id)}
                  className="btn-ghost"
                  style={{ width: '32px', height: '32px', padding: 0, color: 'var(--status-danger)' }}
                  aria-label="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Data Table */}
      <div className="desktop-table-container">
        <div className="mobile-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Expense Item</th>
                <th>Category</th>
                <th>Date</th>
                <th>Mode</th>
                <th>Amount</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {branchExpenses.map(exp => (
                <tr key={exp.id}>
                  <td><strong>{exp.title}</strong></td>
                  <td><span className="badge badge-neutral">{exp.category}</span></td>
                  <td>{exp.date}</td>
                  <td>{exp.paymentMethod}</td>
                  <td><strong style={{ color: 'var(--status-danger)' }}>₹{exp.amount}</strong></td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => deleteExpense(exp.id)} className="btn-ghost" style={{ color: 'var(--status-danger)', minHeight: '30px' }}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Bottom Sheet */}
      {showModal && (
        <BottomSheet
          isOpen={true}
          onClose={() => setShowModal(false)}
          title="Log Operating Overhead"
          subtitle={`Adding expense to ${currentBranch.name}`}
        >
          <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Expense Description *</label>
              <input
                type="text"
                placeholder="e.g. Fiber Internet Bill 500Mbps"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="form-select"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
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
              <label className="form-label">Payment Mode</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="form-select"
              >
                <option value="UPI_GPAY">UPI / Bank Transfer</option>
                <option value="CASH">Cash Drawer</option>
                <option value="CARD">Company Card</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                Save Expense
              </button>
            </div>
          </form>
        </BottomSheet>
      )}
    </div>
  );
};
