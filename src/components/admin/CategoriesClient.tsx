"use client";

import React, { useState } from "react";
import { addCategory, bulkAddCategories, deleteCategory } from "@/actions/categories";
import * as XLSX from "xlsx";

type Props = {
  tournamentId: string;
  initialCategories: any[];
};

export default function CategoriesClient({ tournamentId, initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [previewCategories, setPreviewCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    age_bracket: "",
    weight_class: "",
    belt: "",
    athletes_count: 0,
    age_min: "",
    age_max: "",
    sex: "",
    day: "",
  });
  const [loading, setLoading] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const newCat = await addCategory(tournamentId, {
        name: formData.name,
        age_bracket: formData.age_bracket,
        weight_class: formData.weight_class,
        belt: formData.belt,
        athletes_count: Number(formData.athletes_count) || 0,
        age_min: formData.age_min ? Number(formData.age_min) : undefined,
        age_max: formData.age_max ? Number(formData.age_max) : undefined,
        sex: formData.sex,
        day: formData.day,
      });

      setCategories([...categories, newCat]);
      setFormData({
        name: "",
        age_bracket: "",
        weight_class: "",
        belt: "",
        athletes_count: 0,
        age_min: "",
        age_max: "",
        sex: "",
        day: "",
      });
      setIsAdding(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await deleteCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete category");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let parsedCategories: any[] = [];

      if (file.name.endsWith(".json")) {
        const text = await file.text();
        const data = JSON.parse(text);
        
        let categoriesArray = [];
        if (Array.isArray(data)) {
          categoriesArray = data;
        } else if (data.merged && Array.isArray(data.merged)) {
          categoriesArray = data.merged;
        } else {
          alert("Invalid JSON format. Expected an array of categories or { merged: [...] }");
          return;
        }

        parsedCategories = categoriesArray.map((c: any) => ({
          name: c.category_name || c.name || "Unknown",
          belt: c.belt || "",
          age_min: c.age && typeof c.age === 'object' ? c.age.min : null,
          age_max: c.age && typeof c.age === 'object' ? c.age.max : null,
          sex: c.sex || "",
          day: c.day || data.day || "",
          athletes_count: c.total_rows || c.participants || c.athletes_count || 0,
          age_bracket: c.age && typeof c.age === 'object' ? `${c.age.min}-${c.age.max}` : (typeof c.age === 'string' ? c.age : ""),
          weight_class: c.category || c.weight_class || "",
        })).filter((c: any) => c.name !== "Unknown");
      } else {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        parsedCategories = json.map((row) => ({
          name: row.Name || row.name || row.Category || row.category || "Unknown",
          age_bracket: row["Age Bracket"] || row.age_bracket || "",
          weight_class: row["Weight Class"] || row.weight_class || "",
          belt: row.Belt || row.belt || "",
          athletes_count: Number(row.Athletes || row.athletes_count || row.Count || 0),
          age_min: row.age_min ? Number(row.age_min) : null,
          age_max: row.age_max ? Number(row.age_max) : null,
          sex: row.Sex || row.sex || "",
          day: row.Day || row.day || "",
        })).filter((c) => c.name !== "Unknown");
      }

      setPreviewCategories(parsedCategories);
    } catch (err) {
      console.error(err);
      alert("Error reading file");
    }
  };

  const handleBulkSubmit = async () => {
    if (!previewCategories.length) return;
    setLoading(true);
    try {
      await bulkAddCategories(tournamentId, previewCategories);
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to import categories");
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 pb-24 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary font-bold">Category Management</h2>
          <p className="text-body-sm text-on-surface-variant">View and manage tournament divisions, belt categories, and athlete counts.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { setIsBulkAdding(true); setIsAdding(false); }}
            className="px-4 py-2.5 bg-surface-container border border-outline-variant rounded-lg font-bold font-body-sm flex items-center gap-2 hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span> Bulk Import
          </button>
          <button 
            onClick={() => { setIsAdding(true); setIsBulkAdding(false); }}
            className="px-4 py-2.5 bg-primary text-on-primary rounded-lg font-bold font-body-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> Add Category
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSubmit} className="p-6 bg-surface-container-lowest border border-outline-variant rounded-xl space-y-4">
          <h3 className="font-headline-sm text-sm font-bold text-primary">New Category Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-label-caps text-on-surface-variant block mb-1">Category Name *</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Kata Male Senior White" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-low text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-label-caps text-on-surface-variant block mb-1">Belt</label>
              <input 
                type="text" 
                placeholder="e.g. White / Yellow" 
                value={formData.belt}
                onChange={e => setFormData({ ...formData, belt: e.target.value })}
                className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-low text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-label-caps text-on-surface-variant block mb-1">Expected Athletes Count</label>
              <input 
                type="number" 
                placeholder="0" 
                value={formData.athletes_count}
                onChange={e => setFormData({ ...formData, athletes_count: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-low text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-label-caps text-on-surface-variant block mb-1">Age Bracket</label>
              <input 
                type="text" 
                placeholder="e.g. 14-15" 
                value={formData.age_bracket}
                onChange={e => setFormData({ ...formData, age_bracket: e.target.value })}
                className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-low text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] font-label-caps text-on-surface-variant block mb-1">Gender</label>
              <select 
                value={formData.sex}
                onChange={e => setFormData({ ...formData, sex: e.target.value })}
                className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-low text-sm"
              >
                <option value="">Any</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-label-caps text-on-surface-variant block mb-1">Scheduled Day</label>
              <input 
                type="text" 
                placeholder="e.g. Day 1" 
                value={formData.day}
                onChange={e => setFormData({ ...formData, day: e.target.value })}
                className="w-full px-3 py-2 border border-outline-variant rounded bg-surface-container-low text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-outline-variant rounded font-bold text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-primary text-on-primary rounded font-bold text-sm disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Category"}
            </button>
          </div>
        </form>
      )}

      {isBulkAdding && (
        <div className="p-6 bg-surface-container-lowest border border-outline-variant rounded-xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-headline-sm text-sm font-bold text-primary">Import Categories (JSON / XLSX)</h3>
            <button onClick={() => setIsBulkAdding(false)} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <input 
            type="file" 
            accept=".json,.xlsx,.xls,.csv" 
            onChange={handleFileUpload}
            className="block w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-on-primary hover:file:opacity-90"
          />

          {previewCategories.length > 0 && (
            <div className="space-y-4">
              <div className="max-h-60 overflow-y-auto border border-outline-variant rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-container-low sticky top-0">
                    <tr className="border-b border-outline-variant text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider">
                      <th className="py-2 px-3">Category Name</th>
                      <th className="py-2 px-3">Age</th>
                      <th className="py-2 px-3">Belt</th>
                      <th className="py-2 px-3">Sex</th>
                      <th className="py-2 px-3">Day</th>
                      <th className="py-2 px-3">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {previewCategories.map((cat, i) => (
                      <tr key={i} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-2 px-3 font-bold text-primary">{cat.name}</td>
                        <td className="py-2 px-3">{cat.age_bracket || (cat.age_min !== null && cat.age_max !== null ? `${cat.age_min}-${cat.age_max}` : "-")}</td>
                        <td className="py-2 px-3">{cat.belt || "-"}</td>
                        <td className="py-2 px-3">{cat.sex || "-"}</td>
                        <td className="py-2 px-3">{cat.day || "-"}</td>
                        <td className="py-2 px-3 font-data-mono">{cat.athletes_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface-variant font-bold">{previewCategories.length} categories ready to import.</span>
                <button 
                  onClick={handleBulkSubmit}
                  disabled={loading}
                  className="px-4 py-2 bg-secondary text-on-secondary rounded font-bold text-sm disabled:opacity-50"
                >
                  {loading ? "Importing..." : "Confirm & Import All"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Categories Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Name</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Belt</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Age</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Gender</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Day</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Athletes</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Est Matches</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-surface-container-low transition-colors">
                <td className="px-6 py-4 font-bold text-primary">{c.name}</td>
                <td className="px-6 py-4">{c.belt || "-"}</td>
                <td className="px-6 py-4">{c.age_bracket || (c.age_min !== null && c.age_max !== null ? `${c.age_min}-${c.age_max}` : "-")}</td>
                <td className="px-6 py-4">{c.sex || "-"}</td>
                <td className="px-6 py-4">{c.day || "-"}</td>
                <td className="px-6 py-4 font-data-mono">{c.athletes_count}</td>
                <td className="px-6 py-4 font-data-mono">{c.expected_matches}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(c.id)}
                    className="p-1 hover:bg-error/10 text-error rounded transition-colors"
                    title="Delete Category"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-on-surface-variant italic">
                  No categories found. Click "Add Category" or "Bulk Import" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
