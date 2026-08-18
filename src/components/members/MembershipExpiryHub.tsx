import React, { useState } from 'react';
import { useLibrary } from '../../state/libraryStore';
import { 
  AlertTriangle, 
  Clock, 
  Send, 
  RefreshCw, 
  User, 
  MessageSquare, 
  Calendar, 
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { getDaysRemaining } from '../../utils/dateMath';

interface MembershipExpiryHubProps {
  onOpenMemberDetail: (memberId: string) => void;
}

export const MembershipExpiryHub: React.FC<MembershipExpiryHubProps> = ({
  onOpenMemberDetail
}) => {
  const {
    currentBranch,
    members,
    memberships,
    plans,
    sendWhatsAppNotification,
  } = useLibrary();

  const [activeCategory, setActiveCategory] = useState<'TODAY' | '3DAYS' | '7DAYS' | 'EXPIRED'>('3DAYS');

  const branchMembers = members.filter(m => m.branchId === currentBranch.id);

  // Categorized Buckets
  const expiresToday: { member: typeof members[0]; membership: typeof memberships[0]; days: number }[] = [];
  const expires3Days: { member: typeof members[0]; membership: typeof memberships[0]; days: number }[] = [];
  const expires7Days: { member: typeof members[0]; membership: typeof memberships[0]; days: number }[] = [];
  const expired: { member: typeof members[0]; membership: typeof memberships[0]; days: number }[] = [];

  branchMembers.forEach(member => {
    const msh = memberships.find(m => m.memberId === member.id && m.status !== 'CANCELLED');
    if (!msh) return;
    const days = getDaysRemaining(msh.endDate);

    if (days < 0 || msh.status === 'EXPIRED') {
      expired.push({ member, membership: msh, days });
    } else if (days === 0) {
      expiresToday.push({ member, membership: msh, days });
    } else if (days > 0 && days <= 3) {
      expires3Days.push({ member, membership: msh, days });
    } else if (days > 3 && days <= 7) {
      expires7Days.push({ member, membership: msh, days });
    }
  });

  const getActiveList = () => {
    switch (activeCategory) {
      case 'TODAY': return expiresToday;
      case '3DAYS': return expires3Days;
      case '7DAYS': return expires7Days;
      case 'EXPIRED': return expired;
    }
  };

  const activeList = getActiveList();

  const handleWhatsApp = (memberId: string, type: 'EXPIRY_TODAY' | 'EXPIRY_REMINDER_3D' | 'EXPIRY_REMINDER_7D') => {
    const { url } = sendWhatsAppNotification(memberId, type);
    window.open(url, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Membership Expiry Manager</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          Proactive student retention, renewal nudges, and WhatsApp reminders
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="pill-selector">
        {[
          { id: 'TODAY', label: `Expires Today (${expiresToday.length})`, color: 'var(--status-danger)' },
          { id: '3DAYS', label: `In ≤3 Days (${expires3Days.length})`, color: 'var(--status-warning)' },
          { id: '7DAYS', label: `In ≤7 Days (${expires7Days.length})`, color: 'var(--brand-primary)' },
          { id: 'EXPIRED', label: `Expired (${expired.length})`, color: 'var(--text-muted)' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`pill-item ${activeCategory === cat.id ? 'active' : ''}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* List of Scholars in Selected Category */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {activeList.map(({ member, membership, days }) => {
          const plan = plans.find(p => p.id === membership.planId);

          return (
            <div
              key={member.id}
              className="mobile-card"
              style={{
                margin: 0,
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div 
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--brand-primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700'
                    }}
                  >
                    {member.fullName.charAt(0)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '700' }}>{member.fullName}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {member.memberCode} • {plan?.name || 'Standard'}
                    </p>
                  </div>
                </div>

                <span className={`badge ${days === 0 ? 'badge-danger' : days <= 3 ? 'badge-warning' : 'badge-neutral'}`}>
                  {days < 0 ? 'Expired' : days === 0 ? 'Expires Today' : `${days} Days Left`}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Valid until: <strong style={{ color: 'var(--text-primary)' }}>{membership.endDate}</strong>
                </span>
                {membership.dueAmount > 0 && (
                  <span className="badge badge-danger">Due: ₹{membership.dueAmount}</span>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => onOpenMemberDetail(member.id)}
                  className="btn-primary"
                  style={{ flex: 1, minHeight: '38px', fontSize: '13px' }}
                >
                  <RefreshCw size={14} /> Renew Pass
                </button>

                <button
                  onClick={() => handleWhatsApp(member.id, days <= 0 ? 'EXPIRY_TODAY' : days <= 3 ? 'EXPIRY_REMINDER_3D' : 'EXPIRY_REMINDER_7D')}
                  className="btn-secondary"
                  style={{ minHeight: '38px', padding: '0 12px', color: '#25D366' }}
                  title="Send WhatsApp Nudge"
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>
          );
        })}

        {activeList.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="var(--status-success)" style={{ marginBottom: '10px' }} />
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              No memberships in this category!
            </p>
            <p style={{ fontSize: '12px', marginTop: '2px' }}>All subscriptions are active and well ahead of expiry.</p>
          </div>
        )}
      </div>
    </div>
  );
};
