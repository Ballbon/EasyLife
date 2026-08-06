<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";

import { useAppNavigation } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import QuickAddDialog from "@/components/transactions/QuickAddDialog.vue";
import PWAInstallPrompt from "@/components/ui/PWAInstallPrompt.vue";
import { useNetworkStatus } from "@/composables/useNetworkStatus";

const route = useRoute();
const router = useRouter();
const { mdAndUp } = useDisplay();
const drawer = ref<boolean | null>(null);
const showQuickAdd = ref(false);
const { goBack } = useAppNavigation();
const { isOnline } = useNetworkStatus();

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
    :rail="false"
    width="260"
  >
    <div class="d-flex align-center ga-3 px-6 py-5">
      <VAvatar color="primary" rounded="lg" size="38">
        <VIcon icon="mdi-sprout" color="white" />
      </VAvatar>
      <span class="text-h6 font-weight-bold">EasyLife</span>
    </div>
    <VDivider />
    <VList class="px-3 py-4" nav>
      <VListSubheader>เมนูหลัก</VListSubheader>
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
      <div class="pa-3">
        <VBtn
          block
          variant="text"
          prepend-icon="mdi-logout"
          color="secondary"
          @click="logout"
        >
          ออกจากระบบ
        </VBtn>
        <p class="mt-2 text-center text-caption text-medium-emphasis">
          Theme inspired by
          <a
            href="https://themeselection.com/item/materio-free-vuetify-vuejs-admin-template/"
            target="_blank"
            rel="noreferrer"
            class="text-primary"
          >Materio</a>
        </p>
      </div>
    </template>
  </VNavigationDrawer>

  <VAppBar flat border height="68">
    <VAppBarNavIcon v-if="!mdAndUp" aria-label="เปิดเมนู" @click="drawer = !drawer" />
    <VBtn
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
