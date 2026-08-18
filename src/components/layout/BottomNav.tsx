import React, { useState } from 'react';
import { 
  Home, 
  QrCode, 
  Grid, 
  Users, 
  MoreHorizontal, 
  CreditCard, 
  BarChart3, 
  Calendar, 
  Armchair, 
  DollarSign, 
  Clock, 
  Settings, 
  TestTube, 
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useLibrary } from '../../state/libraryStore';
import { BottomSheet } from '../common/BottomSheet';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAddMember?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenAddMember
}) => {
  const { activeRole, setActiveRole } = useLibrary();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Staff Navigation Tabs
  const staffTabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'gate', label: 'Scan', icon: QrCode, isPrimary: true },
    { id: 'seatmap', label: 'Seats', icon: Grid },
    { id: 'members', label: 'Members', icon: Users },
  ];

  // Student Navigation Tabs
  const studentTabs = [
    { id: 'studentportal', label: 'Home', icon: Home },
    { id: 'gate', label: 'Pass', icon: QrCode, isPrimary: true },
    { id: 'seatmap', label: 'My Seat', icon: Armchair },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  // Admin / Owner Navigation Tabs
  const adminTabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'gate', label: 'Gate', icon: QrCode, isPrimary: true },
    { id: 'payments', label: 'Finance', icon: DollarSign },
  ];

  const currentTabs = activeRole === 'STUDENT' 
    ? studentTabs 
    : activeRole === 'STAFF' 
      ? staffTabs 
      : adminTabs;

  return (
    <>
      <nav 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'calc(var(--bottom-nav-height) + var(--safe-bottom))',
          paddingBottom: 'var(--safe-bottom)',
          backgroundColor: 'var(--bg-card)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 100,
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.35)',
        }}
        className="mobile-bottom-nav"
      >
        {currentTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;

          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '-18px',
                  boxShadow: '0 4px 14px var(--brand-glow)',
                  border: '3px solid var(--bg-app)',
                  transition: 'all var(--transition-fast)'
                }}
                aria-label={tab.label}
              >
                <Icon size={24} />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              style={{
                flex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              <span style={{ fontSize: '11px', fontWeight: isActive ? '700' : '500' }}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* More Tab */}
        <button
          onClick={() => setShowMoreMenu(true)}
          style={{
            flex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            color: showMoreMenu ? 'var(--brand-primary)' : 'var(--text-muted)',
            transition: 'all var(--transition-fast)'
          }}
        >
          <MoreHorizontal size={20} />
          <span style={{ fontSize: '11px', fontWeight: '500' }}>More</span>
        </button>
      </nav>

      {/* More Navigation Menu Bottom Sheet */}
      <BottomSheet
        isOpen={showMoreMenu}
        onClose={() => setShowMoreMenu(false)}
        title="Quick Navigation & Tools"
        subtitle={`Role: ${activeRole}`}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', paddingBottom: '16px' }}>
          <button
            className="quick-action-card"
            onClick={() => {
              onNavigate('seatmap');
              setShowMoreMenu(false);
            }}
          >
            <div className="quick-action-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
              <Grid size={20} />
            </div>
            <span>Seat Matrix</span>
          </button>

          <button
            className="quick-action-card"
            onClick={() => {
              onNavigate('shifts');
              setShowMoreMenu(false);
            }}
          >
            <div className="quick-action-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <Clock size={20} />
            </div>
            <span>Shifts</span>
          </button>

          <button
            className="quick-action-card"
            onClick={() => {
              onNavigate('payments');
              setShowMoreMenu(false);
            }}
          >
            <div className="quick-action-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <CreditCard size={20} />
            </div>
            <span>Payments</span>
          </button>

          <button
            className="quick-action-card"
            onClick={() => {
              onNavigate('expenses');
              setShowMoreMenu(false);
            }}
          >
            <div className="quick-action-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <DollarSign size={20} />
            </div>
            <span>Expenses</span>
          </button>

          <button
            className="quick-action-card"
            onClick={() => {
              onNavigate('studentportal');
              setShowMoreMenu(false);
            }}
          >
            <div className="quick-action-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
              <UserCheck size={20} />
            </div>
            <span>Student App</span>
          </button>

          <button
            className="quick-action-card"
            onClick={() => {
              onNavigate('analytics');
              setShowMoreMenu(false);
            }}
          >
            <div className="quick-action-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
              <BarChart3 size={20} />
            </div>
            <span>Analytics</span>
          </button>

          <button
            className="quick-action-card"
            onClick={() => {
              onNavigate('tests');
              setShowMoreMenu(false);
            }}
          >
            <div className="quick-action-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
              <TestTube size={20} />
            </div>
            <span>Tests (42)</span>
          </button>

          <button
            className="quick-action-card"
            onClick={() => {
              onNavigate('settings');
              setShowMoreMenu(false);
            }}
          >
            <div className="quick-action-icon" style={{ background: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8' }}>
              <Settings size={20} />
            </div>
            <span>Settings</span>
          </button>

          {onOpenAddMember && (
            <button
              className="quick-action-card"
              style={{ border: '1px dashed var(--brand-primary)' }}
              onClick={() => {
                setShowMoreMenu(false);
                onOpenAddMember();
              }}
            >
              <div className="quick-action-icon" style={{ background: 'var(--brand-primary)', color: '#fff' }}>
                <Sparkles size={20} />
              </div>
              <span style={{ color: 'var(--brand-primary)' }}>+ Add Member</span>
            </button>
          )}
        </div>

        {/* Role Switcher in More Menu */}
        <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Switch Persona
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {(['STAFF', 'STUDENT', 'ADMIN'] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setActiveRole(r);
                  setShowMoreMenu(false);
                }}
                className={`pill-item ${activeRole === r ? 'active' : ''}`}
                style={{ justifyContent: 'center' }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>
    </>
  );
};
