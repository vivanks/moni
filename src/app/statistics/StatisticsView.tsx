"use client";

import React from "react";
import { 
  Activity, PieChart, TrendingDown, Store, 
  Users, Wallet, TrendingUp, Target, Landmark, Calendar
} from "lucide-react";
import Modal from "../components/Modal";

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
  walletId?: string;
}

export default function StatisticsView({ 
  wallets, 
  transactions,
  user,
  savingsStats: initialSavingsStats,
  monthOnMonthStats
}: { 
  wallets: WalletData[], 
  transactions: TransactionData[],
  user: { id: string; name: string },
  savingsStats: { 
    totalIncome: number; 
    totalSaved: number; 
    savingsRate: number;
    totalPortfolioBalance: number;
    monthlySavingsAllocation: number;
    monthlyTotalIncome: number;
    monthlyIncomeTransactions: any[];
  },
  monthOnMonthStats: { month: string; income: number; expense: number }[]
}) {
  const [mounted, setMounted] = React.useState(false);
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = React.useState(false);
  
  // Date Selection State
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth());
  const [selectedYear, setSelectedYear] = React.useState(now.getFullYear());

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Derived Date Range
  const startOfSelectedMonth = new Date(selectedYear, selectedMonth, 1);
  const endOfSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

  // Filtered Transactions for the Selected Month
  const filteredTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate >= startOfSelectedMonth && txDate <= endOfSelectedMonth;
  });

  // Re-calculate Savings Stats for the selected month Reactively
  // (Total Savings Portfolio is global, so it remains constant)
  const monthlyTransactions = filteredTransactions;
  const monthlyTotalIncome = monthlyTransactions
    .filter(tx => tx.type === "INCOME")
    .reduce((acc, tx) => acc + tx.amount, 0);

  const monthlyTotalExpenses = monthlyTransactions
    .filter(tx => tx.type === "DEBIT")
    .reduce((acc, tx) => acc + tx.amount, 0);

  const monthlyNetSaved = monthlyTotalIncome - monthlyTotalExpenses;
  const monthlySavingsRate = monthlyTotalIncome > 0 
    ? Math.round((monthlyNetSaved / monthlyTotalIncome) * 100) 
    : 0;

  const monthlySavingsAllocation = monthlyTransactions
    .filter(tx => {
      const wallet = wallets.find(w => w.id === tx.walletId);
      return wallet?.type === "SAVING" && (tx.type === "INCOME" || tx.type === "TRANSFER_IN");
    })
    .reduce((acc, tx) => acc + tx.amount, 0);

  const monthlyIncomeTransactions = monthlyTransactions
    .filter(tx => tx.type === "INCOME")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Aggregate data for "Top Merchants"
  const topMerchants = filteredTransactions
    .reduce((acc, tx) => {
      if (tx.type === "DEBIT") {
        acc[tx.merchant] = (acc[tx.merchant] || 0) + tx.amount;
      }
      return acc;
    }, {} as Record<string, number>);

  const sortedMerchants = Object.entries(topMerchants).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // Aggregate spending by Family Member
  const spendingByMember = filteredTransactions.reduce((acc, tx) => {
    if (tx.type === "DEBIT") {
      const wallet = wallets.find(w => w.id === tx.walletId);
      const owner = wallet?.user?.name || "Shared";
      acc[owner] = (acc[owner] || 0) + tx.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  // Aggregate spending by Wallet
  const spendingByWallet = filteredTransactions.reduce((acc, tx) => {
    if (tx.type === "DEBIT") {
      const wallet = wallets.find(w => w.id === tx.walletId);
      const walletName = wallet?.name || "Unknown";
      acc[walletName] = (acc[walletName] || 0) + tx.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  // Aggregate by Category
  const spendingByCategory = filteredTransactions.reduce((acc, tx) => {
    if (tx.type === "DEBIT") {
      const cat = tx.category || "General";
      acc[cat] = (acc[cat] || 0) + tx.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const totalSpend = Object.values(spendingByCategory).reduce((a, b) => a + b, 0);

  // Sorting categories by amount
  const sortedCategories = Object.entries(spendingByCategory)
    .sort((a, b) => b[1] - a[1]);

  const getMonthlyTransactionsByCategory = (category: string) => {
    return filteredTransactions.filter(tx => 
      (tx.category === category || (category === "General" && !tx.category)) &&
      tx.type === "DEBIT"
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const modalTransactions = activeCategory ? getMonthlyTransactionsByCategory(activeCategory) : [];

  // Month Selection Options (Last 12 Months)
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push({
      label: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
      month: d.getMonth(),
      year: d.getFullYear()
    });
  }

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-6 space-y-8 pb-12">
      <header className="pt-2 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">Statistics</h1>
            <p className="text-slate-500 text-base mt-2">Deep dive into your family's real expenditure trends.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
            <select 
              value={`${selectedMonth}-${selectedYear}`}
              onChange={(e) => {
                const [month, year] = e.target.value.split('-').map(Number);
                setSelectedMonth(month);
                setSelectedYear(year);
              }}
              className="bg-transparent text-sm font-bold text-slate-700 px-4 py-2 outline-none cursor-pointer"
            >
              {monthOptions.map((opt, i) => (
                <option key={i} value={`${opt.month}-${opt.year}`}>
                  {opt.label} {i === 0 ? "(Current Month)" : ""}
                </option>
              ))}
            </select>
          </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-tr from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-indigo-100 mb-6 font-semibold">
            <TrendingDown className="w-5 h-5 text-red-300" />
            Top Category: {sortedCategories[0]?.[0] || "None"}
          </div>
          <div>
            <p className="text-4xl font-extrabold tracking-tight">₹{(sortedCategories[0]?.[1] || 0).toLocaleString('en-IN')}</p>
            <p className="text-sm mt-1 text-indigo-100/70 font-medium tracking-wide font-bold uppercase">LATEST ANALYTICS</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 mb-6 font-semibold">
            <Users className="w-5 h-5 text-indigo-500" />
            Budgetary Savings Rate
          </div>
          <div>
            <p className="text-4xl font-extrabold text-slate-900">{monthlySavingsRate}%</p>
            <p className="text-sm text-slate-500 mt-1 font-medium italic">₹{monthlyNetSaved.toLocaleString('en-IN')} unspent budget</p>
          </div>
        </div>

        <div className="bg-gradient-to-tr from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 w-32 h-32 translate-x-4 translate-y-8">
            <Landmark className="w-full h-full" />
          </div>
          <div className="flex items-center gap-2 text-emerald-100 mb-6 font-semibold uppercase tracking-wider text-[10px]">
            <Landmark className="w-5 h-5" />
            Total Savings Portfolio
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-extrabold tracking-tight">₹{initialSavingsStats.totalPortfolioBalance.toLocaleString('en-IN')}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-emerald-100/90 font-bold bg-emerald-500/30 px-2 py-0.5">
                +₹{monthlySavingsAllocation.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-100/60 font-semibold uppercase tracking-wider">Added in {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'short' })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-900 mb-8 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-indigo-500" /> Income vs Spend
            </h2>
            <div className="flex items-end justify-between gap-3 h-48 mt-4 pt-4 border-b border-slate-100">
              {monthOnMonthStats.map((stat, i) => {
                const maxVal = Math.max(...monthOnMonthStats.flatMap(s => [s.income, s.expense]), 1);
                const incomeHeight = `${(stat.income / maxVal) * 100}%`;
                const expenseHeight = `${(stat.expense / maxVal) * 100}%`;
                
                return (
                  <div key={i} className="flex flex-col items-center gap-2 w-full group h-full justify-end relative">
                    {/* Custom Tailwind Tooltip */}
                    <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs py-1.5 px-3 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-20 flex flex-col items-center">
                      <span className="font-bold text-emerald-400">IN: ₹{stat.income.toLocaleString('en-IN')}</span>
                      <span className="font-bold text-rose-400">OUT: ₹{stat.expense.toLocaleString('en-IN')}</span>
                      {/* Tooltip caret */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                    </div>

                    <div className="flex items-end justify-center w-full h-full gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      {/* Income Bar */}
                      <div 
                        className="w-1/3 max-w-[24px] bg-emerald-500 rounded-t-sm min-h-[4px]" 
                        style={{ height: incomeHeight }}
                      />
                      {/* Expense Bar */}
                      <div 
                        className="w-1/3 max-w-[24px] bg-rose-500 rounded-t-sm min-h-[4px]" 
                        style={{ height: expenseHeight }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{stat.month}</span>
                  </div>
                );
              })}
              {monthOnMonthStats.length === 0 && (
                <div className="w-full h-full flex items-center justify-center text-slate-400 italic">No monthly data available yet.</div>
              )}
            </div>
            {monthOnMonthStats.length > 0 && (
              <div className="flex gap-6 mt-6 justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Income
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="w-3 h-3 bg-rose-500 rounded-sm"></div> Spend
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-900 mb-8 flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-500" /> Spend by Category
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {sortedCategories.map(([cat, amount], idx) => (
                <button 
                  key={idx} 
                  className="space-y-3 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 text-left group"
                  onClick={() => {
                    setActiveCategory(cat);
                    setShowCategoryModal(true);
                  }}
                >
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{cat}</span>
                    <span className="text-sm font-bold text-slate-900">₹{amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-indigo-500 group-hover:bg-indigo-600 transition-colors" 
                      style={{ width: `${(amount / totalSpend) * 100}%` }} 
                    />
                  </div>
                </button>
              ))}
              {sortedCategories.length === 0 && <p className="text-slate-400 italic">No spending categorization available yet.</p>}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-900 mb-8 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-500" /> Monthly Income Breakdown
            </h2>
            <div className="overflow-hidden border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Source</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Date</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 italic font-medium">
                  {monthlyIncomeTransactions.map((tx: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-800 font-bold">{tx.merchant}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {mounted ? new Date(tx.date).toLocaleDateString() : '...'}
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-extrabold">
                        +₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {monthlyIncomeTransactions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-400">No income recorded for this month.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-emerald-50/50">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 font-bold text-slate-700 uppercase tracking-wider text-xs">Total Monthly Income</td>
                    <td className="px-6 py-4 text-right font-extrabold text-lg text-emerald-700">₹{monthlyTotalIncome.toLocaleString('en-IN')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" /> Family Contribution
              </h3>
              <div className="space-y-5">
                {Object.entries(spendingByMember).map(([member, amount], idx) => (
                  <div key={idx} className="flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                        {member[0]}
                      </div>
                      <span className="font-semibold text-slate-700">{member}</span>
                    </div>
                    <span className="font-bold text-slate-900">₹{amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-500" /> Wallet Level Portfolios
              </h3>
              <div className="space-y-5">
                {Object.entries(spendingByWallet).map(([walletName, amount], idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700 truncate max-w-[120px]">{walletName}</span>
                    <span className="font-bold text-slate-900">₹{amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Store className="w-5 h-5 text-slate-400" /> Top Merchants
            </h3>
            <div className="space-y-4">
              {sortedMerchants.map(([merchant, amount], i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
                  <span className="font-bold text-slate-700 text-sm">{merchant}</span>
                  <span className="font-extrabold text-slate-900 text-sm">₹{amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
              {sortedMerchants.length === 0 && <p className="text-slate-400 italic text-sm">No activity recorded.</p>}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-3xl p-6 shadow-sm">
            <h3 className="text-md font-bold text-slate-900 mb-2 flex items-center gap-2 uppercase tracking-wide text-xs">
               AI Budget Coach
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
               Moni AI is currently analyzing your data. You have {wallets.length} active wallets contributing to a total spend of ₹{totalSpend.toLocaleString('en-IN')}.
            </p>
          </div>
        </section>
      </div>

      <Modal 
        isOpen={showCategoryModal} 
        onClose={() => setShowCategoryModal(false)} 
        title={`${activeCategory} Transactions`}
        size="lg"
      >
        <div className="space-y-6">
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Transactions for {new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
          
          <div className="border border-slate-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Merchant</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Date</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Wallet</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {modalTransactions.map((tx: any, idx: number) => {
                  const wallet = wallets.find(w => w.id === tx.walletId);
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{tx.merchant}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {mounted ? new Date(tx.date).toLocaleDateString() : '...'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-600 uppercase">
                          {wallet?.name || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-rose-600">
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
                {modalTransactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                      No transactions found for this category this month.
                    </td>
                  </tr>
                )}
              </tbody>
              {modalTransactions.length > 0 && (
                <tfoot className="bg-slate-50/50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">Total {activeCategory} Spend</td>
                    <td className="px-6 py-4 text-right font-extrabold text-lg text-slate-900 font-bold">
                      ₹{modalTransactions.reduce((acc, t) => acc + t.amount, 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}
