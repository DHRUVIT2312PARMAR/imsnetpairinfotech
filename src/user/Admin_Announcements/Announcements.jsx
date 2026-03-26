import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import api from "../../services/api";
import AnnouncementForm from "../../components/Announcements/AnnouncementForm";
import AnnouncementList from "../../components/Announcements/AnnouncementList";
import AnnouncementModal from "../../components/Announcements/AnnouncementsModal";

const Announcements = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("announcements:write");

  const [announcements, setAnnouncements] = useState([]);
  const [selected, setSelected]           = useState(null);
  const [loading, setLoading]             = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/announcements?limit=50&sortBy=createdAt&order=desc");
      setAnnouncements(data.data?.records || data.data || []);
    } catch { toast.error("Failed to load announcements"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addAnnouncement = async (formData) => {
    try {
      const { data } = await api.post("/announcements", formData);
      setAnnouncements(prev => [data.data, ...prev]);
      toast.success("Announcement posted");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to post"); }
  };

  const deleteAnnouncement = async (id) => {
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      if (selected?._id === id) setSelected(null);
      toast.success("Deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const togglePin = async (id) => {
    const item = announcements.find(a => a._id === id);
    try {
      const { data } = await api.put(`/announcements/${id}`, { pinned: !item.pinned });
      setAnnouncements(prev => prev.map(a => a._id === id ? data.data : a));
    } catch { toast.error("Failed to update"); }
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">
      <h1 className="text-2xl font-semibold">Announcements</h1>

      {canManage && <AnnouncementForm onAdd={addAnnouncement} />}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <AnnouncementList
          data={announcements}
          onSelect={setSelected}
          onDelete={canManage ? deleteAnnouncement : null}
          onTogglePin={canManage ? togglePin : null}
        />
      )}

      {selected && <AnnouncementModal data={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default Announcements;
