# EasyLife

[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-3.x-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.style=flat-square)](LICENSE)

[English](README.md) | [ภาษาไทย](README.th.md)

Mobile-first personal finance management web application integrated with a Daily Quest gamification system.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture & Security](#architecture--security)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [License](#license)

---

## Overview

**EasyLife** simplifies personal financial tracking by combining transaction management with daily quests and financial habit building. Designed with a mobile-first philosophy, it provides a seamless application experience across smartphones, tablets, and desktops.

---

## Key Features

- **Personal Finance Management**: Track income, expenses, and transaction history in real-time.
- **Daily Quests & Gamification**: Complete financial habits and daily quests to stay engaged.
- **Multi-language Support (i18n)**: Native internationalization capabilities (Thai & English).
- **Responsive Layout**: Built on Vuetify 3 with Materio layout architecture.
- **Mobile-First Experience**: Optimized touch navigation and high-density financial data views.

---

## Tech Stack

| Domain | Technology | Description |
| --- | --- | --- |
| **Frontend** | Vue 3, TypeScript, Vue Router | Composition API, strict type safety, SPA routing |
| **UI Framework** | Vuetify 3, Materio Theme | Material Design 3 system with custom responsive layouts |
| **Build Tool** | Vite | Lightning-fast development server & optimized production bundler |
| **Backend & DB** | Supabase | PostgreSQL database, Authentication, and Row Level Security (RLS) |
| **Validation** | Zod | Runtime type validation for data integrity |
| **Testing & Quality** | Vitest, Playwright, ESLint, Prettier | Unit testing, end-to-end testing, static code analysis |

---

## Architecture & Security

- **Row Level Security (RLS)**: Database tables enforce access control at the database level using `auth.uid()`.
- **Compound Foreign Keys**: Enforces `(resource_id, user_id)` constraints to guarantee multi-tenant data isolation.
- **Currency Integrity**: Financial monetary values are stored as integers representing sub-units (e.g., Satang) to avoid floating-point errors.
- **Authentication Guard**: Client-side Vue Router navigation guards verify session validity before routing to protected views.
- **Strict Environment Handling**: Secrets and local configurations are restricted to `.env.local` and strictly excluded from VCS.

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your local environment:

- **Node.js**: `v22.x` or higher
- **Docker Desktop**: Required for running local Supabase stack
- **Git**

### Installation & Environment Setup

1. **Clone the repository and install dependencies**:

   ```powershell
   git clone <repository-url>
   cd EasyLife
   npm.cmd install
   ```

2. **Configure local environment variables**:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. **Start local Supabase services**:

   ```powershell
   npm.cmd run db:start
   npx.cmd supabase status
   ```

4. **Update `.env.local`** with the API URL and publishable key displayed by `supabase status`:

   ```dotenv
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

5. **Initialize Database & Run Application**:

   ```powershell
   npm.cmd run db:reset
   npm.cmd run db:types
   npm.cmd run dev
   ```

6. Access application at `http://localhost:3000`.
   - Local Supabase Email Testing Dashboard: `http://127.0.0.1:54324`

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm.cmd run dev` | Launch Vite development server |
| `npm.cmd run preview` | Preview production build locally |
| `npm.cmd run check` | Execute static checks, unit tests, build, performance, and security checks |
| `npm.cmd run test:coverage` | Run unit test suite with coverage reporting |
| `npm.cmd run test:e2e` | Execute Playwright E2E integration tests against local Supabase |
| `npm.cmd run security:check` | Audit public environment, secrets, and dependency vulnerabilities |
| `npm.cmd run performance:check` | Validate build bundle against performance budgets |
| `npm.cmd run db:start` | Spin up local Supabase stack via Docker |
| `npm.cmd run db:stop` | Terminate local Supabase stack |
| `npm.cmd run db:reset` | Reapply database migrations and seed data |
| `npm.cmd run db:test` | Run pgTAP database integration and RLS policy tests |
| `npm.cmd run db:types` | Generate TypeScript typings directly from local PostgreSQL schema |

---

## Project Structure

```text
src/
  components/          Shared reusable Vue UI components
  layouts/             Materio application shell, navigation, and sidebar layouts
  lib/                 Supabase client initialization & domain business logic
  plugins/             Vuetify and Materio theme initialization
  router/              Vue Router configuration & authentication middleware
  types/               Application models & generated database schema types
  views/               Page views (Auth, Dashboard, Transactions, Settings)
supabase/
  migrations/          PostgreSQL migrations (schema, functions, triggers, RLS)
  tests/database/      pgTAP unit tests for RLS policies
  seed.sql             Initial seed data (default categories, etc.)
```

---

## Documentation

Comprehensive product specifications and technical planning are available:

- 📋 [Product Specification](PRODUCT_SPEC.md) - Detailed features, domain requirements, and design scope.
- 🗺️ [Development Plan & Roadmap](PLAN.md) - Task breakdowns and release milestones.

---

## License

This project is licensed under the [MIT License](LICENSE).
