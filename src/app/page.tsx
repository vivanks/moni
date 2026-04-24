import Dashboard from "./components/Dashboard";
import AuthOverlay from "./components/AuthOverlay";
import FamilySetup from "./components/FamilySetup";
import prisma from "../lib/prisma";
import { getWallets } from "../lib/actions/wallets";
import { getRecentTransactions, getCategorySpending } from "../lib/actions/transactions";
import { getCategories } from "../lib/actions/categories";
import { getFamilyMembers } from "../lib/actions/auth";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { family: true }
  });

  if (!user) {
    redirect("/login");
  }

  // If user exists but has no family, show the Setup UI instead of redirecting
  if (!user.familyId) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <FamilySetup userId={user.id} />
      </main>
    );
  }


  const wallets = await getWallets(user.id);
  const transactions = await getRecentTransactions(user.id, 15);
  const categorySpending = await getCategorySpending(user.id);
  const categories = await getCategories(user.id);
  const familyMembers = await getFamilyMembers(user.familyId);

  return (
    <main className="min-h-screen py-4 md:py-8 bg-slate-50">
      <AuthOverlay user={user} />
      <Dashboard 
        user={user} 
        initialWallets={wallets} 
        initialTransactions={transactions}
        initialCategorySpending={categorySpending}
        initialCategories={categories}
        initialMembers={familyMembers}
      />
    </main>
  );
}
