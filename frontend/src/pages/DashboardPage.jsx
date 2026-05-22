import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  LayoutList,
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard')
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const tasks = data?.recentTasks || [];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's what's on your plate today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Tasks"
          value={stats.total ?? 0}
          icon={LayoutList}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="To Do"
          value={stats.todo ?? 0}
          icon={ListTodo}
          color="bg-gray-100 text-gray-600"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress ?? 0}
          icon={Clock}
          color="bg-yellow-50 text-yellow-600"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue ?? 0}
          icon={AlertTriangle}
          color="bg-red-50 text-red-600"
        />
      </div>

      {/* Completion bar */}
      {stats.total > 0 && (
        <div className="card p-5 mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {stats.done ?? 0} / {stats.total} done
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all"
              style={{ width: `${Math.round(((stats.done ?? 0) / stats.total) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {Math.round(((stats.done ?? 0) / stats.total) * 100)}% complete
          </p>
        </div>
      )}

      {/* Recent tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
          <Link to="/projects" className="text-sm text-blue-600 hover:underline">
            View projects →
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="card p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No tasks assigned to you yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Join a project or ask an admin to assign you tasks.
            </p>
            <Link to="/projects" className="btn-primary mt-4 inline-flex">
              Browse Projects
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} projectName={task.project?.name} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
