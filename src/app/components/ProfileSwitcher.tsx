"use client";

import { useState } from "react";
import { User, ChevronDown, Check, LogOut } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  familyId: string;
  mustChangePassword: boolean;
}

interface ProfileSwitcherProps {
  initialUsers: UserProfile[];
  onSwitch: (user: UserProfile) => void;
}

export default function ProfileSwitcher({ initialUsers, onSwitch }: ProfileSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<UserProfile>(initialUsers[0]);

  const handleSwitch = (user: UserProfile) => {
    setActiveUser(user);
    onSwitch(user);
    setIsOpen(false);
    // In a real app, this would refresh the session or set a cookie
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 bg-white/80 hover:bg-white border border-slate-200/60 rounded-xl transition-all shadow-sm group"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white shadow-md">
          {activeUser.name[0]}
        </div>
        <div className="text-left hidden md:block">
          <p className="text-xs font-bold text-slate-900 leading-none mb-0.5">{activeUser.name}</p>
          <p className="text-[10px] font-medium text-slate-500">{activeUser.mustChangePassword ? "Setup Required" : "Active Now"}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-200/60 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Switch Profile</p>
            </div>
            
            <div className="p-2 space-y-1">
              {initialUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSwitch(user)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeUser.id === user.id ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-600"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${activeUser.id === user.id ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}>
                      {user.name[0]}
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-bold ${activeUser.id === user.id ? "text-blue-900" : "text-slate-900"}`}>{user.name}</p>
                      <p className="text-xs opacity-70">{user.email}</p>
                    </div>
                  </div>
                  {activeUser.id === user.id && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-slate-100 bg-slate-50/50">
              <button className="w-full flex items-center gap-3 p-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-bold">
                <LogOut className="w-4 h-4" />
                Sign Out / Exit
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
