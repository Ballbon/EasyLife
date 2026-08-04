# EasyLife

เว็บแอป mobile-first สำหรับจัดการการเงินส่วนบุคคลและ Daily Quest ในที่เดียว

## Tech stack

- Next.js 16 App Router, React 19 และ TypeScript
- Tailwind CSS 4 และ shadcn/ui
- Supabase PostgreSQL, Auth และ Row Level Security
- Zod, React Hook Form และ date-fns
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
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=ค่าจาก-supabase-status
NEXT_PUBLIC_SITE_URL=http://localhost:3000
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
| `npm.cmd run dev`      | เปิด Next.js development server                      |
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
  app/                 routes, Server Actions และ auth callback
  components/          UI, auth และ onboarding components
  lib/supabase/        browser/server clients และ session proxy
  types/               form state และ generated database types
supabase/
  migrations/          schema, constraints, triggers และ RLS policies
  tests/database/      pgTAP RLS tests
  seed.sql             หมวดหมู่เริ่มต้น
```

## Security baseline

- Proxy ใช้ `supabase.auth.getClaims()` เพื่อตรวจ JWT และ refresh cookie
- Server Actions ตรวจ authentication ซ้ำก่อนแก้ข้อมูล
- ตารางข้อมูลส่วนตัวเปิด RLS และ policy อ้างอิง `auth.uid()`
- Foreign keys แบบ `(resource_id, user_id)` ป้องกันการอ้าง resource ของผู้ใช้อื่น
- Environment secrets และ `.env.local` ไม่ถูก commit
- จำนวนเงินเก็บเป็น integer หน่วยสตางค์
