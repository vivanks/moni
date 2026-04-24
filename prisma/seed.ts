import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Defined" : "UNDEFINED");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.family.deleteMany();

  console.log("Seeding initial data...");

  // Create a Family Group
  const family = await prisma.family.create({
    data: { 
      name: "The Sharma Family",
      inviteCode: "SHRM"
    },
  });
  console.log("Created Family:", family.id);

  // Create a Primary User
  const vivank = await prisma.user.create({
    data: {
      name: "Vivank",
      email: "vivank@moni.ai",
      password: "password123",
      mustChangePassword: false,
      familyId: family.id,
    },
  });

  // Create an Invited User
  const spouse = await prisma.user.create({
    data: {
      name: "Wife",
      email: "wife@moni.ai",
      mustChangePassword: true,
      familyId: family.id,
    },
  });

  // Create the specific test user requested
  const testUser = await prisma.user.create({
    data: {
      name: "Vivank Sharma",
      email: "vivanksharma37@gmail.com",
      password: "12345678",
      mustChangePassword: false,
      familyId: family.id,
    },
  });
  console.log("Created Test User:", testUser.id, "with Family ID:", testUser.familyId);

  // Create Wallets
  const w1 = await prisma.wallet.create({
    data: {
      name: "Main Salary Account",
      type: "BANK",
      balance: 145000,
      userId: vivank.id,
      familyId: family.id,
    },
  });

  const w2 = await prisma.wallet.create({
    data: {
      name: "Pocket Cash",
      type: "CASH",
      balance: 2500,
      userId: vivank.id,
      familyId: family.id,
    },
  });

  const w3 = await prisma.wallet.create({
    data: {
      name: "Joint Savings",
      type: "BANK",
      balance: 65000,
      userId: spouse.id,
      familyId: family.id,
    },
  });

  const w4 = await prisma.wallet.create({
    data: {
      name: "Amex Platinum",
      type: "CREDIT",
      balance: -45000,
      userId: vivank.id,
      familyId: family.id,
    },
  });

  const cats = ["Food", "Shopping", "Groceries", "Transport", "Entertainment", "Utilities", "Health", "Travel", "Education", "Other"];
  for (const catName of cats) {
    await prisma.category.create({
      data: { 
        name: catName,
        userId: testUser.id,
        familyId: family.id
      }
    });
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
