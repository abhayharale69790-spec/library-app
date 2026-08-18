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
  Check,
  Sparkles,
  MapPin,
  Phone,
  Armchair,
  Bell,
  Calendar,
  Plus
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
} from '../../lib/supabaseClient';
import { SetupWizardModal } from './SetupWizardModal';
import { BottomSheet } from '../common/BottomSheet';
import { BusinessType, SeatNamingStyle } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    businessProfile,
    updateBusinessProfile,
    branches,
    currentBranch,
    addBranch,
    bulkGenerateSeats,
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

  const [activeTab, setActiveTab] = useState<'BUSINESS' | 'BRANCHES' | 'NOTIFICATIONS' | 'BACKUP' | 'CLOUD'>('BUSINESS');
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // Business Profile Form State
  const [name, setName] = useState(businessProfile.name || '');
  const [type, setType] = useState<BusinessType>(businessProfile.type || 'Study Center');
  const [shortName, setShortName] = useState(businessProfile.shortName || '');
  const [phone, setPhone] = useState(businessProfile.phone || '');
  const [whatsapp, setWhatsapp] = useState(businessProfile.whatsapp || '');
  const [address, setAddress] = useState(businessProfile.address || '');
  const [gracePeriod, setGracePeriod] = useState(businessProfile.gracePeriodMinutes || 15);

  // Add Branch Form State
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCapacity, setNewBranchCapacity] = useState(60);
  const [newBranchAddress, setNewBranchAddress] = useState('');
  const [newBranchPhone, setNewBranchPhone] = useState('');

  // Bulk Seat Generator State
  const [bulkCount, setBulkCount] = useState(70);
  const [bulkStyle, setBulkStyle] = useState<SeatNamingStyle>('ALPHA_NUMERIC');
  const [bulkPrefix, setBulkPrefix] = useState('D-');

  // Cloud Database Form State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [testResult, setTestResult] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);

  // Backup Import state
  const [importJsonText, setImportJsonText] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const config = getSupabaseConfig();
    setSupabaseUrl(config.url);
    setSupabaseKey(config.anonKey);
  }, []);

  const handleSaveBusinessProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile({
      name: name.trim(),
      type,
      shortName: shortName.trim() || name.slice(0, 3).toUpperCase(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      address: address.trim(),
      gracePeriodMinutes: Number(gracePeriod),
      receiptPrefix: (shortName.trim() || 'RCP') + '-',
    });
    setNotice({ type: 'success', text: 'Business profile updated successfully!' });
    setTimeout(() => setNotice(null), 3000);
  };

  const handleAddBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    addBranch({
      name: newBranchName.trim(),
      code: (businessProfile.shortName || 'BR') + '-0' + (branches.length + 1),
      address: newBranchAddress.trim() || address,
      phone: newBranchPhone.trim() || phone,
      contactPerson: 'Manager',
      capacity: Number(newBranchCapacity),
    });

    setShowAddBranchModal(false);
    setNewBranchName('');
    setNotice({ type: 'success', text: `Branch ${newBranchName} added with ${newBranchCapacity} desks!` });
    setTimeout(() => setNotice(null), 3000);
  };

  const handleBulkGenerateSeatsSubmit = () => {
    bulkGenerateSeats(currentBranch.id, Number(bulkCount), bulkStyle, bulkPrefix);
    setNotice({ type: 'success', text: `Generated ${bulkCount} desks for ${currentBranch.name}!` });
    setTimeout(() => setNotice(null), 3000);
  };

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
      setNotice({ type: 'error', text: 'Credentials saved, but could not connect to Supabase.' });
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
      setNotice({ type: 'success', text: '✓ All local data successfully uploaded to Supabase!' });
    } else {
      setNotice({ type: 'error', text: `Cloud sync failed: ${res.error}` });
    }
    setTimeout(() => setNotice(null), 4000);
  };

  const handlePullCloud = async () => {
    setNotice({ type: 'success', text: 'Downloading latest cloud data...' });
    const res = await syncFromCloud();
    if (res.success) {
      setNotice({ type: 'success', text: '✓ Local store updated from Cloud PostgreSQL database!' });
    } else {
      setNotice({ type: 'error', text: `Cloud pull failed: ${res.error}` });
    }
    setTimeout(() => setNotice(null), 4000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyCenter-Backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice({ type: 'success', text: 'Complete JSON backup downloaded to your device!' });
    setTimeout(() => setNotice(null), 3000);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;
    const ok = importDataJSON(importJsonText.trim());
    if (ok) {
      setNotice({ type: 'success', text: 'Data backup successfully restored!' });
      setImportJsonText('');
    } else {
      setNotice({ type: 'error', text: 'Invalid JSON format or missing required fields.' });
    }
    setTimeout(() => setNotice(null), 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800 }}>Center Settings & Operations</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Configure your business identity, branches, bulk seats, notifications & cloud sync
          </p>
        </div>

        <button
          onClick={() => setShowSetupWizard(true)}
          className="btn-primary"
          style={{ width: 'auto', minHeight: '40px', padding: '0 16px', fontSize: '13px', background: 'linear-gradient(135deg, #10b981, #059669)', gap: '6px' }}
        >
          <Sparkles size={16} /> 10-Min Setup Wizard
        </button>
      </div>

      {notice && (
        <div 
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: notice.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
            color: notice.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {notice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {notice.text}
        </div>
      )}

      {/* 2. Sub-Tabs */}
      <div className="pill-selector">
        {[
          { id: 'BUSINESS', label: '🏢 Business Profile' },
          { id: 'BRANCHES', label: `📍 Branches (${branches.length})` },
          { id: 'NOTIFICATIONS', label: '🔔 Notifications' },
          { id: 'BACKUP', label: '💾 Backup & Restore' },
          { id: 'CLOUD', label: '☁️ Cloud Sync (Supabase)' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pill-item ${activeTab === t.id ? 'active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: BUSINESS PROFILE */}
      {activeTab === 'BUSINESS' && (
        <form onSubmit={handleSaveBusinessProfile} className="mobile-card" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Customer-Facing Business Identity</h3>
            <span className="badge badge-info">{businessProfile.type}</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            This information automatically appears on student passes, receipts, notifications, and WhatsApp messages.
          </p>

          <div className="form-group">
            <label className="form-label">Business / Center Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">Business Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as BusinessType)}
                className="form-select"
              >
                <option value="Library">Library</option>
                <option value="Study Center">Study Center</option>
                <option value="Reading Room">Reading Room</option>
                <option value="Study Hall">Study Hall</option>
                <option value="Abhyasika">Abhyasika (अभ्यासिका)</option>
                <option value="Co-Learning Space">Co-Learning Space</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Short Code (Receipt Prefix)</label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value.toUpperCase())}
                className="form-input"
                maxLength={6}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div className="form-group">
              <label className="form-label">Contact Phone *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp Number</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gate Early-Arrival Grace Period (Minutes)</label>
            <input
              type="number"
              min="0"
              max="60"
              value={gracePeriod}
              onChange={(e) => setGracePeriod(Number(e.target.value))}
              className="form-input"
            />
          </div>

          <button type="submit" className="btn-primary" style={{ minHeight: '46px', fontSize: '14px', marginTop: '6px' }}>
            Save Business Changes
          </button>
        </form>
      )}

      {/* TAB 2: BRANCHES & SEAT BULK GENERATION */}
      {activeTab === 'BRANCHES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Active Branches & Centers</h3>
            <button onClick={() => setShowAddBranchModal(true)} className="btn-primary" style={{ width: 'auto', minHeight: '36px', padding: '0 12px', fontSize: '12px' }}>
              <Plus size={14} /> Add Branch
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {branches.map(b => (
              <div key={b.id} className="mobile-card" style={{ margin: 0, padding: '14px', border: b.id === currentBranch.id ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '15px', fontWeight: '800' }}>{b.name}</h4>
                      {b.id === currentBranch.id && <span className="badge badge-info">Active</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Code: {b.code} • Capacity: {b.capacity} Desks
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      📍 {b.address}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bulk Desk Generator for Active Branch */}
          <div className="mobile-card" style={{ margin: 0, padding: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>
              ⚡ 1-Click Desk Generator for {currentBranch.name.split(' - ')[0]}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Instantly create desks with custom naming patterns without manual entry.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div className="form-group">
                <label className="form-label">Desk Count</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(Number(e.target.value))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Naming Style</label>
                <select
                  value={bulkStyle}
                  onChange={(e) => setBulkStyle(e.target.value as SeatNamingStyle)}
                  className="form-select"
                >
                  <option value="ALPHA_NUMERIC">A-01, A-02, B-01...</option>
                  <option value="NUMERIC">01, 02, 03... 70</option>
                  <option value="CUSTOM">Custom Prefix</option>
                </select>
              </div>

              {bulkStyle === 'CUSTOM' && (
                <div className="form-group">
                  <label className="form-label">Prefix</label>
                  <input
                    type="text"
                    value={bulkPrefix}
                    onChange={(e) => setBulkPrefix(e.target.value)}
                    className="form-input"
                  />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleBulkGenerateSeatsSubmit}
              className="btn-primary"
              style={{ width: '100%', minHeight: '44px', marginTop: '10px' }}
            >
              Generate {bulkCount} Desks Now
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="mobile-card" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800' }}>WhatsApp & In-App Expiry Reminders</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Automatically send WhatsApp messages branded with {businessProfile.name || 'your center'} before student membership expires.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={businessProfile.enable7dReminder}
                onChange={(e) => updateBusinessProfile({ enable7dReminder: e.target.checked })}
              />
              <span>Send reminder <strong>7 days</strong> before expiry</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={businessProfile.enable3dReminder}
                onChange={(e) => updateBusinessProfile({ enable3dReminder: e.target.checked })}
              />
              <span>Send reminder <strong>3 days</strong> before expiry</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={businessProfile.enable1dReminder}
                onChange={(e) => updateBusinessProfile({ enable1dReminder: e.target.checked })}
              />
              <span>Send reminder on <strong>exact expiry day</strong></span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP & RESTORE */}
      {activeTab === 'BACKUP' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="mobile-card" style={{ margin: 0, padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>Export Complete Data Backup</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Download a 100% complete snapshot of all student records, memberships, seats, receipts, and expenses.
            </p>
            <button onClick={handleDownloadBackup} className="btn-primary" style={{ minHeight: '44px', gap: '8px' }}>
              <Download size={18} /> Download Data Backup (.json)
            </button>
          </div>

          <form onSubmit={handleImportSubmit} className="mobile-card" style={{ margin: 0, padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>Restore Data Backup</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Paste previously exported JSON backup to restore your data safely.
            </p>
            <textarea
              rows={4}
              placeholder="Paste JSON backup text here..."
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              className="form-input"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}
            />
            <button type="submit" className="btn-secondary" style={{ width: '100%', minHeight: '44px', marginTop: '10px' }}>
              <Upload size={16} /> Restore from JSON
            </button>
          </form>

          <div className="mobile-card" style={{ margin: 0, padding: '16px', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)' }}>Reset Demo Data</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 10px 0' }}>
              Restore original sample students and shift schedules.
            </p>
            <button onClick={resetToDemoData} className="btn-danger" style={{ minHeight: '38px', fontSize: '13px' }}>
              <RotateCcw size={16} /> Reset to Demo Dataset
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: CLOUD SYNC (SUPABASE) */}
      {activeTab === 'CLOUD' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="mobile-card" style={{ margin: 0, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Supabase PostgreSQL Database</h3>
              <span className={`badge ${isCloudConnected ? 'badge-success' : 'badge-neutral'}`}>
                {isCloudConnected ? '● Connected' : 'Local Offline Mode'}
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Supabase Project URL</label>
              <input
                type="text"
                placeholder="https://xyz.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Supabase Anon Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="form-input"
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button type="button" onClick={handleTestConnection} className="btn-secondary" style={{ flex: 1 }}>
                Test Connection
              </button>
              <button type="button" onClick={handleSaveAndConnect} className="btn-primary" style={{ flex: 1 }}>
                Save & Connect
              </button>
            </div>

            {testResult && (
              <div style={{ padding: '10px', marginTop: '10px', borderRadius: 'var(--radius-sm)', background: testResult.success ? 'var(--status-success-bg)' : 'var(--status-danger-bg)', color: testResult.success ? 'var(--status-success)' : 'var(--status-danger)', fontSize: '12px' }}>
                {testResult.message}
              </div>
            )}
          </div>

          {isCloudConnected && (
            <div className="mobile-card" style={{ margin: 0, padding: '16px', display: 'flex', gap: '10px' }}>
              <button onClick={handlePushCloud} className="btn-primary" style={{ flex: 1 }}>
                Upload Local &rarr; Cloud
              </button>
              <button onClick={handlePullCloud} className="btn-secondary" style={{ flex: 1 }}>
                Download Cloud &rarr; Local
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Branch Modal */}
      {showAddBranchModal && (
        <BottomSheet
          isOpen={true}
          onClose={() => setShowAddBranchModal(false)}
          title="Add New Branch / Center"
          subtitle="Configure multi-branch reading rooms"
        >
          <form onSubmit={handleAddBranchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Branch Name *</label>
              <input
                type="text"
                placeholder="e.g. Dadar West Scholar Point"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="form-input"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Desk Capacity *</label>
              <input
                type="number"
                min="1"
                max="500"
                value={newBranchCapacity}
                onChange={(e) => setNewBranchCapacity(Number(e.target.value))}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              <input
                type="text"
                placeholder="Branch Location"
                value={newBranchAddress}
                onChange={(e) => setNewBranchAddress(e.target.value)}
                className="form-input"
              />
            </div>

            <button type="submit" className="btn-primary" style={{ minHeight: '44px', marginTop: '6px' }}>
              Create Branch & Generate Desks
            </button>
          </form>
        </BottomSheet>
      )}

      {/* Setup Wizard Modal */}
      {showSetupWizard && (
        <SetupWizardModal onClose={() => setShowSetupWizard(false)} />
      )}
    </div>
  );
};
