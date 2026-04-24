import { cookies } from "next/headers";
import prisma from "../../lib/prisma";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  
  let user = null;
  let family = null;

  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, familyId: true }
    });

    if (user?.familyId) {
      family = await prisma.family.findUnique({
        where: { id: user.familyId },
        include: { members: { select: { id: true, name: true, email: true } } }
      });
    }
  }

  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" }
  });

  return <SettingsClient user={user} initialCategories={categories} initialFamily={family} />;
}
