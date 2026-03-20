import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import api from "../../services/api";

const AVATAR_COLORS = [
  ["#eff4ff", "#1a3fb5"], ["#f0fdf4", "#16a34a"], ["#faf5ff", "#9333ea"],
  ["#fff7ed", "#ea580c"], ["#fdf2f8", "#db2777"],
];

const Profile = () => {
  const { user, login } = useAuth();
  const role = user?.role?.toLowerCase() || "employee";

  // Pick a consistent color based on first letter
  const colorIdx = (user?.firstName?.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  const [avatarBg, avatarColor] = AVATAR_COLORS[colorIdx];

  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map(n => n[0].toUpperCase())
    .join("") || "U";

  const [form, setForm] = useState({
    firstName:   user?.firstName   || "",
    lastName:    user?.lastName    || "",
    personalEmail: user?.personalEmail || "",
    phone:       user?.phone       || "",
    department:  user?.department  || "",
    designation: user?.designation || "",
    address:     user?.address     || "",
  });

  const [saving, setSaving] = useState(false);

  const [pwModal, setPwModal] = useState(false);
  const [pwForm,  setPwForm]  = useState({ current: "", newPw: "", confirm: "" });
  const [showPw,  setShowPw]  = useState({ current: false, newPw: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return toast.error("First and last name are required");
    }
    setSaving(true);
    try {
      const res = await api.put("/auth/profile", form);
      if (res.data?.success) {
        login({ ...user, ...res.data.data });
        toast.success("Profile updated successfully");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm)
      return toast.error("Please fill all fields");
    if (pwForm.newPw.length < 8)
      return toast.error("Password must be at least 8 characters");
    if (pwForm.newPw !== pwForm.confirm)
      return toast.error("Passwords do not match");

    setPwSaving(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: pwForm.current,
        newPassword:     pwForm.newPw,
      });
      toast.success("Password changed successfully");
      setPwModal(false);
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  const roleBadge = {
    superadmin: "bg-red-100 text-red-700",
    admin:      "bg-blue-100 text-blue-700",
    hr:         "bg-purple-100 text-purple-700",
    employee:   "bg-green-100 text-green-700",
  }[role] || "bg-gray-100 text-gray-700";

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">My Profile</h1>
          <p className="text-xs text-gray-500 mt-0.5">View and update your personal information</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${roleBadge}`}>
          {role}
        </span>
      </div>

      {/* Avatar + system info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0"
          style={{ background: avatarBg, color: avatarColor }}
        >
          {initials}
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xl font-semibold text-gray-800">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">{user?.systemEmail}</p>
          <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
            <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${roleBadge}`}>
              {role}
            </span>
            {user?.department && (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                {user.department}
              </span>
            )}
            {user?.designation && (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                {user.designation}
              </span>
            )}
          </div>
        </div>
        <div className="text-center sm:text-right">
          <p className="text-xs text-gray-400">System Email</p>
          <p className="text-xs font-medium text-gray-600 mt-0.5 break-all">{user?.systemEmail}</p>
          <p className="text-xs text-gray-400 mt-2">Employee ID</p>
          <p className="text-xs font-medium text-gray-600 mt-0.5">{user?.employeeId || user?.id?.slice(-8)?.toUpperCase() || "—"}</p>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
            <i className="ri-edit-line text-lg"></i>
          </div>
          <h2 className="text-base font-semibold text-gray-800">Personal Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">First Name</label>
            <input
              name="firstName" value={form.firstName} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Last Name</label>
            <input
              name="lastName" value={form.lastName} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              placeholder="Last name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Personal Email</label>
            <input
              name="personalEmail" value={form.personalEmail} onChange={handleChange}
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
            <input
              name="phone" value={form.phone} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
            <input
              name="department" value={form.department} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              placeholder="e.g. Engineering"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Designation</label>
            <input
              name="designation" value={form.designation} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
              placeholder="e.g. Software Engineer"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
            <textarea
              name="address" value={form.address} onChange={handleChange}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 resize-none"
              placeholder="Your address"
            />
          </div>
        </div>

        {/* Read-only system email */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-500 mb-0.5">System Email (read-only)</p>
          <p className="text-sm text-gray-700">{user?.systemEmail}</p>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={() => setPwModal(true)}
            className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            <i className="ri-lock-password-line"></i>
            Change Password
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {pwModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold">Change Password</h3>
              <button onClick={() => setPwModal(false)} className="text-gray-400 hover:text-red-500 text-2xl">
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: "Current Password", field: "current", val: pwForm.current },
                { label: "New Password",     field: "newPw",   val: pwForm.newPw },
                { label: "Confirm Password", field: "confirm", val: pwForm.confirm },
              ].map(({ label, field, val }) => (
                <div key={field}>
                  <label className="text-xs font-medium text-gray-500">{label}</label>
                  <div className="relative mt-1">
                    <input
                      type={showPw[field] ? "text" : "password"}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 pr-10"
                      value={val}
                      onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                      placeholder={label}
                    />
                    <button type="button"
                      onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <i className={showPw[field] ? "ri-eye-off-line" : "ri-eye-line"}></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setPwModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleChangePassword} disabled={pwSaving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
                {pwSaving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                {pwSaving ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
