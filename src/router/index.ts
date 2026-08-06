import { createRouter, createWebHistory } from "vue-router";

import { supabase } from "@/lib/supabase";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: () => import("@/views/IndexView.vue") },
    {
      path: "/login",
      component: () => import("@/views/auth/AuthView.vue"),
      meta: { guest: true, mode: "login", title: "เข้าสู่ระบบ" },
    },
    {
      path: "/register",
      component: () => import("@/views/auth/AuthView.vue"),
      meta: { guest: true, mode: "register", title: "สมัครสมาชิก" },
    },
    {
      path: "/forgot-password",
      component: () => import("@/views/auth/AuthView.vue"),
      meta: { guest: true, mode: "forgot", title: "ลืมรหัสผ่าน" },
    },
    {
      path: "/reset-password",
      component: () => import("@/views/auth/AuthView.vue"),
      meta: { mode: "reset", title: "ตั้งรหัสผ่านใหม่" },
    },
    {
      path: "/auth/callback",
      component: () => import("@/views/auth/AuthCallbackView.vue"),
      meta: { public: true, title: "กำลังยืนยันบัญชี" },
    },
    {
      path: "/onboarding",
      component: () => import("@/views/OnboardingView.vue"),
      meta: { title: "ตั้งค่าเริ่มต้น" },
    },
    {
      path: "/",
      component: () => import("@/layouts/AppLayout.vue"),
      children: [
        {
          path: "dashboard",
          component: () => import("@/views/DashboardView.vue"),
          meta: { title: "ภาพรวม" },
        },
        {
          path: "transactions",
          component: () => import("@/views/TransactionsView.vue"),
          meta: { title: "รายการทั้งหมด" },
        },
        {
          path: "transactions/new",
          component: () => import("@/views/TransactionFormView.vue"),
          meta: { title: "เพิ่มรายการ" },
        },
        {
          path: "transactions/:id/edit",
          component: () => import("@/views/TransactionFormView.vue"),
          meta: { title: "แก้ไขรายการ" },
        },
        {
          path: "settings/accounts",
          component: () => import("@/views/SettingsView.vue"),
          meta: { title: "จัดการบัญชี", settingsTab: "accounts" },
        },
        {
          path: "settings/categories",
          component: () => import("@/views/SettingsView.vue"),
          meta: { title: "จัดการหมวดหมู่", settingsTab: "categories" },
        },
      ],
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  document.title = `${String(to.meta.title ?? "EasyLife")} | EasyLife`;
  if (to.meta.public) return true;

  const { data } = await supabase.auth.getSession();
  const signedIn = Boolean(data.session);
  if (to.meta.guest && signedIn) return "/";
  if (!to.meta.guest && !signedIn)
    return { path: "/login", query: { redirect: to.fullPath } };
  return true;
});
