"use server";

import prisma from "../prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function loginUser(email: string, password?: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) return { error: "User not found" };

  // Logic: If user was invited (password null in DB), 
  // they must use "12345678" for first login
  let isValid = false;
  if (!user.password && password === "12345678") {
    isValid = true;
  } else if (user.password === password) {
    isValid = true;
  }

  if (isValid) {
    const cookieStore = await cookies();
    cookieStore.set("userId", user.id, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    return { success: true, user, mustChangePassword: !user.password || user.mustChangePassword };
  }

  return { error: "Invalid credentials" };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("userId");
  revalidatePath("/");
}

export async function changePassword(userId: string, newPassword: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: newPassword,
        mustChangePassword: false,
      },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update password" };
  }
}

export async function getFamilyMembers(familyId: string) {
  return await prisma.user.findMany({
    where: { familyId },
    select: { id: true, name: true, email: true }
  });
}

export async function getFamilyDetails(familyId: string) {
  return await prisma.family.findUnique({
    where: { id: familyId },
    include: { members: { select: { id: true, name: true, email: true } } }
  });
}

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

export async function createFamily(userId: string, familyName: string) {
  try {
    const inviteCode = generateInviteCode();
    const family = await prisma.family.create({
      data: {
        name: familyName,
        inviteCode: inviteCode,
        members: {
          connect: { id: userId }
        }
      }
    });
    revalidatePath("/");
    return { success: true, family };
  } catch (error) {
    return { error: "Failed to create family" };
  }
}

export async function joinFamily(userId: string, inviteCode: string) {
  try {
    const family = await prisma.family.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() }
    });

    if (!family) return { error: "Invalid invite code" };

    await prisma.user.update({
      where: { id: userId },
      data: { familyId: family.id }
    });

    revalidatePath("/");
    return { success: true, family };
  } catch (error) {
    return { error: "Failed to join family" };
  }
}

export async function leaveFamily(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { familyId: null }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to leave family" };
  }
}

export async function removeMember(memberId: string) {
  try {
    await prisma.user.update({
      where: { id: memberId },
      data: { familyId: null }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: "Failed to remove member" };
  }
}

export async function inviteUser(name: string, email: string, familyId?: string | null) {
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: "User already exists" };

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        familyId: familyId || null,
        mustChangePassword: true,
      },
    });

    revalidatePath("/");
    return { success: true, user: newUser };
  } catch (error) {
    return { error: "Invitation failed" };
  }
}
