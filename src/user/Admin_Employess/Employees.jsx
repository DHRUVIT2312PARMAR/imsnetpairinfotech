import React, { useState, useCallback } from "react";
import Card from "../../components/Employee/Cards";
import { RiUserAddLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useApi from "../../hooks/useApi";
import api from "../../services/api";

const departments = ["All", "Development", "Design", "HR", "Testing", "Management", "Analytics"];
const statuses    = ["All", "Active", "Inactive"];

const SkeletonCard = () => (
  <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5 animate-pulse">
    <div className="flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-full bg-gray-200"></div>
      <div className="h-4 w-28 bg-gray-200 rounded"></div>
      <div className="h-3 w-20 bg-gray-100 rounded"></div>
      <div className="h-3 w-24 bg-gray-100 rounded"></div>
    </div>
  </div>
);

const Employees = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dept, setDept]     = useState("All");
  const [status, setStatus] = useState("All");

  const fetchEmployees = useCallback(() => {
    const params = {};
    if (search) params.search = search;
    if (dept   !== "All") params.department = dept;
    if (status !== "All") params.status     = status.toLowerCase();
    return api.get("/employees", { params }).then(r => r.data.data);
  }, [search, dept, status]);

  const { data, loading, error, refetch } = useApi(fetchEmployees, [search, dept, status]);

  const employees = data?.employees || [];
  const total     = data?.total     || 0;

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this employee?")) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success("Employee terminated");
      refetch();
    } catch {
      toast.error("Failed to remove employee");
    }
  };

  const handleUpdate = async (id, updated) => {
    try {
      await api.put(`/employees/${id}`, updated);
      toast.success("Employee updated");
      refetch();
    } catch {
      toast.error("Failed to update employee");
    }
  };

  const stats = [
    { label: "Total",    value: total,                                                          color: "from-blue-500 to-indigo-600",   icon: "ri-team-line" },
    { label: "Active",   value: employees.filter(e => e.status?.current === "active").length,   color: "from-green-500 to-emerald-600", icon: "ri-user-follow-line" },
    { label: "Inactive", value: employees.filter(e => e.status?.current !== "active").length,   color: "from-orange-500 to-red-500",    icon: "ri-user-unfollow-line" },
  ];

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-semibold">Employees</h2>
        <button
          onClick={() => navigate("/employee/registration")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition justify-center"
        >
          <RiUserAddLine size={18} /> Add Employee
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <i className="ri-error-warning-line"></i> {error}
          <button onClick={refetch} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
        {stats.map((s, i) => (
          <div key={i} className={`rounded-2xl p-5 text-white bg-gradient-to-r ${s.color} shadow-lg flex items-center gap-4`}>
            <div className="bg-white/20 p-3 rounded-xl text-2xl"><i className={s.icon}></i></div>
            <div>
              <p className="text-sm opacity-90">{s.label}</p>
              <p className="text-3xl font-bold">{loading ? "—" : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search by name or designation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 text-sm"
        />
        <select value={dept} onChange={(e) => setDept(e.target.value)}
          className="border border-gray-300 p-2.5 rounded-lg outline-none text-sm">
          {departments.map(d => <option key={d}>{d}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 p-2.5 rounded-lg outline-none text-sm">
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
        <button
          onClick={() => { setSearch(""); setDept("All"); setStatus("All"); }}
          className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm"
        >
          Reset
        </button>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 -mt-2">
        Showing {employees.length} of {total} employees
      </p>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
        ) : employees.length > 0 ? employees.map((emp) => (
          <Card
            key={emp._id}
            id={emp._id}
            name={`${emp.personalInfo?.firstName || ""} ${emp.personalInfo?.lastName || ""}`.trim()}
            designation={emp.employment?.designation || ""}
            department={emp.employment?.department || ""}
            working_amount={emp.compensation?.basicSalary || 0}
            place={emp.contactInfo?.email || ""}
            status={emp.status?.current === "active" ? "Active" : "Inactive"}
            pimg={emp.profilePicture || `https://i.pravatar.cc/150?u=${emp._id}`}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        )) : (
          <div className="col-span-4 text-center py-16 text-gray-400">
            <i className="ri-user-search-line text-5xl mb-3 block"></i>
            <p className="text-sm">No employees found</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Employees;
