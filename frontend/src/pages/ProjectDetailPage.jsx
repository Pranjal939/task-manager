import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import InviteMemberForm from '../components/InviteMemberForm';
import {
  Plus, Users, Settings, Trash2, Crown, UserMinus,
  ChevronLeft, Filter, LayoutGrid, List,
} from 'lucide-react';

const STATUS_COLS = [
  { key: 'TODO', label: 'To Do', color: 'bg-gray-100' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-50' },
  { key: 'DONE', label: 'Done', color: 'bg-green-50' },
];

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('board'); // 'board' | 'list'

  // Modals
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');

  const fetchProject = useCallback(() => {
    api.get(`/projects/${projectId}`)
      .then((r) => setProject(r.data))
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [projectId, navigate]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const isAdmin = project?.myRole === 'ADMIN';

  const filteredTasks = (project?.tasks || []).filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterAssignee && t.assigneeId !== filterAssignee) return false;
    return true;
  });

  const tasksByStatus = STATUS_COLS.reduce((acc, col) => {
    acc[col.key] = filteredTasks.filter((t) => t.status === col.key);
    return acc;
  }, {});

  const handleTaskSaved = (task) => {
    setProject((p) => {
      const exists = p.tasks.find((t) => t.id === task.id);
      const tasks = exists
        ? p.tasks.map((t) => (t.id === task.id ? task : t))
        : [task, ...p.tasks];
      return { ...p, tasks };
    });
    setShowTaskForm(false);
  };

  const handleInvited = (member) => {
    setProject((p) => ({ ...p, members: [...p.members, member] }));
    setShowInvite(false);
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      setProject((p) => ({ ...p, members: p.members.filter((m) => m.user.id !== userId) }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      const { data } = await api.patch(`/projects/${projectId}/members/${userId}/role`, { role });
      setProject((p) => ({
        ...p,
        members: p.members.map((m) => (m.user.id === userId ? { ...m, role: data.role } : m)),
      }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleDeleteProject = async () => {
    try {
      await api.delete(`/projects/${projectId}`);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project');
    }
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      const { data } = await api.put(`/projects/${projectId}`, {
        name: form.name.value,
        description: form.description.value,
      });
      setProject((p) => ({ ...p, name: data.name, description: data.description }));
      setShowSettings(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update project');
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-200 rounded w-96" />
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link to="/projects" className="hover:text-gray-700 flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Projects
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{project.name}</span>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-gray-500 mt-0.5">{project.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View toggle */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setView('board')}
                className={`p-2 ${view === 'board' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                title="Board view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 ${view === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {isAdmin && (
              <>
                <button className="btn-secondary" onClick={() => setShowInvite(true)}>
                  <Users className="w-4 h-4" />
                  Invite
                </button>
                <button className="btn-ghost" onClick={() => setShowSettings(true)}>
                  <Settings className="w-4 h-4" />
                </button>
              </>
            )}
            <button className="btn-primary" onClick={() => setShowTaskForm(true)}>
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
          <select
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
          >
            <option value="">All members</option>
            {project.members.map((m) => (
              <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
            ))}
          </select>
          {(filterStatus || filterAssignee) && (
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => { setFilterStatus(''); setFilterAssignee(''); }}
            >
              Clear filters
            </button>
          )}
          <span className="text-xs text-gray-400 ml-auto">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {view === 'board' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-full">
            {STATUS_COLS.map((col) => (
              <div key={col.key} className={`rounded-xl p-4 ${col.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700 text-sm">{col.label}</h3>
                  <span className="badge bg-white text-gray-600 border border-gray-200">
                    {tasksByStatus[col.key].length}
                  </span>
                </div>
                <div className="space-y-3">
                  {tasksByStatus[col.key].map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {tasksByStatus[col.key].length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-6">No tasks</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-w-4xl">
            {filteredTasks.length === 0 ? (
              <div className="card p-12 text-center">
                <p className="text-gray-500">No tasks found</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Members sidebar strip */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Team:</span>
          <div className="flex items-center gap-1 flex-wrap">
            {project.members.map((m) => (
              <div
                key={m.id}
                title={`${m.user.name} (${m.role})`}
                className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold"
              >
                {m.user.name[0].toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      <Modal open={showTaskForm} onClose={() => setShowTaskForm(false)} title="New Task">
        <TaskForm
          projectId={projectId}
          members={project.members}
          onSave={handleTaskSaved}
          onCancel={() => setShowTaskForm(false)}
        />
      </Modal>

      {/* Invite Modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="Invite Member">
        <InviteMemberForm
          projectId={projectId}
          onInvited={handleInvited}
          onCancel={() => setShowInvite(false)}
        />
      </Modal>

      {/* Settings Modal */}
      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Project Settings" size="lg">
        <div className="space-y-6">
          {/* Edit project */}
          <form onSubmit={handleUpdateProject} className="space-y-4">
            <h3 className="font-semibold text-gray-900">Edit Project</h3>
            <div>
              <label className="label">Name</label>
              <input name="name" className="input" defaultValue={project.name} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea name="description" className="input resize-none" rows={2} defaultValue={project.description || ''} />
            </div>
            <button type="submit" className="btn-primary">Save Changes</button>
          </form>

          {/* Members */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Members</h3>
            <div className="space-y-2">
              {project.members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {m.user.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{m.user.email}</p>
                  </div>
                  {m.user.id === project.owner.id ? (
                    <span className="badge bg-amber-100 text-amber-700">
                      <Crown className="w-3 h-3 mr-1" />Owner
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        className="text-xs border border-gray-200 rounded px-2 py-1"
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.user.id, e.target.value)}
                        disabled={m.user.id === user.id}
                      >
                        <option value="MEMBER">Member</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      {m.user.id !== user.id && (
                        <button
                          onClick={() => handleRemoveMember(m.user.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Remove member"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="border border-red-200 rounded-xl p-4">
            <h3 className="font-semibold text-red-700 mb-1">Danger Zone</h3>
            <p className="text-sm text-gray-500 mb-3">
              Deleting this project will remove all tasks and members permanently.
            </p>
            <button
              className="btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="w-4 h-4" />
              Delete Project
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Project" size="sm">
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{project.name}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button className="btn-danger flex-1" onClick={handleDeleteProject}>
            Yes, Delete
          </button>
          <button className="btn-secondary flex-1" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
