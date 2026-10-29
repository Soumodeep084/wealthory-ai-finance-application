# Wealthory — AI-Powered Personal Finance & Wealth Management

<div align="center">

![Wealthory Banner](https://img.shields.io/badge/Wealthory-AI--Finance%20Platform-7c3aed?style=for-the-badge&logo=wallet&logoColor=white)

An intelligent, full-stack personal finance and wealth management platform built with **Next.js 15 (App Router)**, **React 19**, **Google Gemini AI**, **Prisma ORM**, **PostgreSQL**, **Inngest**, **Clerk**, and **Arcjet**.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=flat-square&logo=clerk)](https://clerk.com/)
[![Inngest](https://img.shields.io/badge/Inngest-Background%20Jobs-000000?style=flat-square)](https://www.inngest.com/)
[![Arcjet](https://img.shields.io/badge/Arcjet-Security%20%26%20Rate%20Limit-00D097?style=flat-square)](https://arcjet.com/)
[![Resend](https://img.shields.io/badge/Resend-Email%20API-black?style=flat-square&logo=resend)](https://resend.com/)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture & System Design](#-architecture--system-design)
- [Database Schema](#-database-schema)
- [Project Directory Structure](#-project-directory-structure)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Background Workflows (Inngest)](#-background-workflows-inngest)
- [Security & Rate Limiting (Arcjet)](#-security--rate-limiting-arcjet)
- [License](#-license)

---

## 🌟 Overview

**Wealthory** helps individuals take complete control of their financial life with cutting-edge AI assistance and automated financial workflows. It combines intuitive multi-account tracking, automated recurring transactions, budget limit enforcement, AI-powered receipt scanning with optical extraction, monthly financial reporting with actionable AI insights, and real-time email notifications.

---

## ✨ Key Features

### 1. 🤖 AI-Powered Receipt Scanner
- Upload receipt images (JPEG, PNG, WebP) directly during transaction entry.
- Powered by **Google Gemini 1.5 Flash** vision models to automatically extract:
  - Total transaction amount
  - Date of purchase
  - Store / Merchant name
  - Itemized purchase descriptions
  - Smart category classification (e.g., *Groceries, Utilities, Travel, Food, Healthcare*)

### 2. 📊 Interactive Dashboard & Financial Analytics
- **Real-Time Balance Overview**: Aggregated net worth, income, and expense summaries across all linked accounts.
- **Visual Breakdown**: Interactive monthly income vs. expense charts and dynamic category distribution graphs built using **Recharts**.
- **Recent Transactions & Account Cards**: Instant snapshot of all your financial positions in a single view.

### 3. 💳 Multi-Account Management
- Create multiple financial accounts with custom balances (e.g., *Savings, Current / Checking*).
- Set and toggle default accounts seamlessly.
- **Account Deletion with Complete Cascade**: Delete any account along with all its historical transactions and auto-reassign fallback default accounts safely with confirmation dialogs.

### 4. 💸 Transaction Tracking & Bulk Operations
- Add one-time or recurring transactions with custom categories and descriptions.
- **Bulk Creation & Deletion**: Support for batch operations with automatic atomic account balance adjustments.
- **Advanced Filtering & Pagination**: Search by description, filter by type (*Income / Expense*) or recurrence status, sort by date, category, or amount, and manage transactions across paginated tables.

### 5. 🔄 Automated Recurring Transactions
- Set recurring schedules (*Daily, Weekly, Monthly, Yearly*).
- Executed in the background via **Inngest** event triggers and cron jobs with per-user rate throttling.

### 6. 🎯 Budget Progress & Threshold Alerts
- Set monthly budget limits for your primary account.
- Live progress bar tracking monthly spend against budget limits.
- Background cron monitors budgets and triggers **Resend email alerts** when expenses exceed 80% or 100% of the set budget.

### 7. 🧠 AI-Driven Monthly Financial Insights
- Automated end-of-month financial reports generated via Inngest cron workflows.
- Gemini AI evaluates spending habits, highlights major expense drivers, and emails personalized, friendly, and actionable advice to each user.

### 8. 🛡️ Enterprise Security & Protection
- Built-in Bot detection and rate limiting powered by **Arcjet**.
- Route shielding and session verification via **Clerk Authentication**.
- Database-level isolation ensuring users can only read, mutate, or delete their own data.

---

## 🛠️ Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) | React Framework with App Router, Server Components, & Server Actions |
| **Frontend Library** | [React 19](https://react.dev/) | Core UI rendering library |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first responsive CSS styling |
| **UI Components** | [Radix UI](https://www.radix-ui.com/) | Accessible primitives (Dialog, Dropdown, Tooltip, Switch, Select, etc.) |
| **Icons & Notifications**| [Lucide React](https://lucide.dev/) & [Sonner](https://sonner.emilkowal.ski/) | Clean iconography and rich toast notifications |
| **Charts & Visuals** | [Recharts](https://recharts.org/) | Composable SVG-based chart library |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) & [Prisma 6](https://www.prisma.io/) | Type-safe database queries and automated schema migrations |
| **Authentication** | [Clerk](https://clerk.com/) | Complete user authentication and identity management |
| **Artificial Intelligence** | [Google Gemini AI](https://ai.google.dev/) | Multimodal receipt analysis & automated financial insights |
| **Event / Cron Workflows** | [Inngest](https://www.inngest.com/) | Serverless event-driven architecture & scheduled cron jobs |
| **Security & Guardrails** | [Arcjet](https://arcjet.com/) | Web application security, rate limiting, and bot protection |
| **Transactional Email** | [Resend](https://resend.com/) & [React Email](https://react.email/) | Responsive HTML email templates rendered with React components |
| **Form Management** | [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) | Schema validation and robust form handling |

---

## 🏛️ Architecture & System Design

```mermaid
flowchart TD
    User([👤 User / Browser])

    subgraph NextJS["Next.js 15 Application"]
        Middleware["🛡️ Middleware (Clerk Auth + Arcjet Shield)"]
        UI["🖥️ UI Components & Pages (App Router)"]
        Actions["⚡ Server Actions (actions/*)"]
    end

    subgraph ExternalServices["External APIs & Services"]
        Clerk["🔐 Clerk Authentication"]
        Gemini["🤖 Google Gemini 1.5 Flash AI"]
        Inngest["⏱️ Inngest Workflow Engine"]
        Resend["📧 Resend Email Delivery"]
        ArcjetService["🛡️ Arcjet Security"]
    end

    subgraph Database["Database"]
        Postgres[(🐘 PostgreSQL DB / Supabase)]
        Prisma["Prisma ORM Client"]
    end

    User -->|HTTP Requests| Middleware
    Middleware --> Clerk
    Middleware --> ArcjetService
    Middleware --> UI
    UI -->|Invokes| Actions
    Actions --> Prisma
    Actions --> Gemini
    Actions --> ArcjetService
    Prisma --> Postgres

    Inngest -->|Cron / Webhook Triggers| Actions
    Inngest --> Gemini
    Inngest --> Resend
    Resend -->|Delivers Email| User
```

---

## 🗄️ Database Schema

The database schema is defined in [`prisma/schema.prisma`](prisma/schema.prisma) and consists of 4 primary models:

```mermaid
erDiagram
    User ||--o{ Account : "owns"
    User ||--o{ Transaction : "owns"
    User ||--o| Budget : "has"
    Account ||--o{ Transaction : "contains"

    User {
        String id PK
        String clerkUserId UK
        String email UK
        String name
        String imageUrl
        DateTime createdAt
        DateTime updatedAt
    }

    Account {
        String id PK
        String name
        AccountType type "CURRENT | SAVINGS"
        Decimal balance
        Boolean isDefault
        String userId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Transaction {
        String id PK
        TransactionType type "INCOME | EXPENSE"
        Decimal amount
        String description
        DateTime date
        String category
        String receiptUrl
        Boolean isRecurring
        RecurringInterval recurringInterval "DAILY | WEEKLY | MONTHLY | YEARLY"
        DateTime nextRecurringDate
        DateTime lastProcessed
        TransactionStatus status "PENDING | COMPLETED | FAILED"
        String userId FK
        String accountId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Budget {
        String id PK
        Decimal amount
        DateTime lastAlertSent
        String userId UK, FK
        DateTime createdAt
        DateTime updatedAt
    }
```

---

## 📁 Project Directory Structure

```text
ai-finance-application/
├── actions/                   # Next.js Server Actions
│   ├── account.js             # Account CRUD, default toggle, cascade deletion
│   ├── budget.js              # Budget fetch and update operations
│   ├── dashboard.js           # Account creation and dashboard analytics
│   ├── seed.js                # Demo data generator
│   ├── send-email.js          # Resend email dispatch service
│   └── transaction.js         # Transaction CRUD, AI receipt scanning, bulk ops
├── app/                       # Next.js App Router
│   ├── (auth)/                # Clerk Auth routes (sign-in, sign-up)
│   ├── (main)/                # Protected App routes
│   │   ├── account/[id]/      # Account details & transaction table view
│   │   ├── dashboard/         # Financial dashboard, charts & summaries
│   │   └── transaction/       # Create transaction & receipt scanner
│   ├── api/
│   │   ├── inngest/           # Inngest webhook endpoint
│   │   └── seed/              # Database seeding endpoint
│   ├── globals.css            # Tailwind & theme variables
│   ├── layout.jsx             # Root layout with Header, Toaster, & Providers
│   └── page.jsx               # Landing page with hero & feature highlights
├── components/                # Shared UI Components
│   ├── ui/                    # Radix & Shadcn UI building blocks
│   ├── create-account-drawer.jsx # Drawer modal for new account creation
│   ├── delete-account-dialog.jsx # Safety modal for account deletion
│   ├── header.jsx             # Top navigation with user controls
│   ├── hero.jsx               # Landing page hero banner
│   └── footer.jsx             # Application footer
├── data/                      # Static configurations & category presets
│   ├── categories.js          # Expense & Income category color maps
│   └── Home_data.js           # Landing page copy & testimonial stats
├── emails/                    # React Email templates
│   └── template.jsx           # Budget alert & monthly report templates
├── hooks/                     # Custom React hooks
│   └── use-fetch.js           # Asynchronous server action wrapper hook
├── lib/                       # Core utility & third-party client instances
│   ├── arcjet.js              # Arcjet rate-limit & bot protection client
│   ├── checkUser.js           # Clerk-to-Prisma user sync utility
│   ├── inngest/               # Inngest client & scheduled background functions
│   ├── prisma.js              # Prisma Client singleton
│   └── utils.js               # CSS class merging utilities (cn)
├── prisma/
│   └── schema.prisma          # PostgreSQL models & relations
├── middleware.js              # Edge middleware for Clerk auth & Arcjet shielding
└── package.json               # Node.js dependencies and scripts
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory and configure the following environment variables:

```env
# Database Connections (PostgreSQL / Supabase / Neon)
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host:port/database?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Google Gemini AI (Receipt Scanner & Financial Insights)
GEMINI_API_KEY="AIzaSy..."

# Resend (Email Dispatching)
RESEND_API_KEY="re_..."

# Arcjet (Bot Detection & Rate Limiting)
ARCJET_KEY="ajkey_..."

# Inngest (Event System - Optional in local development)
INNGEST_EVENT_KEY="your-inngest-event-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.17.0` or later (Node.js 20+ recommended)
- **npm**, **yarn**, or **pnpm**
- A **PostgreSQL** database (Local, Supabase, Neon, or Railway)
- Free accounts with **Clerk**, **Google AI Studio**, **Resend**, and **Arcjet**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Soumodeep084/wealthory-ai-finance-application.git
   cd wealthory-ai-finance-application
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` (or create `.env`) and populate your API keys as detailed above.

4. **Initialize Database Schema**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

6. *(Optional)* **Run Inngest Dev Server** (for background jobs & crons):
   ```bash
   npx inngest-cli@latest dev
   ```
   Inngest dashboard will be available at [http://localhost:8288](http://localhost:8288).

7. *(Optional)* **Preview Transactional Email Templates**:
   ```bash
   npm run email
   ```

---

## ⏱️ Background Workflows (Inngest)

Wealthory uses **Inngest** for background event execution and cron jobs defined in [`lib/inngest/functions.js`](lib/inngest/functions.js):

| Job Name | Trigger / Schedule | Purpose |
| :--- | :--- | :--- |
| `triggerRecurringTransactions` | `cron: 0 0 * * *` (Daily) | Queries all recurring transactions due today and emits processing events. |
| `processRecurringTransaction` | Event: `transaction.recurring.process` | Creates new transaction instances, adjusts account balances, and calculates next dates. |
| `checkBudgetAlerts` | `cron: 0 */6 * * *` (Every 6 hours) | Calculates monthly spend against budget and sends warning emails (at 80% and 100%). |
| `generateMonthlyReports` | `cron: 0 0 1 * *` (1st of every month) | Aggregates previous month stats, requests Gemini AI insights, and emails the user. |

---

## 🛡️ Security & Rate Limiting (Arcjet)

Arcjet protects the application layer against bots, abuse, and brute-force spikes:
- **Middleware Shield**: `middleware.js` inspects all incoming requests for malicious traffic and suspicious automated bots.
- **Account & Transaction Creation Limits**: Server actions use `aj.protect` to enforce token-bucket rate limits per authenticated user to prevent spam and transaction flooding.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
Built with ❤️ by <strong>Soumodeep</strong> · Powered by Next.js & Google Gemini
</div>
