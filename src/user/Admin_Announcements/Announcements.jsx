import React, { useState } from "react";
import AnnouncementForm from "../../components/Announcements/AnnouncementForm";
import AnnouncementList from "../../components/Announcements/AnnouncementList";
import AnnouncementModal from "../../components/Announcements/AnnouncementsModal";

const Announcements = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [selected, setSelected] = useState(null);

  const addAnnouncement = (data) => {
    setAnnouncements((prev) => [
      { id: Date.now(), ...data, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString() },
      ...prev,
    ]);
  };

  const deleteAnnouncement = (id) => {
    setAnnouncements((prev) => prev.filter(a => a.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const togglePin = (id) => {
    setAnnouncements((prev) => prev.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a));
  };

  return (
    <div className="relative h-full m-1 p-6
      bg-gradient-to-br from-slate-50 to-gray-100
      flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <h1 className="text-2xl font-semibold">Announcements</h1>

      <AnnouncementForm onAdd={addAnnouncement} />

      {isLoading ? (
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
          onDelete={deleteAnnouncement}
          onTogglePin={togglePin}
        />
      )}

      {selected && (
        <AnnouncementModal
          data={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};

export default Announcements;