import { expect, test } from "@playwright/test";

test("redirects a signed-out user away from a protected route", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?redirect=\/dashboard$/);
  await expect(page.getByRole("button", { name: "เข้าสู่ระบบ" })).toBeVisible();
});

test("registers, completes onboarding, and records an expense", async ({
  page,
}) => {
  const email = `phase7-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("ชื่อที่ใช้ในแอป").fill("Phase Seven");
  await page.getByLabel("อีเมล").fill(email);
  await page
    .getByLabel("รหัสผ่าน", { exact: true })
    .fill("Phase7-test-password");
  await page.getByLabel("ยืนยันรหัสผ่าน").fill("Phase7-test-password");
  await page.getByRole("button", { name: "สร้างบัญชี" }).click();

  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel("ชื่อบัญชีแรก").fill("เงินสดทดสอบ");
  await page.getByLabel("ยอดคงเหลือปัจจุบัน (บาท)").fill("1000.00");
  await page.getByRole("button", { name: "เริ่มใช้ EasyLife" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/transactions/new");
  await page.getByLabel("จำนวนเงิน (บาท)").fill("125.50");
  await page
    .locator('[role="combobox"]')
    .filter({ has: page.getByLabel("หมวดหมู่") })
    .click();
  await page.getByRole("option").first().click();
  await page.getByLabel("โน้ต").fill("Phase 7 E2E expense");
  await page.getByRole("button", { name: "บันทึกรายการ" }).click();

  await expect(page).toHaveURL(/\/transactions$/);
  await expect(page.getByText("Phase 7 E2E expense")).toBeVisible();
});
