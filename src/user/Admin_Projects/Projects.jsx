import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import api from "../../services/api";
import ProjectFilters from "../../components/Projects/ProjectFilters";
import ProjectsTable from "../../components/Projects/ProjectsTable";
import ProjectCards from "../../components/Projects/ProjectCards";
import ProjectModal from "../../components/Projects/ProjectModal";

const Projects = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("projects:write");

  const [projects, setProjects] = useState([]);
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get("/projects?limit=100&sortBy=createdAt&order=desc");
      const list = res.data?.records || res.data || [];
      setProjects(list); setData(list);
    } catch { toast.error("Failed to load projects"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addNewProject = async (newProject) => {
    try {
      const { data: res } = await api.post("/projects", newProject);
      const updated = [res.data, ...projects];
      setProjects(updated); setData(updated);
      setOpen(false);
      toast.success("Project created");
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const updateProject = async (updatedDetails) => {
    try {
      const { data: res } = await api.put(`/projects/${editingProject._id}`, updatedDetails);
      const updated = projects.map(p => p._id === editingProject._id ? res.data : p);
      setProjects(updated); setData(updated);
      setEditingProject(null);
      toast.success("Project updated");
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/projects/${id}`);
      const updated = projects.filter(p => p._id !== id);
      setProjects(updated); setData(updated);
      toast.success("Project deleted");
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Project Management</h1>
        {canManage && (
          <button onClick={() => setOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <i className="ri-add-line"></i> Add Project
          </button>
        )}
      </div>

      <ProjectCards data={data} />
      <ProjectFilters projects={projects} setData={setData} />

      {loading ? (
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
        <ProjectsTable data={data} onDelete={canManage ? deleteProject : null} onEdit={canManage ? setEditingProject : null} />
      )}

      {open && <ProjectModal onClose={() => setOpen(false)} onSave={addNewProject} />}
      {editingProject && <ProjectModal onClose={() => setEditingProject(null)} onSave={updateProject} initialData={editingProject} />}
    </div>
  );
};

export default Projects;