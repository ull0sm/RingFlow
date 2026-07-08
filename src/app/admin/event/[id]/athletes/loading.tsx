import React from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import { TableRowSkeleton } from "@/components/ui/Skeleton";

export default function AthletesLoading() {
  return (
    <>
      <AdminHeader title="Athletes Roster" />
      
      <div className="flex-1 overflow-y-auto p-margin-desktop space-y-8 bg-surface">
        {/* Header Block */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-primary">Athlete Roster</h2>
            <p className="text-body-sm text-on-surface-variant">Manage athletes or drag-and-drop Excel files to bulk upload by category.</p>
          </div>
          <div className="flex gap-4">
            <button 
              disabled 
              className="px-4 py-2 border border-outline text-primary/50 font-label-caps text-label-caps rounded flex items-center gap-2 bg-surface-container-low select-none opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">upload</span> MASTER EXCEL UPLOAD
            </button>
            <button 
              disabled 
              className="px-4 py-2 bg-primary/50 text-white/50 font-label-caps text-label-caps rounded flex items-center gap-2 select-none opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span> ADD ATHLETE
            </button>
          </div>
        </div>

        {/* Filters Shell */}
        <div className="flex gap-4 mb-4 select-none pointer-events-none opacity-60">
          <input 
            type="text" 
            placeholder="Search by name or chest no..."
            disabled
            className="flex-1 bg-white border border-outline-variant rounded p-2 text-sm outline-none"
          />
          <select 
            disabled
            className="w-64 bg-white border border-outline-variant rounded p-2 text-sm outline-none"
          >
            <option>All Categories</option>
          </select>
        </div>

        {/* Athletes Table Skeletons */}
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
              <TableRowSkeleton cols={4} />
              <TableRowSkeleton cols={4} />
              <TableRowSkeleton cols={4} />
              <TableRowSkeleton cols={4} />
              <TableRowSkeleton cols={4} />
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
