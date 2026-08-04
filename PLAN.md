# EasyLife — Product & Development Plan

## 1. ภาพรวมโปรเจกต์

EasyLife คือเว็บแอปแบบ Mobile-first สำหรับช่วยผู้ใช้จัดการชีวิตประจำวัน โดยรวมความสามารถด้านการเงินส่วนบุคคลและการวางแผนงานประจำวันไว้ในระบบเดียว

เป้าหมายหลักของผลิตภัณฑ์:

- บันทึกรายรับ รายจ่าย และดูข้อมูลย้อนหลังได้
- สรุปค่าใช้จ่ายรายวันและรายเดือน
- แสดงว่าแต่ละเดือนใช้เงินกับอะไรและเป็นจำนวนเท่าไร
- วางงบประมาณและจัดสรรรายได้เข้าแผนต่าง ๆ
- แสดงข้อมูลการเงินในรูปแบบกราฟ
- สร้างเช็กลิสต์แบบ Daily Quest และวางแผนล่วงหน้าได้

## 2. กลุ่มผู้ใช้เป้าหมาย

- บุคคลทั่วไปที่ต้องการเริ่มบันทึกรายรับรายจ่าย
- ผู้ที่ต้องการวางแผนจัดสรรเงินเดือน
- ผู้ที่ต้องการรวมการวางแผนการเงินและงานประจำวันไว้ในแอปเดียว
- ผู้ใช้มือถือเป็นหลัก

## 3. ขอบเขต MVP

### 3.1 Authentication

- สมัครสมาชิกด้วยอีเมล
- เข้าสู่ระบบและออกจากระบบ
- ลืมรหัสผ่าน
- ป้องกันผู้ใช้เข้าถึงข้อมูลของผู้อื่น
- รองรับ Google Login ภายหลังได้

### 3.2 บัญชีการเงิน

- สร้างบัญชี เช่น เงินสด ธนาคาร บัตร และ e-Wallet
- กำหนดยอดตั้งต้น
- เปิดหรือซ่อนบัญชีที่ไม่ใช้งานแล้ว
- แสดงยอดคงเหลือแยกตามบัญชี

### 3.3 รายรับและรายจ่าย

- เพิ่มรายรับ
- เพิ่มรายจ่าย
- โอนเงินระหว่างบัญชี
- เลือกหมวดหมู่
- ระบุวันที่ เวลา จำนวนเงิน รายละเอียด และหมายเหตุ
- แก้ไขและลบรายการย้อนหลัง
- ค้นหาและกรองตามช่วงเวลา ประเภท บัญชี และหมวดหมู่

กฎสำคัญ:

- การโอนเงินต้องไม่ถูกนับเป็นรายรับหรือรายจ่าย
- เงินต้องจัดเก็บเป็นจำนวนเต็มหน่วยสตางค์ เช่น 125.50 บาทเก็บเป็น `12550`
- เวลาในฐานข้อมูลเก็บเป็น UTC แต่แสดงผลและแบ่งวันตาม `Asia/Bangkok`

### 3.4 Dashboard และรายงาน

- รายจ่ายของวันนี้
- รายรับของเดือนนี้
- รายจ่ายของเดือนนี้
- เงินคงเหลือสุทธิ
- หมวดหมู่ที่มีรายจ่ายสูงสุด
- กราฟรายจ่ายรายวัน
- กราฟสัดส่วนรายจ่ายตามหมวดหมู่
- เปรียบเทียบกับเดือนก่อน
- เลือกดูรายงานย้อนหลังตามเดือน

### 3.5 Budget และ Financial Plan

- ตั้งงบประมาณรายเดือนแยกตามหมวดหมู่
- จัดสรรรายได้ด้วยเปอร์เซ็นต์หรือจำนวนเงินจริง
- ตรวจสอบว่าสัดส่วนรวมไม่เกิน 100%
- เปรียบเทียบยอดตามแผนกับยอดที่ใช้จริง
- คัดลอกแผนจากเดือนก่อน

### 3.6 Daily Quest

- สร้างงานครั้งเดียว
- สร้างงานประจำทุกวัน
- เลือกวันที่ทำซ้ำในแต่ละสัปดาห์
- กำหนดวันเริ่มและวันสิ้นสุด
- วางแผนงานล่วงหน้า
- ติ๊กว่างานเสร็จแล้ว
- ดูประวัติการทำงานย้อนหลัง
- มีคะแนนและจำนวนวันที่ทำต่อเนื่องแบบพื้นฐาน

## 4. สิ่งที่ยังไม่ทำใน MVP

- OCR อ่านใบเสร็จ
- เชื่อมบัญชีธนาคารอัตโนมัติ
- AI วิเคราะห์หรือแนะนำการเงิน
- บัญชีครอบครัวหรือบัญชีร่วม
- Native application สำหรับ iOS และ Android
- หลายสกุลเงิน
- ระบบลงทุนเต็มรูปแบบ
- เป้าหมายออมเงินและการติดตามเงินสะสม (Financial Goal)
- Gamification ระดับสูง เช่น badge, level และ achievement
- Offline synchronization เต็มรูปแบบ

## 5. Tech Stack

| ส่วน             | เทคโนโลยี                       |
| ---------------- | ------------------------------- |
| Application      | Next.js App Router + TypeScript |
| Styling          | Tailwind CSS                    |
| UI components    | shadcn/ui                       |
| Icons            | Lucide Icons                    |
| Database         | Supabase PostgreSQL             |
| Authentication   | Supabase Auth                   |
| Authorization    | PostgreSQL Row Level Security   |
| Validation       | Zod                             |
| Forms            | React Hook Form                 |
| Charts           | Recharts                        |
| Date utilities   | date-fns                        |
| Unit tests       | Vitest                          |
| End-to-end tests | Playwright                      |
| CI/CD            | GitHub Actions                  |
| Hosting          | Vercel                          |
| Database hosting | Supabase Cloud                  |
| Error monitoring | Sentry หลังจบ MVP               |

## 6. สถาปัตยกรรมระบบ

```text
ผู้ใช้บนมือถือหรือคอมพิวเตอร์
              |
              v
      Next.js Mobile-first PWA
      - Dashboard
      - Transactions
      - Monthly Reports
      - Financial Plans
      - Daily Quests
              |
              v
             Supabase
      - PostgreSQL
      - Authentication
      - Row Level Security
      - Backup
```

แนวทางการออกแบบ:

- เริ่มด้วย monolith หนึ่งโปรเจกต์ ไม่สร้าง microservices ใน MVP
- ใช้ Server Components สำหรับการอ่านข้อมูลเป็นค่าเริ่มต้น
- ใช้ Server Actions หรือ Route Handlers สำหรับการแก้ไขข้อมูล
- คำนวณรายงานจาก PostgreSQL view หรือ SQL function
- เพิ่มระบบ cache เฉพาะเมื่อวัดแล้วพบปัญหาด้านประสิทธิภาพ
- เก็บ database schema และ migrations ไว้ใน Git

## 7. โครงสร้างฐานข้อมูลเบื้องต้น

### `profiles`

- `id`
- `display_name`
- `currency`
- `timezone`
- `created_at`

### `accounts`

- `id`
- `user_id`
- `name`
- `type`
- `initial_balance_satang`
- `is_active`
- `created_at`

### `categories`

- `id`
- `user_id`
- `name`
- `type` (`income` หรือ `expense`)
- `color`
- `icon`
- `is_default`

### `transactions`

- `id`
- `user_id`
- `account_id`
- `destination_account_id` สำหรับการโอนเงิน
- `category_id`
- `type` (`income`, `expense`, `transfer`)
- `amount_satang`
- `occurred_at`
- `note`
- `created_at`
- `updated_at`

### `budgets`

- `id`
- `user_id`
- `category_id`
- `month`
- `limit_satang`

### `financial_plans`

- `id`
- `user_id`
- `name`
- `month`
- `expected_income_satang`
- `status`

### `plan_allocations`

- `id`
- `financial_plan_id`
- `name`
- `allocation_type` (`percentage` หรือ `fixed`)
- `percentage`
- `planned_amount_satang`
- `category_id`

### `tasks`

- `id`
- `user_id`
- `title`
- `description`
- `priority`
- `points`
- `start_date`
- `end_date`
- `is_active`

### `task_schedules`

- `id`
- `task_id`
- `frequency`
- `days_of_week`
- `scheduled_time`

### `task_completions`

- `id`
- `task_id`
- `user_id`
- `scheduled_date`
- `completed_at`
- `earned_points`

ทุกตารางที่มีข้อมูลส่วนตัวต้องเปิด Row Level Security และกำหนด policy โดยอ้างอิง `auth.uid()`

## 8. หน้าจอหลัก

Navigation บนมือถือ:

1. Home
2. Transactions
3. Plans
4. Quests
5. Settings

รายการหน้าที่ต้องพัฒนา:

- Login
- Register
- Forgot Password
- Onboarding
- Dashboard
- Quick Add Transaction
- Transaction History
- Transaction Detail/Edit
- Monthly Report
- Accounts
- Categories
- Monthly Budget
- Financial Plan
- Daily Quest List
- Quest Calendar
- Quest History
- Profile and Settings

## 9. Roadmap การพัฒนา

ระยะเวลาโดยประมาณสำหรับผู้พัฒนาหนึ่งคน: 7–9 สัปดาห์

### Phase 0 — Product Specification (2–3 วัน)

- [x] กำหนดกลุ่มผู้ใช้เริ่มต้น — ดู `PRODUCT_SPEC.md` ข้อ 2
- [x] เขียนปัญหาหลักที่ผลิตภัณฑ์ต้องแก้ — ดู `PRODUCT_SPEC.md` ข้อ 3
- [x] ยืนยันขอบเขต MVP — ดู `PRODUCT_SPEC.md` ข้อ 4
- [x] เขียน user stories — ดู `PRODUCT_SPEC.md` ข้อ 5
- [x] วาด user flow — ดู `PRODUCT_SPEC.md` ข้อ 6
- [x] ทำ wireframe หน้าหลัก — ดู `PRODUCT_SPEC.md` ข้อ 8
- [x] กำหนดกฎการคำนวณเงินและสิ้นเดือน — ดู `PRODUCT_SPEC.md` ข้อ 9–10
- [x] กำหนด acceptance criteria — ดู `PRODUCT_SPEC.md` ข้อ 11

### Phase 1 — Project Foundation (สัปดาห์ที่ 1)

- [x] สร้าง Next.js TypeScript project
- [x] ติดตั้ง Tailwind CSS และ shadcn/ui
- [x] ตั้งค่า ESLint และ formatter
- [x] สร้าง Git repository (`main`)
- [x] ตั้งค่า environment variables และ `.env.example`
- [x] ตั้งค่า Supabase local development
- [x] สร้าง database migrations และ generated TypeScript types
- [x] สร้าง seed data สำหรับหมวดหมู่เริ่มต้น
- [x] ทำระบบสมัครสมาชิก เข้าสู่ระบบ ออกจากระบบ และลืมรหัสผ่าน
- [x] ทำ onboarding และ protected routes ด้วย Next.js Proxy
- [x] สร้าง RLS policies ชุดแรกและ pgTAP tests

### Phase 2 — Transactions (สัปดาห์ที่ 2)

- [x] สร้างระบบบัญชีการเงิน
- [x] สร้างระบบหมวดหมู่
- [x] เพิ่มรายรับและรายจ่าย
- [x] ทำ Quick Add
- [x] ทำการโอนเงินระหว่างบัญชี
- [x] แก้ไขและลบรายการ
- [x] ทำประวัติรายการ
- [x] ทำตัวกรองและค้นหา
- [x] เขียน unit tests สำหรับการคำนวณเงิน

### Phase 3 — Dashboard and Reports (สัปดาห์ที่ 3)

- [ ] สรุปรายรับและรายจ่ายวันนี้
- [ ] สรุปรายเดือน
- [ ] รายงานแยกตามหมวดหมู่
- [ ] กราฟรายจ่ายรายวัน
- [ ] กราฟสัดส่วนรายจ่าย
- [ ] เปรียบเทียบเดือนก่อน
- [ ] เลือกดูข้อมูลย้อนหลัง
- [ ] ตรวจสอบผลลัพธ์ในเขตเวลา Asia/Bangkok

### Phase 4 — Budget and Financial Plan (สัปดาห์ที่ 4)

- [ ] ตั้งงบประมาณแยกตามหมวดหมู่
- [ ] แสดงยอดใช้จริงเทียบกับงบ
- [ ] สร้างแผนจัดสรรรายได้
- [ ] รองรับเปอร์เซ็นต์และจำนวนคงที่
- [ ] ตรวจยอดจัดสรรรวม
- [ ] คัดลอกแผนจากเดือนก่อน

### Phase 5 — Daily Quest (สัปดาห์ที่ 5)

- [ ] สร้าง task แบบครั้งเดียว
- [ ] สร้าง task แบบเกิดซ้ำ
- [ ] รองรับการเลือกวันในสัปดาห์
- [ ] ทำรายการเควสของวันนี้
- [ ] ทำปฏิทินเควส
- [ ] บันทึก completion
- [ ] แสดงประวัติย้อนหลัง
- [ ] เพิ่มคะแนนและ streak ขั้นพื้นฐาน

### Phase 6 — UX and PWA (สัปดาห์ที่ 6)

- [ ] ตรวจ responsive ทุกหน้า
- [ ] สร้าง loading states
- [ ] สร้าง empty states
- [ ] สร้าง error states
- [ ] ตรวจ accessibility
- [ ] ทำ installable PWA
- [ ] ทำ offline fallback page
- [ ] เพิ่ม export CSV
- [ ] ปรับ Quick Add ให้บันทึกรายการได้รวดเร็ว

### Phase 7 — Testing and Security (สัปดาห์ที่ 7)

- [ ] Unit tests สำหรับสูตรคำนวณทั้งหมด
- [ ] Integration tests สำหรับ database queries
- [ ] Database tests สำหรับ RLS policies
- [ ] E2E tests สำหรับ user flows หลัก
- [ ] ทดสอบวันสิ้นเดือนและปีใหม่
- [ ] ทดสอบ leap year
- [ ] ทดสอบ timezone
- [ ] ทดสอบ transaction แบบ transfer
- [ ] ตรวจ environment variables และ secrets
- [ ] ตรวจสอบ performance เบื้องต้น

### Phase 8 — Deployment (สัปดาห์ที่ 8)

- [ ] สร้าง Supabase production project
- [ ] Apply production migrations
- [ ] ตรวจ RLS policies ใน production
- [ ] เชื่อม repository กับ Vercel
- [ ] ตั้ง production environment variables
- [ ] Deploy production
- [ ] ตั้ง custom domain
- [ ] เปิด database backup
- [ ] เพิ่ม error monitoring
- [ ] ทำ production smoke test
- [ ] ทดสอบกับผู้ใช้กลุ่มเล็ก 5–10 คน
- [ ] เก็บ feedback และจัดลำดับงานรอบถัดไป

## 10. Testing Strategy

### Unit Tests

- การรวมรายรับและรายจ่าย
- การคำนวณยอดคงเหลือ
- การคำนวณงบประมาณคงเหลือ
- การจัดสรรเงินแบบเปอร์เซ็นต์
- การจัดสรรเงินแบบจำนวนคงที่
- การปัดเศษสตางค์
- การนับ streak
- การสร้างรายการ task จาก recurrence rule

### Integration Tests

- Query รายงานประจำเดือน
- Query รายจ่ายแยกตามหมวดหมู่
- การโอนเงินระหว่างบัญชี
- การสร้างและแก้ไขแผนการเงิน
- การบันทึก task completion
- RLS ของทุกตาราง

### End-to-End Tests

- สมัครสมาชิกและเข้าสู่ระบบ
- เพิ่มรายจ่ายและเห็นยอดบน Dashboard
- แก้ไขรายการย้อนหลัง
- โอนเงินระหว่างบัญชีโดยยอดรายจ่ายไม่เพิ่ม
- สร้างงบประมาณและดูยอดใช้จริง
- สร้างแผนจัดสรรเงิน
- สร้างและทำ Daily Quest สำเร็จ
- ออกจากระบบแล้วเข้าถึงหน้าส่วนตัวไม่ได้

## 11. CI/CD Pipeline

ทุก Pull Request ต้องผ่าน:

```text
Type Check
    -> Lint
    -> Unit Tests
    -> Database Tests
    -> Production Build
    -> Playwright Smoke Tests
    -> Vercel Preview
```

เมื่อ merge เข้า `main`:

```text
Apply Production Migration
    -> Deploy Production
    -> Production Smoke Test
    -> Report Deployment Result
```

## 12. Definition of Done สำหรับ MVP

- [ ] ผู้ใช้สมัครและเข้าสู่ระบบได้
- [ ] ผู้ใช้สร้างบัญชีการเงินได้
- [ ] ผู้ใช้เพิ่มรายรับ รายจ่าย และการโอนเงินได้
- [ ] การโอนเงินไม่ถูกนับเป็นรายรับหรือรายจ่าย
- [ ] ยอดบน Dashboard ตรงกับข้อมูลจริง
- [ ] ดูรายงานย้อนหลังตามเดือนได้
- [ ] ตั้งงบประมาณรายหมวดหมู่ได้
- [ ] จัดสรรรายได้เข้าแผนต่าง ๆ ได้
- [ ] สร้าง Daily Quest ล่วงหน้าได้
- [ ] ดูประวัติการทำ Quest ได้
- [ ] ผู้ใช้ไม่สามารถเข้าถึงข้อมูลของผู้ใช้อื่นได้
- [ ] Flow สำคัญผ่าน E2E tests
- [ ] Export ข้อมูลได้
- [ ] ใช้งานบนมือถือได้สะดวก
- [ ] Production มี backup และ error monitoring
- [ ] Deploy ผ่าน CI/CD ได้สำเร็จ

## 13. แผนหลังเปิด MVP

### Version 1.1

- ปรับปรุง UX จาก feedback
- เพิ่ม notification
- เพิ่ม badge และ achievement
- เพิ่ม template แผนการเงิน
- เพิ่มรายงานรายปี

### Version 1.2

- แนบรูปใบเสร็จ
- OCR ใบเสร็จ
- ระบบบัญชีร่วม
- เป้าหมายการเงินที่ละเอียดขึ้น

### Version 2.0

- Mobile application
- Offline synchronization
- หลายสกุลเงิน
- Bank integration หากมี API ที่เหมาะสม
- AI ช่วยวิเคราะห์พฤติกรรมการเงิน โดยต้องมีข้อจำกัดและคำเตือนที่ชัดเจน

## 14. ความเสี่ยงและแนวทางป้องกัน

| ความเสี่ยง                             | แนวทางป้องกัน                                       |
| -------------------------------------- | --------------------------------------------------- |
| ยอดเงินคำนวณคลาดเคลื่อน                | เก็บเงินเป็นจำนวนเต็มหน่วยสตางค์และเขียน unit tests |
| ข้อมูลข้ามผู้ใช้                       | เปิด RLS และทดสอบ policy ทุกตาราง                   |
| รายงานผิดช่วงเดือน                     | กำหนด timezone เป็น Asia/Bangkok และทดสอบ boundary  |
| Scope ใหญ่เกินไป                       | ยึดรายการ MVP และเลื่อนฟีเจอร์เสริมออกไป            |
| ผู้ใช้ไม่บันทึกรายการต่อเนื่อง         | ทำ Quick Add ให้ใช้ได้ภายในไม่กี่ขั้นตอน            |
| Database schema เปลี่ยนโดยไม่มีประวัติ | บังคับใช้ migrations และเก็บใน Git                  |
| Production มีปัญหาแต่ไม่ทราบ           | เพิ่ม error monitoring และ smoke tests              |

## 15. งานแรกที่ควรเริ่ม

1. ยืนยันขอบเขต MVP ในเอกสารนี้
2. สร้าง user flow ของ Transaction, Financial Plan และ Daily Quest
3. ทำ wireframe หน้าหลัก
4. ออกแบบ database schema ฉบับละเอียด
5. สร้าง Next.js และ Supabase local project
6. พัฒนา Authentication และ Transactions ก่อน
