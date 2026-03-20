import React, { useState } from "react";
import ProjectFilters from "../../components/Projects/ProjectFilters";
import ProjectsTable from "../../components/Projects/ProjectsTable";
import ProjectCards from "../../components/projects/ProjectCards";
import ProjectModal from "../../components/Projects/ProjectModal";

const Projects = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProject] = useState([
    { id: 1, name: "Rohit", start: "2026-02-03", end: "2026-02-10", status: "Ongoing" },
    { id: 2, name: "Ram", start: "2026-02-03", end: "2026-02-10", status: "Completed" },
    { id: 3, name: "Dev", start: "2026-02-03", end: "2026-02-10", status: "Ongoing" },
    { id: 4, name: "Prabhat", start: "2026-02-03", end: "2026-02-10", status: "On Hold" },
    { id: 5, name: "Demo", start: "2026-02-03", end: "2026-02-10", status: "Ongoing" }
  ]);

  const [data, setData] = useState(projects);
  const [open, setOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const addNewProject = (newProject) => {
    const projectWithId = { ...newProject, id: Date.now() };
    const updatedList = [projectWithId, ...projects];
    setProject(updatedList);
    setData(updatedList);
    setOpen(false);
  };

  const updateProject = (updatedDetails) => {
    const updatedList = projects.map((p) =>
      p.id === editingProject.id ? { ...updatedDetails, id: p.id } : p
    );
    setProject(updatedList);
    setData(updatedList);
    setEditingProject(null);
  };

  const deleteProject = (id) => {
    if (window.confirm("Are you sure?")) {
      const updatedList = projects.filter((p) => p.id !== id);
      setProject(updatedList);
      setData(updatedList);
    }
  };

  const startEdit = (project) => {
    setEditingProject(project);
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold"> Project Management </h1>
        <button 
          onClick={() => setOpen(true)} 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <i className="ri-add-line"></i> Add Project
        </button>
      </div>

      <ProjectCards data={data} />
      <ProjectFilters projects={projects} setData={setData} />
      
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <tbody className="animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-full"></div></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ProjectsTable 
          data={data} 
          onDelete={deleteProject} 
          onEdit={startEdit} 
        />
      )}

      {/* Add Modal */}
      {open && (
        <ProjectModal 
          onClose={() => setOpen(false)} 
          onSave={addNewProject} 
        />
      )}

      {/* Edit Modal (Same Component, Different Mode) */}
      {editingProject && (
        <ProjectModal 
          onClose={() => setEditingProject(null)} 
          onSave={updateProject} 
          initialData={editingProject}
        />
      )}
    </div>
  );
};

export default Projects;