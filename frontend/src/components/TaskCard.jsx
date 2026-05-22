import { Link } from 'react-router-dom';
import { Calendar, User, Flag } from 'lucide-react';
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

const PRIORITY_STYLES = {
  LOW: 'text-gray-400',
  MEDIUM: 'text-yellow-500',
  HIGH: 'text-red-500',
};

export default function TaskCard({ task, projectName }) {
  const isOverdue =
    task.dueDate && task.status !== 'DONE' && isPast(new Date(task.dueDate));
  const isDueToday =
    task.dueDate && task.status !== 'DONE' && isToday(new Date(task.dueDate));

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="block card p-4 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
          {task.title}
        </h3>
        <Flag className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${PRIORITY_STYLES[task.priority]}`} />
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`badge ${STATUS_STYLES[task.status]}`}>
          {STATUS_LABELS[task.status]}
        </span>

        <div className="flex items-center gap-3">
          {task.assignee && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <User className="w-3 h-3" />
              <span>{task.assignee.name}</span>
            </div>
          )}
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 text-xs ${
                isOverdue
                  ? 'text-red-600 font-medium'
                  : isDueToday
                  ? 'text-orange-500 font-medium'
                  : 'text-gray-500'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(task.dueDate), 'MMM d')}</span>
            </div>
          )}
        </div>
      </div>

      {projectName && (
        <p className="text-xs text-gray-400 mt-2 truncate">{projectName}</p>
      )}
    </Link>
  );
}
