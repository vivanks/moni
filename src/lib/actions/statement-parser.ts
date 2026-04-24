"use server";

import prisma from "../prisma";
import { revalidatePath } from "next/cache";
import { extractText } from "unpdf";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "",
  baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
});

export async function parseStatementAction(formData: FormData, userId: string) {
  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file uploaded");
  }

  try {
    const bytes = await file.arrayBuffer();

    // 1. Extract raw text from PDF using unpdf
    const { text: rawText } = await extractText(new Uint8Array(bytes), {
      mergePages: true,
    });

    if (!rawText || rawText.trim().length === 0) {
      throw new Error("Could not extract any text from the provided PDF.");
    }

    // 2. Fetch categories for AI context
    const dbCategories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { name: true }
    });
    const categoryList = dbCategories.map(c => c.name).join(", ") || "Other";

    // 3. Call Groq API to extract transactions
    try {
      const response = await openai.chat.completions.create({
        model: process.env.LLM_MODEL || "llama-3.3-70b-versatile",
        seed: 42,
        messages: [
          {
            role: "system",
            content: `You are a financial statement analyzer. Extract ALL transactions from the provided bank statement text. 
            
            Valid Categories: ${categoryList}.

            Rules:
            1. Date: Use key "date" in YYYY-MM-DD format.
            2. Amount: Use key "amount" as a positive number.
            3. Type: Use key "type" as "DEBIT" or "INCOME".
            4. Merchant: Use key "merchant". Cleaned Title Case name (e.g., "Swiggy").
            5. Raw Merchant: Use key "rawMerchant". (CRITICAL)
               - This MUST be the exact, original text snippet from the statement line before any cleaning.
               - Example: "UPI/SWIGGY/12345/BANGALORE" -> rawMerchant: "UPI/SWIGGY/12345/BANGALORE".
            6. Category: Use key "category". Map to the most relevant valid category.
            7. Output: Return ONLY a raw JSON array of objects. No markdown.`
          },
          {
            role: "user",
            content: rawText
          }
        ],
        temperature: 0,
      });

      const resultText = response.choices[0].message.content || "";
      let transactions = [];
      try {
        const cleanText = resultText.replace(/```json\n?|```/g, "").trim();
        const parsed = JSON.parse(cleanText);
        transactions = Array.isArray(parsed) ? parsed : (parsed.transactions || []);
      } catch (e) {
        const match = resultText.match(/\[.*\]/s);
        if (match) {
          transactions = JSON.parse(match[0]);
        }
      }

      // 3. Validate and clean transactions
      const validTransactions = transactions
        .map((tx: any) => {
          const merchant = tx.merchant || tx.merchantName || tx.description || tx.vendor;
          const rawMerchant = tx.rawMerchant || merchant; // Fallback to cleaned if raw missing
          const amount = tx.amount ?? tx.value ?? tx.sum;
          const date = tx.date || tx.transactionDate;
          
          if (!merchant || amount === undefined) return null;
          
          return {
            merchant: String(merchant).trim(), // AI-analysed name
            rawMerchant: String(rawMerchant).trim(), // Full original name
            amount: parseFloat(String(amount)) || 0,
            date: date || new Date().toISOString().split('T')[0],
            type: tx.type === "INCOME" ? "INCOME" : "DEBIT",
            category: tx.category || "Other"
          };
        })
        .filter(Boolean);

      return { success: true, transactions: validTransactions };
    } catch (llmError: any) {
      throw llmError;
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to analyze statement" };
  }
}

export async function saveImportedTransactions(
  userId: string, 
  walletId: string, 
  transactions: any[]
) {
  try {
    const created = await prisma.$transaction(
      transactions.map(tx => prisma.transaction.create({
        data: {
          userId,
          walletId,
          amount: Math.abs(tx.amount),
          type: tx.type,
          merchant: tx.merchant,
          rawMerchant: tx.rawMerchant,
          date: new Date(tx.date),
          category: tx.category || "General"
        }
      }))
    );

    const netChange = transactions.reduce((acc, tx) => {
      return tx.type === "INCOME" ? acc + tx.amount : acc - tx.amount;
    }, 0);

    await prisma.wallet.update({
      where: { id: walletId },
      data: { balance: { increment: netChange } }
    });

    revalidatePath("/statistics");
    revalidatePath("/wallets");
    
    return { success: true, count: created.length };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save transactions" };
  }
}

export async function checkDuplicatesAction(walletId: string, transactions: any[]) {
  try {
    const normalize = (s: string) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';

    const duplicateMap = await Promise.all(
      transactions.map(async (tx) => {
        const txDate = new Date(tx.date);
        const start = new Date(txDate);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(txDate);
        end.setUTCHours(23, 59, 59, 999);
        
        // Find ALL transactions for this wallet, amount, and day
        const candidates = await prisma.transaction.findMany({
          where: {
            walletId,
            amount: Math.abs(tx.amount),
            date: {
              gte: start,
              lte: end,
            },
          },
          select: { rawMerchant: true, merchant: true }
        });
        
        // PRIORITIZE Matching via Raw Merchant
        const targetRaw = normalize(tx.rawMerchant || tx.merchant);
        
        const isDuplicate = candidates.some(cand => {
          const candRaw = normalize(cand.rawMerchant || cand.merchant);
          return candRaw === targetRaw;
        });
        
        return isDuplicate;
      })
    );

    return { success: true, duplicates: duplicateMap };
  } catch (error: any) {
    console.error("Check Duplicates Error:", error);
    return { success: false, error: error.message };
  }
}
