import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import api from "../../services/api";

const TABS = [
  { id: "personal",    label: "Personal",    icon: "ri-user-line" },
  { id: "contact",     label: "Contact",     icon: "ri-phone-line" },
  { id: "security",    label: "Password",    icon: "ri-lock-line" },
  { id: "emergency",   label: "Emergency",   icon: "ri-heart-pulse-line" },
  { id: "preferences", label: "Preferences", icon: "ri-settings-3-line" },
  { id: "employment",  label: "Employment",  icon: "ri-briefcase-line" },
];

const Settings = () => {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [saving, setSaving]       = useState(false);

  const [profile, setProfile] = useState({
    firstName:    user?.firstName    || "",
    lastName:     user?.lastName     || "",
    personalEmail: user?.personalEmail || "",
    phone:        user?.phone        || "",
    dateOfBirth:  user?.dateOfBirth  || "",
    gender:       user?.gender       || "",
    bio:          user?.bio          || "",
    address: {
      city:    user?.address?.city    || "",
      state:   user?.address?.state   || "",
      pincode: user?.address?.pincode || "",
    },
    emergencyContact: {
      name:         user?.emergencyContact?.name         || "",
      phone:        user?.emergencyContact?.phone        || "",
      relationship: user?.emergencyContact?.relationship || "",
    },
    linkedin: user?.linkedin || "",
  });

  const [pw, setPw]       = useState({ current: "", newPw: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [pwSaving, setPwSaving] = useState(false);

  const set = (field, val) => setProfile(p => ({ ...p, [field]: val }));
  const setNested = (parent, field, val) =>
    setProfile(p => ({ ...p, [parent]: { ...p[parent], [field]: val } }));

  const handleSave = async () => {
    if (!profile.firstName.trim() || !profile.lastName.trim())
      return toast.error("First and last name are required");
    setSaving(true);
    try {
      const res = await api.put("/auth/profile", profile);
      if (res.data?.success) {
        login({ ...user, ...res.data.data });
        toast.success("Profile updated");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pw.current || !pw.newPw || !pw.confirm) return toast.error("Fill all fields");
    if (pw.newPw.length < 8) return toast.error("Min 8 characters");
    if (pw.newPw !== pw.confirm) return toast.error("Passwords do not match");
    setPwSaving(true);
    try {
      await api.put("/auth/change-password", { currentPassword: pw.current, newPassword: pw.newPw });
      toast.success("Password changed");
      setPw({ current: "", newPw: "", confirm: "" });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  const role = user?.role?.toLowerCase() || "employee";
  const initials = [user?.firstName, user?.lastName].filter(Boolean).map(n => n[0].toUpperCase()).join("") || "U";

  const SaveBtn = ({ onClick, loading }) => (
    <button onClick={onClick} disabled={loading}
      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2">
      {loading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
      {loading ? "Saving..." : "Save Changes"}
    </button>
  );

  const Field = ({ label, children }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );

  const Input = ({ value, onChange, placeholder, type = "text", readOnly = false }) => (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
      className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition ${readOnly ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed" : "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"}`} />
  );

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${{
          superadmin: "bg-red-100 text-red-700", admin: "bg-blue-100 text-blue-700",
          hr: "bg-purple-100 text-purple-700", employee: "bg-green-100 text-green-700"
        }[role] || "bg-gray-100 text-gray-700"}`}>{role}</span>
      </div>

      {/* Avatar card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-base font-semibold text-gray-800">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-gray-400">{user?.systemEmail}</p>
          <p className="text-xs text-gray-400 capitalize mt-0.5">{role}</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white border border-gray-200 p-1 rounded-xl overflow-x-auto shadow-sm">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 flex-1 text-xs font-medium py-2 px-3 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}>
            <i className={`${tab.icon} text-sm`}></i>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Personal Info ── */}
      {activeTab === "personal" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-800">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="First Name">
              <Input value={profile.firstName} onChange={e => set("firstName", e.target.value)} placeholder="First name" />
            </Field>
            <Field label="Last Name">
              <Input value={profile.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Last name" />
            </Field>
            <Field label="Date of Birth">
              <Input type="date" value={profile.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} />
            </Field>
            <Field label="Gender">
              <select value={profile.gender} onChange={e => set("gender", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not">Prefer not to say</option>
              </select>
            </Field>
          </div>
          <Field label={`Bio (${250 - profile.bio.length} chars left)`}>
            <textarea value={profile.bio} onChange={e => set("bio", e.target.value.slice(0, 250))}
              placeholder="Write a short bio..." rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 resize-none" />
          </Field>
          <SaveBtn onClick={handleSave} loading={saving} />
        </div>
      )}

      {/* ── Contact ── */}
      {activeTab === "contact" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-800">Contact Details</h2>
          <Field label="Phone Number">
            <Input value={profile.phone} onChange={e => set("phone", e.target.value)} placeholder="+91 98765 43210" />
          </Field>
          <Field label="Personal Email (used for OTP)">
            <Input type="email" value={profile.personalEmail} onChange={e => set("personalEmail", e.target.value)} placeholder="your@gmail.com" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City">
              <Input value={profile.address.city} onChange={e => setNested("address", "city", e.target.value)} placeholder="City" />
            </Field>
            <Field label="State">
              <Input value={profile.address.state} onChange={e => setNested("address", "state", e.target.value)} placeholder="State" />
            </Field>
            <Field label="Pincode">
              <Input value={profile.address.pincode} onChange={e => setNested("address", "pincode", e.target.value)} placeholder="Pincode" />
            </Field>
          </div>
          <Field label="LinkedIn">
            <Input value={profile.linkedin} onChange={e => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/your-profile" />
          </Field>
          <SaveBtn onClick={handleSave} loading={saving} />
        </div>
      )}

      {/* ── Password ── */}
      {activeTab === "security" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-800">Change Password</h2>
          {[
            { label: "Current Password", key: "current" },
            { label: "New Password",     key: "newPw" },
            { label: "Confirm Password", key: "confirm" },
          ].map(({ label, key }) => (
            <Field key={key} label={label}>
              <div className="relative">
                <input type={showPw[key] ? "text" : "password"} value={pw[key]}
                  onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={label}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 pr-10" />
                <button type="button" onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <i className={showPw[key] ? "ri-eye-off-line" : "ri-eye-line"}></i>
                </button>
              </div>
            </Field>
          ))}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
            <p className="text-xs text-yellow-700">Min 8 characters — include uppercase, lowercase, number, and special character.</p>
          </div>
          <button onClick={handleChangePassword} disabled={pwSaving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2">
            {pwSaving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            {pwSaving ? "Updating..." : "Update Password"}
          </button>
        </div>
      )}

      {/* ── Emergency Contact ── */}
      {activeTab === "emergency" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-800">Emergency Contact</h2>
          {[
            { label: "Contact Name",  key: "name",         placeholder: "Full name" },
            { label: "Phone Number",  key: "phone",        placeholder: "+91 98765 43210" },
            { label: "Relationship",  key: "relationship", placeholder: "e.g. Mother, Father, Spouse" },
          ].map(({ label, key, placeholder }) => (
            <Field key={key} label={label}>
              <Input value={profile.emergencyContact[key]}
                onChange={e => setNested("emergencyContact", key, e.target.value)}
                placeholder={placeholder} />
            </Field>
          ))}
          <SaveBtn onClick={handleSave} loading={saving} />
        </div>
      )}

      {/* ── Preferences ── */}
      {activeTab === "preferences" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">
          <h2 className="text-base font-semibold text-gray-800">Preferences</h2>

          {/* Notification toggles */}
          {[
            { label: "Email Notifications", desc: "Receive updates via email" },
            { label: "Push Notifications",  desc: "In-app alerts and updates" },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
              </label>
            </div>
          ))}

          {/* Theme hint */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">Theme</p>
              <p className="text-xs text-gray-400">Toggle dark / light mode from the header</p>
            </div>
            <span className="text-xs text-blue-500 flex items-center gap-1">
              <i className="ri-moon-line"></i> Header →
            </span>
          </div>
        </div>
      )}

      {/* ── Employment (read-only) ── */}
      {activeTab === "employment" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-1">
          <h2 className="text-base font-semibold text-gray-800 mb-1">Employment Details</h2>
          <p className="text-xs text-gray-400 mb-4">These fields are managed by HR and cannot be edited here.</p>
          {[
            { label: "Employee ID",   value: user?.employeeId || user?.id?.slice(-8)?.toUpperCase() || "—" },
            { label: "System Email",  value: user?.systemEmail || "—" },
            { label: "Role",          value: user?.role || "—" },
            { label: "Department",    value: user?.department || "—" },
            { label: "Designation",   value: user?.designation || "—" },
            { label: "Joining Date",  value: user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString("en-IN") : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <span className="text-xs font-medium text-gray-500">{label}</span>
              <span className="text-sm text-gray-800 font-medium capitalize">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Settings;
