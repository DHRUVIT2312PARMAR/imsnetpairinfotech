import React, { useState } from "react";

const AddTaskModal = ({ open, onClose, onSave }) => {
  const [task, setTask] = useState({
    title: "",
    description: "",
    employee: "",
    priority: "Medium",
    startDate: "",
    deadline: "",
    hours: "",
  });

  if (!open) return null;

  const handleChange = (e) => {
    setTask({ ...task, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!task.title || !task.employee || !task.startDate || !task.deadline) {
      alert("Please fill all required fields");
      return;
    }

    if (new Date(task.deadline) < new Date(task.startDate)) {
      alert("End Date cannot be before Start Date");
      return;
    }

    onSave({
      ...task,
      status: "Assigned",
      id: Date.now(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur flex items-center justify-center z-50">

      <div className="bg-white w-[95%] max-w-xl rounded-2xl shadow-xl p-6">

        <h2 className="text-xl font-semibold mb-5">
          Create New Task
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>
            <label htmlFor="task-title" className="text-sm font-medium">Task Title *</label>
            <input
              id="task-title"
              name="title"
              placeholder="Enter task title"
              onChange={handleChange}
              className="border p-2 rounded-lg w-full mt-1"
            />
          </div>

          <div>
            <label htmlFor="task-employee" className="text-sm font-medium">Assign Employee *</label>
            <select
              id="task-employee"
              name="employee"
              onChange={handleChange}
              className="border p-2 rounded-lg w-full mt-1"
            >
              <option value="">Select Employee</option>
              <option>Rohit</option>
              <option>Amit</option>
              <option>Neha</option>
            </select>
          </div>

          <div>
            <label htmlFor="task-hours" className="text-sm font-medium">Estimated Hours</label>
            <input
              id="task-hours"
              type="number"
              name="hours"
              placeholder="e.g. 8"
              onChange={handleChange}
              className="border p-2 rounded-lg w-full mt-1"
            />
          </div>

          <div>
            <label htmlFor="task-startDate" className="text-sm font-medium">Start Date *</label>
            <input
              id="task-startDate"
              type="date"
              name="startDate"
              onChange={handleChange}
              className="border p-2 rounded-lg w-full mt-1"
            />
          </div>

          <div>
            <label htmlFor="task-deadline" className="text-sm font-medium">End Date / Deadline *</label>
            <input
              id="task-deadline"
              type="date"
              name="deadline"
              onChange={handleChange}
              className="border p-2 rounded-lg w-full mt-1"
            />
          </div>

        </div>

        <div className="mt-4">
          <label htmlFor="task-description" className="text-sm font-medium">Task Description</label>
          <textarea
            id="task-description"
            name="description"
            placeholder="Write task details..."
            onChange={handleChange}
            className="border p-2 rounded-lg w-full mt-1 h-24 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;