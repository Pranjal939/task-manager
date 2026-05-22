import { useState } from 'react';
import api from '../lib/api';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];

export default function TaskForm({ projectId, members = [], task, onSave, onCancel }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'TODO',
    priority: task?.priority || 'MEDIUM',
    assigneeId: task?.assigneeId || task?.assignee?.id || '',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Title is required');
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        projectId,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null,
      };
      let data;
      if (isEdit) {
        ({ data } = await api.put(`/tasks/${task.id}`, payload));
      } else {
        ({ data } = await api.post('/tasks', payload));
      }
      onSave(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
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
        <label className="label">Title *</label>
        <input className="input" value={form.title} onChange={set('title')} placeholder="Task title" />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input resize-none"
          rows={3}
          value={form.description}
          onChange={set('description')}
          placeholder="Optional description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Assignee</label>
          <select className="input" value={form.assigneeId} onChange={set('assigneeId')}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Due Date</label>
          <input
            type="date"
            className="input"
            value={form.dueDate}
            onChange={set('dueDate')}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
