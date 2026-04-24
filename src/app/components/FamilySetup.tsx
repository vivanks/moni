"use client";

import React, { useState } from "react";
import { createFamily, joinFamily } from "../../lib/actions/auth";
import { Users, Sparkles, Loader2, ArrowRight, UserPlus } from "lucide-react";

export default function FamilySetup({ userId }: { userId: string }) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (mode === "create") {
        const res = await createFamily(userId, familyName);
        if (res.success) window.location.reload();
        else setError(res.error || "Failed to create family");
      } else {
        const res = await joinFamily(userId, inviteCode);
        if (res.success) window.location.reload();
        else setError(res.error || "Invalid invite code");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative overflow-hidden transition-all scale-100">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600" />
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-50 rounded-2xl mb-6 relative group">
             {mode === "create" ? <Users className="w-10 h-10 text-indigo-600" /> : <UserPlus className="w-10 h-10 text-indigo-600" />}
             <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 border-2 border-white rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
             </div>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            {mode === "create" ? "Setup Your Family" : "Join Your Family"}
          </h1>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl mt-6">
            <button
              onClick={() => setMode("create")}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === "create" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
            >
              Create New
            </button>
            <button
              onClick={() => setMode("join")}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${mode === "join" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
            >
              Join Existing
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === "create" ? (
            <div className="space-y-5">
              <div className="relative group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Family Group Name</label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-900"
                  placeholder="e.g. The Sharma Household"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="relative group">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">4-Character Invite Code</label>
                <input
                  type="text"
                  maxLength={4}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-5 py-6 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono text-3xl text-center font-black tracking-[0.5em] text-indigo-600 placeholder:text-slate-200"
                  placeholder="ABCD"
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
              <p className="text-sm font-bold text-red-600 text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || (mode === "create" ? !familyName.trim() : inviteCode.length < 4)}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {mode === "create" ? "Create Family Group" : "Join Family Group"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
            Step 1: Establishment
          </p>
        </div>
      </div>
    </div>
  );
}
