import React from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import { TableRowSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function CategoriesLoading() {
  return (
    <>
      <AdminHeader title="Categories" />
      
      <div className="flex-1 overflow-y-auto p-margin-desktop space-y-8 bg-surface">
        {/* Header Block */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-primary">Division Management</h2>
            <p className="text-body-sm text-on-surface-variant">View and manage categories for this tournament.</p>
          </div>
          <div className="flex gap-4">
            <button 
              disabled 
              className="px-4 py-2 border border-outline text-primary/50 font-label-caps text-label-caps rounded flex items-center gap-2 bg-surface-container-low select-none opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">upload</span> UPLOAD JSON/EXCEL
            </button>
            <button 
              disabled 
              className="px-4 py-2 bg-primary/50 text-white/50 font-label-caps text-label-caps rounded flex items-center gap-2 select-none opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">add</span> ADD CATEGORY
            </button>
          </div>
        </div>

        {/* Categories Table Skeletons */}
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
              <TableRowSkeleton cols={6} />
              <TableRowSkeleton cols={6} />
              <TableRowSkeleton cols={6} />
              <TableRowSkeleton cols={6} />
              <TableRowSkeleton cols={6} />
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
