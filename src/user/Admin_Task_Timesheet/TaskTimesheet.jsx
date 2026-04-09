import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import api from "../../services/api";
import TimesheetCards from "../../components/Task_Timesheet/TimesheetCards";
import TimesheetFilters from "../../components/Task_Timesheet/TimesheetFilters";
import TimesheetTable from "../../components/Task_Timesheet/TimesheetTable";
import AddTaskModal from "../../components/Task_Timesheet/AddTaskBtnModel";

const TaskTimesheet = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() || "employee";
  const canCreate = ["admin","superadmin","hr"].includes(role);

  const [tasks, setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]     = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/tasks?limit=200&sortBy=createdAt&order=desc");
      const list = data.data?.data || [];
      // Normalize for TimesheetCards (needs .hours and .status)
      setTasks(list.map(t => ({
        ...t,
        hours: t.loggedHours || t.estimatedHours || 0,
      })));
    } catch { toast.error("Failed to load tasks"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveTask = async (newTask) => {
    try {
      const payload = {
        title:          newTask.title,
        description:    newTask.description,
        priority:       newTask.priority || "Medium",
        startDate:      newTask.startDate,
        dueDate:        newTask.deadline,
        estimatedHours: newTask.hours ? +newTask.hours : 0,
        status:         "Todo",
      };
      const { data } = await api.post("/tasks", payload);
      setTasks(prev => [{ ...data.data, hours: data.data.loggedHours || 0 }, ...prev]);
      toast.success("Task created");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to create task"); }
    setOpen(false);
  };

  const updateTasks = async (updatedList) => {
    // Called by TimesheetTable when status changes or delete
    // Find what changed
    const changed = updatedList.find((t, i) => {
      const orig = tasks[i];
      return orig && (t._id === orig._id) && (t.status !== orig.status);
    });
    if (changed) {
      try {
        await api.put(`/tasks/${changed._id}`, { status: changed.status });
      } catch { /* silent — UI already updated */ }
    }
    setTasks(updatedList);
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Task & Timesheet</h1>
        {canCreate && (
          <button onClick={() => setOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            + Add Task
          </button>
        )}
      </div>

      <TimesheetCards data={tasks} />
      <TimesheetFilters />

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <tbody className="animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-full"></div></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <TimesheetTable tasks={tasks} setTasks={updateTasks} />
      )}

      <AddTaskModal open={open} onClose={() => setOpen(false)} onSave={saveTask} />
    </div>
  );
};

export default TaskTimesheet;
