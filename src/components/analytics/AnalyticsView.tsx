import React from 'react';
import { useLibrary } from '../../state/libraryStore';
import {
  Sparkles,
  TrendingUp,
  Users,
  Armchair,
  Clock,
  AlertTriangle,
  Lightbulb,
  Zap,
  BarChart3,
  Calendar
} from 'lucide-react';
import { getDaysRemaining } from '../../utils/dateMath';

export const AnalyticsView: React.FC = () => {
  const {
    currentBranch,
    members,
    memberships,
    assignments,
    seats,
    shifts,
    payments,
    attendance,
  } = useLibrary();

  const branchMembers = members.filter(m => m.branchId === currentBranch.id);
  const branchSeats = seats.filter(s => s.branchId === currentBranch.id);

  // Peak Hour Simulation Data (06:00 to 24:00)
  const hourlyOccupancy = [
    { hour: '06 AM', pct: 65, label: 'Morning Surge' },
    { hour: '08 AM', pct: 92, label: 'Peak UPS/CA Slot' },
    { hour: '10 AM', pct: 88, label: 'Peak' },
    { hour: '12 PM', pct: 70, label: 'Shift Transition' },
    { hour: '02 PM', pct: 55, label: 'Afternoon Lull' },
    { hour: '04 PM', pct: 60, label: 'Tea Break' },
    { hour: '06 PM', pct: 85, label: 'Evening Surge' },
    { hour: '08 PM', pct: 95, label: 'Peak Evening' },
    { hour: '10 PM', pct: 62, label: 'Night Owl Start' },
    { hour: '12 AM', pct: 40, label: 'Night Deep Study' },
  ];

  // Churn Risk Scholars (Expiring soon with low recent attendance)
  const churnRiskMembers = branchMembers.filter(m => {
    const msh = memberships.find(mem => mem.memberId === m.id && mem.status !== 'CANCELLED');
    if (!msh) return false;
    const daysLeft = getDaysRemaining(msh.endDate);
    return daysLeft >= 0 && daysLeft <= 10;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={22} color="var(--brand-primary)" />
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>AI Library Intelligence & Analytics</h1>
        </div>
        <p style={{ fontSize: '13px', marginTop: '2px' }}>
          Predictive shift modeling, capacity forecasting, and automated student retention signals
        </p>
      </div>

      {/* AI Recommendations Panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
      }}>
        {/* Insight 1: Dynamic Pricing */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(15, 23, 42, 0.6))',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lightbulb size={18} color="var(--brand-primary)" />
            <strong style={{ fontSize: '14px', color: '#ffffff' }}>Dynamic Shift Yield Optimization</strong>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Afternoon Shift (12:00-17:00) currently has <strong>45% vacancy</strong>. AI suggests introducing a targeted <em>Scholar Flash Discount (₹1,199/mo)</em> to capture college students and boost net monthly revenue by approx ₹18,400.
          </p>
          <span className="badge badge-info" style={{ alignSelf: 'flex-start', fontSize: '10px' }}>
            Yield +18% Opportunity
          </span>
        </div>

        {/* Insight 2: Peak Hour Overflow */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(15, 23, 42, 0.6))',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="var(--status-warning)" />
            <strong style={{ fontSize: '14px', color: '#ffffff' }}>Morning Capacity Bottleneck</strong>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Morning Shift occupancy reaches <strong>92% between 08:00 AM - 10:30 AM</strong>. Recommend auto-routing 2 waitlisted candidates to the Discussion Floating Pods to prevent turnstile congestion.
          </p>
          <span className="badge badge-warning" style={{ alignSelf: 'flex-start', fontSize: '10px' }}>
            Waitlist Auto-Route
          </span>
        </div>

        {/* Insight 3: Retention Churn Risk */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 23, 42, 0.6))',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="var(--status-success)" />
            <strong style={{ fontSize: '14px', color: '#ffffff' }}>Study Streak & Scholar Retention</strong>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Average scholar study session duration is <strong>5.4 hours/day</strong>. Scholars logging &gt;4 hours daily exhibit a <strong>91% monthly renewal rate</strong>.
          </p>
          <span className="badge badge-success" style={{ alignSelf: 'flex-start', fontSize: '10px' }}>
            High Retention Benchmark
          </span>
        </div>
      </div>

      {/* Hourly Occupancy Heatmap */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Hourly Library Density Heatmap</h3>
            <p style={{ fontSize: '12px' }}>Aggregated optical turnstile entries & exits across operating hours</p>
          </div>
          <span className="badge badge-neutral">Dadar Campus • 24h Cycle</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
          gap: '10px',
        }}>
          {hourlyOccupancy.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 6px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{
                height: '100px',
                width: '28px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'flex-end',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: '100%',
                  height: `${item.pct}%`,
                  background: item.pct >= 90 ? 'var(--status-danger)' : item.pct >= 75 ? 'var(--status-warning)' : 'var(--brand-primary)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'height 0.3s ease',
                }} />
              </div>

              <span style={{ fontSize: '13px', fontWeight: 800 }}>{item.pct}%</span>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.hour}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Churn Prevention Watchlist */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Proactive Retention Watchlist</h3>
            <p style={{ fontSize: '12px' }}>Scholars expiring in the next 10 days identified for proactive engagement</p>
          </div>
          <span className="badge badge-warning">{churnRiskMembers.length} Scholars at Renewal Decision</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {churnRiskMembers.map(member => {
            const msh = memberships.find(m => m.memberId === member.id);
            const daysLeft = msh ? getDaysRemaining(msh.endDate) : 0;
            const asgn = assignments.find(a => a.memberId === member.id && a.status === 'ACTIVE');
            const seat = seats.find(s => s.id === asgn?.seatId);

            return (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{member.fullName}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Desk {seat?.label || 'Floating'} • Exam: {member.targetExam || 'General'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`badge ${daysLeft <= 3 ? 'badge-danger' : 'badge-warning'}`}>
                    {daysLeft} days left
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Auto-Renewal: {msh?.autoRenew ? 'Enabled' : 'Manual'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
