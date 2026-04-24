"use server";

import prisma from "../prisma";
import { revalidatePath } from "next/cache";

/**
 * Resets all financial data across the application but keeps the user accounts.
 * This includes Transactions, Wallets, Families, and Categories.
 * Users' familyId will be nullified.
 */
export async function resetAllData() {
  try {
    // 1. Delete all Transactions
    await prisma.transaction.deleteMany();

    // 2. Delete all Wallets
    await prisma.wallet.deleteMany();

    // 3. Delete all Families
    await prisma.family.deleteMany();

    // 4. Create a default family to keep the app functional
    const inviteCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const defaultFamily = await prisma.family.create({
      data: { 
        name: "Main Family",
        inviteCode: inviteCode
      }
    });

    // 5. Delete all Categories
    await prisma.category.deleteMany();

    // 6. Reset all users to the default family
    await prisma.user.updateMany({
      data: {
        familyId: defaultFamily.id
      }
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to reset database:", error);
    return { success: false, error: "Failed to reset database" };
  }
}
