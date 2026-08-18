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
  BookOpenCheck
} from 'lucide-react';
import { getDaysRemaining } from '../../utils/dateMath';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { memberships, activeRole } = useLibrary();

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
    { id: 'tests', label: '35-Point Bible Suite', icon: FlaskConical, badge: '35 Tests', badgeColor: 'var(--brand-primary)' },
    { id: 'settings', label: 'Settings & Data', icon: Settings },
  ];

  return (
    <aside style={{
      width: '240px',
      backgroundColor: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0,
    }}>
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
          <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em', color: '#ffffff' }}>
            24<span style={{ color: '#60a5fa' }}>LIBRARY</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Shift Space OS
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{
        flex: 1,
        padding: '12px 10px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
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
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: isActive ? 'var(--brand-primary)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--transition-fast)',
                fontFamily: 'var(--font-main)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={18} color={isActive ? '#ffffff' : 'var(--text-muted)'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: isActive ? 'rgba(255, 255, 255, 0.25)' : (item.badgeColor || 'var(--bg-surface-elevated)'),
                  color: isActive ? '#ffffff' : '#ffffff',
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Role / Session Footer */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--brand-primary)',
        }}>
          {activeRole.substring(0, 2)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activeRole} Console
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
            Dadar Hub Manager
          </div>
        </div>
      </div>
    </aside>
  );
};
