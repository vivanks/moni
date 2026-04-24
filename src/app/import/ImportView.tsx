"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud, CheckCircle2, AlertCircle,
  Loader2, Trash2, Building2, CreditCard, Banknote, Sparkles,
  ChevronDown, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown,
  FileText, ChevronRight
} from "lucide-react";
import { parseStatementAction, saveImportedTransactions, checkDuplicatesAction } from "../../lib/actions/statement-parser";

interface WalletData {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface Category {
  id: string;
  name: string;
}

export default function ImportView({
  wallets,
  categories,
  userId,
}: {
  wallets: WalletData[];
  categories: Category[];
  userId: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedTransactions, setExtractedTransactions] = useState<any[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<boolean[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  const tableRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (extractedTransactions.length > 0) {
      setTimeout(() => {
        tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 400);
    }
  }, [extractedTransactions.length]);

  React.useEffect(() => {
    async function check() {
      if (extractedTransactions.length > 0 && selectedWalletId) {
        setIsCheckingDuplicates(true);
        setDuplicates([]);
        const result = await checkDuplicatesAction(selectedWalletId, extractedTransactions);
        if (result.success && result.duplicates) {
          setDuplicates(result.duplicates);
        }
        setIsCheckingDuplicates(false);
      }
    }
    check();
  }, [extractedTransactions, selectedWalletId]);

  const totalIncome = isCheckingDuplicates
    ? 0
    : extractedTransactions.reduce(
        (sum, tx, idx) => (!duplicates[idx] && tx.type === "INCOME" ? sum + tx.amount : sum),
        0
      );
  const totalExpense = isCheckingDuplicates
    ? 0
    : extractedTransactions.reduce(
        (sum, tx, idx) => (!duplicates[idx] && tx.type === "DEBIT" ? sum + tx.amount : sum),
        0
      );
  const dupCount = duplicates.filter(Boolean).length;
  const newCount = extractedTransactions.length - dupCount;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsParsing(true);
    setError(null);
    setExtractedTransactions([]);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const result = await parseStatementAction(formData, userId);
      if (result.success) {
        setExtractedTransactions(result.transactions);
      } else {
        setError(result.error || "Failed to parse statement");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    const transactionsToSave = extractedTransactions.filter((_, idx) => !duplicates[idx]);
    
    if (transactionsToSave.length === 0) {
      setError("No valid transactions to save.");
      return;
    }

    if (!selectedWalletId) {
      setError("Please select a destination wallet before committing to ledger.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const result = await saveImportedTransactions(userId, selectedWalletId, transactionsToSave);
      if (result.success) {
        setSuccess(`Successfully imported ${result.count} transactions!`);
        setExtractedTransactions([]);
        setFile(null);
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 2000);
      } else {
        setError(result.error || "Failed to save transactions");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  const removeTransaction = (index: number) => {
    setExtractedTransactions((prev) => prev.filter((_, i) => i !== index));
    setDuplicates((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTransactionCategory = (index: number, newCategory: string) => {
    setExtractedTransactions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], category: newCategory };
      return updated;
    });
  };

  const updateTransactionMerchant = (index: number, newMerchant: string) => {
    setExtractedTransactions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], merchant: newMerchant };
      return updated;
    });
  };

  const getWalletIcon = (type: string) => {
    switch (type) {
      case "BANK": return <Building2 className="w-5 h-5" />;
      case "CREDIT": return <CreditCard className="w-5 h-5" />;
      default: return <Banknote className="w-5 h-5" />;
    }
  };

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast Notifications */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3 w-full max-w-md px-4">
        {success && (
          <div className="bg-slate-900 text-white px-5 py-4 rounded-2xl flex items-center gap-3 shadow-2xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm font-semibold">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-white text-slate-900 px-5 py-4 rounded-2xl flex items-center gap-3 shadow-2xl border border-red-100">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-8 py-20 space-y-20">

        {/* Page Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-bold text-indigo-600 tracking-wider">AI-Powered Import</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">Import Statement</h1>
          <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
            Moni analyzes your statements with surgical precision. Upload your bank PDF, verify the extracted data, and commit to your ledger in seconds.
          </p>
        </div>

        <div className="space-y-16">

          {/* ── Section 1: Upload ── */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center gap-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-lg shadow-indigo-600/20">1</div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Source</h2>
                <p className="text-sm text-slate-400">Upload your bank statement PDF</p>
              </div>
            </div>
            <div className="p-10">
              <label className={`
                flex flex-col items-center justify-center w-full min-h-[16rem] rounded-[1.5rem] border-2 border-dashed cursor-pointer transition-all duration-500
                ${file
                  ? "border-indigo-400 bg-indigo-50/30 shadow-inner"
                  : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"}
              `}>
                <div className={`
                  w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-700
                  ${file ? "bg-indigo-600 text-white scale-110 shadow-xl shadow-indigo-600/30" : "bg-slate-50 text-slate-300"}
                `}>
                  {file ? <FileText className="w-10 h-10" /> : <UploadCloud className="w-10 h-10" />}
                </div>
                <div className="text-center">
                  <p className="text-xl font-black text-slate-800 mb-2 tracking-tight">
                    {file ? file.name : "Select Statement"}
                  </p>
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Ready for Analysis` : "PDF format only"}
                  </p>
                </div>
                <input type="file" className="hidden" accept="application/pdf" onChange={handleFileChange} />
              </label>

              {file && !extractedTransactions.length && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={handleUpload}
                    disabled={isParsing}
                    className="
                      bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] px-10 py-5 rounded-2xl 
                      transition-all duration-500 disabled:opacity-50 shadow-xl shadow-indigo-900/10 flex items-center gap-3
                    "
                  >
                    {isParsing ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
                    ) : (
                      <>Begin Analysis <ChevronRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Section 2: Destination ── */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center gap-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-lg shadow-indigo-600/20">2</div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Destination</h2>
                <p className="text-sm text-slate-400">Choose the destination account</p>
              </div>
            </div>
            <div className="p-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wallets.map((wallet) => {
                  const isActive = selectedWalletId === wallet.id;
                  return (
                    <button
                      key={wallet.id}
                      onClick={() => setSelectedWalletId(wallet.id)}
                      className={`
                        relative group flex items-start gap-5 p-6 rounded-2xl border-2 transition-all duration-500
                        ${isActive
                          ? "border-indigo-600 bg-indigo-50/40 shadow-lg shadow-indigo-100/50 scale-[1.02]"
                          : "border-slate-50 bg-white hover:border-slate-200 hover:shadow-md"}
                      `}
                    >
                      <div className={`
                        w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-500
                        ${isActive ? "bg-indigo-600 text-white rotate-[-5deg]" : "bg-slate-50 text-slate-400"}
                      `}>
                        {getWalletIcon(wallet.type)}
                      </div>
                      <div className="min-w-0 pr-6">
                        <p className={`font-black text-base truncate tracking-tight transition-colors ${isActive ? "text-slate-900" : "text-slate-700"}`}>
                          {wallet.name}
                        </p>
                        <p className={`text-sm font-bold mt-1 tracking-tight ${isActive ? "text-indigo-600" : "text-slate-400"}`}>
                          ₹{wallet.balance.toLocaleString("en-IN")}
                        </p>
                      </div>
                      {isActive && (
                        <div className="absolute top-4 right-4 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Section 3: Review ── */}
          {extractedTransactions.length > 0 && (
            <div ref={tableRef} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/40">
                <div className="flex items-start justify-between gap-6 mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-lg shadow-indigo-600/20 shrink-0">3</div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Refinement</h2>
                      <p className="text-sm text-slate-400">Review and categorize extracted data</p>
                    </div>
                  </div>
                  {isCheckingDuplicates && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-bold text-indigo-600">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Scanning duplicates...
                    </div>
                  )}
                </div>

                {/* Summary Totals */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-[1.5rem] p-6 border border-emerald-100 shadow-sm transition-all duration-500">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Aggregate Income</p>
                      <p className="text-3xl font-black text-emerald-700 tracking-tighter">
                        {isCheckingDuplicates ? "---" : `₹${totalIncome.toLocaleString("en-IN")}`}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <TrendingUp className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white/60 backdrop-blur-sm rounded-[1.5rem] p-6 border border-rose-100 shadow-sm transition-all duration-500">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Aggregate Expense</p>
                      <p className="text-3xl font-black text-rose-900 tracking-tighter">
                        {isCheckingDuplicates ? "---" : `₹${totalExpense.toLocaleString("en-IN")}`}
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                      <TrendingDown className="w-7 h-7" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                      <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Description (Editable)</th>
                      <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Categorization</th>
                      <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Value</th>
                      <th className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Reference</th>
                      <th className="px-8 py-6 w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {extractedTransactions.map((tx, idx) => {
                      const isDup = duplicates[idx];
                      return (
                        <tr
                          key={idx}
                          className={`group transition-all duration-300 ${isDup ? "bg-slate-50/50 opacity-40 grayscale" : "hover:bg-slate-50/50"}`}
                        >
                          <td className="px-8 py-6 text-sm font-bold text-slate-500">
                            {tx.date}
                          </td>
                          <td className="px-8 py-6">
                            <input 
                              type="text"
                              disabled={isDup}
                              value={tx.merchant}
                              onChange={(e) => updateTransactionMerchant(idx, e.target.value)}
                              className="bg-slate-100 border-none text-[14px] font-black text-slate-900 px-4 py-2.5 rounded-xl w-60 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
                            />
                          </td>
                          <td className="px-8 py-6">
                            <div className="relative inline-block w-48">
                              <select
                                disabled={isDup}
                                value={tx.category || "Other"}
                                onChange={(e) => updateTransactionCategory(idx, e.target.value)}
                                className="
                                  w-full appearance-none bg-slate-100 border-none text-xs font-black text-slate-700 
                                  px-5 py-3 rounded-xl cursor-pointer hover:bg-white hover:ring-2 hover:ring-indigo-100 transition-all
                                  disabled:opacity-30 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500/20
                                "
                              >
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <span className={`text-base font-black tracking-tight ${tx.type === "INCOME" ? "text-emerald-600" : "text-slate-900"}`}>
                              {tx.type === "INCOME" ? "+" : "−"}₹{(Number(tx.amount) || 0).toLocaleString("en-IN")}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            {isDup ? (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-lg shadow-sm">
                                <AlertCircle className="w-3 h-3 text-rose-500" />
                                <span className="text-[10px] font-black text-rose-600 uppercase tracking-tighter">Duplicate</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg shadow-sm">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Ready</span>
                              </div>
                            )}
                          </td>
                          <td className="px-8 py-6 w-64 whitespace-normal break-words border-l border-slate-50 bg-slate-50/20">
                            <span className="text-[10px] font-bold text-slate-400 italic block leading-relaxed">
                              {tx.rawMerchant}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button
                              disabled={isDup}
                              onClick={() => removeTransaction(idx)}
                              className="p-2 rounded-xl text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 disabled:hidden"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Commit Footer */}
              <div className="px-10 py-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                   <p className="text-sm font-bold text-slate-500">
                    {newCount > 0 
                      ? `${newCount} unique transaction${newCount !== 1 ? "s" : ""} detected`
                      : "No new transactions found"}
                   </p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving || newCount === 0}
                  className="
                    bg-slate-900 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] px-12 py-5 rounded-2xl 
                    transition-all duration-500 disabled:opacity-50 shadow-xl shadow-indigo-900/10 flex items-center gap-3 active:scale-95
                  "
                >
                  {isSaving ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Finalizing...</>
                  ) : (
                    <>Commit to Ledger <CheckCircle2 className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
