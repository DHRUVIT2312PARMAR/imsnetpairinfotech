import React from "react";

const categoryColor = {
  General: "bg-blue-100 text-blue-700",
  HR:      "bg-purple-100 text-purple-700",
  IT:      "bg-green-100 text-green-700",
  Event:   "bg-orange-100 text-orange-700",
};

const AnnouncementList = ({ data, onSelect, onDelete, onTogglePin }) => {
  if (!data.length)
    return (
      <div className="text-center py-12 text-gray-400">
        <i className="ri-megaphone-line text-5xl mb-3 block"></i>
        <p className="text-sm">No announcements yet. Create one above.</p>
      </div>
    );

  // Pinned first
  const sorted = [...data].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      {sorted.map((a) => (
        <div
          key={a.id}
          onClick={() => onSelect(a)}
          className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-xl cursor-pointer transition relative ${a.pinned ? "border-blue-300 ring-1 ring-blue-200" : "border-gray-200"}`}
        >
          {/* Pinned badge */}
          {a.pinned && (
            <span className="absolute top-3 right-10 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
              <i className="ri-pushpin-line text-[10px]"></i> Pinned
            </span>
          )}

          <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-gray-800 line-clamp-1 flex-1">{a.title}</h3>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(a.id); }}
              className="text-red-400 hover:text-red-600 flex-shrink-0"
            >
              <i className="ri-delete-bin-line"></i>
            </button>
          </div>

          {/* Category badge */}
          {a.category && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-2 inline-block ${categoryColor[a.category] || "bg-gray-100 text-gray-600"}`}>
              {a.category}
            </span>
          )}

          <p className="text-gray-600 text-sm mt-2 line-clamp-3">{a.msg}</p>

          <div className="text-xs text-gray-400 mt-4 flex justify-between">
            <span>{a.date}</span>
            <span>{a.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementList;
