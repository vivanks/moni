"use server";

import prisma from "../prisma";
import { revalidatePath } from "next/cache";

export async function getRecentTransactions(userId: string, limit?: number) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    ...(limit ? { take: limit } : {}),
    include: { wallet: true }
  });

  // Resolve GUIDs to names
  const categories = await prisma.category.findMany({ where: { userId } });
  const catMap = new Map(categories.map(c => [c.id, c.name]));

  return transactions.map(tx => ({
    ...tx,
    category: (tx.category && catMap.get(tx.category)) || tx.category || "General"
  }));
}

export async function addTransaction(data: { amount: number; type: string; merchant: string; category?: string; walletId: string; userId: string; date?: Date }) {
  // Auto-categorize transactions to savings wallets
  const targetWallet = await prisma.wallet.findUnique({ where: { id: data.walletId } });
  if (targetWallet?.type === "SAVING") {
    data.category = "Savings";
  }

  const transaction = await prisma.transaction.create({
    data,
  });

  // Calculate new balance for the wallet
  const wallet = targetWallet;
  if (wallet) {
    const isPositive = data.type === "INCOME" || data.type === "TRANSFER_IN";
    const newBalance = isPositive 
      ? wallet.balance + data.amount 
      : wallet.balance - data.amount;

    await prisma.wallet.update({
      where: { id: data.walletId },
      data: { balance: newBalance },
    });
  }

  revalidatePath("/");
  revalidatePath("/wallets");
  revalidatePath("/statistics");
  return transaction;
}

export async function deleteTransaction(id: string, userId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: { wallet: true }
  });

  if (!transaction || transaction.userId !== userId) {
    throw new Error("Transaction not found or unauthorized");
  }

  // Reverse the balance change
  const amountChange = transaction.type === "INCOME" 
    ? -transaction.amount 
    : transaction.amount;

  await prisma.$transaction([
    prisma.wallet.update({
      where: { id: transaction.walletId },
      data: { balance: { increment: amountChange } }
    }),
    prisma.transaction.delete({
      where: { id }
    })
  ]);

  revalidatePath("/");
  revalidatePath("/wallets");
  revalidatePath("/statistics");
  return { success: true };
}

export async function updateTransaction(id: string, userId: string, data: { amount?: number; type?: string; merchant?: string; category?: string; walletId?: string; date?: Date }) {
  const oldTransaction = await prisma.transaction.findUnique({
    where: { id },
    include: { wallet: true }
  });

  if (!oldTransaction || oldTransaction.userId !== userId) {
    throw new Error("Transaction not found or unauthorized");
  }

  // Handle balance reversal if amount, type, or wallet changed
  if (data.amount !== undefined || data.type !== undefined || data.walletId !== undefined) {
    // 1. Reverse old transaction effect
    const isOldPositive = oldTransaction.type === "INCOME" || oldTransaction.type === "TRANSFER_IN";
    const reverseAmount = isOldPositive 
      ? -oldTransaction.amount 
      : oldTransaction.amount;
    
    await prisma.wallet.update({
      where: { id: oldTransaction.walletId },
      data: { balance: { increment: reverseAmount } }
    });

    // 2. Update transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data
    });

    // 3. Apply new transaction effect to (possibly new) wallet
    const newWalletId = data.walletId || oldTransaction.walletId;
    const newAmount = data.amount !== undefined ? data.amount : oldTransaction.amount;
    const newType = data.type || oldTransaction.type;

    const isNewPositive = newType === "INCOME" || newType === "TRANSFER_IN";
    const applyAmount = isNewPositive 
      ? newAmount 
      : -newAmount;

    await prisma.wallet.update({
      where: { id: newWalletId },
      data: { balance: { increment: applyAmount } }
    });

    revalidatePath("/");
    revalidatePath("/wallets");
    revalidatePath("/statistics");
    return updatedTransaction;
  }

  // If no balance-affecting fields changed
  const updatedTransaction = await prisma.transaction.update({
    where: { id },
    data
  });

  revalidatePath("/");
  revalidatePath("/wallets");
  revalidatePath("/statistics");
  return updatedTransaction;
}

export async function getCategorySpending(userId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { 
      userId,
      type: "DEBIT"
    },
    select: {
      amount: true,
      category: true,
    }
  });

  const aggregation = transactions.reduce((acc, tx) => {
    const catValue = tx.category || "Other";
    acc[catValue] = (acc[catValue] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  // Fetch all categories once to resolve potential GUIDs
  const dbCategories = await prisma.category.findMany({ where: { userId } });
  const categoryMap = new Map(dbCategories.map(c => [c.id, c.name]));

  const resolvedAggregation: Record<string, number> = {};
  for (const [key, amount] of Object.entries(aggregation)) {
    const resolvedName = categoryMap.get(key) || key;
    resolvedAggregation[resolvedName] = (resolvedAggregation[resolvedName] || 0) + amount;
  }

  const total = Object.values(resolvedAggregation).reduce((a, b) => a + b, 0);

  return Object.entries(resolvedAggregation).map(([category, amount]) => ({
    category,
    amount,
    percentage: total > 0 ? `${Math.round((amount / total) * 100)}%` : "0%",
    color: getCategoryColor(category)
  }));
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    "Food": "bg-orange-500",
    "Shopping": "bg-pink-500",
    "Transport": "bg-blue-500",
    "Entertainment": "bg-purple-500",
    "Utilities": "bg-emerald-500",
    "Health": "bg-red-500",
    "Travel": "bg-indigo-500",
    "Savings": "bg-teal-500",
  };
  return colors[category] || "bg-slate-500";
}

export async function getWalletTransactions(userId: string, walletId: string, limit = 50) {
  const transactions = await prisma.transaction.findMany({
    where: { 
      walletId: walletId,
      userId: userId
    },
    orderBy: { date: "desc" },
    take: limit,
    include: { wallet: true }
  });

  const categories = await prisma.category.findMany({ where: { userId } });
  const catMap = new Map(categories.map(c => [c.id, c.name]));

  return transactions.map(tx => ({
    ...tx,
    category: (tx.category && catMap.get(tx.category)) || tx.category || "General"
  }));
}

export async function getSavingsStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { familyId: true }
  });

  const whereClause = user?.familyId 
    ? { wallet: { familyId: user.familyId } }
    : { userId };

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    include: { wallet: true }
  });

  const wallets = await prisma.wallet.findMany({
    where: user?.familyId ? { familyId: user.familyId } : { userId }
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalIncome = transactions
    .filter(tx => tx.type === "INCOME" && new Date(tx.date) >= startOfMonth)
    .reduce((acc, tx) => acc + tx.amount, 0);

  const totalExpenses = transactions
    .filter(tx => tx.type === "DEBIT" && new Date(tx.date) >= startOfMonth)
    .reduce((acc, tx) => acc + tx.amount, 0);

  const netSaved = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netSaved / totalIncome) * 100) : 0;

  // New Metrics
  const totalPortfolioBalance = wallets
    .filter(w => w.type === "SAVING")
    .reduce((acc, w) => acc + w.balance, 0);

  // Use the existing startOfMonth declaration from above
  const monthlySavingsAllocation = transactions
    .filter(tx => 
      tx.wallet.type === "SAVING" && 
      (tx.type === "INCOME" || tx.type === "TRANSFER_IN") &&
      new Date(tx.date) >= startOfMonth
    )
    .reduce((acc, tx) => acc + tx.amount, 0);

  const monthlyIncomeTransactions = transactions
    .filter(tx => tx.type === "INCOME" && new Date(tx.date) >= startOfMonth)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const monthlyTotalIncome = monthlyIncomeTransactions.reduce((acc, tx) => acc + tx.amount, 0);

  return {
    totalIncome,
    totalSaved: netSaved,
    savingsRate,
    totalPortfolioBalance,
    monthlySavingsAllocation,
    monthlyTotalIncome,
    monthlyIncomeTransactions
  };
}

export async function getMonthOnMonthStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { familyId: true }
  });

  const whereClause = user?.familyId 
    ? { wallet: { familyId: user.familyId } }
    : { userId };

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    orderBy: { date: 'asc' }
  });

  const monthData: Record<string, { income: number, expense: number }> = {};
  
  for (const tx of transactions) {
    const monthStr = new Date(tx.date).toLocaleString('en-US', { month: 'short', year: '2-digit' });
    if (!monthData[monthStr]) {
      monthData[monthStr] = { income: 0, expense: 0 };
    }
    
    if (tx.type === "INCOME") {
      monthData[monthStr].income += tx.amount;
    } else if (tx.type === "DEBIT") {
      monthData[monthStr].expense += tx.amount;
    }
  }

  const result = Object.entries(monthData)
    .map(([month, data]) => ({ month, ...data }))
    .slice(-6); // last 6 active months
    
  return result;
}
