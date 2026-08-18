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
  Building2,
  Receipt,
  Download,
  FileText
} from 'lucide-react';
import { useLibrary } from '../../state/libraryStore';
import { BottomSheet } from '../common/BottomSheet';
import { SetupWizardModal } from '../settings/SetupWizardModal';

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
  const { activeRole, businessProfile } = useLibrary();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // 1. Staff Navigation Tabs
  const staffTabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'gate', label: 'Scan', icon: QrCode, isPrimary: true },
    { id: 'seatmap', label: 'Seats', icon: Grid },
    { id: 'members', label: 'Students', icon: Users },
  ];

  // 2. Student Navigation Tabs
  const studentTabs = [
    { id: 'studentportal', label: 'Home', icon: Home },
    { id: 'gate', label: 'Pass', icon: QrCode, isPrimary: true },
    { id: 'seatmap', label: 'Seat', icon: Armchair },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  // 3. Admin / Owner Navigation Tabs
  const adminTabs = [
    { id: 'dashboard', label: 'Home', icon: Home, isPrimary: false },
    { id: 'members', label: 'Students', icon: Users, isPrimary: false },
    { id: 'payments', label: 'Finance', icon: DollarSign, isPrimary: false },
    { id: 'analytics', label: 'Reports', icon: BarChart3, isPrimary: false },
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
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid var(--bg-card)',
                  transform: 'translateY(-14px)',
                  boxShadow: '0 6px 18px rgba(59, 130, 246, 0.45)',
                  cursor: 'pointer',
                }}
                className="bottom-nav-primary-btn"
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
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                background: 'transparent',
                border: 'none',
                color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)',
                gap: '3px',
                cursor: 'pointer',
                transition: 'color var(--transition-fast)'
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: '10.5px', fontWeight: isActive ? 700 : 500 }}>
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
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            background: 'transparent',
            border: 'none',
            color: ['expenses', 'shifts', 'analytics', 'tests', 'settings'].includes(currentView) 
              ? 'var(--brand-primary)' 
              : 'var(--text-muted)',
            gap: '3px',
            cursor: 'pointer',
          }}
        >
          <MoreHorizontal size={20} />
          <span style={{ fontSize: '10.5px', fontWeight: 500 }}>
            More
          </span>
        </button>
      </nav>

      {/* Slide-Up "More" Action Sheet */}
      {showMoreMenu && (
        <BottomSheet
          isOpen={true}
          onClose={() => setShowMoreMenu(false)}
          title="More Operations & Settings"
          subtitle={businessProfile.name || 'Management Utilities'}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', paddingBottom: '10px' }}>
            {/* Quick Setup Wizard Button */}
            <button
              onClick={() => {
                setShowMoreMenu(false);
                setShowSetupWizard(true);
              }}
              className="quick-action-card"
              style={{
                margin: 0,
                border: '1.5px solid var(--status-success)',
                background: 'rgba(16, 185, 129, 0.08)',
                minHeight: '80px',
                gridColumn: 'span 2',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--status-success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={20} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '14px', color: 'var(--status-success)' }}>
                  10-Minute Setup Wizard
                </strong>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Configure business name, branch, seats, shifts & plans
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                onNavigate('seatmap');
                setShowMoreMenu(false);
              }}
              className="quick-action-card"
              style={{ margin: 0 }}
            >
              <Grid size={22} color="var(--brand-primary)" />
              <span style={{ fontWeight: 600, fontSize: '13px' }}>Seat Inventory</span>
            </button>

            <button
              onClick={() => {
                onNavigate('shifts');
                setShowMoreMenu(false);
              }}
              className="quick-action-card"
              style={{ margin: 0 }}
            >
              <Clock size={22} color="var(--shift-morning)" />
              <span style={{ fontWeight: 600, fontSize: '13px' }}>Shifts & Timings</span>
            </button>

            <button
              onClick={() => {
                onNavigate('expenses');
                setShowMoreMenu(false);
              }}
              className="quick-action-card"
              style={{ margin: 0 }}
            >
              <Receipt size={22} color="var(--status-danger)" />
              <span style={{ fontWeight: 600, fontSize: '13px' }}>Operating Expenses</span>
            </button>

            <button
              onClick={() => {
                onNavigate('analytics');
                setShowMoreMenu(false);
              }}
              className="quick-action-card"
              style={{ margin: 0 }}
            >
              <BarChart3 size={22} color="var(--status-success)" />
              <span style={{ fontWeight: 600, fontSize: '13px' }}>P&L & Analytics</span>
            </button>

            <button
              onClick={() => {
                onNavigate('tests');
                setShowMoreMenu(false);
              }}
              className="quick-action-card"
              style={{ margin: 0 }}
            >
              <TestTube size={22} color="var(--status-warning)" />
              <span style={{ fontWeight: 600, fontSize: '13px' }}>42-Scenario Tests</span>
            </button>

            <button
              onClick={() => {
                onNavigate('settings');
                setShowMoreMenu(false);
              }}
              className="quick-action-card"
              style={{ margin: 0 }}
            >
              <Settings size={22} color="var(--text-secondary)" />
              <span style={{ fontWeight: 600, fontSize: '13px' }}>Center Settings</span>
            </button>
          </div>
        </BottomSheet>
      )}

      {/* Setup Wizard Modal from More Menu */}
      {showSetupWizard && (
        <SetupWizardModal onClose={() => setShowSetupWizard(false)} />
      )}
    </>
  );
};
