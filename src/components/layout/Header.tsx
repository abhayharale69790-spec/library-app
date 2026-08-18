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
  ChevronDown
} from 'lucide-react';
import { Role } from '../../types';
import { NotificationCenterModal } from './NotificationCenterModal';

interface HeaderProps {
  onOpenAddMember: () => void;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddMember, onNavigate }) => {
  const {
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
          padding: '0 16px',
          gap: '12px',
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        {/* Left: Mobile Title / Branch Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--brand-primary)', letterSpacing: '-0.03em' }}>
              24<span style={{ color: 'var(--text-primary)' }}>Library</span>
            </span>
          </div>

          <div style={{ position: 'relative' }}>
            <select
              value={currentBranch.id}
              onChange={(e) => setCurrentBranchId(e.target.value)}
              style={{
                padding: '4px 24px 4px 8px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                maxWidth: '130px',
                textOverflow: 'ellipsis',
                appearance: 'none',
              }}
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Right: Role Switcher, Clock Trigger, Notifications, Add */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Persona Switcher Pill */}
          <select
            value={activeRole}
            onChange={(e) => setActiveRole(e.target.value as Role)}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 700,
              background: activeRole === 'STAFF' 
                ? 'rgba(59, 130, 246, 0.15)' 
                : activeRole === 'STUDENT' 
                  ? 'rgba(236, 72, 153, 0.15)' 
                  : 'rgba(16, 185, 129, 0.15)',
              color: activeRole === 'STAFF' 
                ? '#3b82f6' 
                : activeRole === 'STUDENT' 
                  ? '#ec4899' 
                  : '#10b981',
              borderColor: 'transparent',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            <option value="STAFF">Staff</option>
            <option value="STUDENT">Student</option>
            <option value="ADMIN">Admin</option>
          </select>

          {/* Time Clock Badge (Click to adjust) */}
          <button
            onClick={() => setShowClockMenu(!showClockMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600
            }}
            title="Simulated Library Clock"
          >
            <Clock size={13} color="var(--brand-primary)" />
            <span>{simulatedClockTime}</span>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => setShowNotifications(true)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              position: 'relative'
            }}
            aria-label="Notifications"
          >
            <Bell size={17} />
            {notifications.length > 0 && (
              <span 
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  width: '15px',
                  height: '15px',
                  borderRadius: '50%',
                  background: 'var(--status-danger)',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-card)'
                }}
              >
                {notifications.length}
              </span>
            )}
          </button>

          {/* Desktop Add Member Button */}
          <button
            onClick={onOpenAddMember}
            className="btn-primary"
            style={{
              display: 'none',
              padding: '0 14px',
              minHeight: '36px',
              fontSize: '13px'
            }}
          >
            <Plus size={15} /> Add
          </button>
        </div>
      </header>

      {/* Clock Simulator Quick Picker Dropdown */}
      {showClockMenu && (
        <div 
          style={{
            position: 'fixed',
            top: 'calc(var(--header-height-mobile) + 8px)',
            right: '16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            width: '260px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700' }}>Simulate Clock</span>
            <span style={{ fontSize: '11px', color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>{simulatedClockTime}</span>
          </div>
          <input
            type="time"
            value={simulatedClockTime}
            onChange={(e) => setSimulatedClockTime(e.target.value)}
            className="form-input"
            style={{ minHeight: '36px', marginBottom: '8px', fontSize: '13px' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
            {['08:30', '13:00', '17:30', '21:00', '02:00', '06:00'].map(t => (
              <button
                key={t}
                onClick={() => {
                  setSimulatedClockTime(t);
                  setShowClockMenu(false);
                }}
                className="btn-secondary"
                style={{ minHeight: '28px', padding: '0 4px', fontSize: '11px', justifyContent: 'center' }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notifications Slide-Up */}
      <NotificationCenterModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};
