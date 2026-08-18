import React, { useState } from 'react';
import { useLibrary, GateScanResult } from '../../state/libraryStore';
import {
  QrCode,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Armchair,
  Volume2,
  Camera,
  Play,
  RotateCcw,
  Zap,
  Building2,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { formatDateDisplay } from '../../utils/dateMath';

export const QRGateSimulator: React.FC = () => {
  const {
    currentBranch,
    members,
    shifts,
    seats,
    assignments,
    insideAttendanceCount,
    scanGateQR,
    accessLogs,
    simulatedClockTime,
  } = useLibrary();

  const [inputToken, setInputToken] = useState('');
  const [lastScanResult, setLastScanResult] = useState<GateScanResult | null>(null);
  const [gateStatus, setGateStatus] = useState<'STANDBY' | 'GRANTED' | 'DENIED'>('STANDBY');
  const [isScanningMode, setIsScanningMode] = useState(true);

  const handleScan = (tokenToScan: string) => {
    if (!tokenToScan.trim()) return;

    const result = scanGateQR(tokenToScan, 'TURNSTILE-GATE-01');
    setLastScanResult(result);

    if (result.allowed) {
      setGateStatus('GRANTED');
    } else {
      setGateStatus('DENIED');
    }

    // Reset gate after 4 seconds
    setTimeout(() => {
      setGateStatus('STANDBY');
    }, 4500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px', margin: '0 auto' }}>
      {/* 1. Header & Live Gate Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800 }}>
            Optical QR Gate Scanner
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Turnstile 01 • {currentBranch.name} ({insideAttendanceCount} Scholars inside)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span 
            className={`badge ${gateStatus === 'GRANTED' ? 'badge-success' : gateStatus === 'DENIED' ? 'badge-danger' : 'badge-neutral'}`}
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            {gateStatus === 'GRANTED' ? '🔓 UNLOCKED' : gateStatus === 'DENIED' ? '🔒 LOCKED' : '● STANDBY'}
          </span>
        </div>
      </div>

      {/* 2. Optical Camera Viewfinder Simulation */}
      <div 
        style={{
          background: 'linear-gradient(180deg, #0f172a, #0b0f19)',
          border: `2px solid ${gateStatus === 'GRANTED' ? 'var(--status-success)' : gateStatus === 'DENIED' ? 'var(--status-danger)' : 'var(--border-medium)'}`,
          borderRadius: 'var(--radius-xl)',
          padding: '24px 16px',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: gateStatus === 'GRANTED' ? '0 0 30px rgba(16, 185, 129, 0.3)' : gateStatus === 'DENIED' ? '0 0 30px rgba(239, 68, 68, 0.3)' : 'var(--shadow-md)',
          transition: 'all var(--transition-normal)'
        }}
      >
        {/* Viewfinder Reticle Corners */}
        <div style={{ position: 'relative', width: '200px', height: '200px', border: '1px dashed rgba(59, 130, 246, 0.4)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59, 130, 246, 0.03)' }}>
          <QrCode size={80} color="var(--brand-primary)" style={{ opacity: 0.8 }} />
          
          {/* Animated Scanning Laser Line */}
          <div 
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '3px',
              background: gateStatus === 'GRANTED' ? 'var(--status-success)' : gateStatus === 'DENIED' ? 'var(--status-danger)' : 'var(--brand-primary)',
              boxShadow: '0 0 10px currentColor',
              animation: 'scanAnimation 2s ease-in-out infinite alternate',
              top: '50%'
            }} 
          />
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '14px', textAlign: 'center' }}>
          Align scholar digital pass QR inside the box
        </p>
      </div>

      {/* 3. Scan Feedback Response Card */}
      {lastScanResult && (
        <div 
          className="mobile-card"
          style={{
            margin: 0,
            padding: '16px',
            background: lastScanResult.allowed ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
            border: `1.5px solid ${lastScanResult.allowed ? 'var(--status-success)' : 'var(--status-danger)'}`,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: lastScanResult.allowed ? 'var(--status-success)' : 'var(--status-danger)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {lastScanResult.allowed ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: lastScanResult.allowed ? 'var(--status-success)' : 'var(--status-danger)' }}>
                  {lastScanResult.allowed ? '✓ ACCESS GRANTED' : '⚠ ACCESS DENIED'}
                </h3>
                <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                  {lastScanResult.action}
                </span>
              </div>

              {/* Scholar details if found */}
              {lastScanResult.member && (
                <div style={{ margin: '8px 0', fontSize: '13px' }}>
                  <strong>{lastScanResult.member.fullName}</strong> ({lastScanResult.member.memberCode})
                  <p style={{ color: 'var(--text-primary)', marginTop: '2px' }}>
                    {lastScanResult.reason}
                  </p>
                  {lastScanResult.seat && (
                    <p style={{ color: 'var(--brand-primary)', fontWeight: '600', marginTop: '2px' }}>
                      Assigned Desk: {lastScanResult.seat.label} ({lastScanResult.shift?.name.split(' ')[0]})
                    </p>
                  )}
                </div>
              )}

              {!lastScanResult.member && (
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>
                  Reason: {lastScanResult.reason}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Quick Simulation Scholar Buttons */}
      <div>
        <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
          Simulate Scholar QR Taps (1-Tap Test)
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {members.slice(0, 4).map(m => {
            const assignment = assignments.find(a => a.memberId === m.id && a.status === 'ACTIVE');
            const seat = assignment ? seats.find(s => s.id === assignment.seatId) : null;
            const shift = assignment ? shifts.find(s => s.id === assignment.shiftId) : null;

            return (
              <div
                key={m.id}
                onClick={() => handleScan(m.qrToken)}
                className="mobile-card mobile-card-interactive"
                style={{
                  margin: 0,
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' }}>
                    {m.fullName.charAt(0)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{m.fullName}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {seat ? `Desk ${seat.label}` : 'Floating'} • {shift?.name.split(' ')[0] || 'Morning'}
                    </p>
                  </div>
                </div>

                <button className="btn-primary" style={{ minHeight: '32px', width: 'auto', padding: '0 12px', fontSize: '12px' }}>
                  Scan Tap &rarr;
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Live Access Logs */}
      <div className="mobile-card" style={{ margin: 0, padding: '14px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
          Gate 01 Access Feed
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {accessLogs.slice(-4).reverse().map(log => (
            <div 
              key={log.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: log.result === 'ALLOWED' ? 'var(--status-success)' : 'var(--status-danger)' }} />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600' }}>{log.memberName || log.memberCode || 'Unknown'}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.reason}</p>
                </div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {log.timestamp.split('T')[1]?.slice(0, 5) || 'Just now'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
