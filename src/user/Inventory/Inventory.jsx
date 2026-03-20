import React, { useState } from "react";
import { toast } from "react-toastify";

const initialItems = [
  { id: 1,  name: "A4 Paper Reams",      category: "Stationery", qty: 50,  minQty: 20, location: "Store Room A", unit: "Reams" },
  { id: 2,  name: "Ballpoint Pens",       category: "Stationery", qty: 8,   minQty: 30, location: "Store Room A", unit: "Box" },
  { id: 3,  name: "HDMI Cables",          category: "IT",         qty: 15,  minQty: 5,  location: "IT Rack",      unit: "Pcs" },
  { id: 4,  name: "USB-C Hubs",           category: "IT",         qty: 3,   minQty: 5,  location: "IT Rack",      unit: "Pcs" },
  { id: 5,  name: "Printer Ink (Black)",  category: "IT",         qty: 6,   minQty: 4,  location: "IT Rack",      unit: "Cartridge" },
  { id: 6,  name: "Whiteboard Markers",   category: "Stationery", qty: 12,  minQty: 10, location: "Conference",   unit: "Box" },
  { id: 7,  name: "Sanitizer Bottles",    category: "Hygiene",    qty: 2,   minQty: 10, location: "Reception",    unit: "Bottles" },
  { id: 8,  name: "Coffee Sachets",       category: "Pantry",     qty: 100, minQty: 50, location: "Pantry",       unit: "Sachets" },
  { id: 9,  name: "Ethernet Cables 5m",   category: "IT",         qty: 20,  minQty: 8,  location: "IT Rack",      unit: "Pcs" },
  { id: 10, name: "Sticky Notes",         category: "Stationery", qty: 25,  minQty: 15, location: "Store Room A", unit: "Pads" },
];

const emptyForm = { name: "", category: "IT", qty: "", minQty: "", location: "", unit: "Pcs" };

const categoryStyle = (c) => ({
  IT:         "bg-blue-100 text-blue-700",
  Stationery: "bg-purple-100 text-purple-700",
  Hygiene:    "bg-green-100 text-green-700",
  Pantry:     "bg-yellow-100 text-yellow-700",
}[c] || "bg-gray-100 text-gray-600");

const Inventory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems]       = useState(initialItems);
  const [open, setOpen]         = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm]         = useState(emptyForm);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("All");
  const [stockFilter, setStockFilter] = useState("All");

  const lowStock = items.filter(i => i.qty <= i.minQty);

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = filter === "All" || i.category === filter;
    const matchStock  = stockFilter === "All" || (stockFilter === "Low" && i.qty <= i.minQty) || (stockFilter === "OK" && i.qty > i.minQty);
    return matchSearch && matchCat && matchStock;
  });

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setOpen(true); };

  const handleSave = () => {
    if (!form.name || !form.qty || !form.location) return toast.error("Fill all required fields");
    if (editItem) {
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...form, qty: +form.qty, minQty: +form.minQty } : i));
      toast.success("Item updated");
    } else {
      setItems(prev => [{ id: Date.now(), ...form, qty: +form.qty, minQty: +form.minQty || 0 }, ...prev]);
      toast.success("Item added");
    }
    setOpen(false);
  };

  const handleDelete = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success("Item removed");
  };

  const handleStockIn = (id, amount) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + amount } : i));
    toast.success(`Stock updated`);
  };

  return (
    <div className="relative h-full m-1 p-6 bg-gradient-to-br from-slate-50 to-gray-100 flex flex-col gap-6 overflow-y-auto rounded-2xl">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition text-sm">
          <i className="ri-add-line"></i> Add Item
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Items",  value: items.length,                                          color: "from-blue-500 to-indigo-600",   icon: "ri-store-line" },
          { label: "Low Stock",    value: lowStock.length,                                       color: "from-red-500 to-rose-600",      icon: "ri-alert-line" },
          { label: "IT Items",     value: items.filter(i => i.category === "IT").length,         color: "from-purple-500 to-violet-600", icon: "ri-computer-line" },
          { label: "Stationery",   value: items.filter(i => i.category === "Stationery").length, color: "from-yellow-500 to-orange-500", icon: "ri-pencil-line" },
        ].map((s, i) => (
          <div key={i} className={`rounded-2xl p-5 text-white bg-gradient-to-r ${s.color} shadow-lg hover:shadow-2xl transition hover:-translate-y-1`}>
            <div className="flex justify-between items-center">
              <div><p className="text-xs opacity-90">{s.label}</p><h2 className="text-2xl font-bold mt-1">{s.value}</h2></div>
              <div className="bg-white/20 p-2.5 rounded-xl text-xl"><i className={s.icon}></i></div>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
            <i className="ri-alert-line"></i> Low Stock Alert ({lowStock.length} items)
          </p>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(i => (
              <span key={i.id} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">
                {i.name} — {i.qty} {i.unit} left
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
        <input type="text" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 text-sm" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border border-gray-300 p-2.5 rounded-lg outline-none text-sm">
          <option value="All">All Categories</option>
          <option>IT</option><option>Stationery</option><option>Hygiene</option><option>Pantry</option>
        </select>
        <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="border border-gray-300 p-2.5 rounded-lg outline-none text-sm">
          <option value="All">All Stock</option>
          <option value="Low">Low Stock</option>
          <option value="OK">In Stock</option>
        </select>
        <button onClick={() => { setSearch(""); setFilter("All"); setStockFilter("All"); }}
          className="border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm">Reset</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-6 py-4 text-left font-semibold">Item Name</th>
              <th className="px-6 py-4 text-center font-semibold">Category</th>
              <th className="px-6 py-4 text-center font-semibold">Quantity</th>
              <th className="px-6 py-4 text-center font-semibold">Min. Qty</th>
              <th className="px-6 py-4 text-center font-semibold">Location</th>
              <th className="px-6 py-4 text-center font-semibold">Status</th>
              <th className="px-6 py-4 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 rounded w-full"></div></td>
                    ))}
                  </tr>
                ))
              : filtered.map(item => {
              const isLow = item.qty <= item.minQty;
              return (
                <tr key={item.id} className={`border-t transition ${isLow ? "bg-red-50/30 hover:bg-red-50/50" : "hover:bg-blue-50/40"}`}>
                  <td className="px-6 py-4 font-medium">{item.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryStyle(item.category)}`}>{item.category}</span>
                  </td>
                  <td className="px-6 py-4 text-center font-semibold">{item.qty} <span className="text-xs text-gray-400 font-normal">{item.unit}</span></td>
                  <td className="px-6 py-4 text-center text-gray-500">{item.minQty}</td>
                  <td className="px-6 py-4 text-center text-gray-500">{item.location}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isLow ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {isLow ? "Low Stock" : "In Stock"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => handleStockIn(item.id, 10)} className="p-2 rounded-lg hover:bg-green-50" title="Add 10 units">
                        <i className="ri-add-circle-line text-green-600 text-lg"></i>
                      </button>
                      <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-blue-50" title="Edit">
                        <i className="ri-edit-line text-blue-600 text-lg"></i>
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-red-50" title="Delete">
                        <i className="ri-delete-bin-line text-red-500 text-lg"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">No items found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold">{editItem ? "Edit Item" : "Add Item"}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl"><i className="ri-close-line"></i></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Item Name *</label>
                <input className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. A4 Paper" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                  <select className="w-full border border-gray-300 p-2.5 rounded-lg outline-none mt-1 text-sm"
                    value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option>IT</option><option>Stationery</option><option>Hygiene</option><option>Pantry</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Unit</label>
                  <input className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm"
                    value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="Pcs / Box" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Quantity *</label>
                  <input type="number" min="0" className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm"
                    value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Min. Qty</label>
                  <input type="number" min="0" className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm"
                    value={form.minQty} onChange={e => setForm({ ...form, minQty: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Location *</label>
                <input className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-blue-500 mt-1 text-sm"
                  value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Store Room A" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
                {editItem ? "Update" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
