import React, { useState } from 'react';
import { useLibrary } from '../../state/libraryStore';
import { 
  Building2, 
  Clock, 
  UserCheck, 
  ShieldCheck, 
  Plus, 
  QrCode, 
  FlaskConical,
  Sun,
  Moon,
  Cloud,
  CloudOff,
  Bell,
  ChevronDown,
  Sparkles,
  Settings
} from 'lucide-react';
import { Role } from '../../types';
import { NotificationCenterModal } from './NotificationCenterModal';
import { SetupWizardModal } from '../settings/SetupWizardModal';

interface HeaderProps {
  onOpenAddMember: () => void;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddMember, onNavigate }) => {
  const {
    businessProfile,
    currentBranch,
    branches,
    setCurrentBranchId,
    activeRole,
    setActiveRole,
    simulatedClockTime,
    setSimulatedClockTime,
    shifts,
    insideAttendanceCount,
    seats,
    branchOccupancyRate,
    isCloudConnected,
    notifications,
  } = useLibrary();

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [showClockMenu, setShowClockMenu] = useState(false);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const currentActiveShift = shifts.find(s => {
    if (s.branchId !== currentBranch.id) return false;
    if (s.startTime === '00:00' && s.endTime === '23:59') return false;
    const [nowH, nowM] = simulatedClockTime.split(':').map(n => parseInt(n, 10));
    const nowMin = nowH * 60 + nowM;
    const [sH, sM] = s.startTime.split(':').map(n => parseInt(n, 10));
    const [eH, eM] = s.endTime.split(':').map(n => parseInt(n, 10));
    const sMin = sH * 60 + sM;
    const eMin = eH * 60 + eM;
    if (eMin <= sMin) {
      return nowMin >= sMin || nowMin <= eMin;
    }
    return nowMin >= sMin && nowMin <= eMin;
  });

  return (
    <>
      <header 
        style={{
          height: 'var(--header-height-mobile)',
          backgroundColor: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          gap: '10px',
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        {/* Left: Configurable Business Title / Branch Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            onClick={() => onNavigate('dashboard')}
          >
            <div 
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--brand-primary), #1d4ed8)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '13px',
                flexShrink: 0
              }}
            >
              {businessProfile.shortName ? businessProfile.shortName.charAt(0) : '24'}
            </div>
            <span 
              style={{ 
                fontSize: '15px', 
                fontWeight: '800', 
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {businessProfile.name || 'Study Point'}
            </span>
          </div>

          {/* Simple Branch Selector */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value={currentBranch.id}
              onChange={(e) => setCurrentBranchId(e.target.value)}
              style={{
                padding: '4px 20px 4px 6px',
                fontSize: '11px',
                fontWeight: 600,
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--brand-primary)',
                appearance: 'none',
                cursor: 'pointer',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name.split(' - ')[0]}</option>
              ))}
            </select>
            <ChevronDown size={11} style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Right: Quick Setup / Role Switcher / Alerts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Quick Setup Wizard Trigger */}
          {!businessProfile.isConfigured && (
            <button
              onClick={() => setShowSetupWizard(true)}
              className="btn-primary"
              style={{
                minHeight: '28px',
                padding: '0 8px',
                fontSize: '11px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
                gap: '4px'
              }}
            >
              <Sparkles size={12} /> Setup
            </button>
          )}

          {/* Persona Role Switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
            {(['ADMIN', 'STAFF', 'STUDENT'] as Role[]).map(r => (
              <button
                key={r}
                onClick={() => {
                  setActiveRole(r);
                  if (r === 'STUDENT') onNavigate('studentportal');
                  else onNavigate('dashboard');
                }}
                style={{
                  padding: '3px 7px',
                  fontSize: '10px',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  background: activeRole === r ? 'var(--brand-primary)' : 'transparent',
                  color: activeRole === r ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {r === 'ADMIN' ? 'Owner' : r === 'STAFF' ? 'Staff' : 'Student'}
              </button>
            ))}
          </div>

          {/* Notification Bell */}
          <button
            onClick={() => setShowNotifications(true)}
            className="btn-ghost"
            style={{
              width: '32px',
              height: '32px',
              padding: 0,
              position: 'relative',
              color: 'var(--text-secondary)'
            }}
            aria-label="Notifications"
          >
            <Bell size={16} />
            {notifications.length > 0 && (
              <span 
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: 'var(--status-danger)',
                  boxShadow: '0 0 4px var(--status-danger)'
                }} 
              />
            )}
          </button>

          {/* Quick Setup Settings Icon */}
          <button
            onClick={() => setShowSetupWizard(true)}
            className="btn-ghost"
            style={{ width: '32px', height: '32px', padding: 0, color: 'var(--text-secondary)' }}
            title="Setup & Business Profile"
            aria-label="Settings"
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      {/* Notification Center Modal */}
      {showNotifications && (
        <NotificationCenterModal isOpen={true} onClose={() => setShowNotifications(false)} />
      )}

      {/* Setup Wizard Modal */}
      {showSetupWizard && (
        <SetupWizardModal onClose={() => setShowSetupWizard(false)} />
      )}
    </>
  );
};
