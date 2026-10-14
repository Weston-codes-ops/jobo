"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, LogOut, Moon, Sun, UserRound, Settings } from "lucide-react";

type AppHeaderProps = {
  userEmail?: string;
  onSignIn: () => void;
  onSignOut: () => void;
};

export function AppHeader({ userEmail, onSignIn, onSignOut }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className="mx-auto flex h-[68px] w-[min(100%-2rem,70rem)] shrink-0 items-center justify-between border-b border-line sm:h-[72px] sm:w-[min(100%-3rem,70rem)]">
      <a className="inline-flex items-center gap-2.5 rounded-md text-[22px] font-bold tracking-[-1.2px] transition-colors hover:text-green focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green" href="#" aria-label="Jobo home">
        <span>jobo<span className="text-[#76a17c]">.</span></span>
      </a>
      {userEmail ? (
        <div className="relative" ref={menuRef}>
          <button
            className="group inline-flex items-center gap-1.5 rounded-full p-1 transition-colors hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
            type="button"
            aria-label="Open account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls="account-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="grid size-9 place-items-center rounded-full bg-[#e7efe8] text-[13px] font-bold text-green ring-1 ring-[#dce8dd] transition-colors group-hover:bg-[#dcebdd]">
              {userEmail.trim().charAt(0).toUpperCase() || "U"}
            </span>
            <ChevronDown size={14} className={`text-[#718078] transition-transform ${menuOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-[calc(100%+10px)] z-30 w-64 overflow-hidden rounded-xl border border-[#e1e8e2] bg-white py-2 shadow-[0_16px_40px_rgba(27,46,32,0.14)]"
              id="account-menu"
              role="menu"
              aria-label="Account menu"
            >
              <div className="border-b border-[#edf1ed] px-4 pb-3 pt-1">
                <p className="m-0 text-[13px] font-semibold text-[#344238]">Your account</p>
                <p className="mb-0 mt-1 truncate text-[11px] text-[#7b867e]">{userEmail}</p>
              </div>
              <div className="py-1.5">
                <div className="flex items-center gap-3 px-4 py-2.5 text-[12px] text-[#455349]" role="menuitem" aria-disabled="true">
                  <UserRound size={16} className="text-[#718078]" aria-hidden="true" />
                  <span className="flex-1">Profile</span>
                  <span className="text-[9px] uppercase tracking-wide text-[#98a29a]">Soon</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2.5 text-[12px] text-[#455349]" role="menuitem" aria-disabled="true">
                  <Settings size={16} className="text-[#718078]" aria-hidden="true" />
                  <span className="flex-1">Settings</span>
                  <span className="text-[9px] uppercase tracking-wide text-[#98a29a]">Soon</span>
                </div>
              </div>
              <div className="border-y border-[#edf1ed] px-4 py-3" aria-label="Appearance, light mode selected">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-[#66746a]">
                  <Sun size={14} aria-hidden="true" />
                  Appearance
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-[#f2f6f2] p-1">
                  <span className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-2 py-1.5 text-[10px] font-semibold text-[#3d5542] shadow-sm">
                    <Sun size={12} aria-hidden="true" /> Light <Check size={11} aria-hidden="true" />
                  </span>
                  <span className="flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] text-[#89948b]" aria-disabled="true">
                    <Moon size={12} aria-hidden="true" /> Dark
                  </span>
                </div>
              </div>
              <div className="px-2 pt-1.5">
                <button
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[12px] font-medium text-[#765b52] transition-colors hover:bg-[#fbf4f2] focus-visible:outline-2 focus-visible:outline-green"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut();
                  }}
                >
                  <LogOut size={15} aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button className="min-h-3 bg-green px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(49,94,70,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-green-hover hover:shadow-[0_7px_18px_rgba(49,94,70,0.2)] hover:cursor-pointer active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green" onClick={onSignIn}>
          Sign in
        </button>
      )}
    </header>
  );
}
