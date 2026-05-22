import { useState } from 'react';
import api from '../lib/api';

export default function InviteMemberForm({ projectId, onInvited, onCancel }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Email is required');
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/projects/${projectId}/members`, { email, role });
      onInvited(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      <div>
        <label className="label">Email address</label>
        <input
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="member@example.com"
        />
      </div>
      <div>
        <label className="label">Role</label>
        <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Inviting…' : 'Invite Member'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
