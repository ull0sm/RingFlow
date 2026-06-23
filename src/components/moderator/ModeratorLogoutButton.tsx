"use client";

import { useRouter } from "next/navigation";

export default function ModeratorLogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    // Clear the moderator session cookie
    document.cookie = "mod_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/moderator/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-on-error-container bg-error-container hover:bg-error hover:text-on-error rounded-lg transition-colors"
      aria-label="Logout"
    >
      <span className="material-symbols-outlined text-[16px]">logout</span>
      <span className="hidden md:inline">Logout</span>
    </button>
  );
}
