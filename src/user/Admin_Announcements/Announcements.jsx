import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import api from "../../services/api";
import { ROLES, ROLE_LABELS, ROLE_COLORS, ANNOUNCEMENT_CREATORS } from "../../constants/roles";

// ── Role Badge ────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const c = ROLE_COLORS[role] ?? ROLE_COLORS[ROLES.EMPLOYEE];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {ROLE_LABELS[role] ?? role}
    </span>
  );
};

// ── Create / Edit Modal ───────────────────────────────────────
const AnnouncementModal = ({ onClose, onSaved, allowedTargets, existing }) => {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    title:        existing?.title   ?? "",
    message:      existing?.message ?? "",
    targetRoles:  existing?.targetRoles ?? existing?.target_roles ?? [],
    pinned:       existing?.pinned ?? existing?.is_pinned ?? false,
    expiresAt:    existing?.expiresAt ? new Date(existing.expiresAt).toISOString().slice(0, 16) : "",
    category:     existing?.category ?? "General",
  });
  const [saving, setSaving] = useState(false);

  const toggleRole = (role) =>
    setForm(f => ({
      ...f,
      targetRoles: f.targetRoles.includes(role)
        ? f.targetRoles.filter(r => r !== role)
        : [...f.targetRoles, role],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim())             return toast.error("Title is required");
    if (!form.message.trim())           return toast.error("Message is required");
    if (form.targetRoles.length === 0)  return toast.error("Select at least one target role");
    setSaving(true);
    try {
      const payload = {
        title:        form.title.trim(),
        message:      form.message.trim(),
        target_roles: form.targetRoles,
        targetRoles:  form.targetRoles,
        category:     form.category,
        is_pinned:    form.pinned,
        pinned:       form.pinned,
        expires_at:   form.expiresAt || null,
      };
      if (isEdit) {
        await api.patch(`/announcements/${existing._id || existing.id}`, payload);
        toast.success("Announcement updated");
      } else {
        await api.post("/announcements", payload);
        toast.success("Announcement created");
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Announcement" : "New Announcement"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            <i className="ri-close-line"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" maxLength={255} placeholder="e.g. Company Holiday Notice"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
            <textarea rows={4} placeholder="Write the announcement message…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200 resize-none"
              value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500"
              value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option>General</option><option>HR</option><option>IT</option><option>Event</option>
            </select>
          </div>

          {/* Target roles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visible to *</label>
            <div className="flex flex-wrap gap-2">
              {allowedTargets.map(role => {
                const selected = form.targetRoles.includes(role);
                const c = ROLE_COLORS[role] ?? ROLE_COLORS.employee;
                return (
                  <button key={role} type="button" onClick={() => toggleRole(role)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all
                      ${selected ? `${c.bg} ${c.text} border-current` : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400"}`}>
                    {selected && <span className="mr-1">✓</span>}
                    {ROLE_LABELS[role] ?? role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div onClick={() => setForm(f => ({ ...f, pinned: !f.pinned }))}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${form.pinned ? "bg-purple-500" : "bg-gray-200"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.pinned ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-gray-600">Pin to top</span>
            </label>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Expires at (optional)</label>
              <input type="datetime-local"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-purple-500"
                value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium disabled:opacity-50 flex items-center gap-2">
              {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              {isEdit ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Announcement Card ─────────────────────────────────────────
const AnnouncementCard = ({ ann, canManage, onDelete, onEdit, onRead }) => {
  const isExpired = ann.expiresAt && new Date(ann.expiresAt) < new Date();
  const isRead    = ann.is_read;
  const isPinned  = ann.pinned ?? ann.is_pinned;
  const roles     = ann.targetRoles ?? ann.target_roles ?? [];

  return (
    <div onClick={() => !isRead && onRead(ann._id || ann.id)}
      className={`relative bg-white rounded-2xl shadow-sm border transition-shadow hover:shadow-md cursor-pointer
        ${isPinned ? "border-purple-300 ring-1 ring-purple-200" : "border-gray-100"}
        ${!isRead ? "border-l-4 border-l-purple-500" : ""}
        ${isExpired ? "opacity-60" : ""}`}>
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {isPinned && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <i className="ri-pushpin-line text-xs"></i> Pinned
              </span>
            )}
            {ann.category && ann.category !== "General" && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ann.category}</span>
            )}
            <h3 className={`text-sm text-gray-900 ${!isRead ? "font-bold" : "font-semibold"}`}>{ann.title}</h3>
          </div>
          {canManage && (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={e => { e.stopPropagation(); onEdit(ann); }}
                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                <i className="ri-edit-line text-sm"></i>
              </button>
              <button onClick={e => { e.stopPropagation(); onDelete(ann._id || ann.id); }}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                <i className="ri-delete-bin-line text-sm"></i>
              </button>
            </div>
          )}
        </div>

        {/* Target role badges */}
        <div className="flex flex-wrap gap-1 mb-3">
          {roles.map(r => <RoleBadge key={r} role={r} />)}
        </div>

        {/* Message */}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{ann.message}</p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400 flex items-center gap-1.5">
            By <span className="font-medium text-gray-500">{ann.created_by_name}</span>
            {ann.created_by_role && <RoleBadge role={ann.created_by_role} />}
          </span>
          <div className="flex items-center gap-2">
            {!isRead && <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" title="Unread" />}
            <span className="text-xs text-gray-400">
              {new Date(ann.publishedAt || ann.published_at || ann.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────
const Announcements = () => {
  const { user } = useAuth();
  const canCreate = ANNOUNCEMENT_CREATORS.includes(user?.role);

  const [announcements, setAnnouncements] = useState([]);
  const [allowedTargets, setAllowedTargets] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [page, setPage]             = useState(1);
  const [meta, setMeta]             = useState({ total: 0, pages: 1 });
  const [showModal, setShowModal]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.set("search", search);
      const { data } = await api.get(`/announcements?${params}`);
      const res = data.data || {};
      setAnnouncements(res.data || []);
      setMeta(res.meta || { total: 0, pages: 1 });
    } catch { toast.error("Failed to load announcements"); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => {
    if (canCreate) {
      api.get("/announcements/allowed-targets")
        .then(({ data }) => setAllowedTargets(data.data || []))
        .catch(() => {});
    }
  }, [canCreate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/announcements/${id}`);
      toast.success("Announcement deleted");
      setConfirmDelete(null);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || "Delete failed"); }
  };

  const handleRead = async (id) => {
    try {
      await api.post(`/announcements/${id}/read`);
      setAnnouncements(prev => prev.map(a => (a._id === id || a.id === id) ? { ...a, is_read: true } : a));
    } catch { /* silent */ }
  };

  const unreadCount = announcements.filter(a => !a.is_read).length;

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            Announcements
            {unreadCount > 0 && (
              <span className="text-sm font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Showing announcements for <span className="font-medium">{ROLE_LABELS[user?.role] ?? user?.role}</span>
          </p>
        </div>
        {canCreate && (
          <button onClick={() => { setEditTarget(null); setShowModal(true); }}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
            <i className="ri-add-line text-base"></i> New Announcement
          </button>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <input type="text" placeholder="Search announcements…"
          className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-40 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <i className="ri-megaphone-line text-5xl mb-3"></i>
          <p className="text-lg font-medium">No announcements</p>
          <p className="text-sm">{canCreate ? "Create the first one using the button above." : "Nothing to show right now."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {announcements.map(ann => (
            <AnnouncementCard
              key={ann._id || ann.id}
              ann={ann}
              canManage={canCreate && (ann.created_by_role === user?.role || user?.role === ROLES.SUPER_ADMIN)}
              onDelete={id => setConfirmDelete(id)}
              onEdit={a => { setEditTarget(a); setShowModal(true); }}
              onRead={handleRead}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
            ← Prev
          </button>
          <span className="text-sm text-gray-600 px-2">Page {page} of {meta.pages}</span>
          <button onClick={() => setPage(p => Math.min(meta.pages, p + 1))} disabled={page === meta.pages}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
            Next →
          </button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <AnnouncementModal
          existing={editTarget}
          allowedTargets={allowedTargets}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={() => { setShowModal(false); setEditTarget(null); fetchAll(); }}
        />
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Announcement?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone. Are you sure?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
