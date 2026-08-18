import React, { useState, useEffect } from 'react';
import { useLibrary } from '../../state/libraryStore';
import {
  Settings,
  Building2,
  Database,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Cloud,
  CloudOff,
  RefreshCw,
  Copy,
  ExternalLink,
  Zap,
  Check
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
} from '../../lib/supabaseClient';

export const SettingsView: React.FC = () => {
  const {
    org,
    branches,
    currentBranch,
    exportDataJSON,
    importDataJSON,
    resetToDemoData,
    isCloudConnected,
    isSyncingCloud,
    cloudSyncStatusText,
    syncToCloud,
    syncFromCloud,
    refreshCloudStatus,
  } = useLibrary();

  // Cloud Database Form State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [testResult, setTestResult] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Backup Import state
  const [importJsonText, setImportJsonText] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const config = getSupabaseConfig();
    setSupabaseUrl(config.url);
    setSupabaseKey(config.anonKey);
  }, []);

  const handleTestConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setTestResult({ loading: false, success: false, message: 'Please enter both Supabase URL and Anon Key.' });
      return;
    }

    setTestResult({ loading: true });
    const res = await testSupabaseConnection(supabaseUrl.trim(), supabaseKey.trim());
    setTestResult({ loading: false, success: res.success, message: res.message });

    if (res.success) {
      saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
      await refreshCloudStatus();
    }
  };

  const handleSaveAndConnect = async () => {
    saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
    const connected = await refreshCloudStatus();
    if (connected) {
      setNotice({ type: 'success', text: 'Supabase credentials saved and connected!' });
    } else {
      setNotice({ type: 'error', text: 'Credentials saved, but could not connect to Supabase. Check URL & Key.' });
    }
    setTimeout(() => setNotice(null), 3500);
  };

  const handleDisconnectCloud = async () => {
    clearSupabaseConfig();
    setSupabaseUrl('');
    setSupabaseKey('');
    await refreshCloudStatus();
    setNotice({ type: 'success', text: 'Disconnected from cloud database. Reverted to local offline mode.' });
    setTimeout(() => setNotice(null), 3000);
  };

  const handlePushCloud = async () => {
    setNotice({ type: 'success', text: 'Syncing all branch inventory and member data to Supabase...' });
    const res = await syncToCloud();
    if (res.success) {
      setNotice({ type: 'success', text: 'All local records successfully synced to Supabase Cloud Database!' });
    } else {
      setNotice({ type: 'error', text: `Sync failed: ${res.error}` });
    }
    setTimeout(() => setNotice(null), 4000);
  };

  const handlePullCloud = async () => {
    setNotice({ type: 'success', text: 'Pulling latest records from Supabase Cloud...' });
    const res = await syncFromCloud();
    if (res.success) {
      setNotice({ type: 'success', text: 'App state updated with latest data from Supabase Cloud!' });
    } else {
      setNotice({ type: 'error', text: `Pull failed: ${res.error}` });
    }
    setTimeout(() => setNotice(null), 4000);
  };

  const handleExport = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `24library-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice({ type: 'success', text: 'Database exported to JSON file successfully!' });
    setTimeout(() => setNotice(null), 3000);
  };

  const handleImport = () => {
    if (!importJsonText.trim()) {
      setNotice({ type: 'error', text: 'Please paste valid JSON backup content.' });
      return;
    }
    const success = importDataJSON(importJsonText);
    if (success) {
      setNotice({ type: 'success', text: 'Database restored successfully!' });
      setImportJsonText('');
      setTimeout(() => setNotice(null), 3000);
    } else {
      setNotice({ type: 'error', text: 'Failed to import. Invalid JSON schema.' });
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all library data to fresh demo dataset?')) {
      resetToDemoData();
      setNotice({ type: 'success', text: 'Database reset to demo state.' });
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleDownloadSchemaSql = () => {
    const a = document.createElement('a');
    a.href = '/schema.sql';
    a.download = '24library-supabase-schema.sql';
    a.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '880px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 800 }}>System Settings & Cloud Database</h1>
        <p style={{ fontSize: '13px', marginTop: '2px' }}>
          Manage PostgreSQL / Supabase cloud synchronization, multi-device replication, and local backups
        </p>
      </div>

      {notice && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: notice.type === 'error' ? 'var(--status-danger-bg)' : 'var(--status-success-bg)',
          border: `1px solid ${notice.type === 'error' ? 'var(--status-danger)' : 'var(--status-success)'}`,
          color: notice.type === 'error' ? 'var(--status-danger)' : 'var(--status-success)',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          {notice.text}
        </div>
      )}

      {/* CLOUD DATABASE INTEGRATION PANEL */}
      <div className="card" style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        border: `2px solid ${isCloudConnected ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-medium)'}`,
        background: isCloudConnected ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, var(--bg-card) 100%)' : 'var(--bg-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: isCloudConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {isCloudConnected ? <Cloud size={20} color="var(--status-success)" /> : <CloudOff size={20} color="var(--brand-primary)" />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 800 }}>Supabase / PostgreSQL Cloud Database</h3>
                <span className={`badge ${isCloudConnected ? 'badge-success' : 'badge-neutral'}`}>
                  {isCloudConnected ? 'LIVE REPLICATION ACTIVE' : 'OFFLINE / STANDALONE'}
                </span>
              </div>
              <p style={{ fontSize: '12px' }}>
                {cloudSyncStatusText}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleDownloadSchemaSql}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
              title="Download full SQL DDL schema to run in Supabase"
            >
              <FileText size={14} />
              <span>Download schema.sql</span>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Supabase Project URL</label>
            <input
              type="text"
              placeholder="https://your-project.supabase.co"
              className="form-control mono"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Supabase Anon Public API Key</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="form-control mono"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
            />
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: testResult.loading ? 'var(--bg-input)' : testResult.success ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
            border: `1px solid ${testResult.loading ? 'var(--border-medium)' : testResult.success ? 'var(--status-success)' : 'var(--status-danger)'}`,
            color: testResult.loading ? 'var(--text-primary)' : testResult.success ? 'var(--status-success)' : 'var(--status-danger)',
            fontSize: '12.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            {testResult.loading ? <RefreshCw size={15} className="animate-spin" /> : testResult.success ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            <span>{testResult.loading ? 'Testing connection to Supabase endpoint...' : testResult.message}</span>
          </div>
        )}

        {/* Cloud Actions Toolbar */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={handleTestConnection}
            className="btn btn-secondary btn-sm"
            style={{ gap: '6px' }}
          >
            <Zap size={14} />
            <span>Test Connection</span>
          </button>

          <button
            onClick={handleSaveAndConnect}
            className="btn btn-primary btn-sm"
            style={{ gap: '6px' }}
          >
            <Cloud size={14} />
            <span>Save & Enable Live Sync</span>
          </button>

          {isCloudConnected && (
            <>
              <button
                onClick={handlePushCloud}
                disabled={isSyncingCloud}
                className="btn btn-success btn-sm"
                style={{ gap: '6px' }}
              >
                <Upload size={14} />
                <span>Push Local $\rightarrow$ Cloud</span>
              </button>

              <button
                onClick={handlePullCloud}
                disabled={isSyncingCloud}
                className="btn btn-secondary btn-sm"
                style={{ gap: '6px' }}
              >
                <Download size={14} />
                <span>Pull Cloud $\rightarrow$ Local</span>
              </button>

              <button
                onClick={handleDisconnectCloud}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                Disconnect
              </button>
            </>
          )}
        </div>

        {/* 3-Step Setup Guide */}
        <div style={{
          padding: '14px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-input)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}>
          <strong style={{ color: 'var(--text-primary)' }}>Quick 60-Second Supabase Cloud Setup:</strong>
          <div>1. Create a free project at <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-primary)' }}>supabase.com</a>.</div>
          <div>2. Open the <strong>SQL Editor</strong> in your Supabase Dashboard and paste the contents of <strong style={{ color: 'var(--text-primary)' }}>schema.sql</strong> to create all 14 tables and GiST locks.</div>
          <div>3. Copy your <strong>Project URL</strong> and <strong>anon public API key</strong> (from Project Settings $\rightarrow$ API) into the fields above and click <em>Save & Enable Live Sync</em>!</div>
        </div>
      </div>

      {/* Organization Details */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={18} color="var(--brand-primary)" />
          <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Organization Profile</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>ORGANIZATION NAME</span>
            <strong style={{ color: 'var(--text-primary)' }}>{org.name}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>SUBSCRIPTION TIER</span>
            <span className="badge badge-success">{org.subscriptionPlan} ENTERPRISE</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>SUPPORT EMAIL</span>
            <span>{org.contactEmail}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px' }}>DESK PHONE</span>
            <span>{org.supportPhone}</span>
          </div>
        </div>
      </div>

      {/* Branch Network */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} color="var(--status-info)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Active Branch Network ({branches.length})</h3>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {branches.map(b => (
            <div
              key={b.id}
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>
                  {b.name} <span className="mono badge badge-neutral" style={{ fontSize: '10px' }}>{b.code}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {b.address} • Phone: {b.phone}
                </div>
              </div>
              <span className="badge badge-success">ACTIVE</span>
            </div>
          ))}
        </div>
      </div>

      {/* Backup, Restore & Data Reset */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={18} color="var(--brand-primary)" />
          <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Standalone JSON Backup & Migration</h3>
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          Export the full transactional state of all branches, seats, memberships, QR tokens, attendance logs, and financial records as a standalone JSON file, or restore from a backup.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={handleExport} className="btn btn-secondary" style={{ gap: '6px' }}>
            <Download size={15} />
            <span>Export Database JSON</span>
          </button>

          <button onClick={handleReset} className="btn btn-ghost" style={{ color: 'var(--status-danger)', gap: '6px' }}>
            <RotateCcw size={15} />
            <span>Reset to Demo Dataset</span>
          </button>
        </div>

        {/* Import JSON Area */}
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label className="form-label">Restore from JSON Backup Content</label>
          <textarea
            rows={4}
            className="form-control mono"
            style={{ fontSize: '12px' }}
            placeholder="Paste exported 24Library JSON dump here..."
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
          />
          <button
            onClick={handleImport}
            className="btn btn-primary btn-sm"
            style={{ alignSelf: 'flex-start', gap: '6px' }}
          >
            <Upload size={14} />
            <span>Restore Database</span>
          </button>
        </div>
      </div>
    </div>
  );
};
