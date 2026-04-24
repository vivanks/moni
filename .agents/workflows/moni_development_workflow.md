---
description: Step-by-step development workflow for Moni AI Budgeting App
---

# Moni Development Workflow

This workflow breaks down the complete development lifecycle for the Moni AI Budgeting App.

## Phase 1: Project Setup and Tooling Initialization (Completed)
- Next.js 15, Tailwind, Prisma initialized.

## Phase 2: UI Development & Hardcoded Data
1. **First Page (Dashboard Overview & Top Bar)**
   - Top layout containing File Upload & Quick text input.
   - Dashboard summary cards (Balances, Outstanding, Monthly Spend).
   - Category-wise breakdown (mocked charts/progress bars).
   - Recent transactions table with hardcoded data.
2. **Chat Assistant UI**
   - Side or bottom chat interface.
   - Chat bubbles with mocked transaction disambiguation examples.
3. **Wallet/Card Management UI**
   - Forms to add/edit wallets and cards.
   - Detail view of wallet.

## Phase 3: Database Setup & Data Model Generation
1. **Define the Schema**
   - Tables: Wallet, CreditCard, Transaction.
2. **Initialize Database**
   - Local SQLite migration and seeding.

## Phase 4: Core Logic - Wallets & Transactions Backend
1. **API Wiring & State**
   - Hook up the UI forms to the DB using API routes or Server Actions.
   - Auto balance updates logic.

## Phase 5: Statement Upload & AI Parsing
1. **File Parsing & Deduplication**
   - Read file contents and parse via OpenAI.
   - SHA256 deduplication and fuzzy matching logic.

## Phase 6: Auto-Categorization & AI Chat Integration
1. **Auto-Categorizations**
   - AI categorization on upload.
2. **Chat API**
   - Next.js route handler for the chat panel to clarify transactions.

## Phase 7: Polish & Advanced Tools
- Complex file (PDF) OCR process.
- Performance and mobile responsiveness checks.
