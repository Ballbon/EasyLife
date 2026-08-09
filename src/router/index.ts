import { createRouter, createWebHistory } from "vue-router";

import { i18n } from "@/i18n";
import { supabase } from "@/lib/supabase";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: () => import("@/views/IndexView.vue") },
    {
      path: "/login",
      component: () => import("@/views/auth/AuthView.vue"),
      meta: { guest: true, mode: "login", title: "เข้าสู่ระบบ", titleKey: "routes.login" },
    },
    {
      path: "/register",
      component: () => import("@/views/auth/AuthView.vue"),
      meta: { guest: true, mode: "register", title: "สมัครสมาชิก", titleKey: "routes.register" },
    },
    {
      path: "/forgot-password",
      component: () => import("@/views/auth/AuthView.vue"),
      meta: { guest: true, mode: "forgot", title: "ลืมรหัสผ่าน", titleKey: "routes.forgotPassword" },
    },
    {
      path: "/reset-password",
      component: () => import("@/views/auth/AuthView.vue"),
      meta: { mode: "reset", title: "ตั้งรหัสผ่านใหม่", titleKey: "routes.resetPassword" },
    },
    {
      path: "/auth/callback",
      component: () => import("@/views/auth/AuthCallbackView.vue"),
      meta: { public: true, title: "กำลังยืนยันบัญชี", titleKey: "routes.authCallback" },
    },
    {
      path: "/onboarding",
      component: () => import("@/views/OnboardingView.vue"),
      meta: { title: "ตั้งค่าเริ่มต้น", titleKey: "routes.onboarding" },
    },
    {
      path: "/",
      component: () => import("@/layouts/AppLayout.vue"),
      children: [
        {
          path: "dashboard",
          component: () => import("@/views/DashboardView.vue"),
          meta: { title: "ภาพรวม", titleKey: "routes.dashboard" },
        },
        {
          path: "transactions",
          component: () => import("@/views/TransactionsView.vue"),
          meta: { title: "รายการทั้งหมด", titleKey: "routes.transactions" },
        },
        {
          path: "reports",
          component: () => import("@/views/ReportsView.vue"),
          meta: { title: "รายงานการเงิน", titleKey: "routes.reports" },
        },
        {
          path: "plans",
          component: () => import("@/views/PlansView.vue"),
          meta: { title: "แผนการเงิน", titleKey: "routes.plans" },
        },
        {
          path: "quests",
          component: () => import("@/views/QuestsView.vue"),
          meta: { title: "Daily Quest", titleKey: "routes.quests" },
        },
        {
          path: "transactions/new",
          component: () => import("@/views/TransactionFormView.vue"),
          meta: { title: "เพิ่มรายการ", titleKey: "routes.transactionNew" },
        },
        {
          path: "transactions/:id/edit",
          component: () => import("@/views/TransactionFormView.vue"),
          meta: { title: "แก้ไขรายการ", titleKey: "routes.transactionEdit" },
        },
        {
          path: "settings/accounts",
          component: () => import("@/views/SettingsView.vue"),
          meta: { title: "จัดการบัญชี", titleKey: "routes.accounts", settingsTab: "accounts" },
        },
        {
          path: "settings/categories",
          component: () => import("@/views/SettingsView.vue"),
          meta: { title: "จัดการหมวดหมู่", titleKey: "routes.categories", settingsTab: "categories" },
        },
        {
          path: "offline",
          component: () => import("@/views/OfflineView.vue"),
          meta: { title: "ออฟไลน์", titleKey: "routes.offline", public: true },
        },
      ],
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  const titleKey = to.meta.titleKey as string | undefined;
  const titleText = titleKey && i18n.global.te(titleKey) ? i18n.global.t(titleKey) : (to.meta.title ?? "EasyLife");
  document.title = `${String(titleText)} | EasyLife`;
  if (to.meta.public) return true;

  const { data } = await supabase.auth.getSession();
  const signedIn = Boolean(data.session);
  if (to.meta.guest && signedIn) return "/";
  if (!to.meta.guest && !signedIn)
    return { path: "/login", query: { redirect: to.fullPath } };
  return true;
});
