"use client";

import React, { useState } from "react";
import { 
  Wallet, PlusCircle, ArrowUpRight, ArrowDownLeft, 
  Shield, History, ArrowRightLeft, ChevronLeft, 
  ChevronRight, CreditCard, Trash2, Pencil 
} from "lucide-react";
import Modal from "../components/Modal";
import { adjustWalletBalance, addWallet, transferFunds } from "../../lib/actions/wallets";
import { deleteTransaction, updateTransaction } from "../../lib/actions/transactions";

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

export default function WalletsView({ 
  initialWallets, 
  initialTransactions,
  user,
  categories
}: { 
  initialWallets: WalletData[], 
  initialTransactions: TransactionData[],
  user: { id: string; name: string, familyId: string | null },
  categories?: any[]
}) {
  const [mounted, setMounted] = useState(false);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAdjustBalanceOpen, setIsAdjustBalanceOpen] = useState(false);

  const [isTrxModalOpen, setIsTrxModalOpen] = useState(false);
  const [editingTrx, setEditingTrx] = useState<any>(null);
  const [trxType, setTrxType] = useState<"income" | "expense">("expense");
  const [dateSelection, setDateSelection] = useState<"today" | "yesterday" | "custom">("custom");
  const [customDate, setCustomDate] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const txPerPage = 8;
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const totalPages = Math.ceil(initialTransactions.length / txPerPage);
  
  const currentTxs = initialTransactions.slice(
    (currentPage - 1) * txPerPage,
    currentPage * txPerPage
  );

  const openHistory = (walletId: string) => {
    setSelectedWalletId(walletId);
    setIsHistoryOpen(true);
  };

  const openTransfer = (walletId: string) => {
    setSelectedWalletId(walletId);
    setIsTransferOpen(true);
  };

  const openAdjustBalance = (walletId: string) => {
    setSelectedWalletId(walletId);
    setIsAdjustBalanceOpen(true);
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-6 space-y-8 pb-12">
      <header className="pt-2 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Wallets</h1>
          <p className="text-slate-500 text-base mt-2">Manage all family accounts and cash streams in one place.</p>
        </div>
        <button 
          onClick={() => setIsAddWalletOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 hover:opacity-90 transition-opacity"
        >
          <PlusCircle className="w-4 h-4" />
          Add Wallet
        </button>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {initialWallets.map(wallet => {
          const isCredit = wallet.type === "CREDIT";
          const isSaving = wallet.type === "SAVING";
          return (
            <div key={wallet.id} className="bg-white text-slate-900 border border-slate-200 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between transition-all hover:shadow-md group shadow-sm">
              {isCredit && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-orange-500"></div>
              )}
              {isSaving && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
              )}
              
              <div className="flex justify-between items-start">
                <div>
                  <span className={`inline-block px-3 py-1 ${isCredit ? "bg-orange-100 text-orange-700" : isSaving ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"} text-xs font-bold rounded-lg mb-3 shadow-sm`}>
                    {wallet.user?.name || "Shared"} • {wallet.type.toUpperCase()}
                  </span>
                  <h2 className="text-slate-800 font-bold text-2xl tracking-tight">{wallet.name}</h2>
                </div>
                <div className={`p-3 ${isCredit ? "bg-orange-50 border-orange-100 text-orange-400" : isSaving ? "bg-emerald-50 border-emerald-100 text-emerald-500" : "bg-slate-50 border-slate-100 text-slate-400"} border rounded-2xl`}>
                  {isCredit ? <CreditCard className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
                </div>
              </div>

              <div className="mt-8">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm text-slate-500 font-semibold tracking-wider uppercase">{isSaving ? "Total Savings" : "Available Balance"}</p>
                    <p className={`text-4xl font-extrabold tracking-tight mt-1 ${isCredit ? "text-orange-600" : isSaving ? "text-emerald-600" : "text-slate-900"}`}>₹{wallet.balance.toLocaleString('en-IN')}</p>
                  </div>
                  <button 
                    onClick={() => openAdjustBalance(wallet.id)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all"
                  >
                    Adjust
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => openTransfer(wallet.id)}
                  className="flex flex-1 items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm"
                >
                  <ArrowRightLeft className="w-4 h-4" /> Transfer
                </button>
                <button 
                  onClick={() => openHistory(wallet.id)}
                  className="flex flex-1 items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl text-sm font-bold transition-all"
                >
                  <History className="w-4 h-4" /> History
                </button>
              </div>
            </div>
          );
        })}
      </section>
      
      <section className="pt-6 space-y-5">
        <h2 className="text-xl font-bold text-slate-900">Recent Global Activity</h2>
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Transaction</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Category</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Amount</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentTxs.map((tx: TransactionData) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          (tx.type === "INCOME" || tx.type === "TRANSFER_IN") ? "bg-emerald-100 text-emerald-600" : 
                          (tx.type === "TRANSFER_OUT") ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
                        }`}>
                          {(tx.type === "INCOME" || tx.type === "TRANSFER_IN") ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-800 block">{tx.merchant}</span>
                          <span className="text-xs text-slate-500">{mounted ? new Date(tx.date).toLocaleDateString() : 'Loading...'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {tx.category || "General"}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${tx.type === "INCOME" || tx.type === "TRANSFER_IN" ? "text-emerald-600" : "text-slate-900"}`}>
                      {(tx.type === "INCOME" || tx.type === "TRANSFER_IN") ? "+" : "-"}₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => {
                            setEditingTrx(tx);
                            setTrxType(tx.type === "INCOME" ? "income" : "expense");
                            setDateSelection("custom");
                            setCustomDate(new Date(tx.date).toISOString().split('T')[0]);
                            setIsTrxModalOpen(true);
                          }}
                          className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm("Delete this transaction?")) {
                              await deleteTransaction(tx.id, user.id);
                              window.location.reload();
                            }
                          }}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {initialTransactions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">No transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {initialTransactions.length > txPerPage && (
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  Showing <span className="font-medium">{(currentPage - 1) * txPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * txPerPage, initialTransactions.length)}</span> of <span className="font-medium">{initialTransactions.length}</span> results
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-300 rounded-lg bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-300 rounded-lg bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
      </section>

      <Modal isOpen={isAddWalletOpen} onClose={() => setIsAddWalletOpen(false)} title="Add New Wallet" size="sm">
        <form className="space-y-4" onSubmit={async (e: any) => {
          e.preventDefault();
          const form = e.target;
          await addWallet({
            name: form.walletName.value,
            type: form.walletType.value,
            balance: parseFloat(form.initialBalance.value),
            userId: user.id,
            familyId: user.familyId || undefined
          });
          setIsAddWalletOpen(false);
          window.location.reload();
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Wallet Name</label>
              <input name="walletName" type="text" placeholder="e.g. HDFC Salary Account" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Account Type</label>
              <select name="walletType" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="BANK">Bank Account</option>
                <option value="CASH">Liquid Cash</option>
                <option value="CREDIT">Credit Card</option>
                <option value="SAVING">Savings Account</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Initial Balance</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                <input name="initialBalance" type="number" step="0.01" className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" required />
              </div>
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg mt-4">
            Create Wallet
          </button>
        </form>
      </Modal>

      <Modal isOpen={isAdjustBalanceOpen} onClose={() => setIsAdjustBalanceOpen(false)} title="Adjust Balance" size="sm">
        <form className="space-y-4" onSubmit={async (e: any) => { 
          e.preventDefault(); 
          if (!selectedWalletId) return;
          const form = e.target;
          await adjustWalletBalance(selectedWalletId, parseFloat(form.querySelector('input[type="number"]').value));
          setIsAdjustBalanceOpen(false);
          window.location.reload();
        }}>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-4">
            <p className="text-amber-800 text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" /> This will update the current balance and log an entry.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">New Balance</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₹</span>
              <input type="number" step="0.01" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" required />
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors mt-2">
            Update Balance
          </button>
        </form>
      </Modal>

      <Modal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} title="Transfer Funds" size="sm">
        <form className="space-y-4" onSubmit={async (e: any) => {
          e.preventDefault();
          if (!selectedWalletId) return;
          const form = e.target;
          const toId = form.targetWallet.value;
          const amount = parseFloat(form.amount.value);
          
          const res = await transferFunds(selectedWalletId, toId, amount, user.id);
          if (res.success) {
            setIsTransferOpen(false);
            window.location.reload();
          } else {
            alert(res.error || "Transfer failed");
          }
        }}>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Transfer To</label>
            <select name="targetWallet" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M6%209L12%2015L18%209%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:24px] bg-[position:right_12px_center] bg-no-repeat pr-10" required>
              <option value="">Select a wallet...</option>
              {initialWallets.filter(w => w.id !== selectedWalletId).map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.balance.toLocaleString('en-IN')})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
              <input name="amount" type="number" step="0.01" className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" required />
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg mt-4">
            Confirm Transfer
          </button>
        </form>
      </Modal>

      <Modal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} title="Wallet History" size="md">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {initialTransactions
            .filter(tx => (tx as any).walletId === selectedWalletId)
            .map((tx: any) => (
              <div key={tx.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    (tx.type === "INCOME" || tx.type === "TRANSFER_IN") ? "bg-emerald-100 text-emerald-600" : 
                    (tx.type === "TRANSFER_OUT") ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
                  }`}>
                    {(tx.type === "INCOME" || tx.type === "TRANSFER_IN") ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-sm">{tx.merchant}</span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{mounted ? new Date(tx.date).toLocaleDateString() : '...'} • {tx.category || "General"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-bold text-base ${(tx.type === "INCOME" || tx.type === "TRANSFER_IN") ? "text-emerald-600" : (tx.type === "TRANSFER_OUT") ? "text-blue-600" : "text-slate-900"}`}>
                    {(tx.type === "INCOME" || tx.type === "TRANSFER_IN") ? "+" : "-"}₹{tx.amount.toLocaleString('en-IN')}
                  </span>
                  <button 
                    onClick={() => {
                      setEditingTrx(tx);
                      setTrxType(tx.type === "INCOME" ? "income" : "expense");
                      setDateSelection("custom");
                      setCustomDate(new Date(tx.date).toISOString().split('T')[0]);
                      setIsHistoryOpen(false);
                      setTimeout(() => setIsTrxModalOpen(true), 150);
                    }}
                    className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={async () => {
                      if (confirm("Delete this transaction?")) {
                        await deleteTransaction(tx.id, user.id);
                        window.location.reload();
                      }
                    }}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          {initialTransactions.filter(tx => (tx as any).walletId === selectedWalletId).length === 0 && (
            <div className="py-12 text-center text-slate-400 italic">No transactions found for this wallet.</div>
          )}
        </div>
      </Modal>

      <Modal 
        isOpen={isTrxModalOpen} 
        onClose={() => {
          setIsTrxModalOpen(false);
          setEditingTrx(null);
        }} 
        title="Edit Transaction" 
        size="sm"
      >
        <form className="space-y-4" onSubmit={async (e: any) => { 
          e.preventDefault(); 
          const form = e.target;
          const amount = parseFloat(form.querySelector('input[type="number"]').value);
          const merchant = form.querySelector('input[placeholder*="Amazon"]')?.value || editingTrx?.merchant || "";
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
                <select defaultValue={editingTrx?.walletId || ""} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10">
                  {initialWallets.map((w: WalletData) => (
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
                <select name="categorySelect" defaultValue={editingTrx?.category || "Other"} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-10">
                  {categories && categories.map((cat: any) => (
                    <option key={cat.id || cat.name || cat} value={cat.name || cat}>{cat.name || cat}</option>
                  ))}
                  {(!categories || categories.length === 0) && <option value="Other">Other</option>}
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
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
