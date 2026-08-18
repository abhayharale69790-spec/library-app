import React from 'react';
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
  CloudOff
} from 'lucide-react';
import { Role } from '../../types';

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
    cloudSyncStatusText,
  } = useLibrary();

  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  // Find which shift is active right now based on simulated time
  const currentActiveShift = shifts.find(s => {
    if (s.branchId !== currentBranch.id) return false;
    if (s.startTime === '00:00' && s.endTime === '23:59') return false;
    const [nowH, nowM] = simulatedClockTime.split(':').map(n => parseInt(n, 10));
    const nowMin = nowH * 60 + nowM;
    const [sH, sM] = s.startTime.split(':').map(n => parseInt(n, 10));
    const [eH, eM] = s.endTime.split(':').map(n => parseInt(n, 10));
    const sMin = sH * 60 + sM;
    const eMin = eH * 60 + eM;
    if (eMin <= sMin) { // Overnight
      return nowMin >= sMin || nowMin <= eMin;
    }
    return nowMin >= sMin && nowMin <= eMin;
  });

  const branchSeatsCount = seats.filter(s => s.branchId === currentBranch.id).length;

  return (
    <header style={{
      height: '68px',
      backgroundColor: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      gap: '16px',
      zIndex: 50,
    }}>
      {/* Left: Branch Switcher & Active Shift Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={20} color="var(--brand-primary)" />
          <select
            value={currentBranch.id}
            onChange={(e) => setCurrentBranchId(e.target.value)}
            className="form-control"
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 600,
              width: 'auto',
              minWidth: '220px',
              background: 'var(--bg-input)',
              borderColor: 'var(--border-medium)',
            }}
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                📍 {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        {/* Shift Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-medium)',
          fontSize: '12px',
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: currentActiveShift ? currentActiveShift.color : 'var(--status-warning)',
            boxShadow: `0 0 8px ${currentActiveShift ? currentActiveShift.color : 'var(--status-warning)'}`,
          }} />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {currentActiveShift ? currentActiveShift.name.split(' (')[0] : 'Intermission / 24h Pass'}
          </span>
        </div>

        {/* Live Occupancy Counter */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--status-success-bg)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          fontSize: '12px',
        }}>
          <UserCheck size={14} color="var(--status-success)" />
          <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>
            {insideAttendanceCount} / {branchSeatsCount} Inside ({branchOccupancyRate}%)
          </span>
        </div>

        {/* Cloud Sync Status Badge */}
        <button
          onClick={() => onNavigate('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: isCloudConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: `1px solid ${isCloudConnected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
            fontSize: '11.5px',
            fontWeight: 700,
            color: isCloudConnected ? 'var(--status-success)' : 'var(--status-warning)',
            cursor: 'pointer',
          }}
          title={cloudSyncStatusText + ' (Click to manage Cloud DB)'}
        >
          {isCloudConnected ? <Cloud size={13} /> : <CloudOff size={13} />}
          <span>{isCloudConnected ? 'Cloud PostgreSQL' : 'Local Offline'}</span>
        </button>
      </div>

      {/* Right: Simulated Clock, Role Switcher & Quick Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Time Simulator Clock */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--bg-input)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-medium)',
        }} title="Simulate library gate clock time">
          <Clock size={14} color="var(--text-muted)" />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TIME:</span>
          <input
            type="time"
            value={simulatedClockTime}
            onChange={(e) => setSimulatedClockTime(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              fontWeight: 700,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Role Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'var(--bg-surface-elevated)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-medium)',
        }}>
          <ShieldCheck size={14} color="var(--text-muted)" style={{ marginLeft: '4px' }} />
          {(['ADMIN', 'OWNER', 'STAFF', 'STUDENT'] as Role[]).map(role => (
            <button
              key={role}
              onClick={() => {
                setActiveRole(role);
                if (role === 'STUDENT') onNavigate('studentportal');
              }}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: activeRole === role ? 700 : 500,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                background: activeRole === role ? 'var(--brand-primary)' : 'transparent',
                color: activeRole === role ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease',
              }}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-sm"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          style={{ padding: '6px 8px' }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Action Buttons */}
        <button
          onClick={() => onNavigate('gate')}
          className="btn btn-secondary btn-sm"
          style={{ gap: '6px' }}
        >
          <QrCode size={15} color="var(--status-info)" />
          <span>QR Gate</span>
        </button>

        <button
          onClick={() => onNavigate('tests')}
          className="btn btn-secondary btn-sm"
          style={{ gap: '6px' }}
        >
          <FlaskConical size={15} color="var(--status-warning)" />
          <span>35-Test Suite</span>
        </button>

        <button
          onClick={onOpenAddMember}
          className="btn btn-primary btn-sm"
          style={{ gap: '6px' }}
        >
          <Plus size={16} />
          <span>Add Member</span>
        </button>
      </div>
    </header>
  );
};
