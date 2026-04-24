export type TransactionType = "credit" | "debit";

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  merchant: string;
  category: string;
  sourceType: "wallet" | "card";
  sourceId: string;
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  type: "bank" | "cash" | "credit";
  ownerName?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  outstanding: number;
  dueDate: string;
}

export const mockWallets: Wallet[] = [
  { id: "w1", name: "Main Salary Account", balance: 145000, type: "bank", ownerName: "Vivank" },
  { id: "w2", name: "Pocket Cash", balance: 2500, type: "cash", ownerName: "Vivank" },
  { id: "w3", name: "Joint Savings", balance: 65000, type: "bank", ownerName: "Wife" },
  { id: "w4", name: "Amex Reserve", balance: -45000, type: "credit", ownerName: "Vivank" },
];

export const mockCards: CreditCard[] = [
  { id: "c1", name: "Amex Platinum", limit: 500000, outstanding: 45000, dueDate: "2026-04-15" },
  { id: "c2", name: "HDFC Swiggy", limit: 150000, outstanding: 12000, dueDate: "2026-04-18" },
];

export const mockTransactions: Transaction[] = [
  { id: "t1", date: "2026-04-05", amount: 450, type: "debit", merchant: "Swiggy", category: "Food", sourceType: "card", sourceId: "c2" },
  { id: "t2", date: "2026-04-04", amount: 1200, type: "debit", merchant: "Uber", category: "Travel", sourceType: "wallet", sourceId: "w1" },
  { id: "t3", date: "2026-04-01", amount: 145000, type: "credit", merchant: "TechCorp Inc", category: "Salary", sourceType: "wallet", sourceId: "w1" },
  { id: "t4", date: "2026-03-29", amount: 8900, type: "debit", merchant: "Amazon", category: "Shopping", sourceType: "card", sourceId: "c1" },
  { id: "t5", date: "2026-03-28", amount: 650, type: "debit", merchant: "Starbucks", category: "Food", sourceType: "wallet", sourceId: "w2" },
];

export const categoryBreakdown = [
  { category: "Food", amount: 15000, color: "bg-orange-500", percentage: "15%" },
  { category: "Travel", amount: 8000, color: "bg-blue-500", percentage: "8%" },
  { category: "Shopping", amount: 45000, color: "bg-purple-500", percentage: "45%" },
  { category: "Bills", amount: 32000, color: "bg-red-500", percentage: "32%" },
];
