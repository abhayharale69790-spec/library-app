import React from 'react';
import { useLibrary } from '../../state/libraryStore';
import {
  LayoutDashboard,
  Armchair,
  Users,
  Clock3,
  QrCode,
  CreditCard,
  Receipt,
  GraduationCap,
  Sparkles,
  FlaskConical,
  Settings,
  BookOpenCheck,
  Building2,
  CalendarCheck
} from 'lucide-react';
import { getDaysRemaining } from '../../utils/dateMath';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { businessProfile, memberships, activeRole, currentBranch, isCloudConnected } = useLibrary();

  // Compute live badges
  const expiringCount = memberships.filter(m => {
    if (m.status !== 'ACTIVE' && m.status !== 'EXPIRING') return false;
    const days = getDaysRemaining(m.endDate);
    return days >= 0 && days <= 7;
  }).length;

  const overdueCount = memberships.filter(m => m.dueAmount > 0).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'seatmap', label: 'Seat Inventory', icon: Armchair },
    { id: 'members', label: 'Students Directory', icon: Users, badge: expiringCount > 0 ? `${expiringCount} Expiry` : undefined, badgeColor: 'var(--status-warning)' },
    { id: 'shifts', label: 'Shifts & Timings', icon: Clock3 },
    { id: 'gate', label: 'QR Gate Scanner', icon: QrCode, badge: 'Live', badgeColor: 'var(--status-info)' },
    { id: 'payments', label: 'Fee Collections', icon: CreditCard, badge: overdueCount > 0 ? `₹ Dues` : undefined, badgeColor: 'var(--status-danger)' },
    { id: 'expenses', label: 'Operating Expenses', icon: Receipt },
    { id: 'studentportal', label: 'Student Portal', icon: GraduationCap },
    { id: 'analytics', label: 'Reports & P&L', icon: Sparkles },
    { id: 'tests', label: '42-Scenario Suite', icon: FlaskConical, badge: '42 Tests', badgeColor: 'var(--brand-primary)' },
    { id: 'settings', label: 'Center Settings', icon: Settings },
  ];

  return (
    <aside 
      className="desktop-sidebar"
      style={{
        width: '240px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        flexShrink: 0,
      }}
    >
      {/* Brand Logo Header */}
      <div style={{
        padding: '20px 18px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, var(--brand-primary), #1d4ed8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: '800',
          fontSize: '16px',
          flexShrink: 0,
        }}>
          {businessProfile.shortName ? businessProfile.shortName.charAt(0) : '24'}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <h2 style={{
            fontSize: '15px',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {businessProfile.name || 'Study Point'}
          </h2>
          <span style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}>
            {businessProfile.type || 'Study Center'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{
        flex: 1,
        padding: '12px 10px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon 
                  size={17} 
                  color={isActive ? 'var(--brand-primary)' : 'currentColor'} 
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  color: item.badgeColor || 'var(--text-muted)',
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Profile & Status */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isCloudConnected ? 'var(--status-success)' : 'var(--brand-primary)',
          }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            {isCloudConnected ? 'Cloud Active' : 'Local Storage'}
          </span>
        </div>

        <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
          {activeRole}
        </span>
      </div>
    </aside>
  );
};
