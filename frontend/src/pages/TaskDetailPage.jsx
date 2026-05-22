import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';
import {
  ChevronLeft, Edit2, Trash2, Calendar, User, Flag,
  FolderKanban, Clock,
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';

const STATUS_STYLES = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
};

const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const PRIORITY_COLORS = {
  LOW: 'text-gray-500',
  MEDIUM: 'text-yellow-600',
  HIGH: 'text-red-600',
};

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    api.get(`/tasks/${taskId}`)
      .then(async (r) => {
        setTask(r.data);
        // Fetch members for the edit form
        const proj = await api.get(`/projects/${r.data.projectId}`);
        setMembers(proj.data.members || []);
      })
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [taskId, navigate]);

  const handleSaved = (updated) => {
    setTask(updated);
    setShowEdit(false);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/tasks/${taskId}`);
      navigate(`/projects/${task.projectId}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete task');
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const { data } = await api.put(`/tasks/${taskId}`, { status });
      setTask(data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-6 bg-gray-200 rounded w-32" />
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!task) return null;

  const isOverdue = task.dueDate && task.status !== 'DONE' && isPast(new Date(task.dueDate));
  const isDueToday = task.dueDate && task.status !== 'DONE' && isToday(new Date(task.dueDate));
  const canDelete =
    members.find((m) => m.user.id === user.id)?.role === 'ADMIN' ||
    task.creatorId === user.id;

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/projects" className="hover:text-gray-700">Projects</Link>
        <span>/</span>
        <Link to={`/projects/${task.projectId}`} className="hover:text-gray-700 flex items-center gap-1">
          <FolderKanban className="w-3.5 h-3.5" />
          {task.project?.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 truncate max-w-xs">{task.title}</span>
      </div>

      <div className="card p-6 md:p-8">
        {/* Title + actions */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <h1 className="text-xl font-bold text-gray-900 leading-snug">{task.title}</h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="btn-secondary" onClick={() => setShowEdit(true)}>
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            {canDelete && (
              <button className="btn-ghost text-red-500 hover:bg-red-50" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status selector */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleStatusChange(key)}
              className={`badge cursor-pointer transition-all ${
                task.status === key
                  ? STATUS_STYLES[key] + ' ring-2 ring-offset-1 ring-current'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Description */}
        {task.description ? (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        ) : (
          <p className="text-gray-400 text-sm italic mb-6">No description provided.</p>
        )}

        {/* Meta */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <MetaItem
            icon={Flag}
            label="Priority"
            value={task.priority}
            valueClass={PRIORITY_COLORS[task.priority]}
          />
          <MetaItem
            icon={User}
            label="Assignee"
            value={task.assignee?.name || 'Unassigned'}
          />
          <MetaItem
            icon={Calendar}
            label="Due Date"
            value={
              task.dueDate
                ? format(new Date(task.dueDate), 'MMM d, yyyy')
                : 'No due date'
            }
            valueClass={
              isOverdue ? 'text-red-600 font-medium' : isDueToday ? 'text-orange-500 font-medium' : ''
            }
          />
          <MetaItem
            icon={Clock}
            label="Created"
            value={format(new Date(task.createdAt), 'MMM d, yyyy')}
          />
          <MetaItem
            icon={User}
            label="Created by"
            value={task.creator?.name || '—'}
          />
          <MetaItem
            icon={FolderKanban}
            label="Project"
            value={task.project?.name || '—'}
          />
        </div>
      </div>

      {/* Back link */}
      <Link
        to={`/projects/${task.projectId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to project
      </Link>

      {/* Edit Modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Task">
        <TaskForm
          projectId={task.projectId}
          members={members}
          task={task}
          onSave={handleSaved}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>

      {/* Delete confirm */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Task" size="sm">
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{task.title}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button className="btn-danger flex-1" onClick={handleDelete}>
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

function MetaItem({ icon: Icon, label, value, valueClass = '' }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-sm font-medium text-gray-800 ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}
