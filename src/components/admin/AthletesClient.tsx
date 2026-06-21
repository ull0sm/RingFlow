"use client";

import React, { useState, useRef } from "react";
import { addAthlete, deleteAthlete, bulkAddMasterAthletes, updateAthleteCategory } from "@/actions/athletes";
import * as XLSX from "xlsx";

type Athlete = {
  id: string;
  name: string;
  chest_number: string | null;
  category_id: string;
  categories?: { name: string };
};

type Category = {
  id: string;
  name: string;
};

interface Props {
  tournamentId: string;
  initialAthletes: Athlete[];
  categories: Category[];
}

export default function AthletesClient({ tournamentId, initialAthletes, categories }: Props) {
  const [athletes, setAthletes] = useState<Athlete[]>(initialAthletes);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters and Editing State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("all");
  const [editingAthleteId, setEditingAthleteId] = useState<string | null>(null);

  // Preview State
  const [previewAthletes, setPreviewAthletes] = useState<any[]>([]);

  const [addForm, setAddForm] = useState({
    name: "",
    chest_number: "",
    category_id: categories.length > 0 ? categories[0].id : ""
  });

  // Sync props
  React.useEffect(() => {
    setAthletes(initialAthletes);
  }, [initialAthletes]);

  const handleSaveAdd = async () => {
    if (!addForm.name || !addForm.category_id) return alert("Name and Category are required");
    try {
      await addAthlete(tournamentId, addForm);
      setIsAdding(false);
      setAddForm({ name: "", chest_number: "", category_id: categories.length > 0 ? categories[0].id : "" });
    } catch (err) {
      alert("Failed to add athlete");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this athlete?")) return;
    try {
      await deleteAthlete(id, tournamentId);
    } catch (err) {
      alert("Failed to delete athlete");
    }
  };

  const handleUpdateCategory = async (athleteId: string, newCategoryId: string) => {
    try {
      await updateAthleteCategory(athleteId, newCategoryId === "uncategorized" ? null : newCategoryId, tournamentId);
      setEditingAthleteId(null);
    } catch (err) {
      alert("Failed to update category");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const file = files[0];
      setUploadProgress(`Processing ${file.name}...`);
      
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet) as any[];

      // Expected columns: no, name, sex, belt, age, dojo, day
      const parsedAthletes = json.map(row => ({
        no: String(row.no || row.No || row.chest_number || ""),
        name: String(row.name || row.Name || row.athlete || "Unknown"),
        sex: String(row.sex || row.Sex || row.gender || ""),
        belt: String(row.belt || row.Belt || ""),
        age: String(row.age || row.Age || ""),
        dojo: String(row.dojo || row.Dojo || row.club || ""),
        day: String(row.day || row.Day || "")
      })).filter(a => a.name !== "Unknown");

      if (parsedAthletes.length > 0) {
        setPreviewAthletes(parsedAthletes);
      } else {
        alert("No valid athletes found in the file.");
      }
      
    } catch (err) {
      console.error(err);
      alert("Error parsing Master Excel file.");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleApproveUpload = async () => {
    setIsUploading(true);
    setUploadProgress("Pushing to database...");
    try {
      await bulkAddMasterAthletes(tournamentId, previewAthletes);
      setPreviewAthletes([]);
    } catch (err) {
      console.error(err);
      alert("Error saving to database: " + (err as Error).message);
    } finally {
      setIsUploading(false);
      setUploadProgress("");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-margin-desktop space-y-8 bg-surface">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-primary">Athlete Roster</h2>
          <p className="text-body-sm text-on-surface-variant">Manage athletes or drag-and-drop Excel files to bulk upload by category.</p>
        </div>
        <div className="flex gap-4">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isAdding}
            className="px-4 py-2 border border-outline text-primary font-label-caps text-label-caps rounded flex items-center gap-2 hover:bg-surface-container-low disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">upload</span> {isUploading ? "UPLOADING..." : "MASTER EXCEL UPLOAD"}
          </button>
          <button  
            onClick={() => setIsAdding(true)}
            disabled={isAdding || isUploading || categories.length === 0}
            title={categories.length === 0 ? "Add a category first" : ""}
            className="px-4 py-2 bg-primary text-white font-label-caps text-label-caps rounded flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span> ADD ATHLETE
          </button>
        </div>
      </div>

      {uploadProgress && (
        <div className="bg-secondary-container text-on-secondary-container p-4 rounded-lg flex items-center gap-3 font-data-mono text-sm shadow-sm animate-pulse">
          <span className="material-symbols-outlined animate-spin">sync</span> {uploadProgress}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <input 
          type="text" 
          placeholder="Search by name or chest no..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-white border border-outline-variant rounded p-2 text-sm outline-none focus:border-secondary"
        />
        <select 
          value={filterCategoryId}
          onChange={(e) => setFilterCategoryId(e.target.value)}
          className="w-64 bg-white border border-outline-variant rounded p-2 text-sm outline-none"
        >
          <option value="all">All Categories</option>
          <option value="uncategorized">Uncategorized</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant w-32">Chest No.</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Name</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">Category</th>
              <th className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm divide-y divide-outline-variant">
            {isAdding && (
              <tr className="bg-surface-container-low">
                <td className="px-6 py-2"><input value={addForm.chest_number} onChange={e => setAddForm({...addForm, chest_number: e.target.value})} placeholder="No." className="w-full p-2 border rounded" /></td>
                <td className="px-6 py-2"><input value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} placeholder="Athlete Name" className="w-full p-2 border rounded" /></td>
                <td className="px-6 py-2">
                  <select value={addForm.category_id} onChange={e => setAddForm({...addForm, category_id: e.target.value})} className="w-full p-2 border rounded bg-white">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </td>
                <td className="px-6 py-2 text-right">
                  <div className="flex gap-2 justify-end">
                    <button onClick={handleSaveAdd} className="px-3 py-1 bg-primary text-white rounded font-label-caps text-[10px]">SAVE</button>
                    <button onClick={() => setIsAdding(false)} className="px-3 py-1 border rounded font-label-caps text-[10px]">CANCEL</button>
                  </div>
                </td>
              </tr>
            )}

            {athletes.filter(athlete => {
              if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesName = athlete.name.toLowerCase().includes(query);
                const matchesChest = athlete.chest_number?.toLowerCase().includes(query);
                if (!matchesName && !matchesChest) return false;
              }
              if (filterCategoryId !== "all") {
                if (filterCategoryId === "uncategorized") {
                  if (athlete.category_id !== null) return false;
                } else {
                  if (athlete.category_id !== filterCategoryId) return false;
                }
              }
              return true;
            }).map((athlete) => (
              <tr key={athlete.id} className="hover:bg-surface-container-low transition-colors">
                <td className="px-6 py-4 font-data-mono">{athlete.chest_number || "-"}</td>
                <td className="px-6 py-4 font-bold text-primary">{athlete.name}</td>
                <td className="px-6 py-4">
                  {editingAthleteId === athlete.id ? (
                    <select 
                      defaultValue={athlete.category_id || "uncategorized"}
                      onChange={(e) => handleUpdateCategory(athlete.id, e.target.value)}
                      onBlur={() => setEditingAthleteId(null)}
                      autoFocus
                      className="w-full bg-white border border-outline-variant rounded p-1 text-xs outline-none"
                    >
                      <option value="uncategorized">UNCATEGORIZED</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setEditingAthleteId(athlete.id)}>
                      {athlete.categories?.name ? (
                        <span className="px-2 py-1 bg-surface-container rounded text-xs font-label-caps hover:bg-surface-container-high transition-colors">{athlete.categories.name}</span>
                      ) : (
                        <span className="px-2 py-1 bg-error/10 text-error rounded text-xs font-label-caps hover:bg-error/20 transition-colors">UNCATEGORIZED</span>
                      )}
                      <span className="material-symbols-outlined text-[14px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(athlete.id)} className="material-symbols-outlined text-outline hover:text-error transition-colors text-sm">delete</button>
                </td>
              </tr>
            ))}
            
            {!athletes || (athletes.length === 0 && !isAdding) && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-on-surface-variant italic">
                  No athletes found in this tournament roster.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Preview Modal */}
      {previewAthletes.length > 0 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest w-full max-w-4xl max-h-[80vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low shrink-0">
              <div>
                <h2 className="text-xl font-bold text-primary mb-1">Preview Master Roster</h2>
                <p className="text-xs text-on-surface-variant">Review the {previewAthletes.length} athletes extracted from your Excel file.</p>
              </div>
              <button onClick={() => setPreviewAthletes([])} className="material-symbols-outlined text-outline hover:text-error transition-colors">close</button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 bg-surface-container-lowest">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider">
                    <th className="py-2">No</th>
                    <th className="py-2">Name</th>
                    <th className="py-2">Belt</th>
                    <th className="py-2">Age</th>
                    <th className="py-2">Sex</th>
                    <th className="py-2">Day</th>
                    <th className="py-2">Dojo</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-body-md text-on-surface">
                  {previewAthletes.map((a, i) => (
                    <tr key={i} className="border-b border-outline-variant/30 hover:bg-surface-container-highest/30 transition-colors">
                      <td className="py-2 font-data-mono text-outline">{a.no || "-"}</td>
                      <td className="py-2 font-bold text-primary">{a.name}</td>
                      <td className="py-2">{a.belt || "-"}</td>
                      <td className="py-2">{a.age || "-"}</td>
                      <td className="py-2">{a.sex || "-"}</td>
                      <td className="py-2">{a.day || "-"}</td>
                      <td className="py-2">{a.dojo || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-outline-variant bg-surface-container-low flex justify-between items-center shrink-0">
              <button 
                onClick={() => setPreviewAthletes([])}
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
                {isUploading ? <><span className="material-symbols-outlined animate-spin text-[18px]">sync</span> {uploadProgress || "PUSHING..."}</> : "APPROVE & UPLOAD"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
