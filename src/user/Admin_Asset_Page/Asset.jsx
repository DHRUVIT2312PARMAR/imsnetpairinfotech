import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import Card from "../../components/Asset/Card";
import { toast } from "react-toastify";
import api from "../../services/api";

const Asset = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("assets:write");

  const [assets, setAssets]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [open, setOpen]               = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData]       = useState({ name: "", category: "Other", description: "", status: "Available" });
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [saving, setSaving]           = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/assets?limit=100");
      setAssets(data.data?.records || data.data || []);
    } catch { toast.error("Failed to load assets"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const cardData = [
    { title: "Total Assets", tot: assets.length,                                              bg: "from-indigo-500 to-blue-600" },
    { title: "Assigned",     tot: assets.filter(a => a.status === "Assigned").length,         bg: "from-emerald-500 to-green-600" },
    { title: "Available",    tot: assets.filter(a => a.status === "Available").length,        bg: "from-amber-400 to-orange-500" },
    { title: "Under Repair", tot: assets.filter(a => a.status === "Under Repair").length,     bg: "from-rose-500 to-red-600" },
  ];

  const filtered = assets.filter(a => {
    const matchSearch = (a.name||"").toLowerCase().includes(search.toLowerCase()) ||
                        (a.assetId||"").toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filterStatus === "All" || a.status === filterStatus);
  });

  const handleSave = async () => {
    if (!formData.name || !formData.category) return toast.error("Fill all required fields");
    setSaving(true);
    try {
      if (editingAsset) {
        const { data } = await api.put(`/assets/${editingAsset._id}`, formData);
        setAssets(prev => prev.map(a => a._id === editingAsset._id ? data.data : a));
        toast.success("Asset updated");
      } else {
        const { data } = await api.post("/assets", formData);
        setAssets(prev => [data.data, ...prev]);
        toast.success("Asset added");
      }
      setOpen(false); setEditingAsset(null);
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const handleReturn = async (id) => {
    try {
      const { data } = await api.put(`/assets/${id}`, { status: "Available", assignedTo: null });
      setAssets(prev => prev.map(a => a._id === id ? data.data : a));
      toast.success("Asset returned");
    } catch { toast.error("Failed"); }
  };

  const statusBadge = (s) => ({
    Assigned:     "bg-green-100 text-green-700",
    Available:    "bg-blue-100 text-blue-700",
    "Under Repair": "bg-red-100 text-red-700",
    Retired:      "bg-gray-100 text-gray-600",
  }[s] || "bg-gray-100 text-gray-600");

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-semibold">Asset Management</h2>
        {canManage && (
          <button onClick={() => { setEditingAsset(null); setFormData({ name: "", category: "Other", description: "", status: "Available" }); setOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <i className="ri-add-line text-lg"></i> Add Asset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full p-1">
        {cardData.map((d, i) => <Card key={i} title={d.title} tot={d.tot} bg={d.bg} />)}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 text-sm" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-gray-300 p-2.5 rounded-lg outline-none text-sm">
          <option value="All">All Status</option>
          <option>Assigned</option><option>Available</option><option>Under Repair</option><option>Retired</option>
        </select>
        <button onClick={() => { setSearch(""); setFilterStatus("All"); }} className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm">Reset</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Asset ID</th>
              <th className="px-6 py-4 text-left font-semibold">Asset Name</th>
              <th className="px-6 py-4 text-center font-semibold">Category</th>
              <th className="px-6 py-4 text-center font-semibold">Status</th>
              {canManage && <th className="px-6 py-4 text-center font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t animate-pulse">
                {Array.from({ length: canManage ? 5 : 4 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-full"></div></td>)}
              </tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={canManage ? 5 : 4} className="px-6 py-12 text-center text-gray-400 text-sm">No assets found</td></tr>
            ) : filtered.map((asset) => (
              <tr key={asset._id} className="border-t hover:bg-blue-50/40 transition">
                <td className="px-6 py-4 font-medium text-gray-500">{asset.assetId || "—"}</td>
                <td className="px-6 py-4 font-medium">{asset.name}</td>
                <td className="px-6 py-4 text-center">{asset.category}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(asset.status)}`}>{asset.status}</span>
                </td>
                {canManage && (
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => { setEditingAsset(asset); setFormData({ name: asset.name, category: asset.category, description: asset.description||"", status: asset.status }); setOpen(true); }}
                        className="p-2 rounded-lg hover:bg-blue-50 transition" title="Edit">
                        <i className="ri-edit-2-line text-blue-600 text-lg"></i>
                      </button>
                      {asset.status === "Assigned" && (
                        <button onClick={() => handleReturn(asset._id)} className="p-2 rounded-lg hover:bg-green-50 transition" title="Return">
                          <i className="ri-arrow-go-back-line text-green-600 text-lg"></i>
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && canManage && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingAsset ? "Edit Asset" : "Add New Asset"}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Asset Name *</label>
                <input className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. MacBook Pro" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                <select className="w-full border border-gray-300 p-2.5 rounded-lg outline-none mt-1"
                  value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                  <option>Laptop</option><option>Mobile</option><option>Monitor</option><option>Keyboard</option><option>Mouse</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
                <select className="w-full border border-gray-300 p-2.5 rounded-lg outline-none mt-1"
                  value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option>Available</option><option>Assigned</option><option>Under Repair</option><option>Retired</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                <input className="w-full border border-gray-300 p-2.5 rounded-lg outline-none mt-1"
                  value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional notes" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                {editingAsset ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Asset;
