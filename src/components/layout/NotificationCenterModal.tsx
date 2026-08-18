import React from 'react';
import { Bell, Clock, AlertTriangle, CheckCircle, CreditCard, Sparkles, CheckCheck } from 'lucide-react';
import { useLibrary } from '../../state/libraryStore';
import { BottomSheet } from '../common/BottomSheet';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose
}) => {
  const { notifications, members } = useLibrary();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EXPIRY_TODAY':
      case 'EXPIRY_REMINDER_3D':
      case 'EXPIRY_REMINDER_7D':
        return <AlertTriangle size={18} color="#f59e0b" />;
      case 'OVERDUE_ALERT':
        return <AlertTriangle size={18} color="#ef4444" />;
      case 'PAYMENT_RECEIPT':
        return <CreditCard size={18} color="#10b981" />;
      case 'SEAT_ASSIGNED':
        return <CheckCircle size={18} color="#3b82f6" />;
      default:
        return <Sparkles size={18} color="#a855f7" />;
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Center"
      subtitle={`${notifications.length} notifications`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <Bell size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>All caught up!</p>
            <p style={{ fontSize: '12px' }}>No new notifications at this time.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id}
              className="mobile-card"
              style={{ padding: '14px', margin: 0, display: 'flex', gap: '12px', alignItems: 'flex-start' }}
            >
              <div 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {getNotificationIcon(n.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700' }}>
                    {n.type.replace(/_/g, ' ')}
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={11} /> {n.sentAt.split('T')[1]?.slice(0, 5) || 'Just now'}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px', lineHeight: 1.4 }}>
                  {n.message}
                </p>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                    {n.memberName}
                  </span>
                  <span className="badge badge-info" style={{ fontSize: '10px' }}>
                    {n.channel}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </BottomSheet>
  );
};
