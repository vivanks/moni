import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "../../lib/prisma";
import ImportView from "./ImportView";

export default async function ImportPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true }
  });

  if (!user) {
    redirect("/login");
  }

  const wallets = await prisma.wallet.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, type: true, balance: true }
  });

  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" }
  });

  return (
    <main className="min-h-screen pt-12">
      <ImportView 
        wallets={wallets} 
        categories={categories}
        userId={user.id} 
      />
    </main>
  );
}
