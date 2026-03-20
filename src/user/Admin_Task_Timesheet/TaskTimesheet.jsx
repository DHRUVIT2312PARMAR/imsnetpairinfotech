import React, { useState } from "react";
import TimesheetCards from "../../components/Task_Timesheet/TimesheetCards";
import TimesheetFilters from "../../components/Task_Timesheet/TimesheetFilters";
import TimesheetTable from "../../components/Task_Timesheet/TimesheetTable";
import AddTaskModal from "../../components/Task_Timesheet/AddTaskBtnModel";
import TimesheetData from "../../components/Task_Timesheet/TimesheetData";

const TaskTimesheet = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  // Initial data ko state mein load kiya
  const [tasks, setTasks] = useState(TimesheetData);

  const saveTask = (newTask) => {
    // Naya task list mein add kiya (top par dikhane ke liye spread use kiya)
    setTasks([newTask, ...tasks]);
    setOpen(false);
  };

  const updateTasks = (updatedList) => {
    setTasks(updatedList);
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Task & Timesheet</h1>
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add Task
        </button>
      </div>

      <TimesheetCards data={tasks} />
      <TimesheetFilters />

      {isLoading ? (
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

      <AddTaskModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={saveTask}
      />
    </div>
  );
};

export default TaskTimesheet;