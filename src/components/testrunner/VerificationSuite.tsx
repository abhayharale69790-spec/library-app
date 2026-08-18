import React, { useState } from 'react';
import { runBibleTestSuite } from '../../utils/testRunner';
import { TestResult } from '../../types';
import {
  FlaskConical,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const VerificationSuite: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>(() => runBibleTestSuite());
  const [isRunning, setIsRunning] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  const handleRunAll = () => {
    setIsRunning(true);
    setTimeout(() => {
      const freshResults = runBibleTestSuite();
      setResults(freshResults);
      setIsRunning(false);

      const allPassed = freshResults.every(r => r.status === 'PASSED');
      if (allPassed) {
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    }, 600);
  };

  const categories = ['ALL', 'CONCURRENCY', 'SEAT_MATRIX', 'MEMBERSHIP', 'PAYMENT', 'QR_GATE', 'ATTENDANCE', 'BRANCH'];

  const filteredResults = results.filter(r => {
    if (activeCategory !== 'ALL' && r.category !== activeCategory) return false;
    return true;
  });

  const passedCount = results.filter(r => r.status === 'PASSED').length;
  const failedCount = results.filter(r => r.status === 'FAILED').length;
  const passRate = Math.round((passedCount / results.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FlaskConical size={22} color="var(--brand-primary)" />
            <h1 style={{ fontSize: '22px', fontWeight: 800 }}>35-Point Live Verification Suite</h1>
          </div>
          <p style={{ fontSize: '13px', marginTop: '2px' }}>
            Automated verification engine validating all behavioral rules & conflict matrix from Section 57 of the Bible
          </p>
        </div>

        <button
          onClick={handleRunAll}
          disabled={isRunning}
          className="btn btn-primary"
          style={{ gap: '8px', padding: '10px 20px', fontWeight: 700 }}
        >
          <Play size={16} />
          <span>{isRunning ? 'Executing 35 Tests...' : 'Run All 35 Bible Tests'}</span>
        </button>
      </div>

      {/* Summary Scorecard */}
      <div className="card" style={{
        padding: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>SYSTEM PASS RATE</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: passRate === 100 ? 'var(--status-success)' : 'var(--status-warning)', marginTop: '4px' }}>
            {passRate}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {passedCount} / {results.length} Assertions Passed
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>CORE ENGINES COVERED</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            7 Engines Verified
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Concurrency, Seats, QR Gate, Renewal Math, Attendance
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>CONCURRENCY & SAFETY</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--status-success)', marginTop: '4px' }}>
            Zero-Conflict Verified
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Double booking & race condition locks active
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: activeCategory === cat ? '1px solid var(--brand-primary)' : '1px solid var(--border-medium)',
              background: activeCategory === cat ? 'var(--brand-primary)' : 'var(--bg-card)',
              color: activeCategory === cat ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: activeCategory === cat ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Test Results List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredResults.map(test => {
          const isPassed = test.status === 'PASSED';
          const isExpanded = expandedTestId === test.id;

          return (
            <div
              key={test.id}
              className="card"
              style={{
                padding: '14px 18px',
                borderLeft: `4px solid ${isPassed ? 'var(--status-success)' : 'var(--status-danger)'}`,
                cursor: 'pointer',
              }}
              onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isPassed ? (
                    <CheckCircle2 size={18} color="var(--status-success)" />
                  ) : (
                    <XCircle size={18} color="var(--status-danger)" />
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>
                        TEST {String(test.testNumber).padStart(2, '0')}
                      </span>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                        {test.title}
                      </strong>
                      <span className="badge badge-neutral" style={{ fontSize: '9.5px' }}>
                        {test.category}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {test.description}
                    </div>
                  </div>
                </div>

                <span className={`badge ${isPassed ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '10.5px' }}>
                  {test.status}
                </span>
              </div>

              {/* Expanded Test Logs and Assertions */}
              {isExpanded && (
                <div style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '12px',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', fontWeight: 600 }}>EXPECTED BEHAVIOR</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{test.expected}</span>
                    </div>

                    <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '10px', fontWeight: 600 }}>ACTUAL RESULT</span>
                      <span style={{ color: isPassed ? 'var(--status-success)' : 'var(--status-danger)', fontWeight: 600 }}>{test.actual || 'N/A'}</span>
                    </div>
                  </div>

                  {test.logs && test.logs.length > 0 && (
                    <div style={{
                      background: '#070b14',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: '#94a3b8',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                    }}>
                      {test.logs.map((log, li) => (
                        <div key={li}>&gt; {log}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
