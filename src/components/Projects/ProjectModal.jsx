import React, { useState, useEffect } from "react";

const ProjectModal = ({ onClose, onSave, initialData }) => {
  const [project, setProject] = useState({
    name: "",
    start: "",
    end: "",
    status: "Ongoing"
  });

  useEffect(() => {
    if (initialData) {
      setProject(initialData);
    }
  }, [initialData]);

  const save = () => {
    if (project.name && project.start && project.end) {
      onSave(project);
    } else {
      alert("Please fill all fields");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-xl shadow-xl p-6 relative">
        <h3 className="text-xl font-semibold mb-5 flex items-center gap-2">
          <i className={initialData ? "ri-edit-box-line text-blue-600" : "ri-folder-add-line text-blue-600"}></i>
          {initialData ? "Edit Project" : "Add Project"}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="project-name" className="text-sm font-medium text-gray-600">Project Name</label>
            <input
              id="project-name"
              type="text"
              className="w-full border border-gray-400 rounded-lg px-3 py-2 mt-1 outline-none focus:border-blue-500"
              value={project.name}
              onChange={(e) => setProject({ ...project, name: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="project-start" className="text-sm font-medium text-gray-600">Start Date</label>
              <input
                id="project-start"
                type="date"
                className="w-full border border-gray-400 rounded-lg px-3 py-2 mt-1 outline-none focus:border-blue-500"
                value={project.start}
                onChange={(e) => setProject({ ...project, start: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="project-end" className="text-sm font-medium text-gray-600">End Date</label>
              <input
                id="project-end"
                type="date"
                className="w-full border border-gray-400 rounded-lg px-3 py-2 mt-1 outline-none focus:border-blue-500"
                value={project.end}
                onChange={(e) => setProject({ ...project, end: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label htmlFor="project-status" className="text-sm font-medium text-gray-600">Status</label>
            <select
              id="project-status"
              className="w-full border border-gray-400 rounded-lg px-3 py-2 mt-1 outline-none"
              value={project.status}
              onChange={(e) => setProject({ ...project, status: e.target.value })}
            >
              <option>Ongoing</option>
              <option>Completed</option>
              <option>On Hold</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button 
            onClick={save} 
            className={`${initialData ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-5 py-2 rounded-lg flex items-center gap-2`}
          >
            <i className="ri-save-line"></i> {initialData ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;