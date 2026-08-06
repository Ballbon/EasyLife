# EasyLife

เว็บแอป mobile-first สำหรับจัดการการเงินส่วนบุคคลและ Daily Quest ในที่เดียว

## Tech stack

- Vue 3, TypeScript และ Vue Router
- Vuetify 3 พร้อม Materio theme
- Vite สำหรับ development และ production build
- Supabase PostgreSQL, Auth และ Row Level Security
- Zod สำหรับ validation
- Vitest, ESLint และ Prettier

รายละเอียดผลิตภัณฑ์อยู่ใน [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) และ roadmap อยู่ใน [PLAN.md](./PLAN.md)

## เริ่มพัฒนาในเครื่อง

ต้องมี Node.js 22+, Docker Desktop และ Git

```powershell
npm.cmd install
Copy-Item .env.example .env.local
npm.cmd run db:start
npx.cmd supabase status
```

นำค่า API URL และ publishable key จาก `supabase status` ใส่ใน `.env.local`:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=ค่าจาก-supabase-status
```

จากนั้นเตรียมฐานข้อมูลและเปิดแอป:

```powershell
npm.cmd run db:reset
npm.cmd run db:types
npm.cmd run dev
```

เปิด <http://localhost:3000> ส่วนอีเมลทดสอบจาก Supabase local ดูได้ที่ <http://127.0.0.1:54324>

## คำสั่งสำคัญ

| คำสั่ง                 | หน้าที่                                              |
| ---------------------- | ---------------------------------------------------- |
| `npm.cmd run dev`      | เปิด Vite development server                         |
| `npm.cmd run preview`  | เปิดดู production build                              |
| `npm.cmd run check`    | รัน lint, typecheck, unit tests และ production build |
| `npm.cmd run db:start` | เปิด Supabase local stack                            |
| `npm.cmd run db:stop`  | ปิด Supabase local stack                             |
| `npm.cmd run db:reset` | สร้างฐานข้อมูลใหม่จาก migrations และ seed            |
| `npm.cmd run db:test`  | รัน pgTAP database/RLS tests                         |
| `npm.cmd run db:types` | สร้าง TypeScript types จาก local database            |

บน PowerShell เครื่องที่มี execution policy เข้มงวด ให้ใช้ `npm.cmd` และ `npx.cmd` ตามตัวอย่างแทน `npm`/`npx`

## โครงสร้างหลัก

```text
src/
  layouts/             Materio application shell และ navigation
  router/              Vue Router routes และ authentication guard
  views/               หน้าจอ auth, dashboard, transactions และ settings
  components/          shared Vue components
  lib/                 Supabase client และ business logic
  plugins/             Vuetify/Materio theme configuration
  types/               app types และ generated database types
supabase/
  migrations/          schema, constraints, triggers และ RLS policies
  tests/database/      pgTAP RLS tests
  seed.sql             หมวดหมู่เริ่มต้น
```

## Security baseline

- Vue Router guard ตรวจ session ก่อนเข้า protected routes
- Data actions ตรวจผู้ใช้ซ้ำก่อนแก้ข้อมูล
- ตารางข้อมูลส่วนตัวเปิด RLS และ policy อ้างอิง `auth.uid()`
- Foreign keys แบบ `(resource_id, user_id)` ป้องกันการอ้าง resource ของผู้ใช้อื่น
- Environment secrets และ `.env.local` ไม่ถูก commit
- จำนวนเงินเก็บเป็น integer หน่วยสตางค์
