"use client";

import React, { useState, useRef } from "react";
import { addAthlete, deleteAthlete, bulkAddAthletes } from "@/actions/athletes";
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Processing ${i+1}/${files.length}: ${file.name}...`);
        
        // Extract category name from filename (e.g. cat1.xlsx -> cat1)
        const categoryName = file.name.replace(/\.[^/.]+$/, ""); 

        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        // Expected columns: no, name
        const parsedAthletes = json.map(row => ({
          no: String(row.no || row.No || row.chest_number || ""),
          name: String(row.name || row.Name || row.athlete || "Unknown")
        })).filter(a => a.name !== "Unknown");

        if (parsedAthletes.length > 0) {
          await bulkAddAthletes(tournamentId, categoryName, parsedAthletes);
          successCount += parsedAthletes.length;
        }
      }

      alert(`Successfully uploaded ${successCount} athletes across ${files.length} files.`);
      
    } catch (err) {
      console.error(err);
      alert("Error parsing Excel file.");
    } finally {
      setIsUploading(false);
      setUploadProgress("");
      if (fileInputRef.current) fileInputRef.current.value = "";
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
            multiple
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isAdding}
            className="px-4 py-2 border border-outline text-primary font-label-caps text-label-caps rounded flex items-center gap-2 hover:bg-surface-container-low disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">upload</span> {isUploading ? "UPLOADING..." : "MASS UPLOAD (EXCEL)"}
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

      {/* Drag Drop Zone Hint */}
      <div 
        className="w-full border-2 border-dashed border-outline-variant hover:border-secondary transition-colors bg-surface-container-lowest p-8 rounded-xl flex flex-col items-center justify-center text-on-surface-variant cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
      >
        <span className="material-symbols-outlined text-4xl mb-3 group-hover:text-secondary group-hover:-translate-y-1 transition-transform">cloud_upload</span>
        <h3 className="font-headline-sm text-primary mb-1">Drag and drop category Excel files here</h3>
        <p className="text-body-sm max-w-lg text-center">Name your file exactly as the category name (e.g., <code className="bg-surface-container px-1 py-0.5 rounded">U18-Boys-60kg.xlsx</code>). Include columns <code className="bg-surface-container px-1 py-0.5 rounded">no</code> and <code className="bg-surface-container px-1 py-0.5 rounded">name</code>. You can upload 100+ files at once.</p>
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

            {athletes.map((athlete) => (
              <tr key={athlete.id} className="hover:bg-surface-container-low transition-colors">
                <td className="px-6 py-4 font-data-mono">{athlete.chest_number || "-"}</td>
                <td className="px-6 py-4 font-bold text-primary">{athlete.name}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-surface-container rounded text-xs font-label-caps">{athlete.categories?.name}</span>
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
    </div>
  );
}
