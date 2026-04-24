"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Settings, LogOut } from "lucide-react";
import UserAccountMenu from "./UserAccountMenu";

export default function NavBar({ user }: { user?: { id: string, name: string, email: string } | null }) {
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `transition-colors ${isActive ? "text-blue-600 font-bold" : "hover:text-slate-900"}`;
  };

  if (pathname?.startsWith("/login")) {
    return null;
  }

  return (
    <nav className="flex items-center justify-between py-6 px-6 max-w-6xl mx-auto border-b border-slate-200/60 mb-2 w-full">
      <div className="flex items-center gap-10">
        {/* Moni Logo - Large & Cool */}
        <Link href="/" className="flex items-center gap-4 hover:opacity-90 transition-all group">
          <div className="p-2.5 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 rounded-2xl shadow-xl shadow-blue-600/30 group-hover:scale-110 transition-transform">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 drop-shadow-sm select-none">
            Moni
          </span>
        </Link>
        
        {/* Main Navigation Links */}
        <div className="hidden md:flex gap-8 text-sm font-semibold text-slate-500">
          <Link href="/" className={getLinkClass("/")}>Dashboard</Link>
          <Link href="/wallets" className={getLinkClass("/wallets")}>Wallets</Link>
          <Link href="/statistics" className={getLinkClass("/statistics")}>Statistics</Link>
          <Link href="/import" className={getLinkClass("/import")}>Import</Link>
          <Link href="/settings" className={`md:hidden ${getLinkClass("/settings")}`}>Settings</Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/settings" className={`p-2.5 rounded-full transition-colors hidden md:block ${pathname === "/settings" ? "bg-slate-100 text-blue-600" : "text-slate-400 hover:bg-slate-100/80"}`}>
          <Settings className="w-5 h-5" />
        </Link>
        {user && <UserAccountMenu user={user} />}
      </div>
    </nav>
  );
}
