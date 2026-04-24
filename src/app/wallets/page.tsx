import WalletsView from "./WalletsView";
import prisma from "../../lib/prisma";
import { getWallets } from "../../lib/actions/wallets";
import { getRecentTransactions } from "../../lib/actions/transactions";
import { getCategories } from "../../lib/actions/categories";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function WalletsPage() {
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

  const wallets = await getWallets(user.id);
  const transactions = await getRecentTransactions(user.id);
  const categories = await getCategories(user.id);

  return (
    <main className="min-h-screen py-4 md:py-8 bg-slate-50">
      <WalletsView 
        user={user} 
        initialWallets={wallets} 
        initialTransactions={transactions} 
        categories={categories}
      />
    </main>
  );
}
