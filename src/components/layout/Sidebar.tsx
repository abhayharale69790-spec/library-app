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
  const { memberships, activeRole, currentBranch, isCloudConnected } = useLibrary();

  // Compute live badges
  const expiringCount = memberships.filter(m => {
    if (m.status !== 'ACTIVE' && m.status !== 'EXPIRING') return false;
    const days = getDaysRemaining(m.endDate);
    return days >= 0 && days <= 7;
  }).length;

  const overdueCount = memberships.filter(m => m.dueAmount > 0).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'seatmap', label: 'Shift Seat Map', icon: Armchair },
    { id: 'members', label: 'Members Directory', icon: Users, badge: expiringCount > 0 ? `${expiringCount} Expiry` : undefined, badgeColor: 'var(--status-warning)' },
    { id: 'shifts', label: 'Shifts & Timings', icon: Clock3 },
    { id: 'gate', label: 'QR Gate Hardware', icon: QrCode, badge: 'Live', badgeColor: 'var(--status-info)' },
    { id: 'payments', label: 'Payments & Dues', icon: CreditCard, badge: overdueCount > 0 ? `₹ Dues` : undefined, badgeColor: 'var(--status-danger)' },
    { id: 'expenses', label: 'Expenses & P&L', icon: Receipt },
    { id: 'studentportal', label: 'Student Self-Portal', icon: GraduationCap },
    { id: 'analytics', label: 'AI Intelligence', icon: Sparkles },
    { id: 'tests', label: '42-Scenario Suite', icon: FlaskConical, badge: '42 Tests', badgeColor: 'var(--brand-primary)' },
    { id: 'settings', label: 'Settings & Cloud DB', icon: Settings },
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
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
        }}>
          <BookOpenCheck size={22} color="#ffffff" />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            24<span style={{ color: 'var(--brand-primary)' }}>Library</span>
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Enterprise v2.0
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: '16px 10px', overflowY: 'auto' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 10px 8px' }}>
          Navigation ({activeRole})
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--border-medium)' : '1px solid transparent',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13px',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} color={isActive ? 'var(--brand-primary)' : 'currentColor'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: item.badgeColor || 'var(--brand-primary)',
                    color: '#ffffff',
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer Status */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isCloudConnected ? 'var(--status-success)' : 'var(--status-warning)',
            boxShadow: isCloudConnected ? '0 0 8px var(--status-success)' : 'none',
          }} />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            {isCloudConnected ? 'Cloud Sync 🟢' : 'Local Standalone 🟡'}
          </span>
        </div>
      </div>
    </aside>
  );
};
