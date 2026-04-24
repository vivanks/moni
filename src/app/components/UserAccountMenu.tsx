"use client";

import React, { useState } from "react";
import { LogOut, User, ChevronDown, ShieldCheck } from "lucide-react";
import { logoutUser } from "../../lib/actions/auth";

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export default function UserAccountMenu({ user }: { user: UserProfile }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-1.5 bg-white border border-slate-200/60 rounded-2xl hover:bg-slate-50 transition-all shadow-sm group"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white shadow-md">
          {user.name[0]}
        </div>
        <div className="text-left hidden md:block">
          <p className="text-sm font-bold text-slate-900 leading-none mb-0.5">{user.name}</p>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5" /> Authenticated
          </p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 shadow-2xl z-50 rounded-[1.5rem] overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-lg">
                   {user.name[0]}
                 </div>
                 <div className="overflow-hidden">
                   <p className="text-base font-bold text-slate-900 truncate">{user.name}</p>
                   <p className="text-xs text-slate-500 truncate">{user.email}</p>
                 </div>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 inline-block">
                FAMILY MEMBER
              </div>
            </div>
            
            <div className="p-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-4 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all text-sm font-bold group"
              >
                <div className="p-2 bg-slate-50 group-hover:bg-red-100 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" />
                </div>
                Sign Out from Moni
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
