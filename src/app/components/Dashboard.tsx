"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  UploadCloud, Wallet, CreditCard, Activity,
  ArrowUpRight, ArrowDownLeft, Search, PlusCircle, Users
} from "lucide-react";
import Modal from "./Modal";
import { addTransaction, deleteTransaction, updateTransaction } from "../../lib/actions/transactions";
import { createCategory, deleteCategory } from "../../lib/actions/categories";
import { inviteFamilyMember } from "../../lib/actions/auth";
import { Trash2, UserPlus, Pencil } from "lucide-react";

interface WalletData {
  id: string;
  name: string;
  type: string;
  balance: number;
  user?: { name: string };
}

interface TransactionData {
  id: string;
  amount: number;
  date: Date;
  type: string;
  merchant: string;
  category?: string | null;
}

export default function Dashboard({
  initialWallets = [],
  initialTransactions = [],
  initialCategorySpending = [],
  initialCategories = [],
  initialMembers = [],
  user
}: {
  initialWallets?: WalletData[],
  initialTransactions?: TransactionData[],
  initialCategorySpending?: any[],
  initialCategories?: any[],
  initialMembers?: { id: string, name: string }[],
  user: { id: string; name: string, familyId: string | null }
}) {
  const [mounted, setMounted] = useState(false);
  const [wallets] = useState<WalletData[]>(initialWallets);
  const [transactions] = useState<TransactionData[]>(initialTransactions);
  const [categorySpending] = useState<any[]>(initialCategorySpending);
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [familyMembers] = useState<{ id: string, name: string }[]>(initialMembers);

  const [isTrxModalOpen, setIsTrxModalOpen] = useState(false);
  const [isManageCatOpen, setIsManageCatOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [dateSelection, setDateSelection] = useState<"today" | "yesterday" | "custom">("today");
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [trxType, setTrxType] = useState<"expense" | "income">("expense");
  const [editingTrx, setEditingTrx] = useState<TransactionData | null>(null);

  // Fix Hydration: Ensure client-only rendering for dates
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const totalBalance = wallets.reduce((acc, curr) => acc + curr.balance, 0);
  const totalOutstanding = wallets.filter(w => w.type === "CREDIT").reduce((acc, curr) => acc + Math.abs(curr.balance), 0);
  const monthlySpend = transactions.reduce((acc, curr) => acc + (curr.type === "DEBIT" ? curr.amount : 0), 0);


  const handleAISearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setIsAIThinking(true);
      setTimeout(() => setIsAIThinking(false), 2000);
    }
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-6 space-y-8 pb-12">
      <header className="pt-2">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Overview</h1>
        <p className="text-slate-500 text-base mt-2">Welcome back, {user.name}. Here is your family's financial summary.</p>
      </header>

      <section className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isAIThinking ? "text-blue-600 animate-pulse" : "text-slate-400"}`} />
          <input
            type="text"
            placeholder={isAIThinking ? "Moni is analyzing..." : "Ask AI or search transactions..."}
            onKeyDown={handleAISearch}
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 shadow-sm rounded-2xl text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
          />
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsTrxModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-500 font-medium text-base">Total Liquid Balance</h3>
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">₹{totalBalance.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-500 font-medium text-base">Credit Outstanding</h3>
            <div className="p-2.5 bg-red-50 rounded-xl">
              <CreditCard className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">₹{totalOutstanding.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-500 font-medium text-base">Monthly Global Spend</h3>
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">₹{monthlySpend.toLocaleString('en-IN')}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
            <Link href="/wallets" className="text-sm text-blue-600 hover:text-blue-700 font-semibold">View All</Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Merchant</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Category</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Date</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Amount</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx: TransactionData) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${(tx.type === "INCOME" || tx.type === "TRANSFER_IN") ? "bg-emerald-100 text-emerald-600" :
                            (tx.type === "TRANSFER_OUT") ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
                          }`}>
                          {(tx.type === "INCOME" || tx.type === "TRANSFER_IN") ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <span className="font-semibold text-slate-800">{tx.merchant}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200">
                        {tx.category || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {mounted ? new Date(tx.date).toLocaleDateString() : 'Loading...'}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${tx.type === "INCOME" || tx.type === "TRANSFER_IN" ? "text-emerald-600" : "text-slate-900"}`}>
                      {(tx.type === "INCOME" || tx.type === "TRANSFER_IN") ? "+" : "-"}₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingTrx(tx);
                          setTrxType(tx.type === "INCOME" ? "income" : "expense");
                          setIsTrxModalOpen(true);
                        }}
                        className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm("Are you sure you want to delete this transaction?")) {
                            await deleteTransaction(tx.id, user.id);
                            window.location.reload();
                          }
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-xl font-bold text-slate-900">Spend by Category</h2>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            {categorySpending.map((cat: any) => (
              <div key={cat.category} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-semibold text-slate-700">{cat.category}</span>
                  <span className="text-sm font-medium text-slate-500">₹{cat.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cat.color}`}
                    style={{ width: cat.percentage }}
                  />
                </div>
              </div>
            ))}
            {categorySpending.length === 0 && (
              <p className="text-sm text-slate-400 italic text-center py-4">No spending data yet.</p>
            )}
            <button
              onClick={() => setIsManageCatOpen(true)}
              className="w-full py-3 mt-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700 font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Manage Categories
            </button>
          </div>
        </section>
      </div>

      <section className="pt-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" /> Family Wallets
          </h2>
          <button
            onClick={() => setIsAddMemberOpen(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            <PlusCircle className="w-4 h-4" /> Add Member
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map((wallet: WalletData) => (
            <div key={wallet.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-10 opacity-70"></div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="inline-block px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg mb-2 capitalize">
                    {wallet.user?.name || "Shared"}
                  </span>
                  <h3 className="text-slate-800 font-bold text-lg">{wallet.name}</h3>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-400">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Current Balance</p>
                <p className="text-2xl font-bold text-slate-900">₹{wallet.balance.toLocaleString('en-IN')}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Modal
        isOpen={isTrxModalOpen}
        onClose={() => {
          setIsTrxModalOpen(false);
          setEditingTrx(null);
        }}
        title={editingTrx ? "Edit Transaction" : "Add Transaction"}
        size="sm"
      >
        <form className="space-y-4" onSubmit={async (e: any) => {
          e.preventDefault();
          const form = e.target;
          const amount = parseFloat(form.querySelector('input[type="number"]').value);
          const merchant = form.querySelector('input[placeholder*="Amazon"]').value;
          const walletId = form.querySelector('select').value;
          const category = trxType === "expense" ? form.categorySelect.value : "Income";
          const date = dateSelection === "custom" ? new Date(customDate) : new Date();

            if (editingTrx) {
              await updateTransaction(editingTrx.id, user.id, {
                amount,
                type: trxType === "income" ? "INCOME" : "DEBIT",
                merchant,
                walletId,
                category,
                date
              });
            } else {
              await addTransaction({
                amount,
                type: trxType === "income" ? "INCOME" : "DEBIT",
                merchant,
                walletId,
                userId: user.id,
                category,
                date
              });
            }
          setIsTrxModalOpen(false);
          setEditingTrx(null);
          window.location.reload();
        }}>

          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setTrxType("expense")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${trxType === "expense" ? "bg-white text-red-600 shadow-sm scale-[1.02]" : "text-slate-500 hover:text-slate-700"}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setTrxType("income")}
              className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${trxType === "income" ? "bg-white text-emerald-600 shadow-sm scale-[1.02]" : "text-slate-500 hover:text-slate-700"}`}
            >
              Income
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider text-[10px]">Select Wallet</label>
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M6%209L12%2015L18%209%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:24px] bg-[position:right_12px_center] bg-no-repeat pr-10">
                  {wallets.map((w: WalletData) => (
                    <option key={w.id} value={w.id}>{w.name} ({w.user?.name || "Shared"})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider text-[10px]">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                  <input type="number" step="0.01"
                    defaultValue={editingTrx?.amount || ""}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00" required />
                </div>
              </div>
            </div>

            {trxType === "expense" && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider text-[10px]">Spending Category</label>
                <select name="categorySelect" defaultValue={editingTrx?.category || "Other"} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M6%209L12%2015L18%209%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:24px] bg-[position:right_12px_center] bg-no-repeat pr-10">
                  {categories.map((cat: any) => (
                    <option key={cat.id || cat} value={cat.name || cat}>{cat.name || cat}</option>
                  ))}
                  {categories.length === 0 && <option value="Other">Other</option>}
                </select>
              </div>
            )}


            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider text-[10px]">Date</label>
              <div className="flex gap-2 mb-3">
                {["today", "yesterday", "custom"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDateSelection(d as any)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${dateSelection === d ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
              {dateSelection === "custom" && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider text-[10px]">Merchant / Payee</label>
              <input type="text"
                defaultValue={editingTrx?.merchant || ""}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Amazon, Starbucks" required />
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95">
              Confirm {trxType === "expense" ? "Expense" : "Income"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isManageCatOpen} onClose={() => setIsManageCatOpen(false)} title="Manage Categories" size="sm">
        <div className="space-y-6">
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${cat.color || 'bg-blue-500'}`} />
                  <span className="font-bold text-slate-700">{cat.name}</span>
                </div>
                <button
                  onClick={async () => {
                    await deleteCategory(cat.id);
                    setCategories(categories.filter(c => c.id !== cat.id));
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="py-8 text-center text-slate-400 italic">No categories yet.</div>
            )}
          </div>

          <form className="pt-4 border-t border-slate-100" onSubmit={async (e: any) => {
            e.preventDefault();
            const name = e.target.categoryName.value;
            const res = await createCategory(name, user.id);
            if (res.success && res.category) {
              setCategories([...categories, res.category]);
              e.target.reset();
            }
          }}>
            <div className="flex gap-2">
              <input
                name="categoryName"
                type="text"
                placeholder="New Category Name..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button type="submit" className="bg-slate-900 text-white px-4 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
                Add
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={isAddMemberOpen} onClose={() => setIsAddMemberOpen(false)} title="Invite Family Member" size="sm">
        <form className="space-y-4" onSubmit={async (e: any) => {
          e.preventDefault();
          if (!user.familyId) return;
          const name = e.target.memberName.value;
          const email = e.target.memberEmail.value;
          const res = await inviteUser(name, email, user.familyId);
          if (res.success) {
            setIsAddMemberOpen(false);
            window.location.reload();
          } else {
            alert(res.error || "Failed to invite member.");
          }
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Member Name</label>
              <input
                name="memberName"
                type="text"
                placeholder="e.g. Rahul Sharma"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input
                name="memberEmail"
                type="email"
                placeholder="rahul@example.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 mt-4 flex items-center justify-center gap-2">
            <UserPlus className="w-5 h-5" />
            Send Invitation
          </button>
        </form>
      </Modal>

    </div>
  );
}
