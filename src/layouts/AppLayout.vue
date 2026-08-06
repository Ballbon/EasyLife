<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useDisplay } from "vuetify";

import { supabase } from "@/lib/supabase";

const route = useRoute();
const router = useRouter();
const { mdAndUp } = useDisplay();
const drawer = ref(false);

const navItems = [
  { title: "ภาพรวม", icon: "mdi-view-dashboard-outline", to: "/dashboard" },
  { title: "รายงาน", icon: "mdi-chart-box-outline", to: "/reports" },
  { title: "รายการ", icon: "mdi-swap-horizontal", to: "/transactions" },
  { title: "บัญชี", icon: "mdi-wallet-outline", to: "/settings/accounts" },
  { title: "หมวดหมู่", icon: "mdi-shape-outline", to: "/settings/categories" },
];
const showFab = computed(
  () => route.path === "/dashboard" || route.path === "/transactions",
);

async function logout() {
  await supabase.auth.signOut();
  await router.replace("/login");
}
</script>

<template>
  <VNavigationDrawer
    v-model="drawer"
    :permanent="mdAndUp"
    :rail="false"
    width="260"
  >
    <div class="d-flex align-center ga-3 px-6 py-5">
      <VAvatar color="primary" rounded="lg" size="38"
        ><VIcon icon="mdi-sprout"
      /></VAvatar>
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
            >Materio</a
          >
        </p>
      </div>
    </template>
  </VNavigationDrawer>

  <VAppBar flat border height="68">
    <VAppBarNavIcon v-if="!mdAndUp" @click="drawer = !drawer" />
    <VAppBarTitle class="font-weight-semibold">{{
      route.meta.title
    }}</VAppBarTitle>
    <template #append>
      <VBtn icon="mdi-bell-outline" variant="text" aria-label="การแจ้งเตือน" />
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
      to="/transactions/new"
      position="fixed"
      location="bottom right"
      icon="mdi-plus"
      size="large"
      color="primary"
      class="fab mb-4 mr-4"
      aria-label="เพิ่มรายการ"
    />
  </VMain>
</template>

<style scoped>
.app-container {
  max-width: 1440px;
}
.fab {
  z-index: 10;
  box-shadow: 0 6px 16px rgba(145, 85, 253, 0.45);
}
</style>
