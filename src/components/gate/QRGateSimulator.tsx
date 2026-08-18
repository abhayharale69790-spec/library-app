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
  Unlock
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
    branchOccupancyRate,
    scanGateQR,
    accessLogs,
    simulatedClockTime,
  } = useLibrary();

  const [inputToken, setInputToken] = useState('');
  const [lastScanResult, setLastScanResult] = useState<GateScanResult | null>(null);
  const [gateStatus, setGateStatus] = useState<'STANDBY' | 'GRANTED' | 'DENIED'>('STANDBY');

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
    }, 4000);
  };

  const branchSeats = seats.filter(s => s.branchId === currentBranch.id);

  // Pre-configured testbench profiles
  const testCandidates = [
    {
      title: 'Valid Active Morning Scholar',
      name: 'Rahul Sharma',
      desc: 'Seat A-01 | Morning Shift (Active)',
      member: members.find(m => m.id === 'mem_1'),
      expected: 'ACCESS GRANTED (Turnstile Unlocks)',
      color: 'var(--status-success)',
    },
    {
      title: 'Expired Membership Test',
      name: 'Saurabh Patil',
      desc: 'Expired 4 days ago | Gate Locked',
      member: members.find(m => m.id === 'mem_7'),
      expected: 'ACCESS DENIED (Expired Membership Alert)',
      color: 'var(--status-danger)',
    },
    {
      title: 'Wrong Shift Access Test',
      name: 'Amit Verma',
      desc: 'Night Owl Shift (22:00-06:00)',
      member: members.find(m => m.id === 'mem_3'),
      expected: 'ACCESS DENIED if scanning outside 22:00-06:00',
      color: 'var(--status-warning)',
    },
    {
      title: 'Expiring Soon (2 Days Left)',
      name: 'Priya Nair',
      desc: 'Seat A-02 | Morning Shift',
      member: members.find(m => m.id === 'mem_2'),
      expected: 'ACCESS GRANTED + Renewal Reminder Nudge',
      color: 'var(--brand-primary)',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Title */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800 }}>
          Turnstile QR Gate Access Simulator
        </h1>
        <p style={{ fontSize: '13px', marginTop: '2px' }}>
          Physical hardware simulator for optical turnstiles, RFID scanners & access validation logic
        </p>
      </div>

      {/* Main Hardware Display */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
        gap: '20px',
      }}>
        {/* Left Column: Interactive Gate Visualization Display */}
        <div className="card" style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '380px',
          background: gateStatus === 'GRANTED' 
            ? 'linear-gradient(180deg, #064e3b 0%, #0f172a 100%)' 
            : gateStatus === 'DENIED' 
            ? 'linear-gradient(180deg, #7f1d1d 0%, #0f172a 100%)' 
            : 'linear-gradient(180deg, #131d33 0%, #0b0f19 100%)',
          border: `2px solid ${gateStatus === 'GRANTED' ? 'var(--status-success)' : gateStatus === 'DENIED' ? 'var(--status-danger)' : 'var(--border-medium)'}`,
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Top Optical Sensor Light Indicator */}
          <div style={{
            position: 'absolute',
            top: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: gateStatus === 'GRANTED' ? 'var(--status-success)' : gateStatus === 'DENIED' ? 'var(--status-danger)' : '#64748b',
              boxShadow: gateStatus !== 'STANDBY' ? `0 0 14px ${gateStatus === 'GRANTED' ? 'var(--status-success)' : 'var(--status-danger)'}` : 'none',
            }} />
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', color: '#ffffff' }}>
              GATE 01: {gateStatus === 'STANDBY' ? 'STANDBY READY' : gateStatus === 'GRANTED' ? 'OPEN / UNLOCKED' : 'LOCKED / BLOCKED'}
            </span>
          </div>

          {/* Center Hardware Icon / Animation */}
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              margin: '0 auto 16px',
              background: gateStatus === 'GRANTED' ? 'rgba(16, 185, 129, 0.2)' : gateStatus === 'DENIED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.1)',
              border: `2px solid ${gateStatus === 'GRANTED' ? 'var(--status-success)' : gateStatus === 'DENIED' ? 'var(--status-danger)' : 'var(--border-medium)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: gateStatus === 'GRANTED' ? '0 0 30px rgba(16, 185, 129, 0.4)' : gateStatus === 'DENIED' ? '0 0 30px rgba(239, 68, 68, 0.4)' : 'none',
              transition: 'all 0.25s ease',
            }}>
              {gateStatus === 'GRANTED' ? (
                <Unlock size={44} color="var(--status-success)" />
              ) : gateStatus === 'DENIED' ? (
                <Lock size={44} color="var(--status-danger)" />
              ) : (
                <QrCode size={44} color="var(--brand-primary)" />
              )}
            </div>

            <h2 style={{
              fontSize: '22px',
              fontWeight: 800,
              color: gateStatus === 'GRANTED' ? 'var(--status-success)' : gateStatus === 'DENIED' ? 'var(--status-danger)' : '#ffffff',
            }}>
              {gateStatus === 'STANDBY' && 'Present QR Code at Turnstile'}
              {gateStatus === 'GRANTED' && (lastScanResult?.action === 'CHECK_IN' ? 'ACCESS GRANTED • WELCOME' : 'CHECK-OUT RECORDED • GOODBYE')}
              {gateStatus === 'DENIED' && 'ACCESS DENIED • GATE LOCKED'}
            </h2>

            {lastScanResult && (
              <div style={{ marginTop: '10px', maxWidth: '420px', margin: '10px auto 0' }}>
                <p style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: gateStatus === 'GRANTED' ? '#d1fae5' : '#fee2e2',
                }}>
                  {lastScanResult.reason}
                </p>

                {lastScanResult.member && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '12px',
                  }}>
                    <span>👤 {lastScanResult.member.fullName}</span>
                    <span>🪑 Desk: <strong>{lastScanResult.seat?.label || 'Floating'}</strong></span>
                    <span>⏰ Shift: {lastScanResult.shift?.name.split(' (')[0]}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Scanner Input Box */}
          <div style={{
            marginTop: '28px',
            width: '100%',
            maxWidth: '480px',
            display: 'flex',
            gap: '8px',
          }}>
            <input
              type="text"
              placeholder="Paste or type QR token / Member ID..."
              className="form-control"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleScan(inputToken);
                  setInputToken('');
                }
              }}
            />
            <button
              onClick={() => {
                handleScan(inputToken);
                setInputToken('');
              }}
              className="btn btn-primary"
              style={{ gap: '6px' }}
            >
              <Play size={15} />
              <span>Scan</span>
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Hardware Testbench */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>
              Hardware Scenario Testbench
            </h3>
            <p style={{ fontSize: '12px' }}>
              One-click simulation of student scans across various shift & validity conditions
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {testCandidates.map((c, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{c.name}</strong>
                    <span style={{ fontSize: '11px', color: c.color, fontWeight: 600 }}>
                      ({c.title})
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {c.desc}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (c.member) {
                      handleScan(c.member.qrToken);
                    }
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ gap: '4px' }}
                >
                  <Play size={12} />
                  <span>Scan QR</span>
                </button>
              </div>
            ))}

            {/* Test Tampered/Invalid QR */}
            <div style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px dashed var(--status-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--status-danger)' }}>Tampered / Fake QR Code</strong>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Unrecognized signature payload test
                </div>
              </div>

              <button
                onClick={() => handleScan('24LIB:INVALID:FAKE:TOKEN:9999')}
                className="btn btn-danger btn-sm"
                style={{ gap: '4px' }}
              >
                <Play size={12} />
                <span>Test Fake</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Gate Access Log Stream */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Gate Access Telemetry Log</h3>
            <p style={{ fontSize: '12px' }}>Audited real-time turnstile events and security reasons</p>
          </div>
          <span className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Total Events: {accessLogs.length}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px 12px' }}>Timestamp</th>
                <th style={{ padding: '8px 12px' }}>Scholar / Token</th>
                <th style={{ padding: '8px 12px' }}>Result</th>
                <th style={{ padding: '8px 12px' }}>Access Reason / Error Message</th>
                <th style={{ padding: '8px 12px' }}>Gate ID</th>
              </tr>
            </thead>
            <tbody>
              {accessLogs.slice(0, 10).map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td className="mono" style={{ padding: '8px 12px' }}>{log.timestamp}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{log.memberName || log.memberCode || 'Anonymous'}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span className={`badge ${log.result === 'ALLOWED' ? (log.reason.includes('CHECK_OUT') ? 'badge-info' : 'badge-success') : 'badge-danger'}`}>
                      {log.result}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: log.result === 'ALLOWED' ? 'var(--text-secondary)' : 'var(--status-danger)' }}>
                    {log.reason}
                  </td>
                  <td className="mono" style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '11px' }}>{log.gateId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
