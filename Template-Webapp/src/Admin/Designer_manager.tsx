import React, { useState } from 'react';
import type { Designer } from './types';
import './Designer_manager.css';

interface Props {
  designers: Designer[];
  onSuspend: (id: string) => void;
  onBan: (id: string) => void;
  onWarn: (id: string, message: string) => void;
  onRestore: (id: string) => void;
}

const Designer_manager: React.FC<Props> = ({ designers, onSuspend, onBan, onWarn, onRestore }) => {
  const [search, setSearch] = useState('');
  const [warningModal, setWarningModal] = useState<{ id: string; brand: string } | null>(null);
  const [warningMsg, setWarningMsg] = useState('');

  const filtered = designers.filter((d) =>
    d.brand.toLowerCase().includes(search.toLowerCase()) ||
    d.owner.toLowerCase().includes(search.toLowerCase())
  );

  const sendWarning = () => {
    if (warningModal && warningMsg.trim()) {
      onWarn(warningModal.id, warningMsg);
      setWarningModal(null);
      setWarningMsg('');
    }
  };

  const getStatusColor = (status: Designer['status']) => {
    if (status === 'active') return '#10b981';
    if (status === 'suspended') return '#f59e0b';
    return '#ef4444';
  };

  return (
    <section className="designer-manager-root">
      <header className="designer-header">
        <div>
          <h1>Designers & Brands Manager</h1>
          <p>Manage all brands and designers on the platform</p>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by brand or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="designer-stats">
        <div className="stat-card">
          <label>Total Designers</label>
          <span>{designers.length}</span>
        </div>
        <div className="stat-card">
          <label>Active</label>
          <span className="green">{designers.filter((d) => d.status === 'active').length}</span>
        </div>
        <div className="stat-card">
          <label>Suspended</label>
          <span className="amber">{designers.filter((d) => d.status === 'suspended').length}</span>
        </div>
        <div className="stat-card">
          <label>Banned</label>
          <span className="red">{designers.filter((d) => d.status === 'banned').length}</span>
        </div>
      </div>

      <table className="designers-table">
        <thead>
          <tr>
            <th>Brand</th>
            <th>Owner</th>
            <th>Email</th>
            <th>Joined</th>
            <th>Rating</th>
            <th>Warnings</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((d) => (
            <tr key={d.id}>
              <td className="brand-cell">{d.brand}</td>
              <td>{d.owner}</td>
              <td className="email-cell">{d.email}</td>
              <td>{new Date(d.joinDate).toLocaleDateString()}</td>
              <td>{d.rating ? `${d.rating}/5` : '–'}</td>
              <td>
                <span className={`warning-badge ${d.warnings > 0 ? 'active' : ''}`}>
                  {d.warnings}
                </span>
              </td>
              <td>
                <span className="status-badge" style={{ backgroundColor: getStatusColor(d.status) }}>
                  {d.status}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  {d.status === 'active' && (
                    <>
                      <button className="btn-warn" onClick={() => setWarningModal({ id: d.id, brand: d.brand })}>
                        Warn
                      </button>
                      <button className="btn-suspend" onClick={() => onSuspend(d.id)}>
                        Suspend
                      </button>
                      <button className="btn-ban" onClick={() => onBan(d.id)}>
                        Ban
                      </button>
                    </>
                  )}
                  {(d.status === 'suspended' || d.status === 'banned') && (
                    <button className="btn-restore" onClick={() => onRestore(d.id)}>
                      Restore
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {warningModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Send Warning to {warningModal.brand}</h3>
            <label>Warning Message</label>
            <textarea
              placeholder="Explain the reason for this warning..."
              value={warningMsg}
              onChange={(e) => setWarningMsg(e.target.value)}
              rows={4}
            />
            <div className="modal-actions">
              <button onClick={() => setWarningModal(null)}>Cancel</button>
              <button onClick={sendWarning} className="primary">
                Send Warning
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Designer_manager;
