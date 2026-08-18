import React, { useState } from 'react';
import { useLibrary } from '../../state/libraryStore';
import { 
  Building2, 
  ArrowRightLeft, 
  X, 
  AlertTriangle, 
  CheckCircle2,
  Armchair
} from 'lucide-react';

interface MemberTransferModalProps {
  memberId: string;
  onClose: () => void;
}

export const MemberTransferModal: React.FC<MemberTransferModalProps> = ({ memberId, onClose }) => {
  const {
    branches,
    members,
    currentBranchId,
    transferBranch,
  } = useLibrary();

  const member = members.find(m => m.id === memberId);
  const otherBranches = branches.filter(b => b.id !== member?.branchId);

  const [targetBranchId, setTargetBranchId] = useState(otherBranches[0]?.id || '');
  const [statusNotice, setStatusNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!member) return null;

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBranchId) {
      setStatusNotice({ type: 'error', text: 'Please select a destination branch.' });
      return;
    }

    const res = transferBranch(member.id, targetBranchId);
    if (!res.success) {
      setStatusNotice({ type: 'error', text: res.error || 'Branch transfer failed.' });
    } else {
      const targetName = branches.find(b => b.id === targetBranchId)?.name;
      setStatusNotice({ type: 'success', text: `Scholar transferred to ${targetName}. Seat released in current branch.` });
      setTimeout(onClose, 1500);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }} onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowRightLeft size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Inter-Branch Scholar Transfer</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
        </div>

        <form onSubmit={handleTransfer}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {statusNotice && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: statusNotice.type === 'error' ? 'var(--status-danger-bg)' : 'var(--status-success-bg)',
                border: `1px solid ${statusNotice.type === 'error' ? 'var(--status-danger)' : 'var(--status-success)'}`,
                color: statusNotice.type === 'error' ? 'var(--status-danger)' : 'var(--status-success)',
                fontSize: '12.5px',
                fontWeight: 600,
              }}>
                {statusNotice.text}
              </div>
            )}

            <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
              <div>Scholar: <strong style={{ color: '#ffffff' }}>{member.fullName}</strong> ({member.memberCode})</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Current Branch: {branches.find(b => b.id === member.branchId)?.name}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Destination Branch</label>
              <select
                className="form-control"
                value={targetBranchId}
                onChange={(e) => setTargetBranchId(e.target.value)}
              >
                {otherBranches.map(b => (
                  <option key={b.id} value={b.id}>
                    📍 {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontSize: '12px',
              color: 'var(--status-warning)',
            }}>
              ⚠️ <strong>Inventory Rule:</strong> Transferring will automatically release the assigned desk in the current branch and issue a new branch QR access token.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">Confirm Transfer</button>
          </div>
        </form>
      </div>
    </div>
  );
};
