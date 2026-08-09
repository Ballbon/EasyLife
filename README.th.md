# EasyLife

[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-3.x-6E9F18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue.style=flat-square)](LICENSE)

[English](README.md) | [ภาษาไทย](README.th.md)

เว็บแอปพลิเคชันจัดการการเงินส่วนบุคคลรูปแบบ Mobile-First ที่ผสานระบบ Daily Quest และการสร้างวินัยทางการเงินไว้ในที่เดียว

---

##สารบัญ

- [ภาพรวมโครงการ](#ภาพรวมโครงการ)
- [ฟีเจอร์หลัก](#ฟีเจอร์หลัก)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [สถาปัตยกรรมและความปลอดภัย](#สถาปัตยกรรมและความปลอดภัย)
- [การติดตั้งและเริ่มต้นใช้งาน](#การติดตั้งและเริ่มต้นใช้งาน)
- [คำสั่งสำคัญ](#คำสั่งสำคัญ)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [เอกสารเพิ่มเติม](#เอกสารเพิ่มเติม)
- [สัญญาอนุญาต](#สัญญาอนุญาต)

---

## ภาพรวมโครงการ

**EasyLife** ออกแบบขึ้นเพื่อลดความยุ่งยากในการบันทึกรายรับ-รายจ่าย โดยนำแนวคิด Gamification ผ่านภารกิจประจำวัน (Daily Quests) มาช่วยสร้างวินัยทางการเงิน พร้อมโครงสร้าง UI รูปแบบ Mobile-First ที่ตอบสนองการใช้งานราบรื่นทั้งบนสมาร์ทโฟน แท็บเล็ต และคอมพิวเตอร์

---

## ฟีเจอร์หลัก

- **ระบบจัดการการเงิน**: บันทึกรายรับ รายจ่าย และดูประวัติรายการย้อนหลังแบบ Real-time
- **Daily Quests & Gamification**: ระบบภารกิจประจำวันเพื่อสร้างแรงจูงใจในการบันทึกการเงิน
- **รองรับหลายภาษา (i18n)**: สลับการใช้งานภาษาไทยและภาษาอังกฤษได้สมบูรณ์
- **Responsive Layout**: สร้างด้วย Vuetify 3 และโครงสร้างธีม Materio
- **Mobile-First Experience**: ออกแบบ UI/UX เน้นการสัมผัสและการแสดงผลข้อมูลการเงินที่ชัดเจนบนหน้าจอขนาดเล็ก

---

## เทคโนโลยีที่ใช้

| ส่วนงาน | เทคโนโลยี | รายละเอียด |
| --- | --- | --- |
| **Frontend** | Vue 3, TypeScript, Vue Router | Composition API, Strict Type Safety, Single Page Application |
| **UI Framework** | Vuetify 3, Materio Theme | ระบบ Material Design 3 พร้อมเค้าโครงหน้าจอแบบ Responsive |
| **Build Tool** | Vite | Server สำหรับพัฒนาที่รวดเร็ว และระบบ Bundler สำหรับ Production |
| **Backend & DB** | Supabase | PostgreSQL Database, Authentication และ Row Level Security (RLS) |
| **Validation** | Zod | ตรวจสอบความถูกต้องของข้อมูล (Runtime Type Validation) |
| **Testing & Quality** | Vitest, Playwright, ESLint, Prettier | Unit Testing, End-to-End Testing และ Static Code Analysis |

---

## สถาปัตยกรรมและความปลอดภัย

- **Row Level Security (RLS)**: ป้องกันการเข้าถึงข้อมูลข้ามบัญชีในระดับฐานข้อมูลโดยอ้างอิง `auth.uid()`
- **Compound Foreign Keys**: กำหนดข้อจำกัดแบบ `(resource_id, user_id)` เพื่อแยกข้อมูลของผู้ใช้อย่างเด็ดขาด
- **ความถูกต้องของตัวเลขการเงิน**: จัดเก็บจำนวนเงินเป็นจำนวนเต็มหน่วยสตางค์ (Integer) เพื่อป้องกันข้อผิดพลาดจาก Floating-point
- **Authentication Guard**: ระบบ Vue Router Guard ตรวจสอบ Session ผู้ใช้อย่างรัดกุมก่อนเข้าถึงหน้าปกป้อง
- **การจัดการ Environment Secrets**: จัดเก็บความลับและค่าคอนฟิกไว้ใน `.env.local` เท่านั้น และไม่ถูก Commit เข้า Git repository

---

## การติดตั้งและเริ่มต้นใช้งาน

### สิ่งที่ต้องเตรียมก่อนติดตั้ง

โปรดตรวจสอบว่าเครื่องของคุณได้ติดตั้งโปรแกรมต่อไปนี้เรียบร้อยแล้ว:

- **Node.js**: เวอร์ชั่น `v22.x` ขึ้นไป
- **Docker Desktop**: จำเป็นสำหรับการรัน Supabase Local Stack
- **Git**

### ขั้นตอนการตั้งค่าระบบ

1. **Clone Repository และติดตั้ง Dependencies**:

   ```powershell
   git clone <repository-url>
   cd EasyLife
   npm.cmd install
   ```

2. **คัดลอกไฟล์ Environment Variables**:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. **เปิดใช้งานบริการ Supabase Local**:

   ```powershell
   npm.cmd run db:start
   npx.cmd supabase status
   ```

4. **อัปเดตไฟล์ `.env.local`** โดยนำค่า API URL และ Publishable Key ที่ได้จาก `supabase status` มาใส่:

   ```dotenv
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_PUBLISHABLE_KEY=ค่าที่ได้จาก-supabase-status
   ```

5. **เตรียมฐานข้อมูลและรันแอปพลิเคชัน**:

   ```powershell
   npm.cmd run db:reset
   npm.cmd run db:types
   npm.cmd run dev
   ```

6. เข้าใช้งานแอปพลิเคชันผ่านเว็บเบราว์เซอร์ที่ `http://localhost:3000`
   - ระบบดูอีเมลทดสอบของ Supabase Local: `http://127.0.0.1:54324`

---

## คำสั่งสำคัญ

| คำสั่ง | หน้าที่ |
| --- | --- |
| `npm.cmd run dev` | เปิด Vite Development Server สำหรับพัฒนา |
| `npm.cmd run preview` | ทดสอบเปิดดู Production Build ในเครื่อง |
| `npm.cmd run check` | รัน Static Checks, Unit Tests, Build, Performance และ Security Audit |
| `npm.cmd run test:coverage` | รัน Unit Tests พร้อมตรวจสอบ Coverage Threshold |
| `npm.cmd run test:e2e` | รัน Playwright E2E Tests ทดสอบ User Flow ร่วมกับ Supabase Local |
| `npm.cmd run security:check` | ตรวจสอบข้อมูลรั่วไหลใน Env, Secrets และ Dependencies Vulnerabilities |
| `npm.cmd run performance:check` | ตรวจสอบขนาดไฟล์ Build ตาม Performance Budget |
| `npm.cmd run db:start` | เปิดใช้งาน Supabase Local Stack ผ่าน Docker |
| `npm.cmd run db:stop` | ปิดการทำงาน Supabase Local Stack |
| `npm.cmd run db:reset` | รีเซ็ตฐานข้อมูลใหม่ทั้งหมดจาก Migrations และ Seed |
| `npm.cmd run db:test` | รัน pgTAP Database Integration และ RLS Policy Tests |
| `npm.cmd run db:types` | สร้าง TypeScript Types อัตโนมัติจากโครงสร้างฐานข้อมูล Local |

---

## โครงสร้างโปรเจกต์

```text
src/
  components/          Shared reusable Vue components
  layouts/             Materio application shell, navigation และ sidebar layouts
  lib/                 Supabase client initialization & business logic
  plugins/             การตั้งค่า Vuetify และธีม Materio
  router/              Vue Router configuration & authentication middleware
  types/               Application types และ generated database types
  views/               หน้าจอหลัก (Auth, Dashboard, Transactions, Settings)
supabase/
  migrations/          PostgreSQL migrations (schema, functions, triggers, RLS)
  tests/database/      pgTAP unit tests สำหรับตรวจสอบ RLS policies
  seed.sql             ข้อมูลเริ่มต้นระบบ (Default categories และอื่นๆ)
```

---

## เอกสารเพิ่มเติม

สามารถอ่านรายละเอียดข้อกำหนดผลิตภัณฑ์และแผนการพัฒนาเพิ่มเติมได้ที่:

- 📋 [Product Specification](PRODUCT_SPEC.md) - รายละเอียดฟีเจอร์ ข้อกำหนดขอบเขตระบบ
- 🗺️ [Development Plan & Roadmap](PLAN.md) - แผนงานพัฒนาและขั้นตอนการปล่อยเวอร์ชัน

---

## สัญญาอนุญาต

โปรเจกต์นี้อยู่ภายใต้ [MIT License](LICENSE)
