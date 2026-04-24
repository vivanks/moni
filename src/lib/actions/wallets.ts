"use server";

import prisma from "../prisma";
import { revalidatePath } from "next/cache";

export async function getWallets(userId: string) {
  return await prisma.wallet.findMany({
    where: { userId },
    include: { user: true },
  });
}

export async function getFamilyWallets(familyId: string) {
  return await prisma.wallet.findMany({
    where: { familyId },
    include: { user: true },
  });
}

export async function addWallet(data: { name: string; type: string; balance: number; userId: string; familyId?: string }) {
  const wallet = await prisma.wallet.create({
    data,
  });
  revalidatePath("/");
  return wallet;
}

export async function adjustWalletBalance(walletId: string, balance: number) {
  const wallet = await prisma.wallet.update({
    where: { id: walletId },
    data: { balance },
  });
  revalidatePath("/");
  revalidatePath("/wallets");
  return wallet;
}

export async function transferFunds(fromId: string, toId: string, amount: number, userId: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deduct from source
      const source = await tx.wallet.update({
        where: { id: fromId },
        data: { balance: { decrement: amount } }
      });

      if (source.balance < 0 && source.type !== "CREDIT") {
        throw new Error("Insufficient funds in source wallet");
      }

      // 2. Add to target
      const target = await tx.wallet.update({
        where: { id: toId },
        data: { balance: { increment: amount } }
      });

      const isSavingTransfer = source.type === "SAVING" || target.type === "SAVING";

      // 3. Create Outgoing Transfer Transaction record
      const outgoing = await tx.transaction.create({
        data: {
          amount,
          type: "TRANSFER_OUT",
          merchant: `To: ${target.name}`,
          walletId: fromId,
          userId,
          category: isSavingTransfer ? "Savings" : "Transfer",
          date: new Date()
        }
      });

      // 4. Create Incoming Transfer Transaction record
      const incoming = await tx.transaction.create({
        data: {
          amount,
          type: "TRANSFER_IN",
          merchant: `From: ${source.name}`,
          walletId: toId,
          userId,
          category: isSavingTransfer ? "Savings" : "Transfer",
          date: new Date()
        }
      });

      return { source, target, outgoing, incoming };
    });

    revalidatePath("/");
    revalidatePath("/wallets");
    revalidatePath("/statistics");
    return { success: true, ...result };
  } catch (error: any) {
    console.error("Transfer failed:", error);
    return { success: false, error: error.message };
  }
}

