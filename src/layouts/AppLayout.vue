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

const navItems = [
  { title: "ภาพรวม", icon: "mdi-view-dashboard-outline", to: "/dashboard" },
  { title: "แผนการเงิน", icon: "mdi-chart-donut", to: "/plans" },
  {
    title: "Daily Quest",
    icon: "mdi-checkbox-marked-circle-outline",
    to: "/quests",
  },
  { title: "รายงาน", icon: "mdi-chart-box-outline", to: "/reports" },
  { title: "รายการ", icon: "mdi-swap-horizontal", to: "/transactions" },
  { title: "บัญชี", icon: "mdi-wallet-outline", to: "/settings/accounts" },
  { title: "หมวดหมู่", icon: "mdi-shape-outline", to: "/settings/categories" },
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
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <div
      class="d-flex align-center"
      :class="isExpanded ? 'justify-space-between px-5 py-4' : 'justify-center py-4'"
      style="min-height: 64px;"
    >
      <div class="d-flex align-center ga-3 overflow-hidden">
        <VAvatar color="primary" rounded="lg" size="38" class="flex-shrink-0">
          <VIcon icon="mdi-sprout" color="white" />
        </VAvatar>
        <span v-if="isExpanded" class="text-h6 font-weight-bold text-no-wrap">EasyLife</span>
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
          size="22"
        />
      </VBtn>
    </div>
    <VDivider />
    <VList :class="isExpanded ? 'px-3 py-4' : 'px-2 py-4'" nav>
      <VListSubheader v-if="isExpanded">เมนูหลัก</VListSubheader>
      <VListItem
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :prepend-icon="item.icon"
        :title="item.title"
        color="primary"
        rounded="lg"
      />
    </VList>
    <template #append>
      <div :class="isExpanded ? 'pa-3 text-center' : 'py-3 text-center'">
        <VBtn
          v-if="isExpanded"
          block
          variant="text"
          prepend-icon="mdi-logout"
          color="secondary"
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

  <VAppBar flat border height="68">
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
    <VAppBarTitle class="font-weight-semibold">{{
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
        />
      </VBtn>
      <VBtn
        color="primary"
        variant="tonal"
        size="small"
        prepend-icon="mdi-flash"
        class="mr-2 d-none d-sm-flex font-weight-medium text-none"
        aria-label="บันทึกด่วน (Alt+N)"
        title="บันทึกด่วน (Alt+N)"
        @click="showQuickAdd = true"
      >
        บันทึกด่วน
      </VBtn>
      <VAvatar color="primary" size="36" class="ml-2">
        <VIcon icon="mdi-account-outline" size="20" />
      </VAvatar>
    </template>
  </VAppBar>

  <VMain>
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
      class="fab mb-4 mr-4"
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
  max-width: 1440px;
}
.fab {
  z-index: 10;
  box-shadow: 0 6px 16px rgba(145, 85, 253, 0.45);
}
.banner-offline {
  z-index: 2000;
}
</style>
