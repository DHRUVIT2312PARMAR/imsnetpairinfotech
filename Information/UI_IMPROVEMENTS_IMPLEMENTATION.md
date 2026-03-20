# UI Improvements Implementation Guide
## NetPair IMS — Tasks, Settings, Profile & Notifications

**Version:** 1.0.0
**Scope:** Tasks & Timesheet · Settings & Profile · Notifications Popup · Role-Based Fixes
**Last Updated:** March 2026

---

## TABLE OF CONTENTS

1. [Tasks & Timesheet — Employee Own Only + New Table Format](#1-tasks--timesheet--employee-own-only--new-table-format)
2. [Policies — Employee Cannot Add](#2-policies--employee-cannot-add)
3. [Settings — Profile Update for All Roles](#3-settings--profile-update-for-all-roles)
4. [Notifications — Remove Sidebar, Add Icon Popup](#4-notifications--remove-sidebar-add-icon-popup)
5. [API Endpoints](#5-api-endpoints)
6. [Summary of Changes](#6-summary-of-changes)

---

## 1. TASKS & TIMESHEET — EMPLOYEE OWN ONLY + NEW TABLE FORMAT

### Problem

- Employee can see ALL other employees' tasks in the table
- Table columns are wrong (currently shows Employee, Task, Priority, Date, Status, Actions)
- Employee should only see their OWN tasks
- Table format should be: **Project · Task · Priority · Date · Status · Actions**

### Fix 1 — Backend: Filter tasks by logged-in user for employee role

```javascript
// backend/controllers/taskController.js

exports.getTasks = async (req, res) => {
  try {
    const { user } = req;
    let filter = {};

    // Employee sees ONLY their own tasks
    if (user.role === 'employee') {
      filter.assignedTo = user._id;
    }

    // Admin sees all tasks (for oversight)
    // HR does not access tasks

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'firstName lastName')
      .populate('projectId',  'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: tasks });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
```

### Fix 2 — Task Schema

```javascript
// backend/models/Task.js
const TaskSchema = new mongoose.Schema({
  projectId:   { type: ObjectId, ref: 'Project',  required: true },
  title:       { type: String,   required: true },
  description: { type: String },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'on-hold'],
    default: 'pending',
  },
  assignedTo:  { type: ObjectId, ref: 'User' },
  assignedBy:  { type: ObjectId, ref: 'User' },
  dueDate:     { type: Date },
  completedAt: { type: Date },
}, { timestamps: true });
```

### Fix 3 — New Table Component (Employee view)

Table format: **Project | Task | Priority | Date | Status | Actions**

```jsx
// src/pages/tasks-timesheet/TaskTable.jsx

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const PRIORITY_STYLES = {
  low:      { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Low'      },
  medium:   { bg: 'bg-blue-50',    text: 'text-blue-600',   label: 'Medium'   },
  high:     { bg: 'bg-orange-50',  text: 'text-orange-600', label: 'High'     },
  critical: { bg: 'bg-red-50',     text: 'text-red-600',    label: 'Critical' },
};

const STATUS_STYLES = {
  pending:     { bg: 'bg-purple-50',  text: 'text-purple-700',  label: 'Pending'     },
  'in-progress':{ bg: 'bg-blue-50',   text: 'text-blue-700',    label: 'In Progress' },
  completed:   { bg: 'bg-green-50',   text: 'text-green-700',   label: 'Completed'   },
  'on-hold':   { bg: 'bg-yellow-50',  text: 'text-yellow-700',  label: 'On Hold'     },
};

const TaskTable = () => {
  const { user }        = useAuth();
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/tasks');
      // Employee only gets their own tasks (backend filters)
      setTasks(data.data);
    } catch (err) {
      console.error('Failed to load tasks:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev =>
        prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t)
      );
    } catch (err) {
      console.error('Status update failed:', err.message);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Remove this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      console.error('Delete failed:', err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

      {/* Table header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            {user.role === 'employee' ? 'My Tasks' : 'All Tasks'}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            {user.role === 'employee' ? ' assigned to you' : ' total'}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              {['Project', 'Task', 'Priority', 'Date', 'Status', 'Actions'].map(h => (
                <th key={h}
                  className="text-left text-xs font-semibold text-gray-500
                             px-6 py-3 uppercase tracking-wide border-b border-gray-100">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center text-gray-400 text-sm">
                  {user.role === 'employee'
                    ? 'No tasks assigned to you yet.'
                    : 'No tasks found.'}
                </td>
              </tr>
            ) : (
              tasks.map((task) => {
                const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
                const status   = STATUS_STYLES[task.status]     || STATUS_STYLES.pending;

                return (
                  <tr key={task._id} className="hover:bg-gray-50 transition-colors">

                    {/* Project */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-700">
                        {task.projectId?.name || '—'}
                      </span>
                    </td>

                    {/* Task */}
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="text-sm text-gray-800 font-medium truncate">
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full
                        text-xs font-medium ${priority.bg} ${priority.text}`}>
                        {priority.label}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString('en-IN', {
                            day: '2-digit', month: '2-digit', year: 'numeric'
                          }).replace(/\//g, '-')
                        : '—'}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {/* Employee can change their own task status */}
                      {user.role === 'employee' ? (
                        <select
                          value={task.status}
                          onChange={e => updateStatus(task._id, e.target.value)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full
                            border-0 outline-none cursor-pointer
                            ${status.bg} ${status.text}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="on-hold">On Hold</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full
                          text-xs font-medium ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Edit — employee can only update status (above), not full edit */}
                        {user.role !== 'employee' && (
                          <button
                            onClick={() => setEditingId(task._id)}
                            className="p-1.5 text-blue-500 hover:text-blue-700
                                       hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit task"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                        )}

                        {/* Delete — admin/superAdmin only */}
                        {['admin', 'superAdmin'].includes(user.role) && (
                          <button
                            onClick={() => deleteTask(task._id)}
                            className="p-1.5 text-red-400 hover:text-red-600
                                       hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete task"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14H6L5 6"/>
                              <path d="M10 11v6M14 11v6"/>
                              <path d="M9 6V4h6v2"/>
                            </svg>
                          </button>
                        )}

                        {/* Employee: view detail only */}
                        {user.role === 'employee' && (
                          <button
                            className="text-xs text-gray-400 hover:text-gray-600
                                       px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskTable;
```

---

## 2. POLICIES — EMPLOYEE CANNOT ADD

### Rule

```
SuperAdmin  → Approve/reject only (primary mode)
Admin       → Full CRUD — create, edit, submit for approval
HR          → View approved policies ONLY
Employee    → View approved policies ONLY
            → CANNOT create, edit, or delete policies
```

### Backend route guard

```javascript
// backend/routes/policies.js

// GET — all roles (content filtered by status)
router.get('/', authenticate, getPolicies);

// POST — Admin + SuperAdmin ONLY
router.post('/', authenticate, restrictTo('admin', 'superAdmin'), createPolicy);

// PUT — Admin + SuperAdmin ONLY
router.put('/:id', authenticate, restrictTo('admin', 'superAdmin'), updatePolicy);

// APPROVE — SuperAdmin ONLY
router.put('/:id/approve', authenticate, restrictTo('superAdmin'), approvePolicy);

// DELETE — Admin + SuperAdmin ONLY
router.delete('/:id', authenticate, restrictTo('admin', 'superAdmin'), deletePolicy);
```

### Frontend — hide Add Policy button

```jsx
// src/pages/policies/Policies.jsx

const { user } = useAuth();

const canManagePolicies = ['admin', 'superAdmin'].includes(user.role);

return (
  <div>
    {/* Add policy button — Admin and SuperAdmin only */}
    {canManagePolicies && (
      <button onClick={() => setShowForm(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
        + Add Policy
      </button>
    )}

    {/* Policy list — all roles see this */}
    {/* HR and Employee see approved only (backend filters) */}
    <PolicyList policies={policies} canEdit={canManagePolicies} />
  </div>
);
```

---

## 3. SETTINGS — PROFILE UPDATE FOR ALL ROLES

### What every role can update in their profile

```
All roles can update:
  ✅ First name
  ✅ Last name
  ✅ Contact number (phone)
  ✅ Personal email (used for OTP)
  ✅ Profile photo
  ✅ Password (with current password verification)
  ✅ Date of birth
  ✅ Gender
  ✅ Address (city, state, pincode)
  ✅ Emergency contact (name, phone, relation)
  ✅ Bio / About me (250 chars)
  ✅ Notification preferences (email, push)
  ✅ Theme (light / dark)
  ✅ Language preference

Additional (employee specific):
  ✅ LinkedIn profile link
  ✅ Skills / expertise tags
  ✅ Department display (read-only — set by HR)
  ✅ Designation display (read-only — set by HR)
  ✅ Employee ID (read-only)
  ✅ Joining date (read-only)
  ✅ Own payslip history
```

### Profile Settings Page Component

```jsx
// src/pages/settings/ProfileSettings.jsx

import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api';

const ProfileSettings = () => {
  const { user, setUser } = useAuth();

  const [profile, setProfile] = useState({
    firstName:    user.firstName    || '',
    lastName:     user.lastName     || '',
    phone:        user.profile?.phone        || '',
    personalEmail: user.personalEmail        || '',
    dateOfBirth:  user.profile?.dateOfBirth  || '',
    gender:       user.profile?.gender       || '',
    bio:          user.profile?.bio          || '',
    address: {
      city:    user.profile?.address?.city    || '',
      state:   user.profile?.address?.state   || '',
      pincode: user.profile?.address?.pincode || '',
    },
    emergencyContact: {
      name:         user.profile?.emergencyContact?.name         || '',
      phone:        user.profile?.emergencyContact?.phone        || '',
      relationship: user.profile?.emergencyContact?.relationship || '',
    },
    socialLinks: {
      linkedin: user.profile?.socialLinks?.linkedin || '',
    },
  });

  const [password, setPassword] = useState({
    current: '', newPass: '', confirm: '',
  });

  const [avatar, setAvatar]       = useState(user.profile?.avatar || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const fileRef = useRef(null);

  // ── Avatar upload ─────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB'); return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP allowed'); return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      const { data } = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatar(data.data.url);
      toast.success('Profile photo updated');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  // ── Save profile ──────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/profile', profile);
      setUser(prev => ({ ...prev, ...data.data }));
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ───────────────────────────────────────
  const handleChangePassword = async () => {
    if (!password.current) { toast.error('Enter current password'); return; }
    if (password.newPass.length < 8) { toast.error('Min 8 characters'); return; }
    if (password.newPass !== password.confirm) { toast.error('Passwords do not match'); return; }

    try {
      await api.put('/auth/change-password', {
        currentPassword: password.current,
        newPassword:     password.newPass,
      });
      setPassword({ current: '', newPass: '', confirm: '' });
      toast.success('Password changed successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  const TABS = [
    { id: 'personal',   label: 'Personal Info'  },
    { id: 'contact',    label: 'Contact'         },
    { id: 'security',   label: 'Password'        },
    { id: 'emergency',  label: 'Emergency'       },
    { id: 'preferences',label: 'Preferences'     },
    { id: 'employment', label: 'Employment'      },
  ];

  return (
    <div className="max-w-3xl mx-auto">

      {/* ── Avatar section ───────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5
                      flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-blue-100
                          flex items-center justify-center">
            {avatar ? (
              <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-blue-600">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            )}
          </div>
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40
                            flex items-center justify-center">
              <svg className="animate-spin w-6 h-6 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-800">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-gray-400 mb-2">{user.systemEmail}</p>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600
                       font-medium px-3 py-1.5 rounded-lg transition-colors
                       disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Change Photo'}
          </button>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG or WebP · max 2MB</p>
          <input ref={fileRef} type="file" accept="image/*"
            onChange={handleAvatarChange} className="hidden" />
        </div>
      </div>

      {/* ── Tab navigation ───────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-xs font-medium py-2 px-3 rounded-lg
              whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Personal Info ──────────────────────────── */}
      {activeTab === 'personal' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Personal Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                First Name
              </label>
              <input
                value={profile.firstName}
                onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                           focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Last Name
              </label>
              <input
                value={profile.lastName}
                onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                           focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
            <input type="date"
              value={profile.dateOfBirth}
              onChange={e => setProfile(p => ({ ...p, dateOfBirth: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                         focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
            <select
              value={profile.gender}
              onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                         focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Bio <span className="text-gray-400">({250 - profile.bio.length} chars left)</span>
            </label>
            <textarea
              value={profile.bio}
              onChange={e => setProfile(p => ({ ...p, bio: e.target.value.slice(0, 250) }))}
              placeholder="Write a short bio about yourself..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                         focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <button onClick={handleSaveProfile} disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm
                       font-medium py-2.5 rounded-lg transition-colors
                       disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Personal Info'}
          </button>
        </div>
      )}

      {/* ── Tab: Contact ─────────────────────────────────── */}
      {activeTab === 'contact' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Contact Details</h3>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              placeholder="+91 98765 43210"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                         focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Personal Email
              <span className="text-gray-400 font-normal ml-1">(used for OTP verification)</span>
            </label>
            <input
              type="email"
              value={profile.personalEmail}
              onChange={e => setProfile(p => ({ ...p, personalEmail: e.target.value }))}
              placeholder="your@gmail.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                         focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Address */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
              <input
                value={profile.address.city}
                onChange={e => setProfile(p => ({
                  ...p, address: { ...p.address, city: e.target.value }
                }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                           focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
              <input
                value={profile.address.state}
                onChange={e => setProfile(p => ({
                  ...p, address: { ...p.address, state: e.target.value }
                }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                           focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pincode</label>
              <input
                type="number"
                value={profile.address.pincode}
                onChange={e => setProfile(p => ({
                  ...p, address: { ...p.address, pincode: e.target.value }
                }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                           focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">LinkedIn</label>
            <input
              value={profile.socialLinks.linkedin}
              onChange={e => setProfile(p => ({
                ...p, socialLinks: { ...p.socialLinks, linkedin: e.target.value }
              }))}
              placeholder="https://linkedin.com/in/your-profile"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                         focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button onClick={handleSaveProfile} disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm
                       font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Contact Info'}
          </button>
        </div>
      )}

      {/* ── Tab: Password ─────────────────────────────────── */}
      {activeTab === 'security' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Change Password</h3>

          {[
            { label: 'Current Password', key: 'current',  placeholder: 'Enter current password' },
            { label: 'New Password',     key: 'newPass',  placeholder: 'Min 8 characters' },
            { label: 'Confirm Password', key: 'confirm',  placeholder: 'Repeat new password' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type="password"
                value={password[key]}
                onChange={e => setPassword(p => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                           focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
            <p className="text-xs text-yellow-700">
              Password must be at least 8 characters and include uppercase,
              lowercase, number, and special character.
            </p>
          </div>

          <button onClick={handleChangePassword}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm
                       font-medium py-2.5 rounded-lg transition-colors">
            Update Password
          </button>
        </div>
      )}

      {/* ── Tab: Emergency Contact ───────────────────────── */}
      {activeTab === 'emergency' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Emergency Contact</h3>

          {[
            { label: 'Contact Name',     key: 'name',         placeholder: 'Full name' },
            { label: 'Phone Number',     key: 'phone',        placeholder: '+91 98765 43210' },
            { label: 'Relationship',     key: 'relationship', placeholder: 'e.g. Mother, Father, Spouse' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                value={profile.emergencyContact[key]}
                onChange={e => setProfile(p => ({
                  ...p, emergencyContact: { ...p.emergencyContact, [key]: e.target.value }
                }))}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                           focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          ))}

          <button onClick={handleSaveProfile} disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm
                       font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Emergency Contact'}
          </button>
        </div>
      )}

      {/* ── Tab: Preferences ─────────────────────────────── */}
      {activeTab === 'preferences' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Preferences</h3>

          {[
            { label: 'Email Notifications', key: 'email',  desc: 'Receive updates via email' },
            { label: 'Push Notifications',  key: 'push',   desc: 'In-app alerts and updates' },
          ].map(({ label, key, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <button
                onClick={() => {/* toggle logic */}}
                className="w-10 h-6 bg-blue-600 rounded-full relative transition-colors"
              >
                <span className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full" />
              </button>
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Theme</label>
            <div className="flex gap-3">
              {['Light', 'Dark', 'System'].map(theme => (
                <button key={theme}
                  className="flex-1 py-2 text-sm border border-gray-300 rounded-lg
                             hover:border-blue-500 hover:text-blue-600 transition-colors">
                  {theme}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Employment (read-only for employee) ─────── */}
      {activeTab === 'employment' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Employment Details</h3>
          <p className="text-xs text-gray-400 mb-4">
            These fields are managed by HR and cannot be edited here.
          </p>

          {[
            { label: 'Employee ID',  value: user.employment?.employeeId  || '—' },
            { label: 'Department',   value: user.profile?.department      || '—' },
            { label: 'Designation',  value: user.profile?.designation     || '—' },
            { label: 'Login Email',  value: user.systemEmail              || '—' },
            { label: 'Role',         value: user.role                     || '—' },
            { label: 'Joining Date',
              value: user.employment?.joiningDate
                ? new Date(user.employment.joiningDate).toLocaleDateString('en-IN')
                : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between
                                        py-3 border-b border-gray-100 last:border-0">
              <span className="text-xs font-medium text-gray-500">{label}</span>
              <span className="text-sm text-gray-800 font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ProfileSettings;
```

---

## 4. NOTIFICATIONS — REMOVE SIDEBAR, ADD ICON POPUP

### What changes

```
BEFORE:
  - Notifications page exists as a full sidebar nav item
  - Takes user to /notifications route

AFTER:
  - Remove /notifications from sidebar navigation
  - Add bell icon (🔔) in the Header (top-right)
  - Click bell → small popup panel opens (not a page)
  - Popup shows recent notifications list
  - Unread count badge on bell icon
  - Mark all as read button
  - "See all" button at bottom (optional full page)
  - Works for ALL roles
```

### Header update — add bell icon

```jsx
// src/components/Header.jsx

import { useState, useEffect, useRef } from 'react';
import NotificationPopup from './NotificationPopup';
import api from '../services/api';

const Header = () => {
  const [showNotif, setShowNotif]         = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const bellRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications?limit=10');
      setNotifications(data.data);
      setUnreadCount(data.data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Notifications fetch failed:', err.message);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark read failed:', err.message);
    }
  };

  return (
    <div className="w-full h-16 flex items-center justify-between px-6
                    bg-white border-b border-gray-200 flex-shrink-0">

      {/* Left: breadcrumb or page title */}
      <div>
        <p className="text-sm font-semibold text-gray-800">
          Welcome, {user?.firstName}
        </p>
        <p className="text-xs text-gray-400 hidden sm:block">{currentDate}</p>
      </div>

      {/* Right: notification bell + profile */}
      <div className="flex items-center gap-3">

        {/* Bell icon with popup */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => setShowNotif(prev => !prev)}
            className="relative p-2 text-gray-500 hover:text-gray-700
                       hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Notifications"
          >
            {/* Bell SVG */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>

            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]
                               bg-red-500 text-white text-[10px] font-bold
                               rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification popup */}
          {showNotif && (
            <NotificationPopup
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllRead={markAllRead}
              onClose={() => setShowNotif(false)}
              onRefresh={fetchNotifications}
            />
          )}
        </div>

        {/* Logout button */}
        <button onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white text-xs
                     font-medium px-3 py-2 rounded-lg transition-colors">
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
};
```

### Notification Popup Component

```jsx
// src/components/NotificationPopup.jsx

const NOTIF_ICONS = {
  leave:      { bg: 'bg-green-100',  color: 'text-green-600',  icon: '📋' },
  attendance: { bg: 'bg-blue-100',   color: 'text-blue-600',   icon: '⏰' },
  task:       { bg: 'bg-purple-100', color: 'text-purple-600', icon: '✅' },
  payroll:    { bg: 'bg-yellow-100', color: 'text-yellow-600', icon: '💰' },
  policy:     { bg: 'bg-orange-100', color: 'text-orange-600', icon: '📄' },
  system:     { bg: 'bg-gray-100',   color: 'text-gray-600',   icon: '⚙️' },
  announcement:{ bg: 'bg-pink-100',  color: 'text-pink-600',   icon: '📢' },
  default:    { bg: 'bg-gray-100',   color: 'text-gray-600',   icon: '🔔' },
};

function timeAgo(date) {
  const diff  = (Date.now() - new Date(date)) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const NotificationPopup = ({
  notifications, unreadCount, onMarkAllRead, onClose, onRefresh
}) => {
  const markOneRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      onRefresh();
    } catch {}
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white
                    border border-gray-200 rounded-xl shadow-xl z-50
                    overflow-hidden">

      {/* Popup header */}
      <div className="flex items-center justify-between px-4 py-3
                      border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-red-100 text-red-600 text-xs font-bold
                             px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-2xl mb-2">🔔</p>
            <p className="text-sm text-gray-400">No notifications yet</p>
          </div>
        ) : (
          notifications.map(notif => {
            const style = NOTIF_ICONS[notif.type] || NOTIF_ICONS.default;
            return (
              <div
                key={notif._id}
                onClick={() => !notif.isRead && markOneRead(notif._id)}
                className={`flex gap-3 px-4 py-3 border-b border-gray-50
                  cursor-pointer transition-colors hover:bg-gray-50
                  ${!notif.isRead ? 'bg-blue-50/40' : ''}`}
              >
                {/* Icon */}
                <div className={`w-9 h-9 rounded-full flex-shrink-0
                  flex items-center justify-center text-base
                  ${style.bg}`}>
                  {style.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium leading-snug
                    ${notif.isRead ? 'text-gray-600' : 'text-gray-800'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {timeAgo(notif.createdAt)}
                  </p>
                </div>

                {/* Unread dot */}
                {!notif.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Popup footer */}
      <div className="px-4 py-3 border-t border-gray-100 text-center">
        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600 font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NotificationPopup;
```

### Remove Notifications from Sidebar

```javascript
// src/components/sidebar/Sidebar.jsx

// REMOVE this item from NAV_ITEMS:
// { path: '/notifications', label: 'Notifications', roles: null }

// The bell icon in Header replaces this entirely
```

### Notification Schema & API

```javascript
// backend/models/Notification.js
const NotificationSchema = new mongoose.Schema({
  userId:   { type: ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['leave','attendance','task','payroll','policy','system','announcement','default'],
    default: 'default',
  },
  title:    { type: String, required: true },
  message:  { type: String, required: true },
  link:     { type: String },               // optional deep-link path
  isRead:   { type: Boolean, default: false },
  metadata: { type: Object },               // extra data if needed
}, { timestamps: true });

NotificationSchema.index({ userId: 1, createdAt: -1 });

// Auto-delete notifications older than 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
```

```javascript
// backend/routes/notifications.js
const router = express.Router();

// Get notifications for logged-in user
router.get('/', authenticate, async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json({ success: true, data: notifications });
});

// Mark one as read
router.put('/:id/read', authenticate, async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isRead: true }
  );
  res.json({ success: true });
});

// Mark all as read
router.put('/mark-all-read', authenticate, async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true });
});
```

### Create notification utility

```javascript
// backend/utils/notify.js
const Notification = require('../models/Notification');

async function createNotification(userId, type, title, message, link = null) {
  try {
    await Notification.create({ userId, type, title, message, link });
  } catch (err) {
    console.error('[NOTIFY]', err.message);
  }
}

// Usage examples in other controllers:
// When leave is approved:
await createNotification(
  leave.employeeId,
  'leave',
  'Leave Approved',
  `Your ${leave.leaveType} leave request has been approved.`,
  '/leave'
);

// When task assigned:
await createNotification(
  task.assignedTo,
  'task',
  'New Task Assigned',
  `You have been assigned: ${task.title}`,
  '/tasks-timesheet'
);

// When payslip ready:
await createNotification(
  employee.userId,
  'payroll',
  'Payslip Available',
  `Your payslip for ${month} is ready to download.`,
  '/settings'
);

module.exports = { createNotification };
```

---

## 5. API ENDPOINTS

```
TASKS
  GET    /api/v1/tasks                    all (employee: own only via backend filter)
  POST   /api/v1/tasks                    admin, superAdmin (assign tasks)
  PUT    /api/v1/tasks/:id                employee (status only), admin, superAdmin (full)
  DELETE /api/v1/tasks/:id                admin, superAdmin

PROFILE
  GET    /api/v1/profile                  all (own)
  PUT    /api/v1/profile                  all (own — editable fields only)
  POST   /api/v1/profile/avatar           all (own)
  DELETE /api/v1/profile/avatar           all (own)

PASSWORD
  PUT    /api/v1/auth/change-password     all (own — requires currentPassword)

POLICIES
  GET    /api/v1/policies                 all (status filtered — hr/emp see approved only)
  POST   /api/v1/policies                 admin, superAdmin
  PUT    /api/v1/policies/:id             admin, superAdmin
  PUT    /api/v1/policies/:id/approve     superAdmin
  DELETE /api/v1/policies/:id             admin, superAdmin

NOTIFICATIONS
  GET    /api/v1/notifications            all (own only, limit=10 default)
  PUT    /api/v1/notifications/:id/read   all (own)
  PUT    /api/v1/notifications/mark-all-read  all (own)
```

---

## 6. SUMMARY OF CHANGES

### Tasks & Timesheet

```
BEFORE: All employees' tasks shown to every employee role user
AFTER:
  ✅ Employee sees ONLY their own tasks (backend filter: assignedTo = user._id)
  ✅ Table columns: Project | Task | Priority | Date | Status | Actions
  ✅ Employee can update their own task STATUS from the table dropdown
  ✅ Edit/Delete buttons hidden for employee role
  ✅ Admin/SuperAdmin see all tasks with full edit/delete
```

### Policies

```
BEFORE: Employee might see Add Policy button
AFTER:
  ✅ HR and Employee see approved policies only (read-only)
  ✅ Add/Edit/Delete buttons shown only to Admin and SuperAdmin
  ✅ Backend route guard blocks POST/PUT/DELETE for hr/employee roles
```

### Settings — Profile Update

```
BEFORE: Basic settings with limited fields
AFTER:
  ✅ All roles can update: first name, last name, phone, personal email,
     date of birth, gender, bio, address, emergency contact, LinkedIn
  ✅ All roles can upload/change profile photo (max 2MB, JPG/PNG/WebP)
  ✅ All roles can change their own password (requires current password)
  ✅ Tabbed layout: Personal | Contact | Password | Emergency | Preferences | Employment
  ✅ Employment tab is READ-ONLY (managed by HR, not self-editable)
  ✅ System email and role shown as read-only badges
```

### Notifications

```
BEFORE: /notifications as a full sidebar page
AFTER:
  ✅ Bell icon (🔔) in Header top-right — visible to ALL roles
  ✅ Red badge shows unread count (99+ if overflow)
  ✅ Click bell → small popup panel (280px wide, max 320px tall)
  ✅ Popup shows last 10 notifications with icon, title, message, time ago
  ✅ Color-coded icons by type (leave, task, payroll, system, etc.)
  ✅ Unread notifications have blue left highlight + blue dot
  ✅ Click notification → marks it as read
  ✅ "Mark all read" button in popup header
  ✅ Click outside popup → auto-closes
  ✅ /notifications removed from sidebar navigation
  ✅ Polls every 30 seconds for new notifications
  ✅ Auto-delete notifications older than 90 days (MongoDB TTL)
```

### Files to create / update

```
CREATE:
  src/components/NotificationPopup.jsx
  src/pages/settings/ProfileSettings.jsx
  backend/models/Notification.js
  backend/utils/notify.js
  backend/routes/notifications.js

UPDATE:
  src/components/Header.jsx              — add bell icon + NotificationPopup
  src/components/sidebar/Sidebar.jsx     — remove /notifications nav item
  src/pages/tasks-timesheet/TaskTable.jsx — new columns + employee filter
  src/pages/policies/Policies.jsx        — hide add button for hr/employee
  backend/controllers/taskController.js  — filter by assignedTo for employee
  backend/routes/policies.js             — add restrictTo middleware
  backend/routes/notifications.js        — new file (see above)
  backend/routes/tasks.js               — update employee filter
```

---

*All changes maintain backward compatibility with existing data.*
*Employee role restrictions are enforced on the backend — frontend hiding is secondary defense.*
*Notification popup works identically for all 4 roles.*
