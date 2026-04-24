"use client";

import React, { useState, useEffect } from "react";
import { User, Bell, Shield, Sparkles, AlertTriangle, Loader2, Tag, Plus, Trash2, Check, CheckCircle2, AlertCircle, Users, LogOut, UserMinus, UserPlus, Copy } from "lucide-react";
import Modal from "../components/Modal";
import { resetAllData } from "../../lib/actions/db";
import { createCategory, deleteCategory, updateCategory, populateDefaultCategories, getCategories, checkCategoryUsage } from "../../lib/actions/categories";
import { leaveFamily, removeMember, inviteUser } from "../../lib/actions/auth";
import { useRouter } from "next/navigation";

interface SettingsClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    familyId: string | null;
  } | null;
  initialCategories: any[];
  initialFamily: any | null;
}

export default function SettingsClient({ user, initialCategories, initialFamily }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [categories, setCategories] = useState(initialCategories);
  const [family, setFamily] = useState(initialFamily);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  // Invitation State
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [addToFamily, setAddToFamily] = useState(true);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const colorOptions = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500", "bg-lime-500", 
    "bg-green-500", "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-sky-500", 
    "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", 
    "bg-pink-500", "bg-rose-500", "bg-slate-500", "bg-gray-500", "bg-zinc-500"
  ];

  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("bg-blue-500");

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !user) return;
    setIsAddingCategory(true);
    const res = await createCategory(newCatName, user.id, newCatColor);
    if (res.success && res.category) {
      setCategories([...categories, res.category].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCatName("");
      setNewCatColor("bg-blue-500");
      showToast("Category added successfully!", "success");
    } else {
      showToast(res.error || "Failed to create category", "error");
    }
    setIsAddingCategory(false);
  };

  const handlePopulateDefaults = async () => {
    if (!user) return;
    setIsPopulating(true);
    const res = await populateDefaultCategories(user.id);
    if (res.success) {
      const updated = await getCategories(user.id);
      setCategories(updated);
      showToast(`Added ${res.count} default categories!`, "success");
    } else {
      showToast(res.error || "Failed to populate defaults", "error");
    }
    setIsPopulating(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!user) return;
    const usage = await checkCategoryUsage(id);
    if (usage.error) {
      showToast(usage.error, "error");
      return;
    }
    if (usage.transactionCount && usage.transactionCount > 0) {
      showToast(`Cannot delete: ${usage.transactionCount} transactions use this category.`, "error");
      return;
    }
    const res = await deleteCategory(id);
    if (res.success) {
      setCategories(categories.filter(c => c.id !== id));
      showToast("Category deleted.", "success");
    } else {
      showToast(res.error || "Failed to delete category", "error");
    }
  };

  const handleUpdateColor = async (id: string, color: string) => {
    const res = await updateCategory(id, { color });
    if (res.success && res.category) {
      setCategories(categories.map(c => c.id === id ? res.category : c));
    }
  };

  const handleResetData = async () => {
    setIsResetting(true);
    const res = await resetAllData();
    if (res.success) {
      setIsResetModalOpen(false);
      router.push("/");
      router.refresh();
    } else {
      showToast("Failed to reset data", "error");
    }
    setIsResetting(false);
  };

  const handleLeaveFamily = async () => {
    if (!user || !confirm("Are you sure you want to leave this family? You will lose access to shared wallets and transactions.")) return;
    setIsLeaving(true);
    const res = await leaveFamily(user.id);
    if (res.success) {
      showToast("Left family successfully", "success");
      setFamily(null);
      router.refresh();
    } else {
      showToast(res.error || "Failed to leave family", "error");
    }
    setIsLeaving(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Remove this member from the family?")) return;
    const res = await removeMember(memberId);
    if (res.success) {
      showToast("Member removed", "success");
      if (family) {
        setFamily({
          ...family,
          members: family.members.filter((m: any) => m.id !== memberId)
        });
      }
    } else {
      showToast(res.error || "Failed to remove member", "error");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;
    setIsInviting(true);
    const res = await inviteUser(inviteName, inviteEmail, addToFamily ? user?.familyId : null);
    if (res.success) {
      showToast(`Invitation sent to ${inviteEmail}`, "success");
      setInviteName("");
      setInviteEmail("");
      if (addToFamily && family && res.user) {
        setFamily({
          ...family,
          members: [...family.members, { id: res.user.id, name: res.user.name, email: res.user.email }]
        });
      }
    } else {
      showToast(res.error || "Failed to send invitation", "error");
    }
    setIsInviting(false);
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-6 space-y-8 pb-12 relative">
      {/* Toast Notifications */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${toast.type === 'success' ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-900 border-red-100'}`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500" />
            )}
            <p className="text-sm font-bold tracking-tight">{toast.message}</p>
          </div>
        </div>
      )}

      <header className="pt-2">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 text-base mt-2">Manage preferences, models, and personal information.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar Nav */}
        <div className="col-span-1 space-y-1">
          <button 
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors text-left ${activeTab === "profile" ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-600"}`}
          >
            <User className="w-4 h-4" /> Profile Details
          </button>
          <button 
            onClick={() => setActiveTab("family")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors text-left ${activeTab === "family" ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-600"}`}
          >
            <Users className="w-4 h-4" /> Family Group
          </button>
          <button 
            onClick={() => setActiveTab("ai")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors text-left ${activeTab === "ai" ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-600"}`}
          >
            <Sparkles className="w-4 h-4" /> AI Integrations
          </button>
          <button 
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors text-left ${activeTab === "notifications" ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-600"}`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab("categories")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors text-left ${activeTab === "categories" ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-600"}`}
          >
            <Tag className="w-4 h-4" /> Categories
          </button>
          <button 
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors text-left ${activeTab === "security" ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-600"}`}
          >
            <Shield className="w-4 h-4" /> Privacy & Security
          </button>
        </div>

        {/* Content Pane */}
        <div className="col-span-1 md:col-span-3 space-y-6">
          
          {activeTab === "profile" && (
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Personal Information</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 block">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue={user?.name || ""} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 block">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue={user?.email || ""} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500" 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 block">Base Currency</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M6%209L12%2015L18%209%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:24px] bg-[position:right_12px_center] bg-no-repeat pr-10">
                    <option>INR (₹) - Indian Rupee</option>
                    <option>USD ($) - US Dollar</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  Save Changes
                </button>
              </div>
            </section>
          )}

          {activeTab === "family" && (
            <section className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{family?.name || "Family Management"}</h2>
                    {family && (
                      <div className="flex items-center gap-2 mt-2">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invite Code:</span>
                         <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg font-mono font-black text-base shadow-sm ring-4 ring-indigo-50 leading-none">
                            {family.inviteCode || "????"}
                         </span>
                         <button 
                            onClick={() => {
                               if (family?.inviteCode) {
                                 navigator.clipboard.writeText(family.inviteCode);
                                 showToast("Code copied!", "success");
                               }
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Copy Code"
                         >
                            <Copy className="w-4 h-4" />
                         </button>
                      </div>
                    )}
                  </div>
                  {family && (
                    <button 
                      onClick={handleLeaveFamily}
                      disabled={isLeaving}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition-all"
                    >
                      {isLeaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                      Leave Family
                    </button>
                  )}
                </div>

                {family ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Members</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {family.members.map((member: any) => (
                          <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 font-bold">
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{member.name} {member.id === user?.id && "(You)"}</p>
                                <p className="text-xs text-slate-400">{member.email}</p>
                              </div>
                            </div>
                            {member.id !== user?.id && (
                              <button 
                                onClick={() => handleRemoveMember(member.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                title="Remove from family"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Invite Others</h3>
                      <form onSubmit={handleInvite} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input 
                            type="text" 
                            placeholder="Full Name" 
                            value={inviteName}
                            onChange={(e) => setInviteName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-blue-500 outline-none"
                          />
                          <input 
                            type="email" 
                            placeholder="Email Address" 
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div>
                            <p className="text-sm font-bold text-slate-800">Add to your family group</p>
                            <p className="text-xs text-slate-500">Automatically share wallets and transactions</p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setAddToFamily(!addToFamily)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${addToFamily ? 'bg-blue-600' : 'bg-slate-300'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${addToFamily ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>

                        <button 
                          type="submit"
                          disabled={isInviting || !inviteEmail}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          {isInviting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                          {addToFamily ? "Invite to Family" : "Invite Standalone User"}
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800">No Family Group</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">Create a family group from the dashboard to start sharing your finances with loved ones.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === "ai" && (
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">AI Preferences</h2>
              
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800">Auto-categorization</h3>
                    <p className="text-sm text-slate-500 mt-1">Allow OpenAI to automatically guess statement categories based on merchant names.</p>
                  </div>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-emerald-500 appearance-none cursor-pointer translate-x-6" checked readOnly/>
                      <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-emerald-500 cursor-pointer"></label>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800">Smart Insights</h3>
                    <p className="text-sm text-slate-500 mt-1">Receive proactive notifications when you are close to spending thresholds.</p>
                  </div>
                  <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle2" id="toggle2" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-slate-300 appearance-none cursor-pointer" readOnly/>
                      <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-6 rounded-full bg-slate-300 cursor-pointer"></label>
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === "categories" && (
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-900">Category Management</h2>
                <button 
                  onClick={handlePopulateDefaults}
                  disabled={isPopulating}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  {isPopulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Populate Defaults
                </button>
              </div>
              
              <div className="space-y-8">
                {/* Add New Category */}
                <form onSubmit={handleAddCategory} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Add New Category</h3>
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-1.5 w-full">
                      <label className="text-xs font-semibold text-slate-500">Category Name</label>
                      <input 
                        type="text" 
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="e.g. Subscriptions"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5 w-full md:w-auto">
                      <label className="text-xs font-semibold text-slate-500">Pick Color</label>
                      <div className="flex flex-wrap gap-2 max-w-[200px]">
                        {colorOptions.slice(0, 10).map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewCatColor(color)}
                            className={`w-6 h-6 rounded-full ${color} border-2 transition-all ${newCatColor === color ? 'border-slate-900 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={isAddingCategory || !newCatName.trim()}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isAddingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Add
                    </button>
                  </div>
                </form>

                {/* Categories List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <div key={cat.id} className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 hover:shadow-sm transition-all">
                      <div className="flex items-center gap-4">
                        <div className="relative group/color">
                          <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center text-white shadow-sm`}>
                            <Tag className="w-5 h-5 opacity-40" />
                          </div>
                          {/* Mini color picker on hover */}
                          <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 p-2 rounded-xl shadow-xl z-10 hidden group-hover/color:grid grid-cols-5 gap-1.5 w-[140px]">
                            {colorOptions.map(color => (
                              <button
                                key={color}
                                onClick={() => handleUpdateColor(cat.id, color)}
                                className={`w-4 h-4 rounded-full ${color} hover:scale-110 transition-transform ${cat.color === color ? 'ring-2 ring-slate-900 ring-offset-1' : ''}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{cat.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Hover color to change</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {categories.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                    <Tag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">No categories created yet.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === "notifications" && (
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in duration-300 text-center py-12">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800">Notification Preferences</h2>
              <p className="text-slate-500 mt-2">Configure how you receive push and email alerts.</p>
            </section>
          )}

          {activeTab === "security" && (
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Privacy & Security</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-800 mb-2">Change Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="password" placeholder="Current Password" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500" />
                    <input type="password" placeholder="New Password" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <button className="mt-3 text-sm text-blue-600 font-semibold hover:text-blue-700">Update Password</button>
                </div>
                
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center bg-red-50 p-4 rounded-xl border border-red-100">
                    <div>
                      <h3 className="font-bold text-red-700">Danger Zone</h3>
                      <p className="text-sm text-red-600/80">Permanently reset all financial data and family records.</p>
                    </div>
                    <button 
                      onClick={() => setIsResetModalOpen(true)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Reset All Data
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal 
        isOpen={isResetModalOpen} 
        onClose={() => !isResetting && setIsResetModalOpen(false)} 
        title="Reset All Data?"
        size="sm"
      >
        <div className="space-y-6 py-2">
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-900">This action is irreversible</p>
              <p className="text-xs text-red-700 mt-0.5">All transactions, wallets, and family associations will be permanently deleted. Your login account will remain active.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleResetData}
              disabled={isResetting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Yes, Reset Everything"
              )}
            </button>
            <button
              onClick={() => setIsResetModalOpen(false)}
              disabled={isResetting}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
