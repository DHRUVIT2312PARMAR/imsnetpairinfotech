import React, { useState } from "react";

const TaskModal = ({ task, close, onSave }) => {
  const [form, setForm] = useState({
    ...task,
    emp: task.employee || task.emp,
    title: task.task || task.title
  });

  const handleUpdate = () => {
    onSave({
      ...form,
      employee: form.emp,
      task: form.title
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-[420px] p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-5">Edit Details</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="ts-emp" className="text-sm font-medium text-gray-600">Employee</label>
            <input
              id="ts-emp"
              className="border p-2 rounded-lg w-full mt-1"
              placeholder="Employee"
              value={form.emp}
              onChange={(e) => setForm({ ...form, emp: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="ts-title" className="text-sm font-medium text-gray-600">Task</label>
            <input
              id="ts-title"
              className="border p-2 rounded-lg w-full mt-1"
              placeholder="Task"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="ts-status" className="text-sm font-medium text-gray-600">Status</label>
            <select
              id="ts-status"
              className="border p-2 rounded-lg w-full mt-1"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>Pending</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </div>
          <button
            className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            onClick={handleUpdate}
          >
            Update Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;