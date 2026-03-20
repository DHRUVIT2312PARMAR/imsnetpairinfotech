import React, { useState } from "react";

const Cards = ({ id, name, designation, department, place, working_amount, status = "Active", pimg, onDelete, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name, designation, department, place, status });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = () => {
    onUpdate(id, formData);
    setOpen(false);
  };

  const statusColor = status === "Active"
    ? "bg-green-100 text-green-700"
    : status === "Inactive"
    ? "bg-gray-100 text-gray-600"
    : "bg-red-100 text-red-700";

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition duration-300 w-full overflow-hidden">
        <div className="flex items-center gap-4 p-5">
          <img src={pimg} alt="profile" className="w-16 h-16 rounded-full object-cover border-2 border-blue-100" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 text-base truncate">{name}</h3>
            <p className="text-sm text-blue-600 font-medium truncate">{designation}</p>
            <p className="text-xs text-gray-400">{place}</p>
          </div>
        </div>

        <div className="px-5 pb-4 grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-gray-400 text-xs">Working Days</p>
            <p className="font-semibold text-gray-800">{working_amount} Days</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-gray-400 text-xs">Status</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{status}</span>
          </div>
        </div>

        {department && (
          <div className="px-5 pb-3">
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{department}</span>
          </div>
        )}

        <div className="border-t px-5 py-3 flex gap-2">
          <button
            onClick={() => setOpen(true)}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(id)}
            className="px-3 py-2 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100 transition"
          >
            <i className="ri-delete-bin-line"></i>
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold">Edit Employee</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-3">
              {[
                { name: "name",        placeholder: "Full Name" },
                { name: "designation", placeholder: "Designation" },
                { name: "department",  placeholder: "Department" },
                { name: "place",       placeholder: "Location" },
              ].map((f) => (
                <input
                  key={f.name}
                  name={f.name}
                  value={formData[f.name] || ""}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm"
                />
              ))}
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none text-sm"
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>Terminated</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Cards;
