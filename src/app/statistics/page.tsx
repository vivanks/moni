import StatisticsView from "./StatisticsView";
import prisma from "../../lib/prisma";
import { getWallets } from "../../lib/actions/wallets";
import { getRecentTransactions, getSavingsStats, getMonthOnMonthStats } from "../../lib/actions/transactions";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function StatisticsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    redirect("/login");
  }

  const wallets = await getWallets(user.id);
  const transactions = await getRecentTransactions(user.id);
  const savingsStats = await getSavingsStats(user.id);
  const monthOnMonthStats = await getMonthOnMonthStats(user.id);

  return (
    <main className="min-h-screen py-4 md:py-8 bg-slate-50">
      <StatisticsView 
        user={user} 
        wallets={wallets} 
        transactions={transactions}
        savingsStats={savingsStats}
        monthOnMonthStats={monthOnMonthStats}
      />
    </main>
  );
}
