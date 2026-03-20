import React, { useState } from "react";
import { toast } from "react-toastify";

const initialUsers = [
  { id: 1,  name: "Rohit Prajapati", email: "rohit@netpair.com",  role: "admin",      dept: "Development", status: "Active" },
  { id: 2,  name: "Neha Patel",      email: "neha@netpair.com",   role: "hr",         dept: "HR",          status: "Active" },
  { id: 3,  name: "Amit Shah",       email: "amit@netpair.com",   role: "employee",   dept: "Testing",     status: "Active" },
  { id: 4,  name: "Karan Joshi",     email: "karan@netpair.com",  role: "employee",   dept: "Design",      status: "Active" },
  { id: 5,  name: "Priya Mehta",     email: "priya@netpair.com",  role: "hr",         dept: "HR",          status: "Active" },
  { id: 6,  name: "Jay Shah",        email: "jay@netpair.com",    role: "employee",   dept: "Development", status: "Inactive" },
  { id: 7,  name: "Mehul Rana",      email: "mehul@netpair.com",  role: "admin",      dept: "Management",  status: "Active" },
  { id: 8,  name: "Sneha Desai",     email: "sneha@netpair.com",  role: "employee",   dept: "Analytics",   status: "Active" },
];

const roleStyle = (r) => ({
  superAdmin: "bg-red-100 text-red-700",
  admin:      "bg-blue-100 text-blue-700",
  hr:         "bg-purple-100 text-purple-700",
  employee:   "bg-green-100 text-green-700",
}[r] || "bg-gray-100 text-gray-600");

const permissionMatrix = {
  superAdmin: ["All permissions"],
  admin:      ["employees:read/write/delete", "attendance:manage", "leaves:approve", "reports:generate", "projects:write", "settings:write"],
  hr:         ["employees:read/write", "attendance:manage", "leaves:approve", "payroll:write", "reports:generate"],
  employee:   ["profile:read/write", "attendance:read/write", "leaves:read/write", "tasks:read/write"],
};

const RoleManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers]       = useState(initialUsers);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("All");
  const [matrixOpen, setMatrixOpen] = useState(false);

  const stats = [
    { label: "Total Users",  value: users.length,                                          color: "from-blue-500 to-indigo-600",   icon: "ri-team-line" },
    { label: "Admins",       value: users.filter(u => u.role === "admin").length,          color: "from-red-500 to-rose-600",      icon: "ri-shield-user-line" },
    { label: "HR",           value: users.filter(u => u.role === "hr").length,             color: "from-purple-500 to-violet-600", icon: "ri-user-settings-line" },
    { label: "Employees",    value: users.filter(u => u.role === "employee").length,       color: "from-green-500 to-emerald-600", icon: "ri-user-line" },
  ];

  const filtered = users.filter(u =>
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) &&
    (filter === "All" || u.role === filter)
  );

  const handleRoleChange = (id, newRole) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    toast.success("Role updated successfully");
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Role Management</h1>
        <button onClick={() => setMatrixOpen(true)} className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition text-sm">
          <i className="ri-table-line"></i> Permission Matrix
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className={`rounded-2xl p-5 text-white bg-gradient-to-r ${s.color} shadow-lg hover:shadow-2xl transition hover:-translate-y-1`}>
            <div className="flex justify-between items-center">
              <div><p className="text-xs opacity-90">{s.label}</p><h2 className="text-2xl font-bold mt-1">{s.value}</h2></div>
              <div className="bg-white/20 p-2.5 rounded-xl text-xl"><i className={s.icon}></i></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 text-sm" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border border-gray-300 p-2.5 rounded-lg outline-none text-sm">
          <option value="All">All Roles</option>
          <option value="superAdmin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="hr">HR</option>
          <option value="employee">Employee</option>
        </select>
        <button onClick={() => { setSearch(""); setFilter("All"); }} className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm">Reset</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[650px]">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">User</th>
              <th className="px-6 py-4 text-center font-semibold">Department</th>
              <th className="px-6 py-4 text-center font-semibold">Current Role</th>
              <th className="px-6 py-4 text-center font-semibold">Status</th>
              <th className="px-6 py-4 text-center font-semibold">Change Role</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t animate-pulse">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-full"></div></td>
                    ))}
                  </tr>
                ))
              : filtered.map(u => (
              <tr key={u.id} className="border-t hover:bg-blue-50/40 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "#eff4ff", color: "#1a3fb5" }}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-gray-600">{u.dept}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleStyle(u.role)}`}>{u.role}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{u.status}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                    className="border border-gray-300 p-1.5 rounded-lg outline-none text-xs focus:border-blue-500">
                    <option value="superAdmin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="hr">HR</option>
                    <option value="employee">Employee</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permission Matrix Modal */}
      {matrixOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">Permission Matrix</h3>
              <button onClick={() => setMatrixOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-4">
              {Object.entries(permissionMatrix).map(([role, perms]) => (
                <div key={role} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roleStyle(role)}`}>{role}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {perms.map((p, i) => (
                      <span key={i} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded-lg">{p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setMatrixOpen(false)} className="w-full mt-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
