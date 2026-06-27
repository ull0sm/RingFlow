"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import { logoutModerator, updateModeratorName } from "@/actions/moderator";
import { useRouter } from "next/navigation";

export default function ModeratorProfileMenu({ moderator }: { moderator: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
  const [name, setName] = useState(moderator.moderator_name || "Unknown");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
        setIsConfirmingLogout(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutModerator();
      router.push("/moderator/login");
    });
  };

  const handleSaveName = async () => {
    setIsEditing(false);
    if (name.trim() === "" || name === moderator.moderator_name) {
      setName(moderator.moderator_name || "Unknown");
      return;
    }
    try {
      await updateModeratorName(moderator.id, name);
    } catch (e) {
      console.error(e);
      setName(moderator.moderator_name || "Unknown");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setName(moderator.moderator_name || "Unknown");
      setIsEditing(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setIsConfirmingLogout(false);
        }}
        className="w-10 h-10 rounded bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors"
        title="Moderator Profile"
      >
        <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-sm p-4 flex flex-col gap-4 z-50">
          <div className="flex flex-col gap-2 border-b border-outline-variant pb-4">
            <span className="text-label-caps font-label-caps text-on-surface-variant">MODERATOR</span>
            
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleKeyDown}
                className="bg-surface-container-lowest border border-outline px-2 py-1 rounded text-body-md font-bold text-on-surface focus:outline-none focus:border-secondary w-full"
                placeholder="Enter name"
              />
            ) : (
              <div 
                className="group flex items-center justify-between cursor-pointer p-1 -ml-1 rounded hover:bg-surface-container-highest transition-colors"
                onClick={() => setIsEditing(true)}
                title="Click to edit name"
              >
                <span className="text-body-md font-bold text-on-surface truncate">{name}</span>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
              </div>
            )}
          </div>

          {isConfirmingLogout ? (
            <div className="flex flex-col gap-3">
              <span className="text-body-sm text-on-surface-variant text-center font-bold">Are you sure you want to logout?</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsConfirmingLogout(false)}
                  disabled={isPending}
                  className="flex-1 px-2 py-2 border border-outline-variant rounded text-on-surface hover:bg-surface-container-highest text-label-caps font-label-caps transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isPending}
                  className="flex-1 px-2 py-2 bg-error text-on-error rounded text-label-caps font-label-caps hover:bg-error/90 transition-colors flex items-center justify-center"
                >
                  {isPending ? "WAIT..." : "LOGOUT"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingLogout(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-outline-variant rounded text-error hover:bg-error-container hover:border-error transition-colors text-label-caps font-label-caps"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>LOGOUT</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
