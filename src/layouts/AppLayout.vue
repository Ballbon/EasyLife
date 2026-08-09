<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";

import { useAppNavigation } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import QuickAddDialog from "@/components/transactions/QuickAddDialog.vue";
import PWAInstallPrompt from "@/components/ui/PWAInstallPrompt.vue";
import { useNetworkStatus } from "@/composables/useNetworkStatus";
import { useThemeMode } from "@/composables/useThemeMode";

const route = useRoute();
const router = useRouter();
const { mdAndUp } = useDisplay();
const drawer = ref<boolean | null>(null);
const isPinned = ref(window.localStorage.getItem("sidebar_pinned") !== "false");
const isHovering = ref(false);
const showQuickAdd = ref(false);
const { goBack } = useAppNavigation();
const { isOnline } = useNetworkStatus();
const { mode, toggleMode } = useThemeMode();

const isExpanded = computed(
  () => isPinned.value || isHovering.value || !mdAndUp.value,
);

function togglePin() {
  isPinned.value = !isPinned.value;
  window.localStorage.setItem("sidebar_pinned", String(isPinned.value));
}

const mainNavItems = [
  { title: "ภาพรวม", icon: "mdi-view-dashboard-outline", to: "/dashboard" },
  { title: "รายการ", icon: "mdi-swap-horizontal", to: "/transactions" },
  { title: "แผนการเงิน", icon: "mdi-chart-donut", to: "/plans" },
];

const insightNavItems = [
  { title: "รายงาน", icon: "mdi-chart-box-outline", to: "/reports" },
  { title: "หมวดหมู่", icon: "mdi-shape-outline", to: "/settings/categories" },
];

const toolNavItems = [
  {
    title: "Daily Quest",
    icon: "mdi-checkbox-marked-circle-outline",
    to: "/quests",
  },
];

const accountNavItems = [
  { title: "บัญชี", icon: "mdi-wallet-outline", to: "/settings/accounts" },
];

const showFab = computed(
  () => route.path === "/dashboard" || route.path === "/transactions",
);

const showBackButton = computed(() => {
  const mainRoutes = [
    "/dashboard",
    "/",
    "/plans",
    "/quests",
    "/reports",
    "/transactions",
    "/settings/accounts",
    "/settings/categories",
  ];
  return !mainRoutes.includes(route.path);
});

function handleKeyDown(e: { altKey: boolean; key: string; preventDefault: () => void }) {
  if (e.altKey && e.key.toLowerCase() === "n") {
    e.preventDefault();
    showQuickAdd.value = true;
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});

async function logout() {
  await supabase.auth.signOut();
  await router.replace("/login");
}
</script>

<template>
  <VAlert
    v-if="!isOnline"
    type="warning"
    variant="flat"
    density="compact"
    tile
    class="text-center position-fixed top-0 w-100 banner-offline"
    icon="mdi-wifi-off"
  >
    คุณกำลังใช้งานในโหมดออฟไลน์ ข้อมูลล่าสุดถูกบันทึกไว้ในแคช
  </VAlert>

  <VNavigationDrawer
    v-model="drawer"
    :permanent="mdAndUp"
    :rail="!isPinned && mdAndUp"
    :expand-on-hover="!isPinned && mdAndUp"
    rail-width="68"
    width="260"
    class="app-sidebar"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <div
      class="d-flex align-center"
      :class="isExpanded ? 'justify-space-between px-5 py-4' : 'justify-center py-4'"
      style="min-height: 64px;"
    >
      <div class="d-flex align-center ga-3 overflow-hidden">
        <VAvatar color="primary" rounded="lg" size="36" class="flex-shrink-0">
          <VIcon icon="mdi-wallet" color="white" size="20" />
        </VAvatar>
        <span v-if="isExpanded" class="text-h6 font-weight-bold text-no-wrap tracking-tight">EasyLife</span>
      </div>
      <VBtn
        v-if="mdAndUp && isExpanded"
        icon
        variant="text"
        size="small"
        class="flex-shrink-0 ml-auto"
        :aria-label="isPinned ? 'ปลดล็อคเมนู' : 'ปักหมุดเมนู'"
        :title="isPinned ? 'ปลดล็อคเมนู' : 'ปักหมุดเมนู'"
        @click.stop="togglePin"
      >
        <VIcon
          :icon="isPinned ? 'mdi-record-circle-outline' : 'mdi-circle-outline'"
          size="20"
        />
      </VBtn>
    </div>
    <VDivider class="border-opacity-50" />

    <VList :class="isExpanded ? 'px-3 py-3' : 'px-2 py-3'" nav>
      <VListSubheader v-if="isExpanded" class="text-caption font-weight-bold text-uppercase tracking-wider text-disabled px-2 mb-1">หลัก</VListSubheader>
      <VListItem
        v-for="item in mainNavItems"
        :key="item.to"
        :to="item.to"
        :prepend-icon="item.icon"
        :title="item.title"
        color="primary"
        rounded="lg"
        class="mb-1"
      />

      <VListSubheader v-if="isExpanded" class="text-caption font-weight-bold text-uppercase tracking-wider text-disabled px-2 mt-4 mb-1">วิเคราะห์</VListSubheader>
      <VListItem
        v-for="item in insightNavItems"
        :key="item.to"
        :to="item.to"
        :prepend-icon="item.icon"
        :title="item.title"
        color="primary"
        rounded="lg"
        class="mb-1"
      />

      <VListSubheader v-if="isExpanded" class="text-caption font-weight-bold text-uppercase tracking-wider text-disabled px-2 mt-4 mb-1">เครื่องมือ</VListSubheader>
      <VListItem
        v-for="item in toolNavItems"
        :key="item.to"
        :to="item.to"
        :prepend-icon="item.icon"
        :title="item.title"
        color="primary"
        rounded="lg"
        class="mb-1"
      />

      <VListSubheader v-if="isExpanded" class="text-caption font-weight-bold text-uppercase tracking-wider text-disabled px-2 mt-4 mb-1">บัญชี</VListSubheader>
      <VListItem
        v-for="item in accountNavItems"
        :key="item.to"
        :to="item.to"
        :prepend-icon="item.icon"
        :title="item.title"
        color="primary"
        rounded="lg"
        class="mb-1"
      />
    </VList>

    <template #append>
      <VDivider class="border-opacity-50" />
      <div :class="isExpanded ? 'pa-3 text-center' : 'py-3 text-center'">
        <VBtn
          v-if="isExpanded"
          block
          variant="text"
          prepend-icon="mdi-logout"
          color="secondary"
          class="justify-start text-none rounded-lg"
          @click="logout"
        >
          ออกจากระบบ
        </VBtn>
        <VBtn
          v-else
          icon="mdi-logout"
          variant="text"
          color="secondary"
          aria-label="ออกจากระบบ"
          title="ออกจากระบบ"
          @click="logout"
        />
      </div>
    </template>
  </VNavigationDrawer>

  <VAppBar flat border height="64" class="app-topbar">
    <VAppBarNavIcon v-if="!mdAndUp" aria-label="เปิดเมนู" @click="drawer = !drawer" />
    <VBtn
      v-if="showBackButton"
      icon="mdi-arrow-left"
      variant="text"
      aria-label="ย้อนกลับ"
      title="ย้อนกลับ"
      class="ml-1 mr-1"
      @click="goBack('/dashboard')"
    />
    <VAppBarTitle class="font-weight-bold text-h6 text-high-emphasis">{{
      route.meta.title
    }}</VAppBarTitle>
    <template #append>
      <VBtn
        icon
        variant="text"
        size="small"
        class="mr-2"
        :aria-label="`เปลี่ยนธีม (${mode})`"
        :title="`ธีมปัจจุบัน: ${mode === 'system' ? 'ตามระบบ' : mode === 'dark' ? 'มืด' : 'สว่าง'}`"
        @click="toggleMode"
      >
        <VIcon
          :icon="
            mode === 'dark'
              ? 'mdi-weather-night'
              : mode === 'light'
                ? 'mdi-weather-sunny'
                : 'mdi-desktop-tower-monitor'
          "
          size="20"
        />
      </VBtn>
      <VBtn
        color="primary"
        variant="flat"
        size="small"
        prepend-icon="mdi-plus"
        class="mr-2 d-none d-sm-flex font-weight-medium text-none rounded-lg px-4"
        aria-label="บันทึกด่วน (Alt+N)"
        title="บันทึกด่วน (Alt+N)"
        @click="showQuickAdd = true"
      >
        บันทึกด่วน
      </VBtn>
      <VAvatar color="primary" variant="tonal" size="36" class="ml-2">
        <VIcon icon="mdi-account" size="20" color="primary" />
      </VAvatar>
    </template>
  </VAppBar>

  <VMain class="app-main">
    <VContainer class="app-container py-6 py-md-8">
      <RouterView />
    </VContainer>

    <VBtn
      v-if="showFab"
      position="fixed"
      location="bottom right"
      icon="mdi-plus"
      size="large"
      color="primary"
      class="fab mb-6 mr-6 rounded-circle"
      aria-label="บันทึกด่วน"
      title="บันทึกด่วน (Alt+N)"
      @click="showQuickAdd = true"
    />
  </VMain>

  <QuickAddDialog v-model="showQuickAdd" />
  <PWAInstallPrompt />
</template>

<style scoped>
.app-container {
  max-width: 1400px;
}
.app-sidebar {
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}
.app-topbar {
  background-color: rgb(var(--v-theme-surface)) !important;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}
.app-main {
  background-color: rgb(var(--v-theme-background));
  min-height: 100vh;
}
.fab {
  z-index: 10;
  box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.4) !important;
}
.banner-offline {
  z-index: 2000;
}
</style>
