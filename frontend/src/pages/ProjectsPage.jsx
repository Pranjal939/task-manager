import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import Modal from '../components/Modal';
import { FolderKanban, Plus, Users, CheckSquare, Crown } from 'lucide-react';
import { format } from 'date-fns';

function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="card p-5 hover:shadow-md transition-shadow group block"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FolderKanban className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {project.name}
          </h3>
        </div>
        {project.myRole === 'ADMIN' && (
          <span className="badge bg-amber-100 text-amber-700 flex-shrink-0">
            <Crown className="w-3 h-3 mr-1" />
            Admin
          </span>
        )}
      </div>

      {project.description && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          <span>{project._count?.members ?? 0} members</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckSquare className="w-3.5 h-3.5" />
          <span>{project._count?.tasks ?? 0} tasks</span>
        </div>
        <span className="ml-auto">{format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/projects')
      .then((r) => setProjects(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Project name is required');
    setCreating(true);
    setError('');
    try {
      const { data } = await api.post('/projects', form);
      setProjects((p) => [{ ...data, myRole: 'ADMIN', _count: { members: 1, tasks: 0 } }, ...p]);
      setShowCreate(false);
      setForm({ name: '', description: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Manage your team projects</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-16 text-center">
          <FolderKanban className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium text-lg">No projects yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">
            Create your first project to get started.
          </p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setError(''); }} title="New Project">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Project name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="My Awesome Project"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What is this project about?"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1" disabled={creating}>
              {creating ? 'Creating…' : 'Create Project'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
