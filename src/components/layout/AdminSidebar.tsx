"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import Image from "next/image";

export default function AdminSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const id = params.id as string || "123";

  const navItems = [
    { name: "Dashboard", href: `/admin/event/${id}/dashboard`, icon: "dashboard" },
    { name: "Ring Balancing", href: `/admin/event/${id}/rings/balance`, icon: "balance" },
    { name: "Categories", href: `/admin/event/${id}/categories`, icon: "category" },
    { name: "Athletes", href: `/admin/event/${id}/athletes`, icon: "groups" },
    { name: "Rings", href: `/admin/event/${id}/rings`, icon: "grid_view" },
    { name: "Settings", href: `/admin/event/${id}/settings`, icon: "settings" },
  ];

  return (
    <aside className="hidden md:flex flex-col h-full py-6 px-4 space-y-2 w-64 bg-surface-container-low border-r border-outline-variant shrink-0">
      <div className="px-2 mb-8">
        <Link href="/admin" className="font-headline-sm text-headline-sm font-bold text-primary hover:text-secondary transition-colors">
          Ring Flow
        </Link>
        <p className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-widest mt-1">Admin Terminal</p>
      </div>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all ${
                isActive
                  ? "bg-secondary-container text-on-secondary-container scale-95 duration-200"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label-caps text-label-caps">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-outline-variant space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-full bg-secondary-fixed flex items-center justify-center overflow-hidden shrink-0">
            {/* Example Avatar */}
            <div className="h-full w-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm">
              AR
            </div>
          </div>
          <div className="overflow-hidden">
            <p className="font-body-md font-bold text-sm text-on-surface truncate">Alex Rivera</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Head Coordinator</p>
          </div>
        </div>
        <Link
          href="/login/admin"
          className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-error hover:bg-error-container/10 transition-all rounded-lg"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label-caps text-label-caps">Logout</span>
        </Link>
      </div>
    </aside>
  );
}
