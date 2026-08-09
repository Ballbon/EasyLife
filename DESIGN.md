# EasyLife — Technical & Design System Specification

## 1. System Architecture Overview

EasyLife เป็นเว็บแอปพลิเคชันรูปแบบ **Mobile-First Progressive Web App (PWA)** เน้นบันทึกการเงินความเร็วสูงและจัดการ Daily Quests ในหน้าจอเดียว

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  [ Next.js App Router (React 19) + Tailwind CSS + Shadcn ] │
└───────────────┬─────────────────────────────┬───────────────┘
                │ Client / Server SDK         │ Realtime / Auth
                ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend (Baas)                  │
│ ┌──────────────┐   ┌──────────────┐   ┌───────────────────┐ │
│ │ Auth & Users │   │ PostgreSQL   │   │ Row Level Security│ │
│ │ (Email/Pass) │   │ (Schema/Data)│   │ (RLS Enforcement) │ │
│ └──────────────┘   └──────────────┘   └───────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Technical Stack

| Layer | Technology | Reason / Purpose |
|-------|------------|------------------|
| **Framework** | Next.js (App Router) | Server Components, Mobile-first performance |
| **Language** | TypeScript | Full-type safety กับ Supabase Database Definitions |
| **Styling & UI** | Tailwind CSS + Shadcn UI | Responsive layout, Accessible UI components |
| **Icons** | Lucide React | Clean, modern iconography |
| **Backend & DB** | Supabase (PostgreSQL) | Managed DB, Auth, Storage, RLS |
| **State Management** | React Hooks + Supabase SDK | Direct data syncing & cache control |

---

## 3. Data Architecture & Database Schema

ข้อมูลการเงินเก็บหน่วยเงินเป็น **Satang (Integer)** เท่านั้น (`1 THB = 100 Satang`) เพื่อป้องกัน Floating-point Imprecision

```mermaid
erdiagram
    profiles ||--o{ accounts : owns
    profiles ||--o{ categories : owns
    profiles ||--o{ transactions : owns
    profiles ||--o{ monthly_budgets : owns
    profiles ||--o{ financial_plans : owns
    profiles ||--o{ daily_quests : owns
    
    accounts ||--o{ transactions : source_account
    accounts ||--o{ transactions : destination_account
    categories ||--o{ transactions : categorized
    categories ||--o{ monthly_budgets : budgeted
    daily_quests ||--o{ quest_completions : completed
```

### Core Tables Summary

| Table | Primary Key | Description | Key Fields / Constraints |
|-------|-------------|-------------|--------------------------|
| `profiles` | `id` (UUID) | ข้อมูลผู้ใช้เพิ่มเติม | `display_name`, `currency_code` (THB), `timezone` |
| `accounts` | `id` (UUID) | บัญชีการเงิน | `user_id`, `name`, `type`, `balance_satang`, `is_hidden` |
| `categories` | `id` (UUID) | หมวดหมู่รายรับ/รายจ่าย | `user_id`, `name`, `type` (`income`/`expense`), `icon`, `color` |
| `transactions` | `id` (UUID) | รายการธุรกรรม | `user_id`, `type` (`income`/`expense`/`transfer`), `amount_satang`, `account_id`, `to_account_id`, `category_id`, `transaction_date` |
| `monthly_budgets` | `id` (UUID) | งบประมาณรายเดือน | `user_id`, `category_id`, `year_month` (YYYY-MM), `amount_satang` |
| `financial_plans` | `id` (UUID) | แผนจัดสรรรายได้ | `user_id`, `year_month`, `expected_income_satang` |
| `daily_quests` | `id` (UUID) | งานประจำวัน | `user_id`, `title`, `points`, `recurrence_type` |
| `quest_completions` | `id` (UUID) | ประวัติการทำ Quest | `quest_id`, `user_id`, `completed_date` |

---

## 4. UI/UX & Design System

### 4.1 Design Philosophy
- **Mobile-First & Thumb-Driven:** ปุ่ม Quick Add (+) และ Navigation หลักอยู่ที่ส่วนล่างของหน้าจอเสมอ
- **High Clarity:** สรุปตัวเลขชัดเจน มี Color-coding สำหรับสถานะการเงิน (รายรับ = เขียว, รายจ่าย = แดง/ส้ม, งบปกติ = ฟ้า, เกินงบ = แดง)
- **Zero Ambiguity:** แสดงสัญลักษณ์ ฿ พร้อมทศนิยม 2 ตำแหน่ง (`฿1,250.00`)

### 4.2 Color Palette & Tokens

```css
:root {
  /* Brand Primary */
  --primary: #2563eb;          /* Royal Blue */
  --primary-foreground: #ffffff;

  /* Financial Status Colors */
  --income: #16a34a;           /* Green */
  --expense: #dc2626;          /* Red */
  --transfer: #0284c7;         /* Sky Blue */

  /* Budget Status */
  --budget-normal: #2563eb;     /* Blue */
  --budget-warning: #d97706;    /* Amber */
  --budget-exceeded: #dc2626;   /* Red */

  /* Neutral Surface & Background */
  --background: #f8fafc;        /* Slate 50 */
  --surface: #ffffff;           /* Pure White */
  --text-main: #0f172a;         /* Slate 900 */
  --text-muted: #64748b;        /* Slate 500 */
}
```

### 4.3 Typography & Component Hierarchy

- **Base Font:** Prompt / Inter / System Sans-serif
- **Card Radius:** `rounded-2xl` (16px) ให้ความรู้สึกเป็นกันเอง มิตรกับผู้ใช้มือถือ
- **Touch Target:** ขั้นต่ำ `44px x 44px` สำหรับปุ่มและอินพุตทั้งหมด

---

## 5. Security & Multi-Tenant Architecture

1. **Row Level Security (RLS):** บังคับใช้ `auth.uid() = user_id` ทุก Table เพื่อป้องกัน Data Leaks ระหว่างผู้ใช้ 100%
2. **Strict Timezone Handling:** ประมวลผลและกรองข้อมูลวันสิ้นเดือน/รายงานโดยอิงตาม `Asia/Bangkok` (UTC+7)
3. **Database Constraints & Triggers:** 
   - ป้องกันการโอนเงินเข้าบัญชีเดียวกัน (`account_id != to_account_id`)
   - คำนวณ `balance_satang` อัตโนมัติในระดับ Database ผ่าน Triggers
