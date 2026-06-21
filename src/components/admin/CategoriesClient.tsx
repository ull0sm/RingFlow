"use client";

import React, { useState, useRef } from "react";
import { addCategory, updateCategory, deleteCategory, bulkAddCategories } from "@/actions/categories";
import { CategoryInput } from "@/actions/tournament";
import * as XLSX from "xlsx";

type Category = {
  id: string;
  name: string;
  age_bracket: string | null;
  weight_class: string | null;
  athletes_count: number;
  expected_matches: number;
};

interface Props {
  tournamentId: string;
  initialCategories: Category[];
}

export default function CategoriesClient({ tournamentId, initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview State
  const [previewCategories, setPreviewCategories] = useState<any[]>([]);

  const [addForm, setAddForm] = useState<CategoryInput>({
    name: "",
    age_bracket: "",
    weight_class: "",
    athletes_count: 0
  });

  // Sync with props
  React.useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const handleStartAdd = () => {
    setIsAdding(true);
    setAddForm({ name: "", age_bracket: "", weight_class: "", athletes_count: 0 });
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
  };

  const handleSaveAdd = async () => {
    if (!addForm.name) return alert("Name is required");
    try {
      await addCategory(tournamentId, addForm);
      setIsAdding(false);
    } catch (err) {
      alert("Failed to add category");
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditForm(cat);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await updateCategory(editingId, tournamentId, {
        name: editForm.name,
        age_bracket: editForm.age_bracket || "",
        weight_class: editForm.weight_class || "",
        athletes_count: editForm.athletes_count,
        expected_matches: editForm.expected_matches
      });
      setEditingId(null);
    } catch (err) {
      alert("Failed to update category");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id, tournamentId);
    } catch (err) {
      alert("Failed to delete category");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let parsedCategories: any[] = [];

      if (file.name.endsWith(".json")) {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // Expected format: { merged: [ { category_name, belt, age: {min, max}, sex, day, total_rows } ] }
        if (data.merged && Array.isArray(data.merged)) {
          parsedCategories = data.merged.map((c: any) => ({
            name: c.category_name,
            belt: c.belt,
            age_min: c.age?.min,
            age_max: c.age?.max,
            sex: c.sex,
            day: c.day || data.day,
            athletes_count: c.total_rows || 0,
            age_bracket: c.age ? `${c.age.min}-${c.age.max}` : "",
            weight_class: "",
          }));
        } else {
          alert("Invalid JSON format. Expected { merged: [...] }");
          return;
        }
      } else {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        // Map rows (expects 'category' and 'participants' columns)
        parsedCategories = json.map(row => ({
          name: String(row.category || row.Category || row.name || "Unknown"),
          age_bracket: "",
          weight_class: "",
          athletes_count: parseInt(row.participants || row.Participants || row.count || 0) || 0
        })).filter(c => c.name !== "Unknown");
      }

      if (parsedCategories.length === 0) {
        alert("No valid categories found in file.");
        return;
      }

      setPreviewCategories(parsedCategories);
      
    } catch (err) {
      console.error(err);
      alert("Error parsing file.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleApproveUpload = async () => {
    setIsUploading(true);
    try {
      await bulkAddCategories(tournamentId, previewCategories);
      setPreviewCategories([]);
    } catch (err) {
      console.error(err);
      alert("Error saving to database.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-margin-desktop space-y-8 bg-surface">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-primary">Division Management</h2>
          <p className="text-body-sm text-on-surface-variant">View and manage categories for this tournament.</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv, .json" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isAdding}
            className="px-4 py-2 border border-outline text-primary font-label-caps text-label-caps rounded flex items-center gap-2 hover:bg-surface-container-low disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">upload</span> {isUploading ? "UPLOADING..." : "UPLOAD JSON/EXCEL"}
          </button>
          <button 
            onClick={handleStartAdd}
            disabled={isAdding || isUploading}
            className="px-4 py-2 bg-primary text-white font-label-caps text-label-caps rounded flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> ADD CATEGORY
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Name</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Age</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Weight</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant text-center">Athletes</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant text-center">Expected Matches</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm divide-y divide-outline-variant">
            {/* Add Row */}
            {isAdding && (
              <tr className="bg-surface-container-low">
                <td className="px-6 py-2"><input value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} placeholder="Name" className="w-full p-2 border rounded" /></td>
                <td className="px-6 py-2"><input value={addForm.age_bracket} onChange={e => setAddForm({...addForm, age_bracket: e.target.value})} placeholder="Age" className="w-full p-2 border rounded" /></td>
                <td className="px-6 py-2"><input value={addForm.weight_class} onChange={e => setAddForm({...addForm, weight_class: e.target.value})} placeholder="Weight" className="w-full p-2 border rounded" /></td>
                <td className="px-6 py-2"><input type="number" value={addForm.athletes_count} onChange={e => setAddForm({...addForm, athletes_count: parseInt(e.target.value)||0})} className="w-full p-2 border rounded text-center" /></td>
                <td className="px-6 py-2 text-center text-on-surface-variant text-xs">Auto</td>
                <td className="px-6 py-2 text-right">
                  <div className="flex gap-2 justify-end">
                    <button onClick={handleSaveAdd} className="px-3 py-1 bg-primary text-white rounded font-label-caps text-[10px]">SAVE</button>
                    <button onClick={handleCancelAdd} className="px-3 py-1 border rounded font-label-caps text-[10px]">CANCEL</button>
                  </div>
                </td>
              </tr>
            )}

            {categories.map((cat) => (
              editingId === cat.id ? (
                <tr key={cat.id} className="bg-surface-container-low">
                  <td className="px-6 py-2"><input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-2 border rounded" /></td>
                  <td className="px-6 py-2"><input value={editForm.age_bracket || ""} onChange={e => setEditForm({...editForm, age_bracket: e.target.value})} className="w-full p-2 border rounded" /></td>
                  <td className="px-6 py-2"><input value={editForm.weight_class || ""} onChange={e => setEditForm({...editForm, weight_class: e.target.value})} className="w-full p-2 border rounded" /></td>
                  <td className="px-6 py-2"><input type="number" value={editForm.athletes_count} onChange={e => setEditForm({...editForm, athletes_count: parseInt(e.target.value)||0})} className="w-full p-2 border rounded text-center" /></td>
                  <td className="px-6 py-2"><input type="number" value={editForm.expected_matches} onChange={e => setEditForm({...editForm, expected_matches: parseInt(e.target.value)||0})} className="w-full p-2 border rounded text-center font-data-mono" /></td>
                  <td className="px-6 py-2 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={handleSaveEdit} className="px-3 py-1 bg-secondary text-white rounded font-label-caps text-[10px]">SAVE</button>
                      <button onClick={handleCancelEdit} className="px-3 py-1 border rounded font-label-caps text-[10px]">CANCEL</button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={cat.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-bold text-primary">{cat.name}</td>
                  <td className="px-6 py-4">{cat.age_bracket || "-"}</td>
                  <td className="px-6 py-4">{cat.weight_class || "-"}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-secondary-container text-on-secondary-container rounded font-data-mono">{cat.athletes_count}</span>
                  </td>
                  <td className="px-6 py-4 text-center font-data-mono">{cat.expected_matches}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleStartEdit(cat)} className="material-symbols-outlined text-outline hover:text-primary transition-colors text-sm">edit</button>
                      <button onClick={() => handleDelete(cat.id)} className="material-symbols-outlined text-outline hover:text-error transition-colors text-sm">delete</button>
                    </div>
                  </td>
                </tr>
              )
            ))}
            
            {!categories || (categories.length === 0 && !isAdding) && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant italic">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Preview Modal */}
      {previewCategories.length > 0 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest w-full max-w-4xl max-h-[80vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low shrink-0">
              <div>
                <h2 className="text-xl font-bold text-primary mb-1">Preview Upload</h2>
                <p className="text-xs text-on-surface-variant">Review the {previewCategories.length} categories extracted from your file.</p>
              </div>
              <button onClick={() => setPreviewCategories([])} className="material-symbols-outlined text-outline hover:text-error transition-colors">close</button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 bg-surface-container-lowest">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider">
                    <th className="py-2">Category Name</th>
                    <th className="py-2">Belt</th>
                    <th className="py-2">Age Range</th>
                    <th className="py-2">Sex</th>
                    <th className="py-2">Day</th>
                    <th className="py-2">Count</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-body-md text-on-surface">
                  {previewCategories.map((cat, i) => (
                    <tr key={i} className="border-b border-outline-variant/30 hover:bg-surface-container-highest/30 transition-colors">
                      <td className="py-2 font-bold text-primary">{cat.name}</td>
                      <td className="py-2">{cat.belt || "-"}</td>
                      <td className="py-2">{cat.age_min}-{cat.age_max}</td>
                      <td className="py-2">{cat.sex || "-"}</td>
                      <td className="py-2">{cat.day || "-"}</td>
                      <td className="py-2 font-data-mono">{cat.athletes_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-outline-variant bg-surface-container-low flex justify-between items-center shrink-0">
              <button 
                onClick={() => setPreviewCategories([])}
                className="px-6 py-2 rounded font-bold text-primary hover:bg-surface-container transition-colors disabled:opacity-50"
                disabled={isUploading}
              >
                CANCEL
              </button>
              <button 
                onClick={handleApproveUpload}
                disabled={isUploading}
                className="px-6 py-2 rounded font-bold bg-secondary text-on-secondary hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> PUSHING...</> : "APPROVE & UPLOAD"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
