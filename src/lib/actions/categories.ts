"use server";

import prisma from "../prisma";
import { revalidatePath } from "next/cache";

export async function getCategories(userId: string) {
  return await prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" }
  });
}

export async function checkCategoryUsage(categoryId: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true, userId: true }
    });
    
    if (!category) return { error: "Category not found." };

    const transactionCount = await prisma.transaction.count({
      where: { 
        category: category.name,
        userId: category.userId
      }
    });

    return { success: true, transactionCount };
  } catch (error) {
    return { error: "Failed to check usage." };
  }
}

export async function createCategory(name: string, userId: string, color: string = "bg-blue-500") {
  try {
    // Duplicate check
    const existing = await prisma.category.findFirst({
      where: { 
        name: { equals: name }, 
        userId 
      }
    });

    if (existing) {
      return { error: "Category already exists." };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { familyId: true }
    });

    const category = await prisma.category.create({
      data: { 
        name, 
        color, 
        userId,
        familyId: user?.familyId 
      }
    });
    
    revalidatePath("/");
    revalidatePath("/statistics");
    revalidatePath("/settings");
    return { success: true, category };
  } catch (error) {
    console.error("Create Category Error:", error);
    return { error: "Failed to create category." };
  }
}

export async function deleteCategory(id: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      select: { name: true, userId: true }
    });

    if (!category) return { error: "Category not found." };

    // Prevent deletion if transactions are mapped
    const transactionCount = await prisma.transaction.count({
      where: { 
        category: category.name,
        userId: category.userId
      }
    });

    if (transactionCount > 0) {
      return { error: `Cannot delete. ${transactionCount} transactions are using this category.` };
    }

    await prisma.category.delete({
      where: { id }
    });
    
    revalidatePath("/");
    revalidatePath("/statistics");
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete category." };
  }
}

export async function updateCategory(id: string, data: { name?: string; color?: string }) {
  try {
    const category = await prisma.category.update({
      where: { id },
      data
    });
    revalidatePath("/");
    revalidatePath("/statistics");
    revalidatePath("/settings");
    return { success: true, category };
  } catch (error) {
    return { error: "Failed to update category." };
  }
}

export async function populateDefaultCategories(userId: string) {
  try {
    const defaultCats = [
      { name: "Food", color: "bg-red-500" },
      { name: "Shopping", color: "bg-pink-500" },
      { name: "Groceries", color: "bg-green-500" },
      { name: "Transport", color: "bg-yellow-500" },
      { name: "Entertainment", color: "bg-purple-500" },
      { name: "Utilities", color: "bg-blue-500" },
      { name: "Health", color: "bg-teal-500" },
      { name: "Travel", color: "bg-orange-500" },
      { name: "Education", color: "bg-indigo-500" },
      { name: "Other", color: "bg-gray-500" },
    ];

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { familyId: true }
    });

    const results = [];
    for (const cat of defaultCats) {
      const existing = await prisma.category.findFirst({
        where: { name: cat.name, userId }
      });

      if (!existing) {
        const created = await prisma.category.create({
          data: {
            name: cat.name,
            color: cat.color,
            userId,
            familyId: user?.familyId
          }
        });
        results.push(created);
      }
    }

    revalidatePath("/");
    revalidatePath("/statistics");
    revalidatePath("/settings");
    return { success: true, count: results.length };
  } catch (error) {
    console.error("Populate Defaults Error:", error);
    return { error: "Failed to populate default categories." };
  }
}
