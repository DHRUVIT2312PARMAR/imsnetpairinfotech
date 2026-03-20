import React, { useState } from "react";

const CATEGORIES = ["General", "HR", "IT", "Event"];

const categoryColor = {
  General: "bg-blue-100 text-blue-700",
  HR:      "bg-purple-100 text-purple-700",
  IT:      "bg-green-100 text-green-700",
  Event:   "bg-orange-100 text-orange-700",
};

const AnnouncementForm = ({ onAdd }) => {
  const [title,    setTitle]    = useState("");
  const [msg,      setMsg]      = useState("");
  const [category, setCategory] = useState("General");
  const [pinned,   setPinned]   = useState(false);

  const submit = () => {
    if (!title.trim() || !msg.trim()) return;
    onAdd({ title, msg, category, pinned });
    setTitle(""); setMsg(""); setCategory("General"); setPinned(false);
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
      <p className="text-base font-semibold text-gray-800 mb-4">New Announcement</p>

      <label htmlFor="ann-title" className="sr-only">Announcement title</label>
      <input
        id="ann-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Announcement title *"
        className="w-full border border-gray-300 p-2.5 rounded-lg mb-3 outline-none focus:border-blue-500 text-sm"
      />

      <label htmlFor="ann-msg" className="sr-only">Message</label>
      <textarea
        id="ann-msg"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Write message..."
        rows={3}
        className="w-full border border-gray-300 p-2.5 rounded-lg mb-3 resize-none outline-none focus:border-blue-500 text-sm"
      />

      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="flex gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-xs px-3 py-1 rounded-full font-medium border transition ${
                category === c ? categoryColor[c] + " border-transparent" : "border-gray-300 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer ml-auto">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="accent-blue-600" />
          Pin to top
        </label>
      </div>

      <button
        onClick={submit}
        className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
      >
        <i className="ri-add-line mr-1"></i> Add Announcement
      </button>
    </div>
  );
};

export default AnnouncementForm;
