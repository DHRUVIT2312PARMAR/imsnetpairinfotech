import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import TaskModal from "../Task_Timesheet/TimeSheetModel";

const PRIORITY_STYLES = {
  High:     "bg-orange-50 text-orange-600",
  Medium:   "bg-blue-50 text-blue-600",
  Low:      "bg-gray-100 text-gray-600",
  Critical: "bg-red-50 text-red-600",
  high:     "bg-orange-50 text-orange-600",
  medium:   "bg-blue-50 text-blue-600",
  low:      "bg-gray-100 text-gray-600",
  critical: "bg-red-50 text-red-600",
};

const STATUS_STYLES = {
  Pending:      "bg-purple-50 text-purple-700",
  "In Progress":"bg-blue-50 text-blue-700",
  Completed:    "bg-green-50 text-green-700",
  Rejected:     "bg-red-50 text-red-700",
  "On Hold":    "bg-yellow-50 text-yellow-700",
  pending:      "bg-purple-50 text-purple-700",
  "in-progress":"bg-blue-50 text-blue-700",
  completed:    "bg-green-50 text-green-700",
  "on-hold":    "bg-yellow-50 text-yellow-700",
};

const TaskTable = ({ tasks, setTasks }) => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || "employee";

  const [open, setOpen]               = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Employee sees only their own tasks
  const visibleTasks = role === "employee"
    ? tasks.filter(t => {
        // match by assignedTo id or employee name fallback
        if (t.assignedTo) return String(t.assignedTo) === String(user?.id);
        return true; // if no assignedTo field, show all (local data)
      })
    : tasks;

  const deleteTask = (id) => {
    if (window.confirm("Delete this task?")) {
      setTasks(tasks.filter(t => t.id !== id && t._id !== id));
    }
  };

  const updateStatus = (id, newStatus) => {
    setTasks(tasks.map(t =>
      (t.id === id || t._id === id) ? { ...t, status: newStatus } : t
    ));
  };

  const onUpdateTask = (updatedTask) => {
    setTasks(tasks.map(t =>
      (t.id === updatedTask.id || t._id === updatedTask._id) ? updatedTask : t
    ));
    setOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            {role === "employee" ? "My Tasks" : "All Tasks"}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {visibleTasks.length} task{visibleTasks.length !== 1 ? "s" : ""}
            {role === "employee" ? " assigned to you" : " total"}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Project", "Task", "Priority", "Date", "Status", "Actions"].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center text-gray-400 text-sm">
                  {role === "employee" ? "No tasks assigned to you yet." : "No tasks found."}
                </td>
              </tr>
            ) : (
              visibleTasks.map(t => {
                const id       = t._id || t.id;
                const priority = t.priority || "Medium";
                const status   = t.status   || "Pending";
                const project  = t.projectId?.name || t.project || "—";
                const title    = t.title || t.task || "—";
                const dueDate  = t.dueDate || t.date || t.startDate;

                return (
                  <tr key={id} className="hover:bg-gray-50 transition-colors">
                    {/* Project */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-700">{project}</span>
                    </td>

                    {/* Task */}
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="text-sm text-gray-800 font-medium truncate">{title}</p>
                      {t.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{t.description}</p>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${PRIORITY_STYLES[priority] || "bg-gray-100 text-gray-600"}`}>
                        {priority}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {dueDate
                        ? new Date(dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
                        : "—"}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {role === "employee" ? (
                        <select
                          value={status}
                          onChange={e => updateStatus(id, e.target.value)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 outline-none cursor-pointer ${STATUS_STYLES[status] || "bg-gray-100 text-gray-600"}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="on-hold">On Hold</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status] || "bg-gray-100 text-gray-600"}`}>
                          {status}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Edit — admin/superadmin only */}
                        {["admin", "superadmin"].includes(role) && (
                          <button
                            onClick={() => { setSelectedTask(t); setOpen(true); }}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit task"
                          >
                            <i className="ri-edit-line text-base"></i>
                          </button>
                        )}
                        {/* Delete — admin/superadmin only */}
                        {["admin", "superadmin"].includes(role) && (
                          <button
                            onClick={() => deleteTask(id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete task"
                          >
                            <i className="ri-delete-bin-line text-base"></i>
                          </button>
                        )}
                        {/* Employee: view only label */}
                        {role === "employee" && (
                          <span className="text-xs text-gray-400 px-2 py-1 rounded bg-gray-50">View</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <TaskModal task={selectedTask} close={() => setOpen(false)} onSave={onUpdateTask} />
      )}
    </div>
  );
};

export default TaskTable;
